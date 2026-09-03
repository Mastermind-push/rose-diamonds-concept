export type ProductCategory = "Rings" | "Necklaces" | "Earrings" | "Bracelets";
export type StorefrontDiamondType = "natural" | "laboratory";

export type StorefrontCaratOption = {
  id: string;
  label: string;
};

export type StorefrontProductFact = {
  id: string;
  label: string;
  value: string;
};

export type StorefrontProductImage = {
  id: string;
  src: string;
  altText: string;
};

export type Product = {
  id: string;
  name: string;
  category: ProductCategory;
  collection: "ROSÉ Signature" | "ROSÉ Dopamine" | "";
  detail: string;
  price: number;
  priceLabel: string;
  metals: string[];
  colours: string[];
  primary: string;
  secondary: string;
  isNew?: boolean;
  fullDescription?: string;
  diamondTypes?: StorefrontDiamondType[];
  caratOptions?: StorefrontCaratOption[];
  variantPrices?: Record<string, number>;
  sizes?: string[];
  facts?: StorefrontProductFact[];
  images?: StorefrontProductImage[];
};

const imagePair = (slug: string) => ({
  primary: `catalog/${slug}-1.webp`,
  secondary: `catalog/${slug}-2.webp`,
});

export const products: Product[] = [
  { id: "pink-emerald-three-stone", name: "Rosé Pink Emerald Three-Stone", category: "Rings", collection: "ROSÉ Signature", detail: "Emerald-cut pink diamond with trillion side stones", price: 2250, priceLabel: "From $2,250", metals: ["White Gold"], colours: ["Pink"], ...imagePair("pink-emerald-three-stone") },
  { id: "pink-marquise-three-stone", name: "Rosé Pink Marquise Three-Stone", category: "Rings", collection: "ROSÉ Signature", detail: "Marquise pink diamond with pear side stones", price: 2475, priceLabel: "From $2,475", metals: ["White Gold"], colours: ["Pink"], ...imagePair("pink-marquise-three-stone") },
  { id: "pink-heart-halo", name: "Rosé Pink Heart Halo", category: "Rings", collection: "ROSÉ Signature", detail: "Heart-cut pink diamond, halo and pavé band", price: 2150, priceLabel: "From $2,150", metals: ["White Gold"], colours: ["Pink"], ...imagePair("pink-heart-halo") },
  { id: "pink-oval-solitaire", name: "Rosé Pink Oval Solitaire", category: "Rings", collection: "ROSÉ Signature", detail: "Oval pink diamond with a pavé band", price: 1975, priceLabel: "From $1,975", metals: ["White Gold"], colours: ["Pink"], ...imagePair("pink-oval-solitaire") },
  { id: "yellow-radiant-three-stone", name: "Rosé Yellow Radiant Three-Stone", category: "Rings", collection: "ROSÉ Signature", detail: "Radiant yellow diamond with trillion side stones", price: 2150, priceLabel: "From $2,150", metals: ["White Gold"], colours: ["Yellow"], ...imagePair("yellow-radiant-three-stone") },
  { id: "toi-et-moi-yellow", name: "Rosé Toi et Moi Fancy Yellow", category: "Rings", collection: "ROSÉ Signature", detail: "Oval white and cushion-cut yellow diamonds", price: 2525, priceLabel: "From $2,525", metals: ["White Gold", "Yellow Gold"], colours: ["White", "Yellow"], ...imagePair("toi-et-moi-yellow") },
  { id: "toi-et-moi-classic", name: "Rosé Toi et Moi Classic", category: "Rings", collection: "ROSÉ Signature", detail: "Pear and oval diamonds in perfect balance", price: 2275, priceLabel: "From $2,275", metals: ["White Gold", "Yellow Gold"], colours: ["White"], ...imagePair("toi-et-moi-classic") },
  { id: "toi-et-moi-pink", name: "Rosé Toi et Moi Fancy Pink", category: "Rings", collection: "ROSÉ Signature", detail: "Pear white and emerald-cut pink diamonds", price: 2675, priceLabel: "From $2,675", metals: ["White Gold", "Rose Gold"], colours: ["White", "Pink"], ...imagePair("toi-et-moi-pink") },
  { id: "oval-solitaire", name: "Rosé Oval Solitaire", category: "Rings", collection: "ROSÉ Signature", detail: "Oval diamond with a fine pavé band", price: 1650, priceLabel: "From $1,650", metals: ["White Gold"], colours: ["White"], ...imagePair("oval-solitaire") },
  { id: "emerald-halo-ring", name: "Rosé Emerald Halo", category: "Rings", collection: "ROSÉ Signature", detail: "Emerald-cut diamond with a luminous halo", price: 1850, priceLabel: "From $1,850", metals: ["White Gold"], colours: ["White"], ...imagePair("emerald-halo-ring") },
  { id: "heart-halo-ring", name: "Rosé Heart Halo", category: "Rings", collection: "ROSÉ Signature", detail: "Heart-cut diamond, halo and pavé band", price: 1950, priceLabel: "From $1,950", metals: ["White Gold"], colours: ["White"], ...imagePair("heart-halo-ring") },

  { id: "emerald-halo-pendant", name: "Rosé Emerald Halo Pendant", category: "Necklaces", collection: "ROSÉ Signature", detail: "Emerald-cut diamond on a diamond-set chain", price: 2075, priceLabel: "From $2,075", metals: ["White Gold"], colours: ["White"], ...imagePair("emerald-halo-pendant") },
  { id: "tennis-necklace", name: "Rosé Signature Tennis Necklace", category: "Necklaces", collection: "ROSÉ Signature", detail: "Round diamonds with the ROSÉ signature clasp", price: 9575, priceLabel: "From $9,575", metals: ["White Gold"], colours: ["White"], ...imagePair("tennis-necklace") },
  { id: "queen-hearts-necklace", name: "Rosé Queen of Hearts Necklace", category: "Necklaces", collection: "ROSÉ Signature", detail: "A heart-cut centrepiece framed by mixed cuts", price: 13975, priceLabel: "From $13,975", metals: ["White Gold"], colours: ["White"], ...imagePair("queen-hearts-necklace") },
  { id: "round-pendant", name: "Rosé Classic Round Diamond Pendant", category: "Necklaces", collection: "ROSÉ Signature", detail: "A classic round diamond in 18K white gold", price: 1845, priceLabel: "From $1,845", metals: ["White Gold"], colours: ["White"], ...imagePair("round-pendant") },
  { id: "cross-pendant", name: "Rosé Classic Diamond Cross Pendant", category: "Necklaces", collection: "ROSÉ Signature", detail: "Round diamonds in a refined cross setting", price: 1775, priceLabel: "From $1,775", metals: ["White Gold"], colours: ["White"], ...imagePair("cross-pendant") },
  { id: "queen-hearts-pendant", name: "Rosé Queen of Hearts Pendant", category: "Necklaces", collection: "ROSÉ Signature", detail: "A heart-cut diamond in 18K white gold", price: 1995, priceLabel: "From $1,995", metals: ["White Gold"], colours: ["White"], ...imagePair("queen-hearts-pendant") },

  { id: "round-studs", name: "Rosé Classic Round Studs", category: "Earrings", collection: "ROSÉ Signature", detail: "Round brilliant diamonds in 18K white gold", price: 895, priceLabel: "From $895", metals: ["White Gold"], colours: ["White"], ...imagePair("round-studs") },
  { id: "oval-studs", name: "Rosé Oval Diamond Studs", category: "Earrings", collection: "ROSÉ Signature", detail: "Oval diamonds in a minimal four-claw setting", price: 995, priceLabel: "From $995", metals: ["White Gold"], colours: ["White"], ...imagePair("oval-studs") },
  { id: "pear-studs", name: "Rosé Pear Shape Studs", category: "Earrings", collection: "ROSÉ Signature", detail: "Pear-cut diamonds in 18K white gold", price: 995, priceLabel: "From $995", metals: ["White Gold"], colours: ["White"], ...imagePair("pear-studs") },
  { id: "emerald-halo-studs", name: "Rosé Emerald Halo Studs", category: "Earrings", collection: "ROSÉ Signature", detail: "Emerald-cut diamonds framed by fine halos", price: 1375, priceLabel: "From $1,375", metals: ["White Gold"], colours: ["White"], ...imagePair("emerald-halo-studs") },
  { id: "queen-hearts-earrings", name: "Rosé Queen of Hearts Earrings", category: "Earrings", collection: "ROSÉ Signature", detail: "Heart-cut diamonds in 18K white gold", price: 1075, priceLabel: "From $1,075", metals: ["White Gold"], colours: ["White"], ...imagePair("queen-hearts-earrings") },

  { id: "slim-tennis-bracelet", name: "Rosé Slim Tennis Bracelet", category: "Bracelets", collection: "ROSÉ Signature", detail: "A delicate line of round brilliant diamonds", price: 3295, priceLabel: "From $3,295", metals: ["White Gold"], colours: ["White"], ...imagePair("slim-tennis-bracelet") },
  { id: "signature-tennis-bracelet", name: "Rosé Signature Tennis Bracelet", category: "Bracelets", collection: "ROSÉ Signature", detail: "Round diamonds with the ROSÉ signature clasp", price: 5395, priceLabel: "From $5,395", metals: ["White Gold"], colours: ["White"], ...imagePair("signature-tennis-bracelet") },
  { id: "emerald-tennis-bracelet", name: "Rosé Emerald Tennis Bracelet", category: "Bracelets", collection: "ROSÉ Signature", detail: "A continuous line of emerald-cut diamonds", price: 6495, priceLabel: "From $6,495", metals: ["White Gold"], colours: ["White"], ...imagePair("emerald-tennis-bracelet") },

  { id: "pink-bloom", name: "Pink Bloom", category: "Rings", collection: "ROSÉ Dopamine", detail: "Pink sapphires and a pink oval diamond", price: 1350, priceLabel: "$1,350", metals: ["White Gold"], colours: ["Pink"], isNew: true, ...imagePair("pink-bloom") },
  { id: "youth", name: "Youth", category: "Rings", collection: "ROSÉ Dopamine", detail: "Pink sapphires and a colourless oval diamond", price: 1350, priceLabel: "$1,350", metals: ["White Gold"], colours: ["Pink", "White"], isNew: true, ...imagePair("youth") },
  { id: "blue-lagoon", name: "Blue Lagoon", category: "Rings", collection: "ROSÉ Dopamine", detail: "Paraiba tourmaline and a heart-cut diamond", price: 1350, priceLabel: "$1,350", metals: ["White Gold"], colours: ["Blue", "White"], isNew: true, ...imagePair("blue-lagoon") },
  { id: "secret-garden", name: "Secret Garden", category: "Rings", collection: "ROSÉ Dopamine", detail: "Emeralds and an emerald-cut diamond", price: 1350, priceLabel: "$1,350", metals: ["White Gold"], colours: ["Green", "White"], isNew: true, ...imagePair("secret-garden") },
  { id: "cherry-kiss", name: "Cherry Kiss", category: "Rings", collection: "ROSÉ Dopamine", detail: "Rubies and a marquise diamond", price: 1350, priceLabel: "$1,350", metals: ["Rose Gold"], colours: ["Red", "White"], isNew: true, ...imagePair("cherry-kiss") },
  { id: "blue-velvet", name: "Blue Velvet", category: "Rings", collection: "ROSÉ Dopamine", detail: "Blue sapphires and a cushion-cut diamond", price: 1350, priceLabel: "$1,350", metals: ["White Gold"], colours: ["Blue", "White"], isNew: true, ...imagePair("blue-velvet") },
  { id: "golden-hour", name: "Golden Hour", category: "Rings", collection: "ROSÉ Dopamine", detail: "Yellow sapphires and a pear-cut diamond", price: 1350, priceLabel: "$1,350", metals: ["Yellow Gold"], colours: ["Yellow", "White"], isNew: true, ...imagePair("golden-hour") },
  { id: "sweetheart", name: "Sweetheart", category: "Rings", collection: "ROSÉ Dopamine", detail: "White diamonds and a pink heart sapphire", price: 1350, priceLabel: "$1,350", metals: ["White Gold"], colours: ["Pink", "White"], isNew: true, ...imagePair("sweetheart") },
];

