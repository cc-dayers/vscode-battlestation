import type { Action, Group } from "../types";

/**
 * Safe JSON parsing utilities to prevent crashes from malformed data.
 */

export function safeParseJson<T = any>(json: string | null | undefined): T | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export function safeParseAction(json: string | null | undefined): Action | null {
  const parsed = safeParseJson<any>(json);
  if (!parsed) return null;
  
  // Validate required fields
  if (
    typeof parsed.name !== "string" ||
    typeof parsed.command !== "string" ||
    typeof parsed.type !== "string"
  ) {
    return null;
  }
  
  return parsed as Action;
}

export function safeParseGroup(json: string | null | undefined): Group | null {
  const parsed = safeParseJson<any>(json);
  if (!parsed) return null;
  
  // Validate required fields
  if (typeof parsed.name !== "string") {
    return null;
  }
  
  return parsed as Group;
}

export function safeParseActionArray(json: string | null | undefined): Action[] {
  const parsed = safeParseJson<any[]>(json);
  if (!Array.isArray(parsed)) return [];
  
  return parsed
    .map((item) => {
      if (
        typeof item?.name === "string" &&
        typeof item?.command === "string" &&
        typeof item?.type === "string"
      ) {
        return item as Action;
      }
      return null;
    })
    .filter((item): item is Action => item !== null);
}
