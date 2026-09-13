"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import "@/app/checkout.css";
import { useClientCommerce } from "@/components/client-commerce";
import { useStorefrontCatalog } from "@/components/use-storefront-catalog";

type Quote = {
  currency: "USD";
  lines: Array<{ productId: string; name: string; option: string; quantity: number; unitPrice: number; total: number }>;
  subtotal: number;
  delivery: number;
  total: number;
};

type DeliveryAddress = {
  firstName: string;
  lastName: string;
  phone: string;
  countryCode: string;
  address1: string;
  address2: string;
  city: string;
  region: string;
  postalCode: string;
  placeId: string;
};

type PaymentSession = { orderId: string; intentId: string; clientSecret: string; currency: string; amount: number; returnUrl: string };
type AirwallexSDK = { init: (options: { env: "sandbox"; enabledElements: string[] }) => Promise<{ payments: { redirectToCheckout: (options: Record<string, unknown>) => void } }> };
type PlaceAddressComponent = { longText?: string; shortText?: string; types: string[] };
type GooglePlace = { id?: string; formattedAddress?: string; addressComponents?: PlaceAddressComponent[]; fetchFields: (options: { fields: string[] }) => Promise<void> };
type PlacePrediction = { toPlace: () => GooglePlace };
type PlaceSelectEvent = Event & { placePrediction?: PlacePrediction };
type PlaceWidget = HTMLElement & { includedRegionCodes?: string[]; includedPrimaryTypes?: string[] };
type PlacesLibrary = { PlaceAutocompleteElement: new (options?: Record<string, unknown>) => PlaceWidget };
type GoogleMapsRuntime = { maps: { importLibrary: (name: string) => Promise<PlacesLibrary> } };

declare global {
  interface Window {
    AirwallexComponentsSDK?: AirwallexSDK;
    google?: GoogleMapsRuntime;
  }
}

const apiBase = (import.meta.env.VITE_SANDBOX_CHECKOUT_API_URL || (typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname) ? "http://localhost:8788" : "")).replace(/\/$/, "");
const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
const assetPath = (path: string) => /^(?:blob:|data:|https?:)/.test(path) ? path : `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
const money = (amount: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(amount);

const emptyAddress: DeliveryAddress = {
  firstName: "", lastName: "", phone: "", countryCode: "", address1: "", address2: "", city: "", region: "", postalCode: "", placeId: "",
};

const countries = [
  ["AE", "United Arab Emirates"], ["AU", "Australia"], ["AT", "Austria"], ["BE", "Belgium"],
  ["CA", "Canada"], ["CN", "China"], ["DK", "Denmark"], ["FI", "Finland"],
  ["FR", "France"], ["DE", "Germany"], ["HK", "Hong Kong SAR"], ["IE", "Ireland"],
  ["IT", "Italy"], ["JP", "Japan"], ["LU", "Luxembourg"], ["MO", "Macao SAR"],
  ["MC", "Monaco"], ["NL", "Netherlands"], ["NZ", "New Zealand"], ["NO", "Norway"],
  ["PT", "Portugal"], ["QA", "Qatar"], ["SA", "Saudi Arabia"], ["SG", "Singapore"],
  ["KR", "South Korea"], ["ES", "Spain"], ["SE", "Sweden"], ["CH", "Switzerland"],
  ["TW", "Taiwan"], ["GB", "United Kingdom"], ["US", "United States"],
] as const;

async function requestApi<T>(path: string, options?: RequestInit): Promise<T> {
  if (!apiBase) throw new Error("Secure checkout is temporarily unavailable.");
  const response = await fetch(`${apiBase}${path}`, { ...options, headers: { "content-type": "application/json", ...options?.headers } });
  const body = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(body.error || "Secure checkout is temporarily unavailable.");
  return body;
}

let sdkPromise: Promise<AirwallexSDK> | undefined;
function loadSdk() {
  if (window.AirwallexComponentsSDK) return Promise.resolve(window.AirwallexComponentsSDK);
  sdkPromise ??= new Promise<AirwallexSDK>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://static.airwallex.com/components/sdk/v1/index.js";
    script.async = true;
    script.onload = () => window.AirwallexComponentsSDK ? resolve(window.AirwallexComponentsSDK) : reject(new Error("Secure payment could not be loaded."));
    script.onerror = () => reject(new Error("Secure payment could not be loaded."));
    document.head.append(script);
  }).catch((error) => { sdkPromise = undefined; throw error; });
  return sdkPromise;
}

let placesPromise: Promise<PlacesLibrary> | undefined;
function loadPlaces() {
  if (window.google?.maps) return window.google.maps.importLibrary("places");
  placesPromise ??= new Promise<PlacesLibrary>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(mapsApiKey)}&libraries=places&loading=async&v=weekly`;
    script.async = true;
    script.onload = () => window.google?.maps.importLibrary("places").then(resolve, reject) ?? reject(new Error("Address search could not be loaded."));
    script.onerror = () => reject(new Error("Address search could not be loaded."));
    document.head.append(script);
  }).catch((error) => { placesPromise = undefined; throw error; });
  return placesPromise;
}