export const catalogConfigs = {
  "all-jewellery": {
    eyebrow: "The complete collection",
    title: "All Jewellery",
    description: "Diamonds, expressive colour and pieces chosen to become part of your everyday life.",
  },
  "new-in": {
    eyebrow: "The latest pieces",
    title: "New In",
    description: "The newest ROSÉ pieces, selected across colour, diamonds and modern signatures.",
    newOnly: true,
  },
  rings: {
    eyebrow: "Jewellery",
    title: "Rings",
    description: "From timeless solitaires to vivid colour and pieces made to stack.",
    category: "Rings" as ProductCategory,
  },
  necklaces: {
    eyebrow: "Jewellery",
    title: "Necklaces",
    description: "Luminous diamonds designed to sit close to the heart.",
    category: "Necklaces" as ProductCategory,
  },
  earrings: {
    eyebrow: "Jewellery",
    title: "Earrings",
    description: "From delicate studs to distinctive diamonds that frame the face.",
    category: "Earrings" as ProductCategory,
  },
  bracelets: {
    eyebrow: "Jewellery",
    title: "Bracelets",
    description: "Fine lines of brilliance, made for every version of the day.",
    category: "Bracelets" as ProductCategory,
  },
  "rose-dopamine": {
    eyebrow: "The collection",
    title: "ROSÉ Dopamine",
    description: "A little joy set in gold, diamonds and vivid colour. Wear one or build your own stack.",
    collection: "ROSÉ Dopamine" as const,
  },
  "rose-signature": {
    eyebrow: "The collection",
    title: "ROSÉ Signature",
    description: "Enduring diamond forms shaped with clarity, balance and a distinctly ROSÉ point of view.",
    collection: "ROSÉ Signature" as const,
  },
  gifts: {
    eyebrow: "The gift edit",
    title: "Gifts",
    description: "Diamonds chosen to mark a moment, say something meaningful or simply bring joy.",
    productIds: ["round-studs", "oval-studs", "pear-studs", "round-pendant", "queen-hearts-pendant", "pink-bloom", "sweetheart", "slim-tennis-bracelet"] as readonly string[],
  },
} as const;

export type CatalogSlug = keyof typeof catalogConfigs;
