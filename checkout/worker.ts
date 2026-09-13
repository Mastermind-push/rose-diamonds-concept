import { quoteCart } from "./pricing.ts";
import { isConfirmedAddress, type AddressVerdict } from "./address-validation.ts";

type Env = {
  AIRWALLEX_CLIENT_ID: string;
  AIRWALLEX_API_KEY: string;
  AIRWALLEX_ACCOUNT_ID: string;
  ALLOWED_ORIGINS: string;
  GOOGLE_ADDRESS_VALIDATION_API_KEY?: string;
  SANDBOX_MANUAL_ADDRESS_ORIGINS?: string;
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

const airwallexBase = "https://api.sandbox.airwallex.com";
let cachedToken: { token: string; expiresAt: number } | undefined;

function json(body: unknown, status = 200, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });
}

function allowedOrigin(request: Request, env: Env) {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  const allowed = env.ALLOWED_ORIGINS.split(",").map((value) => value.trim()).filter(Boolean);
  return allowed.includes(origin) ? origin : null;
}

function cors(origin: string | null): HeadersInit {
  return origin ? { "access-control-allow-origin": origin, "vary": "Origin", "access-control-allow-methods": "GET, POST, OPTIONS", "access-control-allow-headers": "content-type" } : {};
}

async function readJson(request: Request) {
  if (Number(request.headers.get("content-length")) > 16_384) throw new Error("Request is too large.");
  const body = await request.text();
  if (body.length > 16_384) throw new Error("Request is too large.");
  try { return JSON.parse(body) as Record<string, unknown>; }
  catch { throw new Error("Invalid request body."); }
}

function requiredText(value: unknown, label: string, maxLength: number) {
  if (typeof value !== "string" || !value.trim() || value.length > maxLength) throw new Error(`Please enter a valid ${label}.`);
  return value.trim();
}

// Hosted test storefronts must be explicitly opted in; this never applies to a live gateway.
function sandboxAddressAllowed(url: URL, origin: string | null, env: Env) {
  const loopback = ["localhost", "127.0.0.1", "[::1]"];
  if (airwallexBase !== "https://api.sandbox.airwallex.com" || !origin) return false;
  if (loopback.includes(url.hostname) && loopback.includes(new URL(origin).hostname)) return true;
  const testOrigins = (env.SANDBOX_MANUAL_ADDRESS_ORIGINS ?? "").split(",").map((value) => value.trim());
  return url.protocol === "https:" && new URL(origin).protocol === "https:" && testOrigins.includes(origin);
}

function deliveryAddress(input: unknown, allowManual = false): DeliveryAddress {
  if (!input || typeof input !== "object") throw new Error("Please enter your delivery address.");
  const value = input as Record<string, unknown>;
  const countryCode = requiredText(value.countryCode, "delivery country", 2).toUpperCase();
  if (!/^[A-Z]{2}$/.test(countryCode)) throw new Error("Please select a valid delivery country.");
  const phone = requiredText(value.phone, "phone number", 35);
  if (!/^[+()\-\s0-9]{7,35}$/.test(phone)) throw new Error("Please enter a valid phone number.");
  if (allowManual) {
    requiredText(value.city, "city", 100);
    if (!["AE", "HK", "MO", "QA"].includes(countryCode)) requiredText(value.postalCode, "postal code", 30);
  }
  return {
    firstName: requiredText(value.firstName, "first name", 70),
    lastName: requiredText(value.lastName, "last name", 70),
    phone,
    countryCode,
    address1: requiredText(value.address1, "street address", 160),
    address2: typeof value.address2 === "string" ? value.address2.trim().slice(0, 120) : "",
    city: typeof value.city === "string" ? value.city.trim().slice(0, 100) : "",
    region: typeof value.region === "string" ? value.region.trim().slice(0, 100) : "",
    postalCode: typeof value.postalCode === "string" ? value.postalCode.trim().slice(0, 30) : "",
    placeId: allowManual ? "" : requiredText(value.placeId, "address selected from the suggestions", 180),
  };
}

