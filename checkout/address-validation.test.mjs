import assert from "node:assert/strict";
import test from "node:test";
import { isConfirmedAddress } from "./address-validation.ts";

const address = { formattedAddress: "20 Main Street" };
const verdict = { addressComplete: true, validationGranularity: "PREMISE" };

test("accepts complete confirmed premises and subpremises", () => {
  assert.equal(isConfirmedAddress(verdict, address), true);
  assert.equal(isConfirmedAddress({ ...verdict, validationGranularity: "SUB_PREMISE" }, address), true);
});

test("does not mistake a geocoded street, incomplete or uncertain address for a verified delivery", () => {
  for (const validationGranularity of [undefined, "OTHER", "ROUTE", "BLOCK", "PREMISE_PROXIMITY"]) {
    assert.equal(isConfirmedAddress({ ...verdict, validationGranularity }, address), false);
  }
  for (const badVerdict of [undefined, {}, { ...verdict, addressComplete: false }, { ...verdict, hasUnconfirmedComponents: true }]) {
    assert.equal(isConfirmedAddress(badVerdict, address), false);
  }
  assert.equal(isConfirmedAddress(verdict, { ...address, missingComponentTypes: ["street_number"] }), false);
  assert.equal(isConfirmedAddress(verdict, { ...address, unresolvedTokens: ["unknown"] }), false);
  assert.equal(isConfirmedAddress(verdict, {}), false);
});
