import { products } from "../data/catalog.ts";

export type CheckoutItem = { productId: string; option?: string; quantity: number };

const ovalPrices: Record<string, number> = {
  "laboratory::0.50": 1650,
  "laboratory::1.00": 2250,
  "laboratory::1.50": 3150,
  "natural::0.50": 3950,
  "natural::1.00": 8900,
  "natural::1.50": 15900,
};

function priceFor(productId: string, option = "") {
  const product = products.find((item) => item.id === productId);
  if (!product) throw new Error("One of the selected pieces is not in the published catalogue.");

  if (productId !== "oval-solitaire") return product.price;
  const parts = option.split(" · ");
  const diamond = parts[0] === "Laboratory-grown diamond" ? "laboratory"
    : parts[0] === "Natural diamond" ? "natural" : "";
  const carat = parts[1]?.match(/^(0\.50|1\.00|1\.50) ct$/)?.[1];
  const price = ovalPrices[`${diamond}::${carat}`];
  if (!price) throw new Error("Please select a valid diamond and carat weight for the oval solitaire.");
  return price;
}

export function quoteCart(input: unknown) {
  if (!Array.isArray(input) || input.length < 1 || input.length > 20) {
    throw new Error("Your bag must contain between 1 and 20 pieces.");
  }

  const lines = input.map((raw) => {
    if (!raw || typeof raw !== "object") throw new Error("Invalid bag item.");
    const item = raw as Partial<CheckoutItem>;
    if (typeof item.productId !== "string" || typeof item.option !== "undefined" && typeof item.option !== "string"
      || !Number.isInteger(item.quantity) || (item.quantity ?? 0) < 1 || (item.quantity ?? 0) > 5
      || (item.option?.length ?? 0) > 120) throw new Error("Invalid bag item.");

    const product = products.find((entry) => entry.id === item.productId);
    if (!product) throw new Error("One of the selected pieces is not in the published catalogue.");
    const unitPrice = priceFor(item.productId, item.option);
    return { productId: product.id, name: product.name, option: item.option ?? "", quantity: item.quantity!, unitPrice, total: unitPrice * item.quantity! };
  });

  const subtotal = lines.reduce((sum, line) => sum + line.total, 0);
  if (subtotal <= 0 || subtotal > 100_000) throw new Error("This order requires a concierge quotation.");
  return { currency: "USD" as const, lines, subtotal, delivery: 0, total: subtotal };
}
