import { products, type ProductCategory } from "@/data/catalog";

export type AdminVisibility = "draft" | "published";
export type AdminBadge = "none" | "new";
export type DiamondType = "natural" | "laboratory";
export type PriceDisplay = "exact" | "from";

export type CaratOption = {
  id: string;
  label: string;
};

export type ProductFact = {
  id: string;
  label: string;
  value: string;
};

export type AdminProductImage = {
  id: string;
  name: string;
  src: string;
  width: number;
  height: number;
  bytes: number;
  altText: string;
  storage: "bundled" | "local";
};

export type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  category: ProductCategory;
  collection: "ROSÉ Signature" | "ROSÉ Dopamine" | "";
  visibility: AdminVisibility;
  badge: AdminBadge;
  shortDescription: string;
  fullDescription: string;
  priceDisplay: PriceDisplay;
  basePrice: string;
  diamondChoiceEnabled: boolean;
  diamondTypes: DiamondType[];
  caratChoiceEnabled: boolean;
  caratOptions: CaratOption[];
  variantPrices: Record<string, string>;
  sizes: string[];
  facts: ProductFact[];
  primaryImage: string;
  images: AdminProductImage[];
  updatedAt: string;
};

export const adminStorageKey = "rose-admin-catalog-v2";
export const legacyAdminStorageKey = "rose-admin-catalog-v1";
export const adminCatalogUpdateEvent = "rose-admin-catalog-update";

export const sizeOptions: Record<ProductCategory, string[]> = {
  Rings: ["US 4", "US 4.5", "US 5", "US 5.5", "US 6", "US 6.5", "US 7", "US 7.5", "US 8", "US 8.5", "US 9"],
  Necklaces: ["16 in", "18 in", "20 in"],
  Earrings: [],
  Bracelets: ["15 cm", "16 cm", "17 cm", "18 cm"],
};

export const categoryLabels: Record<ProductCategory, string> = {
  Rings: "Ring",
  Necklaces: "Necklace",
  Earrings: "Earrings",
  Bracelets: "Bracelet",
};

export const defaultFacts = (category: ProductCategory): ProductFact[] => [
  { id: "stone", label: "Stone", value: "" },
  { id: "shape", label: "Shape", value: "" },
  { id: "metal", label: "Metal", value: "18K white gold" },
  {
    id: "setting",
    label: "Setting",
    value: category === "Bracelets" ? "Articulated diamond setting" : category === "Necklaces" ? "Pendant and polished chain setting" : "Fine claw and pavé setting",
  },
];

export function createBlankAdminProduct(): AdminProduct {
  return {
    id: `draft-${Date.now()}`,
    slug: "",
    name: "",
    category: "Rings",
    collection: "",
    visibility: "draft",
    badge: "none",
    shortDescription: "",
    fullDescription: "",
    priceDisplay: "exact",
    basePrice: "",
    diamondChoiceEnabled: false,
    diamondTypes: [],
    caratChoiceEnabled: false,
    caratOptions: [],
    variantPrices: { standard: "" },
    sizes: [...sizeOptions.Rings],
    facts: defaultFacts("Rings"),
    primaryImage: "",
    images: [],
    updatedAt: new Date().toISOString(),
  };
}

