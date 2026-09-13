import assert from "node:assert/strict";
import test from "node:test";
import worker from "./worker.ts";

const env = {
  AIRWALLEX_CLIENT_ID: "sandbox-client",
  AIRWALLEX_API_KEY: "sandbox-key",
  AIRWALLEX_ACCOUNT_ID: "sandbox-account",
  ALLOWED_ORIGINS: "https://mastermind-push.github.io",
  GOOGLE_ADDRESS_VALIDATION_API_KEY: "test-validation-key",
};
const origin = "https://mastermind-push.github.io";

function request(path, body) {
  return new Request(`https://checkout.example.test${path}`, {
    method: "POST", headers: { origin, "content-type": "application/json" }, body: JSON.stringify(body),
  });
}

test("rejects a browser origin that is not allowlisted", async () => {
  const response = await worker.fetch(new Request("https://checkout.example.test/api/quote", { method: "POST", headers: { origin: "https://evil.example" }, body: "{}" }), env);
  assert.equal(response.status, 403);
});

test("creates a sandbox intent for the server-calculated amount", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), options });
    if (String(url).includes("addressvalidation.googleapis.com")) return Response.json({ result: { verdict: { addressComplete: true, validationGranularity: "PREMISE" }, address: { formattedAddress: "20 Main Street, New York, NY 10001" } } });
    if (String(url).endsWith("/authentication/login")) return Response.json({ token: "temporary-test-token", expires_at: "2099-01-01T00:00:00Z" }, { status: 201 });
    return Response.json({ id: "int_test", client_secret: "temporary-client-secret" });
  };
  try {
    const response = await worker.fetch(request("/api/payment-intent", {
      items: [{ productId: "round-studs", option: "18k white gold", quantity: 2, price: 1, name: "Untrusted name" }],
      email: "shopper@example.test",
      deliveryAddress: {
        firstName: "Rose", lastName: "Client", phone: "+1 212 555 0123", countryCode: "US",
        address1: "20 Main Street", address2: "", city: "New York", region: "NY", postalCode: "10001", placeId: "selected-test-place",
      },
      returnPath: "/rose-diamonds-concept/checkout/result",
    }), env);
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.amount, 1790);
    assert.ok(result.returnUrl.startsWith(`${origin}/rose-diamonds-concept/checkout/result?order=ROSE-TEST-`));
    assert.equal(calls[1].options.headers["x-api-key"], "sandbox-key");
    assert.equal(calls[1].options.headers["x-login-as"], "sandbox-account");
    assert.ok(calls[2].url.startsWith("https://api.sandbox.airwallex.com/"));
    const payload = JSON.parse(calls[2].options.body);
    assert.equal(payload.amount, 1790);
    assert.equal(payload.order.products.length, 1);
    const product = payload.order.products[0];
    assert.equal(product.code, "round-studs");
    assert.ok(product.name && product.name !== "Untrusted name");
    assert.equal(product.desc, "18k white gold");
    assert.equal(product.quantity, 2);
    assert.equal(product.unit_price, 895, "hosted order must use the authoritative unit price");
    assert.equal(product.type, "physical_good");
    assert.equal(payload.order.products.reduce((total, item) => total + item.quantity * item.unit_price, 0), payload.amount);
  } finally { globalThis.fetch = originalFetch; }
});

test("requires a complete delivery address before creating a payment", async () => {
  const response = await worker.fetch(request("/api/payment-intent", {
    items: [{ productId: "round-studs", quantity: 1 }],
    email: "shopper@example.test", deliveryAddress: { countryCode: "US" }, returnPath: "/rose-diamonds-concept/checkout/result",
  }), env);
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /phone number|first name|delivery address/i);
});

const validBody = {
  items: [{ productId: "round-studs", quantity: 1 }], email: "shopper@example.test",
  deliveryAddress: { firstName: "Rose", lastName: "Client", phone: "+1 212 555 0123", countryCode: "US", address1: "20 Main Street", address2: "", city: "New York", region: "NY", postalCode: "10001", placeId: "selected-test-place" },
  returnPath: "/checkout/result",
};

test("requires address verification configuration and never falls back to manual validation", async () => {
  const response = await worker.fetch(request("/api/payment-intent", validBody), { ...env, GOOGLE_ADDRESS_VALIDATION_API_KEY: undefined });
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /verification is temporarily unavailable/);
});

test("requires an address selected from suggestions", async () => {
  const response = await worker.fetch(request("/api/payment-intent", { ...validBody, deliveryAddress: { ...validBody.deliveryAddress, placeId: "" } }), env);
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /selected from the suggestions/);
});

test("blocks payment for an unconfirmed address, including modified apartment details", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (url, options) => {
    calls++;
    assert.ok(String(url).includes("addressvalidation.googleapis.com"));
    assert.deepEqual(JSON.parse(options.body).address.addressLines, ["20 Main Street", "Unknown apartment"]);
    return Response.json({ result: { verdict: { addressComplete: true, validationGranularity: "PREMISE", hasUnconfirmedComponents: true }, address: { formattedAddress: "20 Main Street" } } });
  };
  try {
    const response = await worker.fetch(request("/api/payment-intent", { ...validBody, deliveryAddress: { ...validBody.deliveryAddress, address2: "Unknown apartment" } }), env);
    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /could not confirm/);
    assert.equal(calls, 1, "must not contact Airwallex");
  } finally { globalThis.fetch = originalFetch; }
});

