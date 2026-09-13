# Airwallex sandbox checkout

This is a test-only payment flow for the GitHub Pages storefront. The Worker talks only to `api.sandbox.airwallex.com`; no production payment can be created by this code. The Pages bundle never contains the API key.

## Local preview

1. Store the sandbox Client ID, API key, and Account ID in `checkout/.dev.vars` (this file is Git-ignored). Use the existing local file if already configured.
2. Run `npm run dev:checkout` for the API at `http://localhost:8788`.
3. In another terminal, run `npx vite --config vite.pages.config.ts` for the storefront. Add a product to the bag, then open `/checkout`.
4. The page can quote locally. To test Airwallex Hosted Payment Page end-to-end, use an HTTPS storefront URL: the HPP `successUrl` requires HTTPS. The local Worker may also need outbound access to Airwallex.

## GitHub Pages preview

GitHub Pages is static. Its checkout will remain disabled until this Worker has been deployed on a separate HTTPS URL. Deployment is **not** done by the local build.

Current sandbox Worker: `https://rose-airwallex-sandbox-checkout.rose-diamonds-sandbox.workers.dev`

1. Deploy `checkout/wrangler.jsonc` to a Cloudflare account, with `AIRWALLEX_CLIENT_ID`, `AIRWALLEX_API_KEY`, and `AIRWALLEX_ACCOUNT_ID` set as Worker secrets; never commit them or set them as `VITE_` variables.
2. Set `ALLOWED_ORIGINS` to the exact GitHub Pages origin (and any local development origins). The repository path is validated separately as the checkout return path.
3. Build the Pages frontend with public `VITE_SANDBOX_CHECKOUT_API_URL=https://<worker-host>` and publish that build to the development Pages site.
4. Test a successful card, a declined card, and 3-D Secure with Airwallex sandbox cards. The result screen checks the PaymentIntent status through the API; it does not trust the browser redirect as proof of payment.

## Address capture and validation

- Set `VITE_GOOGLE_MAPS_API_KEY` at frontend build time to enable Google Places address suggestions. This browser key is public by design and must be restricted in Google Cloud to the exact storefront origins and to Maps JavaScript API / Places API.
- Set `GOOGLE_ADDRESS_VALIDATION_API_KEY` as a Worker secret to reject incomplete or insufficiently precise addresses on the server. Use a separate key restricted to Address Validation API; never put it in a `VITE_` variable.
- Both keys are required for the normal verified-address checkout. Without them, address selection/payment is disabled unless the sandbox origin is explicitly opted in; the server never falls back to format-only validation. A selected suggestion fills the address fields, which cannot be freely edited. Changing country or search text clears that selection. Apartment details remain editable and are validated with the full address before payment.
- Server validation requires `addressComplete: true`, `PREMISE` or `SUB_PREMISE` granularity, no unconfirmed components, no missing components and no unresolved tokens. This is intentionally strict: coverage is not universal, and some valid addresses may need help from customer care. Do not describe the result as a guarantee of physical delivery.
- City, region and postal code are populated from the selected place. They are not blindly required for countries that do not use them; the provider checks the full country-specific postal address.

### Google Cloud setup (one-time)

1. In your Google Cloud project, enable billing and **Maps JavaScript API**, **Places API (New)** and **Address Validation API**.
2. Create a **browser key** restricted to HTTP referrers for the intended storefront. For local testing include `http://127.0.0.1:5174/*` and the exact localhost URL you use. Restrict its APIs to Maps JavaScript API and Places API (New).
3. Add `VITE_GOOGLE_MAPS_API_KEY=...` to the project-root `.env.local` without replacing existing values. The Pages Vite config reads this directory explicitly. Restart Vite after changes.
4. Create a separate **server key** restricted to Address Validation API. Add `GOOGLE_ADDRESS_VALIDATION_API_KEY=...` to `checkout/.dev.vars`; for hosted use set it as a Worker secret. Do not apply browser-referrer restrictions to this server key. Restart the checkout Worker.
5. Check a complete address, a partial street-only suggestion, an edited search after selection, and a provider failure before release. The two services incur Google usage charges; no Google account or billing changes are made by the local code.

Provider references: [Places widget](https://developers.google.com/maps/documentation/javascript/place-autocomplete-new), [Address Validation response](https://developers.google.com/maps/documentation/address-validation/reference/rest/v1/TopLevel/validateAddress).

This demo uses bundled catalogue prices with taxes, duties and complimentary insured delivery included. Admin changes stored only in the browser are not authoritative; before real payments, move catalogue pricing, orders, delivery fees, and customer details to a persistent server database, then add signed webhooks. Do not use this Worker for production.

### Local sandbox address entry

For payment testing before Google Cloud is connected, the local API health response advertises `manualAddressAllowed` only when **both** the request host and allowlisted storefront origin are loopback hosts. The gateway must still be the hardcoded Airwallex sandbox endpoint. A hosted HTTPS sandbox API can also opt in an exact, allowlisted HTTPS storefront through `SANDBOX_MANUAL_ADDRESS_ORIGINS`. The configured GitHub Pages preview is opted in for test payments before Google Cloud setup. No browser flag or submitted request value can enable this; the live gateway remains unsupported.

When Google Places is not configured, the frontend uses that server capability to enable manual street, city, region and postal-code fields. Names, email, telephone, country, street and city remain required; postcode is required except for AE, HK, MO and QA. These test payment intents are explicitly marked `address_validation: sandbox_manual`, never verified. Providing a selected place ID still invokes normal server verification. After Google is configured, the usual suggestion and validation flow is used.

The public preview labels checkout as test-only. Its return screen confirms a sandbox payment without promising fulfilment or email.
