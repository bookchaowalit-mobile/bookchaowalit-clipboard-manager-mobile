/** Pure snippet-archive logic, kept free of React Native imports so it is unit-testable. */

export type Snippet = {
  id: string;
  text: string;
  createdAt: number;
  pinned: boolean;
};

export const STORAGE_KEY = "clipboard-manager.snippets.v1";
export const MAX_SNIPPET_LENGTH = 5_000;
export const MAX_SNIPPETS = 100;

function isSnippet(value: unknown): value is Snippet {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<Snippet>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.text === "string" &&
    candidate.text.length <= MAX_SNIPPET_LENGTH &&
    typeof candidate.createdAt === "number" &&
    Number.isFinite(candidate.createdAt) &&
    typeof candidate.pinned === "boolean"
  );
}

/** Parse persisted JSON; corrupt or foreign data yields an empty archive instead of a crash. */
export function parseStoredSnippets(value: string | null): Snippet[] {
  if (!value) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? enforceLimit(parsed.filter(isSnippet)) : [];
  } catch {
    return [];
  }
}

export function createSnippetId(now = Date.now(), random = Math.random) {
  return now.toString(36) + "-" + random().toString(36).slice(2, 8);
}

/**
 * Keep at most `limit` snippets. Pinned snippets are never evicted while an
 * unpinned one remains; among the rest the oldest go first.
 */
export function enforceLimit(items: Snippet[], limit = MAX_SNIPPETS): Snippet[] {
  if (items.length <= limit) {
    return items;
  }
  const keep = new Set(
    [...items]
      .sort(
        (a, b) =>
          Number(b.pinned) - Number(a.pinned) || b.createdAt - a.createdAt,
      )
      .slice(0, limit)
      .map((item) => item.id),
  );
  return items.filter((item) => keep.has(item.id));
}

export type AddResult = { items: Snippet[]; added: boolean };

/**
 * File `rawText` into the archive. Blank text is rejected; text that is
 * already archived moves to the top (keeping its pin) instead of duplicating.
 */
export function addSnippet(
  items: Snippet[],
  rawText: string,
  now = Date.now(),
  id = createSnippetId(now),
): AddResult {
  const text = rawText.trim().slice(0, MAX_SNIPPET_LENGTH);
  if (!text) {
    return { items, added: false };
  }
  const existing = items.find((item) => item.text === text);
  const snippet: Snippet = existing
    ? { ...existing, createdAt: now }
    : { id, text, createdAt: now, pinned: false };
  const rest = items.filter((item) => item !== existing);
  return { items: enforceLimit([snippet, ...rest]), added: !existing };
}

/** Case-insensitive search; pinned first, then newest first. */
export function filterSnippets(items: Snippet[], query: string): Snippet[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return items
    .filter((item) => item.text.toLocaleLowerCase().includes(normalizedQuery))
    .sort(
      (left, right) =>
        Number(right.pinned) - Number(left.pinned) ||
        right.createdAt - left.createdAt,
    );
}