function componentValue(components: PlaceAddressComponent[], types: string[], short = false) {
  const component = components.find((candidate) => types.some((type) => candidate.types.includes(type)));
  return (short ? component?.shortText : component?.longText) || "";
}

function LockIcon() {
  return <svg width="15" height="16" viewBox="0 0 20 22" fill="none" aria-hidden="true"><rect x="3" y="9" width="14" height="11" rx="1" stroke="currentColor" strokeWidth="1.4" /><path d="M6 9V6a4 4 0 0 1 8 0v3M10 13v3" stroke="currentColor" strokeWidth="1.4" /></svg>;
}

function SearchIcon() {
  return <svg className="checkout-search-icon" width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.3" /><path d="m12.5 12.5 4 4" stroke="currentColor" strokeWidth="1.3" /></svg>;
}

function FieldHelp({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return <details className="checkout-field-tip">
    <summary aria-label={label} onKeyDown={(event) => { if (event.key === "Escape") event.currentTarget.parentElement?.removeAttribute("open"); }}><svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.2" /><path d="M7.8 7.5a2.2 2.2 0 0 1 4.4 0c0 1.7-2.2 1.7-2.2 3.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /><circle cx="10" cy="13.6" r=".7" fill="currentColor" /></svg></summary>
    <p id={id}>{children}</p>
  </details>;
}

function CheckoutHeader() {
  return <header className="checkout-header"><Link className="wordmark" href="/" aria-label="ROSÉ Diamonds home"><img src={assetPath("images/rose-wordmark-transparent.webp")} alt="ROSÉ Diamonds" /></Link></header>;
}

function CheckoutFooter() {
  return <footer className="checkout-footer"><nav aria-label="Checkout policies"><Link href="/policies/delivery-and-returns" target="_blank">Delivery &amp; returns</Link><Link href="/policies/privacy" target="_blank">Privacy policy</Link><Link href="/policies/terms-of-service" target="_blank">Terms of service</Link><Link href="/consultation" target="_blank">Contact us</Link></nav><p>© {new Date().getFullYear()} ROSÉ Diamonds Ltd.</p></footer>;
}

export function SandboxCheckoutView() {
  const commerce = useClientCommerce();
  const products = useStorefrontCatalog();
  const [quote, setQuote] = useState<Quote>();
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState<DeliveryAddress>(emptyAddress);
  const [addressSelected, setAddressSelected] = useState(false);
  const [sandboxManualAddress, setSandboxManualAddress] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressRetry, setAddressRetry] = useState(0);
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const addressLookupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!apiBase) return;
    const controller = new AbortController();
    requestApi<{ environment: string; manualAddressAllowed?: boolean }>("/api/health", { signal: controller.signal })
      .then((health) => setSandboxManualAddress(health.environment === "sandbox" && health.manualAddressAllowed === true))
      .catch(() => { /* Keep verified-address requirements when the server cannot confirm sandbox mode. */ });
    return () => controller.abort();
  }, []);
  const manualAddress = sandboxManualAddress && !mapsApiKey;
  const addressReady = manualAddress ? Boolean(address.countryCode && address.address1.trim() && address.city.trim()) : Boolean(mapsApiKey && addressSelected && !addressLoading);

  useEffect(() => {
    if (!commerce.bag.length || !apiBase) return;
    const controller = new AbortController();
    requestApi<Quote>("/api/quote", { method: "POST", body: JSON.stringify({ items: commerce.bag }), signal: controller.signal })
      .then(setQuote)
      .catch((cause) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not calculate the order."); });
    return () => controller.abort();
  }, [commerce.bag]);

  useEffect(() => {
    if (!mapsApiKey || !address.countryCode || !addressLookupRef.current) return;
    let disposed = false;
    let selectionVersion = 0;
    let widget: PlaceWidget | undefined;
    setAddressLoading(true);
    setAddressError("");
    setAddressSelected(false);
    setAddress((current) => ({ ...current, address1: "", city: "", region: "", postalCode: "", placeId: "" }));

    const invalidate = () => {
      selectionVersion += 1;
      setAddressSelected(false);
      setAddress((current) => ({ ...current, address1: "", city: "", region: "", postalCode: "", placeId: "" }));
    };
    void loadPlaces().then(({ PlaceAutocompleteElement }) => {
      if (disposed || !addressLookupRef.current) return;
      widget = new PlaceAutocompleteElement({ includedPrimaryTypes: ["street_address", "premise", "subpremise"], includedRegionCodes: [address.countryCode] });
      widget.setAttribute("placeholder", "Street address");
      widget.setAttribute("aria-label", "Search delivery address");
      widget.setAttribute("aria-describedby", "checkout-address-help");
      widget.className = "checkout-place-autocomplete";
      widget.addEventListener("input", invalidate);
      widget.addEventListener("gmp-error", () => {
        if (disposed) return;
        invalidate();
        setAddressLoading(false);
        setAddressError("Address search is unavailable. Please try again.");
      });
      widget.addEventListener("gmp-select", (async (event: PlaceSelectEvent) => {
        const place = event.placePrediction?.toPlace();
        if (!place) return;
        const version = ++selectionVersion;
        setAddressSelected(false);
        setAddressLoading(true);
        setAddressError("");
        try {
          await place.fetchFields({ fields: ["id", "formattedAddress", "addressComponents"] });
          if (disposed || version !== selectionVersion) return;
          const components = place.addressComponents || [];
          const streetNumber = componentValue(components, ["street_number"]);
          const route = componentValue(components, ["route"]);
          const premise = componentValue(components, ["premise"]);
          const countryCode = componentValue(components, ["country"], true);
          if (!place.id || countryCode !== address.countryCode || (!route && !premise)) {
            throw new Error("Please select a complete street address in your chosen country.");
          }
          setAddress((current) => ({
            ...current,
            address1: [streetNumber, route].filter(Boolean).join(" ") || premise,
            city: componentValue(components, ["postal_town", "locality", "sublocality_level_1"]),
            region: componentValue(components, ["administrative_area_level_1"], true),
            postalCode: componentValue(components, ["postal_code"]),
            placeId: place.id || "",
          }));
          setAddressSelected(true);
        } catch (cause) {
          if (!disposed && version === selectionVersion) {
            invalidate();
            setAddressError(cause instanceof Error ? cause.message : "We could not retrieve this address. Please select it again.");
          }
        } finally {
          if (!disposed) setAddressLoading(false);
        }
      }) as EventListener);
      addressLookupRef.current.replaceChildren(widget);
      setAddressLoading(false);
    }).catch(() => {
      if (disposed) return;
      placesPromise = undefined;
      setAddressLoading(false);
      setAddressError("Address search could not be loaded. Please try again.");
    });

    return () => { disposed = true; selectionVersion += 1; widget?.remove(); };
  }, [address.countryCode, addressRetry]);

  const updateAddress = (field: keyof DeliveryAddress, value: string) => {
    setAddress((current) => ({ ...current, [field]: value }));
    if (field === "countryCode") {
      setAddressSelected(false);
      setAddress((current) => ({ ...current, address1: "", city: "", region: "", postalCode: "", placeId: "" }));
    }
  };

  const pay = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy || !quote || !acceptedPolicies || !addressReady) return;
    setBusy(true);
    setError("");
    try {
      const sdk = await loadSdk();
      const session = await requestApi<PaymentSession>("/api/payment-intent", {
        method: "POST",
        body: JSON.stringify({ items: commerce.bag, email, deliveryAddress: address, returnPath: `${import.meta.env.BASE_URL}checkout/result` }),
      });
      const { payments } = await sdk.init({ env: "sandbox", enabledElements: ["payments"] });
      payments.redirectToCheckout({
        env: "sandbox", mode: "payment", intent_id: session.intentId, client_secret: session.clientSecret,
        currency: session.currency, country_code: address.countryCode, shopper_email: email,
        ...(session.returnUrl.startsWith("https:") ? { successUrl: session.returnUrl } : {}),
        appearance: { mode: "light", variables: { colorBrand: "#783445" } },
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to open secure payment.");
      setBusy(false);
    }
  };

  return <main className="checkout-page">
    <CheckoutHeader />
    {commerce.bag.length ? <div className="checkout-columns">
      <div className="checkout-information">
        <nav className="checkout-progress" aria-label="Checkout progress"><Link href="/bag">Bag</Link><span aria-hidden="true">›</span><span aria-current="step">Information &amp; delivery</span><span aria-hidden="true">›</span><span>Payment</span></nav>
        <h1 className="sr-only">Checkout</h1>
        <p className="checkout-test-note">Test checkout · No real payment or order will be placed.</p>
        <form className="sandbox-checkout-form" onSubmit={pay}>
          <fieldset className="checkout-group">
            <legend>Contact</legend>
            <div className="checkout-field-grid">
              <div className="checkout-field-wide checkout-field-with-help"><label className="checkout-field-wide"><span className="sr-only">Email address</span><input aria-describedby="checkout-email-help" placeholder="Email address" type="email" autoComplete="email" inputMode="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} /></label><FieldHelp id="checkout-email-help" label="Why we ask for your email">We’ll send your order confirmation and delivery updates to this address.</FieldHelp></div>
            </div>
          </fieldset>
          <fieldset className="checkout-group">
            <legend>Delivery address</legend>
            <div className="checkout-field-grid">
              <label className="checkout-field-wide"><span className="sr-only">Country or region</span><select required autoComplete="country" value={address.countryCode} onChange={(event) => updateAddress("countryCode", event.target.value)}><option value="">Country or region</option>{countries.map(([code, name]) => <option value={code} key={code}>{name}</option>)}</select></label>
              <label><span className="sr-only">First name</span><input placeholder="First name" type="text" autoComplete="given-name" required maxLength={70} value={address.firstName} onChange={(event) => updateAddress("firstName", event.target.value)} /></label>
              <label><span className="sr-only">Last name</span><input placeholder="Last name" type="text" autoComplete="family-name" required maxLength={70} value={address.lastName} onChange={(event) => updateAddress("lastName", event.target.value)} /></label>
              <div className="checkout-field-wide checkout-address-search">
                <div className="checkout-address-control">
                  {mapsApiKey && address.countryCode ? <div ref={addressLookupRef} aria-busy={addressLoading} /> : <input aria-label="Street address" autoComplete="address-line1" required={manualAddress} maxLength={160} disabled={!manualAddress} placeholder="Street address" value={address.address1} onChange={(event) => updateAddress("address1", event.target.value)} aria-describedby="checkout-address-help" />}
                  <SearchIcon />
                </div>
                <small id="checkout-address-help" aria-live="polite">{manualAddress ? "Sandbox testing: enter your delivery address manually." : addressLoading ? "Loading address…" : !mapsApiKey ? "Address search is temporarily unavailable. Please contact us for assistance." : !address.countryCode ? "Select your country to search for an address." : addressSelected ? "Address selected. Your delivery details are filled in below." : "Start typing and select a full address from the suggestions."}</small>
                {addressError && <p className="checkout-address-error" role="alert">{addressError} <button type="button" onClick={() => setAddressRetry((value) => value + 1)}>Retry search</button></p>}
              </div>
              {addressSelected && <div className="checkout-field-wide checkout-selected-address"><span>{address.address1}</span><small>Selected address</small></div>}
              <label className="checkout-field-wide"><span className="sr-only">Apartment, suite or floor (optional)</span><input placeholder="Apartment, suite or floor (optional)" type="text" autoComplete="address-line2" maxLength={120} value={address.address2} onChange={(event) => updateAddress("address2", event.target.value)} /></label>
              <label><span className="sr-only">City</span><input placeholder="City" type="text" autoComplete="address-level2" readOnly={!manualAddress} required={manualAddress} maxLength={100} onChange={(event) => updateAddress("city", event.target.value)} value={address.city} aria-describedby="checkout-address-help" /></label>
              <label><span className="sr-only">Postal code</span><input placeholder="Postal code" type="text" autoComplete="postal-code" readOnly={!manualAddress} required={manualAddress && !["AE", "HK", "MO", "QA"].includes(address.countryCode)} maxLength={30} onChange={(event) => updateAddress("postalCode", event.target.value)} value={address.postalCode} aria-describedby="checkout-address-help" /></label>
              {(address.region || manualAddress) && <label className="checkout-field-wide"><span className="sr-only">State, province or region</span><input placeholder="State, province or region" type="text" autoComplete="address-level1" readOnly={!manualAddress} maxLength={100} onChange={(event) => updateAddress("region", event.target.value)} value={address.region} /></label>}
              <div className="checkout-field-wide checkout-field-with-help"><label className="checkout-field-wide"><span className="sr-only">Phone number</span><input placeholder="Phone number" type="tel" autoComplete="tel" inputMode="tel" required maxLength={35} pattern={"[+\\(\\)\\s0-9\\-]{7,35}"} value={address.phone} onChange={(event) => updateAddress("phone", event.target.value)} aria-describedby="checkout-phone-help" /></label><FieldHelp id="checkout-phone-help" label="Why we ask for your phone number">For the courier to contact you about delivery. Please include your country code.</FieldHelp></div>
            </div>
          </fieldset>
          <section className="checkout-group" aria-labelledby="checkout-delivery-title">
            <h2 id="checkout-delivery-title">Delivery</h2>
            <div className="checkout-delivery"><span><strong>Complimentary insured delivery</strong><small>Your jewellery travels fully insured.</small></span><span>Included</span></div>
          </section>
          <section className="checkout-group" aria-labelledby="checkout-payment-title">
            <h2 id="checkout-payment-title">Payment</h2>
            <p className="checkout-payment-description">Choose your payment method on the next secure page.</p>
            <label className="checkout-consent"><input type="checkbox" required checked={acceptedPolicies} onChange={(event) => setAcceptedPolicies(event.target.checked)} /><span>I agree to the <Link href="/policies/terms-of-service" target="_blank">Terms of Service</Link> and acknowledge the <Link href="/policies/privacy" target="_blank">Privacy Policy</Link> and <Link href="/policies/delivery-and-returns" target="_blank">Delivery &amp; Returns Policy</Link>.</span></label>
            {error && <p className="sandbox-checkout-error" role="alert">{error}</p>}
            <div className="checkout-actions"><Link className="checkout-return" href="/bag"><span aria-hidden="true">‹</span> Return to bag</Link><button className="button button-dark checkout-payment-button" type="submit" disabled={!quote || !apiBase || !acceptedPolicies || !addressReady || busy}>{busy ? "Opening secure payment…" : "Continue to payment"}<span aria-hidden="true">→</span></button></div>
            <p className="checkout-secure-note"><LockIcon /> Secure payment by Airwallex</p>
          </section>
        </form>
        <CheckoutFooter />
      </div>
      <aside className="checkout-summary-panel" aria-label="Order summary">
        <details className="checkout-order-details" open>
          <summary><span>Order summary <span className="checkout-item-count">({commerce.bagCount})</span></span><span className="checkout-summary-toggle" aria-hidden="true">⌄</span></summary>
          <div className="sandbox-checkout-summary">
            {commerce.bag.map((item, index) => {
              const product = products.find((candidate) => candidate.id === item.productId);
              return <div className="sandbox-checkout-line" key={item.key}>
                <div className="checkout-product-image">{product && <img src={assetPath(product.primary)} alt="" />}<span aria-label={`Quantity ${item.quantity}`}>{item.quantity}</span></div>
                <div className="checkout-product-info"><span>{product?.name || item.productId}</span>{item.option && <small>{item.option}</small>}</div>
                <strong>{quote ? money(quote.lines[index]?.total ?? 0) : "—"}</strong>
              </div>;
            })}
            <div className="checkout-costs">
              <div className="sandbox-checkout-total"><span>Subtotal</span><strong>{quote ? money(quote.subtotal) : error ? "Unavailable" : "Calculating…"}</strong></div>
              <div className="sandbox-checkout-total"><span>Insured delivery</span><strong>Included</strong></div>
              <div className="sandbox-checkout-total"><span>Taxes &amp; duties</span><strong>Included</strong></div>
              <div className="sandbox-checkout-total is-grand"><span>Total</span><strong>{quote ? money(quote.total) : "—"}</strong></div>
              <p className="checkout-price-assurance">No additional taxes or duties on delivery.</p>
            </div>
          </div>
        </details>
      </aside>
    </div> : <><section className="utility-empty checkout-empty"><h1>Your bag is empty.</h1><Link className="button button-dark" href="/collections/all-jewellery">Explore jewellery</Link></section><CheckoutFooter /></>}
  </main>;
}