export const initialAdminProducts: AdminProduct[] = products.map((product) => ({
  id: product.id,
  slug: product.id,
  name: product.name,
  category: product.category,
  collection: product.collection,
  visibility: "published",
  badge: product.isNew ? "new" : "none",
  shortDescription: product.detail,
  fullDescription: `${product.name} is crafted with close attention to proportion, light and everyday wear. Each detail is refined to give the piece a distinctive ROSÉ character while preserving the precision of fine jewellery.`,
  priceDisplay: product.priceLabel.startsWith("From") ? "from" : "exact",
  basePrice: String(product.price),
  diamondChoiceEnabled: product.id === "oval-solitaire",
  diamondTypes: product.id === "oval-solitaire" ? ["laboratory", "natural"] : [],
  caratChoiceEnabled: product.id === "oval-solitaire",
  caratOptions: product.id === "oval-solitaire" ? [
    { id: "0.50", label: "0.50 ct" },
    { id: "1.00", label: "1.00 ct" },
    { id: "1.50", label: "1.50 ct" },
  ] : [],
  variantPrices: (product.id === "oval-solitaire" ? {
    "laboratory::0.50": "1650",
    "laboratory::1.00": "2250",
    "laboratory::1.50": "3150",
    "natural::0.50": "3950",
    "natural::1.00": "8900",
    "natural::1.50": "15900",
  } : { standard: String(product.price) }) as Record<string, string>,
  sizes: [...sizeOptions[product.category]],
  facts: [
    { id: "stone", label: "Stone", value: product.detail },
    { id: "shape", label: "Shape", value: "As pictured" },
    { id: "metal", label: "Metal", value: product.metals.map((metal) => `18K ${metal.toLowerCase()}`).join(" / ") },
    { id: "setting", label: "Setting", value: product.category === "Bracelets" ? "Articulated diamond setting" : "Fine claw and pavé setting" },
  ],
  primaryImage: product.primary,
  images: [
    { id: `${product.id}-primary`, name: "Primary image", src: product.primary, width: 0, height: 0, bytes: 0, altText: product.name, storage: "bundled" },
    { id: `${product.id}-secondary`, name: "Worn image", src: product.secondary, width: 0, height: 0, bytes: 0, altText: `${product.name} worn`, storage: "bundled" },
  ],
  updatedAt: new Date(2026, 8, 2).toISOString(),
}));

export function normaliseAdminProduct(product: AdminProduct, migrateLegacy = false): AdminProduct {
  const initial = initialAdminProducts.find((candidate) => candidate.id === product.id || candidate.slug === product.slug);
  const images = Array.isArray(product.images) && product.images.length
    ? product.images
    : initial?.images ?? [];
  const normalised: AdminProduct = {
    ...initial,
    ...product,
    diamondTypes: Array.isArray(product.diamondTypes) ? product.diamondTypes : [],
    caratOptions: Array.isArray(product.caratOptions) ? product.caratOptions : [],
    variantPrices: product.variantPrices ?? { standard: product.basePrice ?? "" },
    sizes: Array.isArray(product.sizes) ? product.sizes : [...sizeOptions[product.category]],
    facts: Array.isArray(product.facts) ? product.facts : defaultFacts(product.category),
    images,
    primaryImage: product.primaryImage || images[0]?.src || initial?.primaryImage || "",
  };

  if (migrateLegacy && product.id === "oval-solitaire" && !product.diamondChoiceEnabled && !product.caratChoiceEnabled) {
    const configured = initialAdminProducts.find((candidate) => candidate.id === "oval-solitaire");
    if (configured) {
      return {
        ...normalised,
        diamondChoiceEnabled: configured.diamondChoiceEnabled,
        diamondTypes: configured.diamondTypes,
        caratChoiceEnabled: configured.caratChoiceEnabled,
        caratOptions: configured.caratOptions,
        variantPrices: configured.variantPrices,
      };
    }
  }

  return normalised;
}

export function normaliseAdminCatalog(catalog: AdminProduct[], migrateLegacy = false): AdminProduct[] {
  const normalised = catalog.map((product) => normaliseAdminProduct(product, migrateLegacy));
  const existingIds = new Set(normalised.map((product) => product.id));
  return [...normalised, ...initialAdminProducts.filter((product) => !existingIds.has(product.id))];
}

export function variantKeys(product: AdminProduct) {
  const diamonds: Array<DiamondType | ""> = product.diamondChoiceEnabled ? product.diamondTypes : [""];
  const carats: Array<CaratOption | null> = product.caratChoiceEnabled ? product.caratOptions : [null];

  return diamonds.flatMap((diamondType) => carats.map((carat) => ({
    key: variantPriceKey(diamondType || null, carat?.id || null, product.diamondChoiceEnabled || product.caratChoiceEnabled),
    diamondType: diamondType || null,
    carat,
  })));
}

export function variantPriceKey(diamondType: DiamondType | null, caratId: string | null, optionsEnabled = true) {
  return optionsEnabled ? `${diamondType || "stone"}::${caratId || "standard"}` : "standard";
}

export function minimumProductPrice(product: AdminProduct) {
  const values = (product.diamondChoiceEnabled || product.caratChoiceEnabled)
    ? variantKeys(product).map((variant) => Number(product.variantPrices[variant.key]))
    : [Number(product.basePrice)];
  const valid = values.filter((value) => Number.isFinite(value) && value > 0);
  return valid.length ? Math.min(...valid) : 0;
}

export function formatAdminPrice(value: number) {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}