test("a provider outage cannot create a payment", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    assert.ok(String(url).includes("addressvalidation.googleapis.com"));
    throw new Error("offline");
  };
  try {
    const response = await worker.fetch(request("/api/payment-intent", validBody), env);
    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /could not verify/);
  } finally { globalThis.fetch = originalFetch; }
});

const localOrigin = "http://127.0.0.1:5174";
const localEnv = { ...env, ALLOWED_ORIGINS: localOrigin, GOOGLE_ADDRESS_VALIDATION_API_KEY: undefined };
const manualBody = { ...validBody, deliveryAddress: { ...validBody.deliveryAddress, placeId: "" } };
function localRequest(body, host = "http://localhost:8788") {
  return new Request(`${host}/api/payment-intent`, { method: "POST", headers: { origin: localOrigin, "content-type": "application/json" }, body: JSON.stringify(body) });
}

test("local sandbox permits a complete manual address without Google and marks it unverified", async () => {
  const originalFetch = globalThis.fetch;
  let intentBody;
  globalThis.fetch = async (url, options) => {
    assert.ok(String(url).startsWith("https://api.sandbox.airwallex.com/"));
    if (String(url).endsWith("/authentication/login")) return Response.json({ token: "sandbox-token", expires_at: "2099-01-01T00:00:00Z" });
    intentBody = JSON.parse(options.body);
    return Response.json({ id: "int_manual_test", client_secret: "sandbox-test-secret" });
  };
  try {
    const response = await worker.fetch(localRequest(manualBody), localEnv);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).amount, 895);
    assert.equal(intentBody.metadata.address_validation, "sandbox_manual");
  } finally { globalThis.fetch = originalFetch; }
});

test("a hosted API blocks manual entry without explicit sandbox opt-in", async () => {
  const response = await worker.fetch(localRequest(manualBody, "https://checkout.example.test"), localEnv);
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /selected from the suggestions/);
});

test("a hosted browser cannot enable manual entry on the local API", async () => {
  const response = await worker.fetch(new Request("http://localhost:8788/api/payment-intent", { method: "POST", headers: { origin, "content-type": "application/json" }, body: JSON.stringify(manualBody) }), env);
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /selected from the suggestions/);
});

test("manual test checkout still requires street, city and applicable postcode", async () => {
  for (const field of ["address1", "city", "postalCode"]) {
    const response = await worker.fetch(localRequest({ ...manualBody, deliveryAddress: { ...manualBody.deliveryAddress, [field]: "" } }), localEnv);
    assert.equal(response.status, 400);
  }
});

test("health exposes manual-address capability only to a local sandbox storefront", async () => {
  const response = await worker.fetch(new Request("http://localhost:8788/api/health", { headers: { origin: localOrigin } }), localEnv);
  assert.equal((await response.json()).manualAddressAllowed, true);
  const hosted = await worker.fetch(new Request("https://checkout.example.test/api/health", { headers: { origin: localOrigin } }), localEnv);
  assert.equal((await hosted.json()).manualAddressAllowed, false);
});


test("the explicitly configured HTTPS preview can create a manual sandbox payment", async () => {
  const originalFetch = globalThis.fetch;
  let payload;
  globalThis.fetch = async (url, options) => {
    assert.ok(String(url).startsWith("https://api.sandbox.airwallex.com/"));
    if (String(url).endsWith("/authentication/login")) return Response.json({ token: "sandbox-token", expires_at: "2099-01-01T00:00:00Z" });
    payload = JSON.parse(options.body);
    return Response.json({ id: "int_hosted_test", client_secret: "sandbox-test-secret" });
  };
  try {
    const hostedEnv = { ...env, GOOGLE_ADDRESS_VALIDATION_API_KEY: undefined, SANDBOX_MANUAL_ADDRESS_ORIGINS: origin };
    const response = await worker.fetch(request("/api/payment-intent", manualBody), hostedEnv);
    assert.equal(response.status, 200);
    assert.equal(payload.metadata.address_validation, "sandbox_manual");
    assert.equal(payload.order.products[0].quantity, 1);
    const health = await worker.fetch(new Request("https://checkout.example.test/api/health", { headers: { origin } }), hostedEnv);
    assert.equal((await health.json()).manualAddressAllowed, true);
  } finally { globalThis.fetch = originalFetch; }
});

test("hosted manual sandbox opt-in requires an exact allowlisted HTTPS origin", async () => {
  for (const requestOrigin of ["https://other.example", "http://mastermind-push.github.io", origin + ".evil.example"]) {
    const response = await worker.fetch(new Request("https://checkout.example.test/api/health", { headers: { origin: requestOrigin } }), {
      ...env, ALLOWED_ORIGINS: requestOrigin, SANDBOX_MANUAL_ADDRESS_ORIGINS: origin,
    });
    assert.equal((await response.json()).manualAddressAllowed, false);
  }
});
