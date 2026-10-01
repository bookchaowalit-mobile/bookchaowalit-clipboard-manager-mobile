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

export type StoredRead = { items: Snippet[]; intact: boolean };

/**
 * Like `parseStoredSnippets`, but also reports whether the stored archive was
 * read completely. When it was not (corrupt JSON, foreign shape, dropped or
 * evicted entries), the screen must not write back, or the next save would
 * replace the user's archive with the partial/empty result.
 */
export function readStoredSnippets(value: string | null): StoredRead {
  if (!value) {
    return { items: [], intact: true };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return { items: [], intact: false };
  }
  if (!Array.isArray(parsed)) {
    return { items: [], intact: false };
  }
  const valid = parsed.filter(isSnippet);
  const items = enforceLimit(valid);
  return { items, intact: valid.length === parsed.length && items.length === valid.length };
}

/**
 * Duplicate-detection key: the same text copied on Windows (CRLF), classic
 * Mac (CR) or from a web page (U+2028) — or with invisible zero-width/BOM
 * characters — is the same snippet.
 */
export function snippetKey(text: string): string {
  return text
    .replace(/\r\n?|[\u2028\u2029]/g, "\n")
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, "")
    .normalize("NFC")
    .trim();
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
  let text = rawText.trim().slice(0, MAX_SNIPPET_LENGTH);
  // Never keep half of an emoji at the length cap.
  if (/[\uD800-\uDBFF]$/.test(text)) {
    text = text.slice(0, -1);
  }
  const key = snippetKey(text);
  if (!key) {
    return { items, added: false };
  }
  const existing = items.find((item) => snippetKey(item.text) === key);
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

/** Portable JSON backup of the archive (AsyncStorage is device-only). */
export function exportArchive(items: Snippet[], now: Date): string {
  return JSON.stringify(
    { app: "clipboard-manager", version: 1, exportedAt: now.toISOString(), snippets: items },
    null,
    2,
  );
}
