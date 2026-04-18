import type { Product } from "@/server/schemas/catalog";

type FakeInput = {
  id: number;
  name: string;
  slug?: string;
  shortDescription?: string;
  priceMinor?: string;
  regularPriceMinor?: string;
  salePriceMinor?: string;
  currency?: string;
  inStock?: boolean;
  purchasable?: boolean;
};

function fakeProduct(input: FakeInput): Product {
  return {
    id: input.id,
    name: input.name,
    slug: input.slug ?? `fake-${input.id}`,
    permalink: undefined,
    short_description:
      input.shortDescription ?? "A delicious sample description used for the demo.",
    prices:
      input.priceMinor === undefined
        ? undefined
        : {
            currency_code: input.currency ?? "CHF",
            price: input.priceMinor,
            regular_price: input.regularPriceMinor,
            sale_price: input.salePriceMinor,
          },
    average_rating: undefined,
    review_count: undefined,
    is_in_stock: input.inStock ?? true,
    is_purchasable: input.purchasable ?? true,
    images: [],
    categories: [],
    sku: undefined,
    attributes: undefined,
    akwaraId: null,
  };
}

export type FakeCase = {
  label: string;
  description: string;
  product: Product;
};

export const fakeCases: FakeCase[] = [
  {
    label: "Regular price",
    description: "No promotion — plain bold price.",
    product: fakeProduct({
      id: 1001,
      name: "Organic Basmati Rice 1kg",
      priceMinor: "1290",
    }),
  },
  {
    label: "On promotion",
    description: "regular_price > price — strikethrough above white-on-brand price.",
    product: fakeProduct({
      id: 1002,
      name: "Pure Honey Jar 500g",
      priceMinor: "990",
      regularPriceMinor: "1490",
      salePriceMinor: "990",
    }),
  },
  {
    label: "Deep discount",
    description: "Large price drop.",
    product: fakeProduct({
      id: 1003,
      name: "Premium Olive Oil 750ml",
      priceMinor: "450",
      regularPriceMinor: "1990",
      salePriceMinor: "450",
    }),
  },
  {
    label: "Promotion + out of stock",
    description: "Stock badge turns red; promo styling still shows.",
    product: fakeProduct({
      id: 1004,
      name: "Artisan Sourdough Flour 2kg",
      priceMinor: "890",
      regularPriceMinor: "1290",
      salePriceMinor: "890",
      inStock: false,
    }),
  },
  {
    label: "Out of stock",
    description: "No promotion.",
    product: fakeProduct({
      id: 1005,
      name: "Dark Chocolate Bar 100g",
      priceMinor: "650",
      inStock: false,
    }),
  },
  {
    label: "Not purchasable",
    description: "Add-to-cart disabled.",
    product: fakeProduct({
      id: 1006,
      name: "Seasonal Spice Blend",
      priceMinor: "1590",
      purchasable: false,
    }),
  },
  {
    label: "Missing prices",
    description: "No prices object — component falls back to `-`.",
    product: fakeProduct({
      id: 1007,
      name: "Mystery Item",
    }),
  },
  {
    label: "Long name + promotion",
    description: "Ensures the promo layout handles long titles.",
    product: fakeProduct({
      id: 1008,
      name: "Hand-Harvested Organic Mediterranean Sea Salt with Rosemary & Thyme 250g",
      priceMinor: "720",
      regularPriceMinor: "1290",
      salePriceMinor: "720",
    }),
  },
];
