import { describe, expect, it } from "vitest";
import {
  buildAncestorChain,
  buildCategoryFilterComboboxData,
  childrenOf,
  flattenCategoriesForSelect,
  pickPrimaryCategoryId,
} from "./category-tree";
import type { Category } from "@/server/schemas/catalog";

const sampleTree: Category[] = [
  { id: 10, name: "Food", slug: "food", parent: 0 },
  { id: 20, name: "Pasta", slug: "pasta", parent: 10 },
  { id: 30, name: "Drinks", slug: "drinks", parent: 0 },
];

describe("childrenOf", () => {
  it("returns root categories for parent 0", () => {
    const roots = childrenOf(0, sampleTree);
    expect(roots.map((c) => c.id).sort()).toEqual([10, 30]);
  });

  it("returns children of a parent id", () => {
    expect(childrenOf(10, sampleTree).map((c) => c.id)).toEqual([20]);
  });
});

describe("buildAncestorChain", () => {
  it("returns root to leaf order", () => {
    expect(buildAncestorChain(20, sampleTree).map((c) => c.id)).toEqual([10, 20]);
  });

  it("returns single node for root category", () => {
    expect(buildAncestorChain(30, sampleTree).map((c) => c.id)).toEqual([30]);
  });

  it("returns empty for unknown id", () => {
    expect(buildAncestorChain(999, sampleTree)).toEqual([]);
  });
});

describe("flattenCategoriesForSelect", () => {
  it("orders roots then nested children with indentation", () => {
    const flat = flattenCategoriesForSelect(sampleTree);
    expect(flat.map((x) => x.value)).toEqual(["30", "10", "20"]);
    expect(flat.map((x) => x.label)).toEqual(["Drinks", "Food", "  Pasta"]);
  });
});

describe("buildCategoryFilterComboboxData", () => {
  it("shares item references between groups and flatItems", () => {
    const { allOption, groups, flatItems } = buildCategoryFilterComboboxData(sampleTree, "All");
    expect(allOption.value).toBe("");
    expect(flatItems[0]).toBe(allOption);
    expect(groups.length).toBe(2);
    expect(flatItems[1]).toBe(groups[0].items[0]);
    expect(groups[0].heading).toBe("Drinks");
    expect(groups[1].heading).toBe("Food");
    expect(flatItems[2]).toBe(groups[1].items[0]);
    expect(flatItems[3]).toBe(groups[1].items[1]);
  });
});

describe("pickPrimaryCategoryId", () => {
  it("picks the deepest assigned category", () => {
    expect(
      pickPrimaryCategoryId([{ id: 30 }, { id: 20 }], sampleTree),
    ).toBe(20);
  });

  it("returns null for empty assignment", () => {
    expect(pickPrimaryCategoryId([], sampleTree)).toBeNull();
  });
});