async function validateDeliveryAddress(env: Env, address: DeliveryAddress) {
  if (!env.GOOGLE_ADDRESS_VALIDATION_API_KEY) throw new Error("Address verification is temporarily unavailable. Please contact us for assistance.");
  let response: Response;
  try {
    response = await fetch(`https://addressvalidation.googleapis.com/v1:validateAddress?key=${encodeURIComponent(env.GOOGLE_ADDRESS_VALIDATION_API_KEY)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ address: { regionCode: address.countryCode, locality: address.city, administrativeArea: address.region, postalCode: address.postalCode, addressLines: [address.address1, address.address2].filter(Boolean) } }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch { throw new Error("We could not verify this delivery address. Please try again."); }
  if (!response.ok) throw new Error("We could not verify this delivery address. Please check it and try again.");
  const result = await response.json() as { result?: { verdict?: AddressVerdict; address?: { formattedAddress?: string; missingComponentTypes?: string[]; unresolvedTokens?: string[] } } };
  if (!isConfirmedAddress(result.result?.verdict, result.result?.address)) {
    throw new Error("We could not confirm this complete delivery address. Please choose another suggestion or check the apartment details.");
  }
}

async function accessToken(env: Env) {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.token;
  if (!env.AIRWALLEX_CLIENT_ID || !env.AIRWALLEX_API_KEY || !env.AIRWALLEX_ACCOUNT_ID) {
    throw new Error("Sandbox checkout is not configured on the server.");
  }
  let response: Response;
  try {
    response = await fetch(`${airwallexBase}/api/v1/authentication/login`, {
      method: "POST",
      headers: {
        "x-client-id": env.AIRWALLEX_CLIENT_ID,
        "x-api-key": env.AIRWALLEX_API_KEY,
        "x-login-as": env.AIRWALLEX_ACCOUNT_ID,
      },
      signal: AbortSignal.timeout(15_000),
    });
  } catch { throw new Error("Airwallex sandbox is temporarily unreachable."); }
  if (!response.ok) throw new Error(`Airwallex sandbox authentication failed (${response.status}).`);
  const data = await response.json() as { token?: string; expires_at?: string };
  if (!data.token) throw new Error("Airwallex did not return an access token.");
  cachedToken = { token: data.token, expiresAt: Date.parse(data.expires_at ?? "") || Date.now() + 25 * 60_000 };
  return data.token;
}

async function airwallex<T>(env: Env, path: string, method: "GET" | "POST", body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${airwallexBase}${path}`, {
      method,
      headers: { authorization: `Bearer ${await accessToken(env)}`, "content-type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15_000),
    });
  } catch { throw new Error("Airwallex sandbox is temporarily unreachable."); }
  if (!response.ok) throw new Error(`Airwallex sandbox request failed (${response.status}).`);
  return response.json() as Promise<T>;
}

function resultUrl(origin: string, path: unknown, orderId: string) {
  if (typeof path !== "string" || !/^\/(?:[a-z0-9-]+\/)*checkout\/result\/?$/i.test(path)) {
    throw new Error("Invalid checkout return path.");
  }
  const url = new URL(path, origin);
  url.searchParams.set("order", orderId);
  return url.toString();
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = allowedOrigin(request, env);
    const manualAddressAllowed = sandboxAddressAllowed(url, origin, env);
    if (url.pathname === "/api/health") return json({ environment: "sandbox", ready: Boolean(env.AIRWALLEX_CLIENT_ID && env.AIRWALLEX_API_KEY), manualAddressAllowed }, 200, cors(origin));
    if (!origin) return json({ error: "Origin is not allowed." }, 403);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });

    try {
      if (url.pathname === "/api/quote" && request.method === "POST") {
        const body = await readJson(request);
        return json(quoteCart(body.items), 200, cors(origin));
      }

      if (url.pathname === "/api/payment-intent" && request.method === "POST") {
        const body = await readJson(request);
        const quote = quoteCart(body.items);
        if (typeof body.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email) || body.email.length > 254) {
          throw new Error("Please enter a valid email address.");
        }
        const submittedAddress = body.deliveryAddress as Partial<DeliveryAddress> | undefined;
        const manualAddress = manualAddressAllowed && !submittedAddress?.placeId;
        const address = deliveryAddress(body.deliveryAddress, manualAddress);
        if (!manualAddress) await validateDeliveryAddress(env, address);
        const orderId = `ROSE-TEST-${crypto.randomUUID()}`;
        const returnUrl = resultUrl(origin, body.returnPath, orderId);
        const intent = await airwallex<{ id: string; client_secret: string }>(env, "/api/v1/pa/payment_intents/create", "POST", {
          request_id: crypto.randomUUID(),
          merchant_order_id: orderId,
          amount: quote.total,
          currency: quote.currency,
          return_url: returnUrl,
          order: {
            products: quote.lines.map((line) => ({
              code: line.productId,
              name: line.name,
              desc: line.option || line.name,
              quantity: line.quantity,
              unit_price: line.unitPrice,
              type: "physical_good",
            })),
          },
          metadata: { mode: "sandbox", delivery_country: address.countryCode, address_validation: manualAddress ? "sandbox_manual" : "verified" },
        });
        if (!intent.id || !intent.client_secret) throw new Error("Airwallex did not return a payment session.");
        return json({ orderId, intentId: intent.id, clientSecret: intent.client_secret, currency: quote.currency, amount: quote.total, returnUrl }, 200, cors(origin));
      }

      if (url.pathname === "/api/payment-status" && request.method === "GET") {
        const orderId = url.searchParams.get("order") ?? "";
        if (!/^ROSE-TEST-[0-9a-f-]{36}$/.test(orderId)) throw new Error("Invalid test order number.");
        const result = await airwallex<{ items?: Array<{ merchant_order_id: string; status: string; amount: number; currency: string }> }>(
          env, `/api/v1/pa/payment_intents?merchant_order_id=${encodeURIComponent(orderId)}`, "GET",
        );
        const intent = result.items?.find((item) => item.merchant_order_id === orderId);
        if (!intent) return json({ error: "Test order not found." }, 404, cors(origin));
        return json({ orderId, status: intent.status, amount: intent.amount, currency: intent.currency }, 200, cors(origin));
      }

      return json({ error: "Not found." }, 404, cors(origin));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sandbox checkout failed.";
      const status = message.startsWith("Airwallex") || message.includes("configured") || message === "fetch failed" ? 502 : 400;
      return json({ error: message }, status, cors(origin));
    }
  },
};

export default worker;
