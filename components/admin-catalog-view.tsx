"use client";

/* eslint-disable @next/next/no-html-link-for-pages */

import { useEffect, useMemo, useState } from "react";
import {
  adminCatalogUpdateEvent,
  adminStorageKey,
  categoryLabels,
  createBlankAdminProduct,
  defaultFacts,
  formatAdminPrice,
  initialAdminProducts,
  legacyAdminStorageKey,
  minimumProductPrice,
  normaliseAdminCatalog,
  normaliseAdminProduct,
  sizeOptions,
  variantKeys,
  type AdminProductImage,
  type AdminProduct,
  type DiamondType,
} from "@/data/admin-catalog";
import type { ProductCategory } from "@/data/catalog";

const assetPath = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
const steps = ["Setup", "Product", "Media", "Options & pricing", "Sizes & details", "Review"] as const;
const collections = ["", "ROSÉ Signature", "ROSÉ Dopamine"] as const;
const mediaDatabaseName = "rose-admin-media";
const mediaStoreName = "images";
const imageRatio = 3 / 4;
const minimumLongEdge = 2000;
const maximumLongEdge = 3200;

const countWords = (value: string) => value.trim() ? value.trim().split(/\s+/).length : 0;
const titleCaseDiamond = (value: DiamondType) => value === "natural" ? "Natural" : "Laboratory-grown";

