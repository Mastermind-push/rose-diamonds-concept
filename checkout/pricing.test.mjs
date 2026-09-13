import assert from "node:assert/strict";
import test from "node:test";
import { quoteCart } from "./pricing.ts";

test("uses catalogue prices, not browser-supplied prices", () => {
  assert.equal(quoteCart([{ productId: "round-studs", quantity: 2, price: 1 }]).total, 1790);
});

test("uses the selected oval diamond variant", () => {
  assert.equal(quoteCart([{ productId: "oval-solitaire", option: "Laboratory-grown diamond · 1.00 ct · US 6", quantity: 1 }]).total, 2250);
  assert.equal(quoteCart([{ productId: "oval-solitaire", option: "Natural diamond · 1.00 ct · US 6", quantity: 1 }]).total, 8900);
});

test("rejects invalid variants and quantities", () => {
  assert.throws(() => quoteCart([{ productId: "oval-solitaire", option: "US 6", quantity: 1 }]));
  assert.throws(() => quoteCart([{ productId: "round-studs", quantity: 0 }]));
  assert.throws(() => quoteCart([{ productId: "unknown", quantity: 1 }]));
});
