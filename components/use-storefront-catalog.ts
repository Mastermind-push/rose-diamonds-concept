"use client";

import { useEffect, useState } from "react";
import {
  adminCatalogUpdateEvent,
  adminStorageKey,
  initialAdminProducts,
  legacyAdminStorageKey,
  minimumProductPrice,
  normaliseAdminCatalog,
  type AdminProduct,
  type AdminProductImage,
} from "@/data/admin-catalog";
import { products as bundledProducts, type Product } from "@/data/catalog";

const mediaDatabaseName = "rose-admin-media";
const mediaStoreName = "images";

function openMediaDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(mediaDatabaseName, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(mediaStoreName)) request.result.createObjectStore(mediaStoreName);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readMediaBlob(id: string) {
  const database = await openMediaDatabase();
  const blob = await new Promise<Blob | undefined>((resolve, reject) => {
    const request = database.transaction(mediaStoreName, "readonly").objectStore(mediaStoreName).get(id);
    request.onsuccess = () => resolve(request.result as Blob | undefined);
    request.onerror = () => reject(request.error);
  });
  database.close();
  return blob;
}

function titleCaseMetal(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function deriveMetals(product: AdminProduct, bundled?: Product) {
  if (bundled?.metals.length) return bundled.metals;
  const metal = product.facts.find((fact) => fact.label.trim().toLowerCase() === "metal")?.value ?? "";
  const matches = metal.match(/(?:white|yellow|rose) gold/gi);
  return matches?.length ? [...new Set(matches.map(titleCaseMetal))] : ["White Gold"];
}

function deriveColours(product: AdminProduct, bundled?: Product) {
  if (bundled?.colours.length) return bundled.colours;
  const copy = `${product.name} ${product.shortDescription} ${product.fullDescription} ${product.facts.map((fact) => fact.value).join(" ")}`;
  const colours = ["Pink", "Yellow", "Blue", "Green", "Red", "White"].filter((colour) => new RegExp(`\\b${colour}\\b`, "i").test(copy));
  return colours.length ? colours : ["White"];
}

async function resolveImage(image: AdminProductImage) {
  if (image.storage === "bundled") return { id: image.id, src: image.src, altText: image.altText };
  try {
    const blob = await readMediaBlob(image.id);
    return blob ? { id: image.id, src: URL.createObjectURL(blob), altText: image.altText } : null;
  } catch {
    return null;
  }
}

async function toStorefrontProduct(product: AdminProduct): Promise<Product | null> {
  if (product.visibility !== "published") return null;
  const bundled = bundledProducts.find((candidate) => candidate.id === product.id || candidate.id === product.slug);
  const resolvedImages = (await Promise.all(product.images.slice(0, 5).map(resolveImage))).filter((image): image is NonNullable<typeof image> => Boolean(image));
  const fallbackPrimary = bundled?.primary ?? product.primaryImage;
  const fallbackSecondary = bundled?.secondary ?? fallbackPrimary;
  const primary = resolvedImages[0]?.src || fallbackPrimary;
  const secondary = resolvedImages[1]?.src || resolvedImages[0]?.src || fallbackSecondary;
  if (!primary) return null;

  const price = minimumProductPrice(product) || Number(product.basePrice) || bundled?.price || 0;
  const hasOptions = product.diamondChoiceEnabled || product.caratChoiceEnabled;
  const priceLabel = `${product.priceDisplay === "from" || hasOptions ? "From " : ""}$${Math.round(price).toLocaleString("en-US")}`;
  const variantPrices = Object.fromEntries(Object.entries(product.variantPrices).flatMap(([key, value]) => {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? [[key, number]] : [];
  }));

  return {
    id: product.slug || product.id,
    name: product.name,
    category: product.category,
    collection: product.collection,
    detail: product.shortDescription,
    price,
    priceLabel,
    metals: deriveMetals(product, bundled),
    colours: deriveColours(product, bundled),
    primary,
    secondary,
    isNew: product.badge === "new",
    fullDescription: product.fullDescription,
    diamondTypes: product.diamondChoiceEnabled ? product.diamondTypes : [],
    caratOptions: product.caratChoiceEnabled ? product.caratOptions : [],
    variantPrices,
    sizes: product.sizes,
    facts: product.facts,
    images: resolvedImages.length ? resolvedImages : [
      { id: `${product.id}-primary`, src: primary, altText: product.name },
      ...(secondary !== primary ? [{ id: `${product.id}-secondary`, src: secondary, altText: `${product.name} worn` }] : []),
    ],
  };
}

function readStoredCatalog() {
  const current = window.localStorage.getItem(adminStorageKey);
  const legacy = current ? null : window.localStorage.getItem(legacyAdminStorageKey);
  if (!current && !legacy) return initialAdminProducts;
  try {
    const parsed = JSON.parse(current || legacy || "[]") as AdminProduct[];
    if (!Array.isArray(parsed) || !parsed.length) return initialAdminProducts;
    const normalised = normaliseAdminCatalog(parsed, Boolean(legacy));
    if (legacy) window.localStorage.setItem(adminStorageKey, JSON.stringify(normalised));
    return normalised;
  } catch {
    return initialAdminProducts;
  }
}

export function useStorefrontCatalogState() {
  const [state, setState] = useState<{ products: Product[]; ready: boolean }>({ products: bundledProducts, ready: false });

  useEffect(() => {
    let generation = 0;
    let objectUrls: string[] = [];
    const refresh = async () => {
      const refreshGeneration = ++generation;
      const next = (await Promise.all(readStoredCatalog().map(toStorefrontProduct))).filter((product): product is Product => Boolean(product));
      if (refreshGeneration !== generation) {
        next.flatMap((product) => product.images ?? []).forEach((image) => {
          if (image.src.startsWith("blob:")) URL.revokeObjectURL(image.src);
        });
        return;
      }
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
      objectUrls = next.flatMap((product) => product.images ?? []).map((image) => image.src).filter((src) => src.startsWith("blob:"));
      setState({ products: next, ready: true });
    };
    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === adminStorageKey || event.key === legacyAdminStorageKey) void refresh();
    };
    const handleRefresh = () => void refresh();
    void refresh();
    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleRefresh);
    window.addEventListener(adminCatalogUpdateEvent, handleRefresh);
    return () => {
      generation += 1;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleRefresh);
      window.removeEventListener(adminCatalogUpdateEvent, handleRefresh);
    };
  }, []);

  return state;
}

export function useStorefrontCatalog() {
  return useStorefrontCatalogState().products;
}
