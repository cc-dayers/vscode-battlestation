import type { Action } from "../types";

export function normalizeActionSearchQuery(query: string): string {
  return query.trim().toLowerCase();
}

export function matchesActionSearch(action: Action, query: string): boolean {
  const normalizedQuery = normalizeActionSearchQuery(query);
  if (!normalizedQuery) {
    return true;
  }

  return [action.name, action.command, action.group || ""]
    .join(" ")
    .toLowerCase()
    .includes(normalizedQuery);
}

export function filterActionsBySearch(actions: Action[], query: string): Action[] {
  const normalizedQuery = normalizeActionSearchQuery(query);
  if (!normalizedQuery) {
    return actions;
  }

  return actions.filter((action) => matchesActionSearch(action, normalizedQuery));
}