function cloneProduct(product: AdminProduct): AdminProduct {
  return JSON.parse(JSON.stringify(product)) as AdminProduct;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

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

async function storeMediaBlob(id: string, blob: Blob) {
  const database = await openMediaDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(mediaStoreName, "readwrite");
    transaction.objectStore(mediaStoreName).put(blob, id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
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

async function removeMediaBlob(id: string) {
  const database = await openMediaDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(mediaStoreName, "readwrite");
    transaction.objectStore(mediaStoreName).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

async function optimiseImage(file: File) {
  const bitmap = await createImageBitmap(file);
  const sourceLongEdge = Math.max(bitmap.width, bitmap.height);
  const scale = Math.min(1, maximumLongEdge / sourceLongEdge);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("This browser cannot prepare the image.");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let quality = 0.92;
  let blob: Blob | null = null;
  do {
    blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
    quality -= 0.04;
  } while (blob && blob.size > 1_250_000 && quality >= 0.8);
  if (!blob) throw new Error("The image could not be optimised.");
  return { blob, width, height };
}

function Field({ label, hint, children, className = "" }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return <label className={`admin-field ${className}`}><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (checked: boolean) => void; label: string; description: string }) {
  return <button className={`admin-toggle-card${checked ? " is-active" : ""}`} type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}><i aria-hidden="true"><b /></i><span><strong>{label}</strong><small>{description}</small></span></button>;
}

function StatusDot({ visibility }: Pick<AdminProduct, "visibility">) {
  return <i className={`admin-status-dot admin-status-${visibility}`} aria-hidden="true" />;
}

export default function AdminCatalogView() {
  const [catalog, setCatalog] = useState<AdminProduct[]>(initialAdminProducts);
  const [draft, setDraft] = useState<AdminProduct>(() => cloneProduct(initialAdminProducts[0]));
  const [activeStep, setActiveStep] = useState(0);
  const [search, setSearch] = useState("");
  const [dirty, setDirty] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [ready, setReady] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});
  const [mediaError, setMediaError] = useState("");
  const [mediaBusy, setMediaBusy] = useState(false);

  useEffect(() => {
    try {
      const current = window.localStorage.getItem(adminStorageKey);
      const legacy = current ? null : window.localStorage.getItem(legacyAdminStorageKey);
      const stored = current || legacy;
      if (stored) {
        const parsed = JSON.parse(stored) as AdminProduct[];
        if (Array.isArray(parsed) && parsed.length) {
          const normalised = normaliseAdminCatalog(parsed, Boolean(legacy));
          // Browser-owned draft data is intentionally synchronised after hydration.
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setCatalog(normalised);
          setDraft(cloneProduct(normalised[0]));
          if (legacy) window.localStorage.setItem(adminStorageKey, JSON.stringify(normalised));
        }
      }
    } catch {
      // Keep the bundled catalogue when the browser blocks local storage.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const objectUrls: string[] = [];
    const resolveMedia = async () => {
      const entries = await Promise.all(draft.images.map(async (image) => {
        if (image.storage === "bundled") return [image.id, assetPath(image.src)] as const;
        try {
          const blob = await readMediaBlob(image.id);
          if (!blob) return [image.id, ""] as const;
          const url = URL.createObjectURL(blob);
          objectUrls.push(url);
          return [image.id, url] as const;
        } catch {
          return [image.id, ""] as const;
        }
      }));
      if (!cancelled) setMediaUrls(Object.fromEntries(entries));
    };
    resolveMedia();
    return () => {
      cancelled = true;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [draft.id, draft.images]);

  const updateDraft = (change: Partial<AdminProduct> | ((current: AdminProduct) => AdminProduct)) => {
    setDraft((current) => typeof change === "function" ? change(current) : { ...current, ...change });
    setDirty(true);
    setSavedMessage("");
  };

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return catalog;
    return catalog.filter((product) => `${product.name} ${product.category} ${product.collection}`.toLowerCase().includes(query));
  }, [catalog, search]);

  const variants = useMemo(() => variantKeys(draft), [draft]);
  const price = minimumProductPrice(draft);
  const words = countWords(draft.fullDescription);
  const optionsEnabled = draft.diamondChoiceEnabled || draft.caratChoiceEnabled;
  const customerFlow = [
    draft.diamondChoiceEnabled ? "Diamond type" : "",
    draft.caratChoiceEnabled ? "Carat weight" : "",
    draft.category === "Rings" ? "Ring size" : draft.category === "Necklaces" ? "Chain length" : draft.category === "Bracelets" ? "Bracelet size" : "",
    "Add to bag",
  ].filter(Boolean).join(" → ");
  const validationItems = useMemo(() => {
    const errors: { message: string; step: number }[] = [];
    if (!draft.name.trim()) errors.push({ message: "Add a product name", step: 1 });
    if (!draft.slug.trim()) errors.push({ message: "Add a product URL", step: 1 });
    if (catalog.some((product) => product.id !== draft.id && product.slug === draft.slug)) errors.push({ message: "Use a unique product URL", step: 1 });
    if (!draft.shortDescription.trim()) errors.push({ message: "Add a catalogue description", step: 1 });
    if (!draft.fullDescription.trim()) errors.push({ message: "Add a full description", step: 1 });
    if (words > 60) errors.push({ message: "Reduce the full description to 60 words", step: 1 });
    if (!draft.images.length) errors.push({ message: "Add at least one product image", step: 2 });
    if (draft.images.some((image) => !image.altText.trim())) errors.push({ message: "Add alternative text to every image", step: 2 });
    if (draft.diamondChoiceEnabled && !draft.diamondTypes.length) errors.push({ message: "Select at least one diamond type", step: 3 });
    if (draft.caratChoiceEnabled && !draft.caratOptions.length) errors.push({ message: "Add at least one carat option", step: 3 });
    if (draft.caratChoiceEnabled && draft.caratOptions.some((option) => !option.label.trim())) errors.push({ message: "Complete every carat label", step: 3 });
    if (optionsEnabled && variants.some((variant) => !(Number(draft.variantPrices[variant.key]) > 0))) errors.push({ message: "Add a price for every variant", step: 3 });
    if (!optionsEnabled && !(Number(draft.basePrice) > 0)) errors.push({ message: "Add the product price", step: 1 });
    if (draft.category !== "Earrings" && !draft.sizes.length) errors.push({ message: "Select at least one available size", step: 4 });
    if (draft.facts.some((fact) => Boolean(fact.label.trim()) !== Boolean(fact.value.trim()))) errors.push({ message: "Complete or remove unfinished product facts", step: 4 });
    return errors;
  }, [catalog, draft, optionsEnabled, variants, words]);
  const validation = validationItems.map((item) => item.message);

  const chooseProduct = (product: AdminProduct) => {
    setDraft(cloneProduct(normaliseAdminProduct(product)));
    setActiveStep(0);
    setDirty(false);
    setSavedMessage("");
  };

  const newProduct = () => {
    setDraft(createBlankAdminProduct());
    setActiveStep(0);
    setDirty(true);
    setSavedMessage("");
  };

  const setCategory = (category: ProductCategory) => {
    updateDraft((current) => ({
      ...current,
      category,
      sizes: [...sizeOptions[category]],
      facts: defaultFacts(category),
    }));
  };

  const uploadMedia = async (file: File) => {
    setMediaError("");
    if (draft.images.length >= 5) return setMediaError("A product can contain no more than five images.");
    if (!file.type.startsWith("image/")) return setMediaError("Choose a JPG, PNG, WebP or AVIF image.");
    setMediaBusy(true);
    try {
      const probe = await createImageBitmap(file);
      const width = probe.width;
      const height = probe.height;
      probe.close();
      const ratio = width / height;
      if (Math.max(width, height) < minimumLongEdge) throw new Error("The longest edge must be at least 2000 px.");
      if (Math.abs(ratio - imageRatio) > 0.035) throw new Error("Crop the image to a 3:4 portrait ratio before uploading.");
      const optimised = await optimiseImage(file);
      const id = `media-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      await storeMediaBlob(id, optimised.blob);
      const image: AdminProductImage = {
        id,
        name: file.name.replace(/\.[^.]+$/, ".webp"),
        src: "",
        width: optimised.width,
        height: optimised.height,
        bytes: optimised.blob.size,
        altText: draft.name || file.name.replace(/\.[^.]+$/, ""),
        storage: "local",
      };
      updateDraft((current) => ({ ...current, images: [...current.images, image], primaryImage: current.primaryImage || "" }));
    } catch (error) {
      setMediaError(error instanceof Error ? error.message : "The image could not be prepared.");
    } finally {
      setMediaBusy(false);
    }
  };

  const removeImage = async (image: AdminProductImage) => {
    if (image.storage === "local") {
      try { await removeMediaBlob(image.id); } catch { /* Removing the catalogue reference is still safe. */ }
    }
    updateDraft((current) => ({ ...current, images: current.images.filter((item) => item.id !== image.id) }));
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= draft.images.length) return;
    updateDraft((current) => {
      const images = [...current.images];
      [images[index], images[target]] = [images[target], images[index]];
      return { ...current, images };
    });
  };

  const toggleDiamond = (diamond: DiamondType) => {
    updateDraft((current) => ({
      ...current,
      diamondTypes: current.diamondTypes.includes(diamond)
        ? current.diamondTypes.filter((item) => item !== diamond)
        : [...current.diamondTypes, diamond],
    }));
  };

  const setOptionEnabled = (kind: "diamond" | "carat", enabled: boolean) => {
    updateDraft((current) => {
      if (kind === "diamond") return {
        ...current,
        diamondChoiceEnabled: enabled,
        diamondTypes: enabled && !current.diamondTypes.length ? ["laboratory", "natural"] : current.diamondTypes,
        priceDisplay: enabled || current.caratChoiceEnabled ? "from" : current.priceDisplay,
      };
      return {
        ...current,
        caratChoiceEnabled: enabled,
        caratOptions: enabled && !current.caratOptions.length ? [
          { id: "0.50", label: "0.50 ct" },
          { id: "1.00", label: "1.00 ct" },
          { id: "1.50", label: "1.50 ct" },
        ] : current.caratOptions,
        priceDisplay: enabled || current.diamondChoiceEnabled ? "from" : current.priceDisplay,
      };
    });
  };

  const addCarat = () => {
    if (draft.caratOptions.length >= 3) return;
    updateDraft((current) => ({ ...current, caratOptions: [...current.caratOptions, { id: `carat-${Date.now()}`, label: "" }] }));
  };

  const save = (visibility: "draft" | "published") => {
    if (visibility === "published" && validation.length) {
      setActiveStep(validationItems[0].step);
      return;
    }
    const saved = { ...draft, visibility, updatedAt: new Date().toISOString() };
    const exists = catalog.some((product) => product.id === saved.id);
    const next = exists ? catalog.map((product) => product.id === saved.id ? saved : product) : [saved, ...catalog];
    setCatalog(next);
    setDraft(cloneProduct(saved));
    setDirty(false);
    setSavedMessage(visibility === "published" ? "Published locally" : "Draft saved locally");
    try {
      window.localStorage.setItem(adminStorageKey, JSON.stringify(next));
      window.dispatchEvent(new Event(adminCatalogUpdateEvent));
    } catch { /* Local preview remains usable in memory. */ }
  };

  const priceLabel = price ? `${draft.priceDisplay === "from" || optionsEnabled ? "From " : ""}${formatAdminPrice(price)}` : "Price not set";

  return <main className="admin-page">
    <header className="admin-topbar">
      <a className="admin-wordmark" href="/" aria-label="ROSÉ Diamonds home"><img src={assetPath("images/rose-wordmark-transparent.webp")} alt="ROSÉ" /></a>
      <div><span>Catalogue</span><b>Product administration</b></div>
      <div className="admin-top-actions"><a href={`/products/${draft.slug || "pink-bloom"}`} target="_blank" rel="noreferrer">View product</a><button className="admin-button admin-button-dark" type="button" onClick={newProduct}>New product</button></div>
    </header>

    <div className="admin-layout">
      <aside className="admin-product-rail">
        <div className="admin-rail-heading"><div><span>Products</span><small>{catalog.length} total</small></div><button type="button" onClick={newProduct} aria-label="Create product">＋</button></div>
        <label className="admin-search"><span className="sr-only">Search products</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search catalogue" /><i aria-hidden="true" /></label>
        <div className="admin-product-list">
          {filteredProducts.map((product) => <button className={draft.id === product.id ? "is-active" : ""} type="button" onClick={() => chooseProduct(product)} key={product.id}>
            <span className="admin-product-thumb">{product.primaryImage ? <img src={assetPath(product.primaryImage)} alt="" /> : <i />}</span>
            <span><strong>{product.name || "Untitled product"}</strong><small>{product.category} · {product.collection || "No collection"}</small></span>
            <StatusDot visibility={product.visibility} />
          </button>)}
        </div>
      </aside>

      <section className="admin-workspace">
        <div className="admin-editor-head">
          <div><p>{draft.id.startsWith("draft-") ? "New product" : "Editing product"}</p><h1>{draft.name || "Untitled product"}</h1><span><StatusDot visibility={draft.visibility} />{draft.visibility}{dirty ? " · Unsaved changes" : ""}</span></div>
          <div>{savedMessage && <small className="admin-saved-message">{savedMessage}</small>}<button className="admin-button" type="button" onClick={() => save("draft")}>Save draft</button><button className="admin-button admin-button-dark" type="button" onClick={() => save("published")}>Publish</button></div>
        </div>

        <nav className="admin-steps" aria-label="Product setup steps">
          {steps.map((step, index) => <button className={activeStep === index ? "is-active" : ""} type="button" onClick={() => setActiveStep(index)} key={step}><span>{String(index + 1).padStart(2, "0")}</span>{step}</button>)}
        </nav>

        <div className="admin-step-content">
          {activeStep === 0 && <section className="admin-form-section">
            <div className="admin-section-heading"><p>Start here</p><h2>Place the piece in your catalogue.</h2><span>These choices prepare the correct fields and size options for the product.</span></div>
            <div className="admin-form-grid">
              <Field label="Jewellery type"><select value={draft.category} onChange={(event) => setCategory(event.target.value as ProductCategory)}>{Object.entries(categoryLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></Field>
              <Field label="Collection" hint="A product can be published without a collection."><select value={draft.collection} onChange={(event) => updateDraft({ collection: event.target.value as AdminProduct["collection"] })}>{collections.map((collection) => <option value={collection} key={collection || "none"}>{collection || "No collection"}</option>)}</select></Field>
              <Field label="Visibility"><div className="admin-segmented"><button className={draft.visibility === "draft" ? "is-active" : ""} type="button" onClick={() => updateDraft({ visibility: "draft" })}>Draft</button><button className={draft.visibility === "published" ? "is-active" : ""} type="button" onClick={() => updateDraft({ visibility: "published" })}>Published</button></div></Field>
              <Field label="Catalogue badge"><div className="admin-segmented"><button className={draft.badge === "none" ? "is-active" : ""} type="button" onClick={() => updateDraft({ badge: "none" })}>No badge</button><button className={draft.badge === "new" ? "is-active" : ""} type="button" onClick={() => updateDraft({ badge: "new" })}>New</button></div></Field>
            </div>
            <aside className="admin-note"><strong>Visibility and badge are separate.</strong><p>Draft controls whether customers can see the product. NEW is only a label displayed on a published product.</p></aside>
          </section>}

          {activeStep === 1 && <section className="admin-form-section">
            <div className="admin-section-heading"><p>Product information</p><h2>Give customers the essential story.</h2><span>Keep the catalogue copy concise; the longer text belongs on the product page.</span></div>
            <div className="admin-form-grid">
              <Field label="Product name" className="admin-field-wide"><input value={draft.name} onChange={(event) => updateDraft((current) => ({ ...current, name: event.target.value, slug: current.slug || slugify(event.target.value) }))} placeholder="Rosé Pink Oval Solitaire" /></Field>
              <Field label="Product URL" hint="Lowercase letters, numbers and hyphens only."><div className="admin-input-prefix"><span>/products/</span><input value={draft.slug} onChange={(event) => updateDraft({ slug: slugify(event.target.value) })} placeholder="pink-oval-solitaire" /></div></Field>
              {!optionsEnabled && <Field label="Price display"><div className="admin-segmented"><button className={draft.priceDisplay === "exact" ? "is-active" : ""} type="button" onClick={() => updateDraft({ priceDisplay: "exact" })}>Exact price</button><button className={draft.priceDisplay === "from" ? "is-active" : ""} type="button" onClick={() => updateDraft({ priceDisplay: "from" })}>From</button></div></Field>}
              <Field label={optionsEnabled ? "Catalogue price" : "Price (USD)"} hint={optionsEnabled ? "Calculated automatically from the lowest variant price." : undefined}>{optionsEnabled ? <output className="admin-calculated-price">{priceLabel}</output> : <div className="admin-price-input"><span>$</span><input inputMode="decimal" value={draft.basePrice} onChange={(event) => updateDraft({ basePrice: event.target.value.replace(/[^0-9.]/g, "") })} placeholder="1,350" /></div>}</Field>
              <Field label="Short catalogue description" hint={`${draft.shortDescription.length}/110 characters`} className="admin-field-wide"><input maxLength={110} value={draft.shortDescription} onChange={(event) => updateDraft({ shortDescription: event.target.value })} placeholder="Pink sapphires and a pink oval diamond" /></Field>
              <Field label="Full product description" hint={`${words}/60 words`} className={`admin-field-wide${words > 60 ? " has-error" : ""}`}><textarea rows={6} value={draft.fullDescription} onChange={(event) => updateDraft({ fullDescription: event.target.value })} placeholder="Describe the character, materials and feeling of the piece…" /></Field>
            </div>
          </section>}

          {activeStep === 2 && <section className="admin-form-section">
            <div className="admin-section-heading"><p>Media</p><h2>Build a consistent product gallery.</h2><span>Add up to five portrait images. The first image becomes the catalogue cover and PDP opening frame.</span></div>
            <div className="admin-media-spec"><div><span>Required format</span><strong>3:4 portrait</strong></div><div><span>Minimum resolution</span><strong>2000 px long edge</strong></div><div><span>Output</span><strong>Optimised WebP</strong></div><p>Files are resized only when larger than 3200 px and compressed to a visually lossless web format. The original composition is never cropped automatically.</p></div>
            <div className="admin-media-grid">
              {Array.from({ length: 5 }, (_, index) => {
                const image = draft.images[index];
                return image ? <article className="admin-media-item" key={image.id}>
                  <div>{mediaUrls[image.id] ? <img src={mediaUrls[image.id]} alt="" /> : <span>Loading preview…</span>}<b>{index === 0 ? "Primary" : String(index + 1).padStart(2, "0")}</b></div>
                  <input value={image.altText} onChange={(event) => updateDraft((current) => ({ ...current, images: current.images.map((item) => item.id === image.id ? { ...item, altText: event.target.value } : item) }))} aria-label={`Alternative text for image ${index + 1}`} placeholder="Describe the image" />
                  <small>{image.width ? `${image.width} × ${image.height} · ${(image.bytes / 1024).toFixed(0)} KB` : "Existing catalogue image"}</small>
                  <footer><button type="button" disabled={index === 0} onClick={() => moveImage(index, -1)} aria-label="Move image left">←</button><button type="button" disabled={index === draft.images.length - 1} onClick={() => moveImage(index, 1)} aria-label="Move image right">→</button><button type="button" onClick={() => removeImage(image)}>Remove</button></footer>
                </article> : <label className="admin-media-empty" key={index}><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={mediaBusy} onChange={(event) => { const file = event.target.files?.[0]; if (file) uploadMedia(file); event.target.value = ""; }} /><i aria-hidden="true">＋</i><strong>{mediaBusy && index === draft.images.length ? "Optimising…" : index === draft.images.length ? "Add image" : `Image ${index + 1}`}</strong><small>{index === 0 ? "Primary catalogue image" : "Optional gallery image"}</small></label>;
              })}
            </div>
            {mediaError && <p className="admin-media-error" role="alert">{mediaError}</p>}
            <p className="admin-media-footnote">New local uploads are stored only on this computer. In production the original and optimised versions will be stored securely in the media library.</p>
          </section>}

          {activeStep === 3 && <section className="admin-form-section">
            <div className="admin-section-heading"><p>Options and pricing</p><h2>Enable only what the customer can choose.</h2><span>When options are enabled, every available combination receives its own price.</span></div>
            <div className="admin-option-switches">
              <Toggle checked={draft.diamondChoiceEnabled} onChange={(checked) => setOptionEnabled("diamond", checked)} label="Diamond type selection" description="Natural, laboratory-grown, or both." />
              <Toggle checked={draft.caratChoiceEnabled} onChange={(checked) => setOptionEnabled("carat", checked)} label="Carat selection" description="Offer up to three carat weights." />
            </div>
            <aside className="admin-note"><strong>Customer flow</strong><p>{customerFlow}</p></aside>

            {!optionsEnabled && <div className="admin-empty-options"><span>One configuration</span><h3>This piece has no customer-selectable stone or carat options.</h3><p>Its stone and carat details will appear in the factual product information instead.</p></div>}

            {draft.diamondChoiceEnabled && <div className="admin-option-block">
              <header><div><span>Diamond types</span><h3>Which options are available?</h3></div><small>Select at least one</small></header>
              <div className="admin-check-grid">{(["laboratory", "natural"] as DiamondType[]).map((type) => <button className={draft.diamondTypes.includes(type) ? "is-active" : ""} type="button" onClick={() => toggleDiamond(type)} key={type}><i aria-hidden="true" />{titleCaseDiamond(type)} diamond</button>)}</div>
            </div>}

            {draft.caratChoiceEnabled && <div className="admin-option-block">
              <header><div><span>Carat weights</span><h3>Add the available options.</h3></div><small>{draft.caratOptions.length}/3 options</small></header>
              <div className="admin-carat-list">{draft.caratOptions.map((option, index) => <div key={option.id}><span>{String(index + 1).padStart(2, "0")}</span><input value={option.label} onChange={(event) => updateDraft((current) => ({ ...current, caratOptions: current.caratOptions.map((item) => item.id === option.id ? { ...item, label: event.target.value } : item) }))} placeholder="1.00 ct" /><button type="button" aria-label={`Remove carat option ${index + 1}`} onClick={() => updateDraft((current) => ({ ...current, caratOptions: current.caratOptions.filter((item) => item.id !== option.id) }))}>Remove</button></div>)}</div>
              {draft.caratOptions.length < 3 && <button className="admin-text-button" type="button" onClick={addCarat}>＋ Add carat option</button>}
            </div>}

            {optionsEnabled && <div className="admin-price-matrix">
              <header><div><span>Variant prices</span><h3>Set a price for every combination.</h3></div><strong>{variants.length} {variants.length === 1 ? "variant" : "variants"}</strong></header>
              <div className="admin-price-table"><div className="admin-price-table-head"><span>Diamond</span><span>Carat</span><span>Price (USD)</span></div>{variants.map((variant) => <div className="admin-price-row" key={variant.key}><span>{variant.diamondType ? titleCaseDiamond(variant.diamondType) : "Fixed stone"}</span><span>{variant.carat?.label || "Fixed carat"}</span><label><b>$</b><input inputMode="decimal" value={draft.variantPrices[variant.key] || ""} onChange={(event) => updateDraft((current) => ({ ...current, variantPrices: { ...current.variantPrices, [variant.key]: event.target.value.replace(/[^0-9.]/g, "") } }))} placeholder="0" /></label></div>)}</div>
              <p>The catalogue will automatically display <strong>{priceLabel}</strong>. Size selection never changes the price.</p>
            </div>}
          </section>}

          {activeStep === 4 && <section className="admin-form-section">
            <div className="admin-section-heading"><p>Sizes and details</p><h2>Complete the practical information.</h2><span>Sizes control the PDP selector. Facts explain the fixed characteristics of the piece.</span></div>
            <div className="admin-details-columns">
              <div className="admin-size-panel"><header><span>Available size range</span><h3>{draft.category === "Earrings" ? "No size selection required" : `Select ${categoryLabels[draft.category].toLowerCase()} sizes`}</h3></header>{draft.category === "Earrings" ? <p>Earrings will be added to the bag without a size step.</p> : <div className="admin-size-grid">{sizeOptions[draft.category].map((size) => <button className={draft.sizes.includes(size) ? "is-active" : ""} type="button" onClick={() => updateDraft((current) => ({ ...current, sizes: current.sizes.includes(size) ? current.sizes.filter((item) => item !== size) : [...current.sizes, size] }))} key={size}>{size}</button>)}</div>}</div>
              <div className="admin-facts-panel"><header><span>Product facts</span><h3>What appears beneath Add to Bag</h3></header><div>{draft.facts.map((fact) => <label key={fact.id}><input value={fact.label} onChange={(event) => updateDraft((current) => ({ ...current, facts: current.facts.map((item) => item.id === fact.id ? { ...item, label: event.target.value } : item) }))} aria-label="Fact label" /><input value={fact.value} onChange={(event) => updateDraft((current) => ({ ...current, facts: current.facts.map((item) => item.id === fact.id ? { ...item, value: event.target.value } : item) }))} aria-label={`${fact.label} value`} placeholder="Enter value" /></label>)}</div><button className="admin-text-button" type="button" onClick={() => updateDraft((current) => ({ ...current, facts: [...current.facts, { id: `fact-${Date.now()}`, label: "", value: "" }] }))}>＋ Add factual point</button></div>
            </div>
          </section>}

          {activeStep === 5 && <section className="admin-form-section admin-review-section">
            <div className="admin-section-heading"><p>Review</p><h2>See what the customer will receive.</h2><span>Resolve any missing information, then publish the product locally.</span></div>
            <div className="admin-review-grid">
              <article className="admin-card-preview"><div>{draft.images[0] && mediaUrls[draft.images[0].id] ? <img src={mediaUrls[draft.images[0].id]} alt="" /> : <span>Product image will appear here</span>}{draft.badge === "new" && <b>New</b>}</div><h3>{draft.name || "Product name"}</h3><strong>{priceLabel}</strong><p>{draft.shortDescription || "Short catalogue description"}</p></article>
              <article className="admin-pdp-preview"><p>Product page selection</p><h3>{draft.name || "Product name"}</h3><strong>{priceLabel}</strong>{draft.diamondChoiceEnabled && <label><span>Diamond type</span><select><option>Select diamond type</option>{draft.diamondTypes.map((type) => <option key={type}>{titleCaseDiamond(type)}</option>)}</select></label>}{draft.caratChoiceEnabled && <label><span>Carat weight</span><select><option>Select carat weight</option>{draft.caratOptions.map((option) => <option key={option.id}>{option.label || "Unnamed option"}</option>)}</select></label>}{draft.category !== "Earrings" && <label><span>{draft.category === "Rings" ? "Ring size" : draft.category === "Necklaces" ? "Chain length" : "Bracelet size"}</span><select><option>Select size</option>{draft.sizes.map((size) => <option key={size}>{size}</option>)}</select></label>}<button type="button">ADD TO BAG</button></article>
              <aside className={`admin-validation${validation.length ? " has-errors" : " is-complete"}`}><span>{validation.length ? "Needs attention" : "Ready to publish"}</span><h3>{validation.length ? `${validation.length} ${validation.length === 1 ? "item" : "items"} remaining` : "Product setup is complete."}</h3>{validation.length ? <ul>{validation.map((error) => <li key={error}>{error}</li>)}</ul> : <p>All required product and variant information has been completed.</p>}<div><button className="admin-button" type="button" onClick={() => save("draft")}>Save draft</button><button className="admin-button admin-button-dark" type="button" disabled={Boolean(validation.length)} onClick={() => save("published")}>Publish product</button></div></aside>
            </div>
          </section>}
        </div>

        <footer className="admin-editor-footer"><button type="button" disabled={activeStep === 0} onClick={() => setActiveStep((step) => Math.max(0, step - 1))}>← Previous</button><span>{activeStep + 1} of {steps.length}</span>{activeStep < steps.length - 1 ? <button type="button" onClick={() => setActiveStep((step) => Math.min(steps.length - 1, step + 1))}>Continue →</button> : <button type="button" disabled={Boolean(validation.length)} onClick={() => save("published")}>Publish product</button>}</footer>
      </section>
    </div>
    {!ready && <div className="admin-loading" role="status">Opening local catalogue…</div>}
  </main>;
}
