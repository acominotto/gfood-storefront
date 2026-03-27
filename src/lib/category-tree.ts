import type { Category } from "@/server/schemas/catalog";

const INDENT_PER_DEPTH = "  ";

export type CategorySelectItem = { label: string; value: string };

/** One top-level branch: shared item object references also appear in `flatItems`. */
export type CategoryComboboxGroup = { heading: string; items: CategorySelectItem[] };

/**
 * Items under one root (root first, then DFS descendants with indent).
 */
export function categoryGroupItemsForRoot(rootId: number, categories: Category[]): CategorySelectItem[] {
  const result: CategorySelectItem[] = [];

  function visit(id: number, depth: number) {
    const cat = categories.find((c) => c.id === id);
    if (!cat) {
      return;
    }
    const prefix = depth > 0 ? INDENT_PER_DEPTH.repeat(depth) : "";
    result.push({ label: `${prefix}${cat.name}`, value: String(cat.id) });
    for (const ch of childrenOf(id, categories)) {
      visit(ch.id, depth + 1);
    }
  }

  visit(rootId, 0);
  return result;
}

/**
 * All categories + grouped by root for hierarchical Combobox/Select.
 * Use `flatItems` with `createListCollection` so each `ComboboxItem` shares references with `groups`.
 */
export function buildCategoryFilterComboboxData(
  categories: Category[],
  allLabel: string,
): { allOption: CategorySelectItem; groups: CategoryComboboxGroup[]; flatItems: CategorySelectItem[] } {
  const allOption: CategorySelectItem = { label: allLabel, value: "" };
  const roots = childrenOf(0, categories);
  const groups: CategoryComboboxGroup[] = roots.map((root) => ({
    heading: root.name,
    items: categoryGroupItemsForRoot(root.id, categories),
  }));
  const flatItems: CategorySelectItem[] = [allOption, ...groups.flatMap((g) => g.items)];
  return { allOption, groups, flatItems };
}

/**
 * Depth-first flat list (no groups): roots alphabetically, then each branch (indented).
 */
export function flattenCategoriesForSelect(categories: Category[]): CategorySelectItem[] {
  const result: CategorySelectItem[] = [];

  function visit(parentId: number, depth: number) {
    for (const c of childrenOf(parentId, categories)) {
      const prefix = depth > 0 ? INDENT_PER_DEPTH.repeat(depth) : "";
      result.push({ label: `${prefix}${c.name}`, value: String(c.id) });
      visit(c.id, depth + 1);
    }
  }

  visit(0, 0);
  return result;
}

/** Categories whose parent id is `parentId` (use `0` for root). */
export function childrenOf(parentId: number, categories: Category[]): Category[] {
  return categories.filter((c) => c.parent === parentId).sort((a, b) => a.name.localeCompare(b.name));
}

/** Root → … → leaf for a category id, or empty if unknown. */
export function buildAncestorChain(categoryId: number, categories: Category[]): Category[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const up: Category[] = [];
  let current = byId.get(categoryId);
  const guard = new Set<number>();

  while (current && !guard.has(current.id)) {
    guard.add(current.id);
    up.push(current);
    const p = current.parent;
    if (!p) {
      break;
    }
    current = byId.get(p);
  }

  return up.reverse();
}

function chainDepth(categoryId: number, categories: Category[]): number {
  return buildAncestorChain(categoryId, categories).length;
}

/**
 * Pick the assigned category with the deepest tree (most specific branch).
 */
export function pickPrimaryCategoryId(
  assignedIds: { id: number }[],
  categories: Category[],
): number | null {
  if (assignedIds.length === 0) {
    return null;
  }
  let best = assignedIds[0].id;
  let bestDepth = chainDepth(best, categories);
  for (let i = 1; i < assignedIds.length; i++) {
    const id = assignedIds[i].id;
    const d = chainDepth(id, categories);
    if (d > bestDepth) {
      bestDepth = d;
      best = id;
    }
  }
  return best;
}