export function SandboxPaymentResultView() {
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const order = typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("order") || "";

  useEffect(() => {
    if (!order) return;
    let active = true;
    requestApi<{ status: string }>(`/api/payment-status?order=${encodeURIComponent(order)}`)
      .then((result) => { if (active) { setStatus(result.status); setError(""); } })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Could not verify payment status."); });
    return () => { active = false; };
  }, [order]);

  const refresh = async () => {
    try {
      const result = await requestApi<{ status: string }>(`/api/payment-status?order=${encodeURIComponent(order)}`);
      setStatus(result.status);
      setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not verify payment status."); }
  };

  const success = status === "SUCCEEDED";
  return <main className="checkout-page"><CheckoutHeader /><section className="sandbox-result"><p className="micro-label">Order confirmation</p><h1>{success ? "Test payment confirmed" : status ? "Payment " + status.replaceAll("_", " ").toLowerCase() : "Confirming your payment"}</h1><p>{success ? "Your sandbox payment was successful. No real charge or jewellery order has been made." : "Please keep this page open while we securely confirm the payment status."}</p>{error && <p className="sandbox-checkout-error" role="alert">{error}</p>}<button className="underlined-link" type="button" onClick={() => void refresh()}>Check status again</button><a className="button button-dark" href="/collections/all-jewellery">Continue browsing</a></section></main>;
}
