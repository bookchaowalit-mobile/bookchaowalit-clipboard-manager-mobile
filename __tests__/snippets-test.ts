import {
  MAX_SNIPPET_LENGTH,
  addSnippet,
  enforceLimit,
  filterSnippets,
  parseStoredSnippets,
  readStoredSnippets,
  snippetKey,
  type Snippet,
} from "../lib/snippets";

const snip = (id: string, over: Partial<Snippet> = {}): Snippet => ({
  id,
  text: id,
  createdAt: 0,
  pinned: false,
  ...over,
});

describe("addSnippet", () => {
  test("trims and files new text at the top", () => {
    const { items, added } = addSnippet([snip("old")], "  hello  ", 5, "new");
    expect(added).toBe(true);
    expect(items.map((item) => item.id)).toEqual(["new", "old"]);
    expect(items[0]).toEqual({ id: "new", text: "hello", createdAt: 5, pinned: false });
  });

  test("rejects blank text without changing the archive", () => {
    const items = [snip("a")];
    expect(addSnippet(items, "   \n ")).toEqual({ items, added: false });
  });

  test("moves duplicate text to the top and keeps its pin", () => {
    const items = [snip("a"), snip("b", { text: "dup", pinned: true })];
    const result = addSnippet(items, " dup ", 9, "new");
    expect(result.added).toBe(false);
    expect(result.items).toEqual([{ id: "b", text: "dup", createdAt: 9, pinned: true }, snip("a")]);
  });

  test("caps text length", () => {
    const { items } = addSnippet([], "x".repeat(MAX_SNIPPET_LENGTH + 10), 1, "n");
    expect(items[0].text).toHaveLength(MAX_SNIPPET_LENGTH);
  });
});

describe("enforceLimit", () => {
  test("evicts the oldest unpinned snippets, never pinned ones", () => {
    const items = [
      snip("new", { createdAt: 3 }),
      snip("mid", { createdAt: 2 }),
      snip("pinned-oldest", { createdAt: 0, pinned: true }),
      snip("old", { createdAt: 1 }),
    ];
    expect(enforceLimit(items, 2).map((item) => item.id)).toEqual(["new", "pinned-oldest"]);
  });

  test("keeps order and identity under the limit", () => {
    const items = [snip("a"), snip("b")];
    expect(enforceLimit(items, 5)).toBe(items);
  });
});

describe("filterSnippets", () => {
  const items = [
    snip("a", { text: "npm run build", createdAt: 1 }),
    snip("b", { text: "git push", createdAt: 3 }),
    snip("c", { text: "NPM test", createdAt: 2, pinned: true }),
  ];

  test("orders pinned first then newest", () => {
    expect(filterSnippets(items, "").map((item) => item.id)).toEqual(["c", "b", "a"]);
  });

  test("matches case-insensitively", () => {
    expect(filterSnippets(items, "  npm ").map((item) => item.id)).toEqual(["c", "a"]);
  });
});

describe("parseStoredSnippets", () => {
  test("returns [] for missing, corrupt, or non-array data", () => {
    expect(parseStoredSnippets(null)).toEqual([]);
    expect(parseStoredSnippets("{oops")).toEqual([]);
    expect(parseStoredSnippets('{"a":1}')).toEqual([]);
  });

  test("drops malformed and oversized entries", () => {
    const good = snip("good");
    const stored = JSON.stringify([
      good,
      { id: 1 },
      snip("huge", { text: "x".repeat(MAX_SNIPPET_LENGTH + 1) }),
      snip("nan", { createdAt: Number.NaN }),
    ]);
    expect(parseStoredSnippets(stored)).toEqual([good]);
  });
});

describe("pass 3 edge cases", () => {
  test("flags corrupt or partly unreadable archives so they are not overwritten", () => {
    expect(readStoredSnippets(null)).toEqual({ items: [], intact: true });
    expect(readStoredSnippets("{oops").intact).toBe(false);
    expect(readStoredSnippets('{"a":1}').intact).toBe(false);
    const good = snip("g");
    expect(readStoredSnippets(JSON.stringify([good]))).toEqual({ items: [good], intact: true });
    expect(readStoredSnippets(JSON.stringify([good, { id: 1 }])).intact).toBe(false);
  });

  test("treats CRLF, lone CR, U+2028 and zero-width variants as the same snippet", () => {
    const start = addSnippet([], "line one\nline two", 1, "a").items;
    for (const variant of ["line one\r\nline two", "line one\rline two", "line one\u2028line two", "\u200Bline one\nline two"]) {
      const result = addSnippet(start, variant, 2, "b");
      expect(result.added).toBe(false);
      expect(result.items).toHaveLength(1);
    }
    expect(snippetKey("\uFEFF\u200B")).toBe("");
    expect(addSnippet([], "\u200B\u200B").added).toBe(false);
  });

  test("never stores half an emoji at the length cap", () => {
    const text = "x".repeat(MAX_SNIPPET_LENGTH - 1) + "📋";
    const [item] = addSnippet([], text, 1, "e").items;
    expect(item.text).toBe("x".repeat(MAX_SNIPPET_LENGTH - 1));
  });
});
