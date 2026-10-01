# Upgrade Plan

## Current state

- Before this pass: **6/10** — real local-only clipboard archive with Jest
  screen tests and release docs, but CI was red: the first Jest test timed
  out on a cold transform cache and the blocking `security:audit` step failed
  on high findings. The 100-item cap could silently evict pinned snippets and
  filing the same text twice created duplicates.
- After this pass: **7/10** — pure archive logic extracted and unit-tested,
  CI validate job is green and deterministic, audit findings reduced to one
  upstream-only item.

## Backlog

### P0
- Clear `image-size` (high, via `metro`, bundler-only) once an Expo SDK 57
  patch ships a metro that depends on `image-size@>=2.0.3`; then make the CI
  `audit` job blocking again (remove `continue-on-error`).
- Release blockers tracked in `TEST-EVIDENCE.md` / `SECURITY-REVIEW.md`
  (production signing identity, owner approval).

### P1
- Import a JSON backup validated with `parseStoredSnippets` (merge, keep pins).
- Optional labels/folders for snippets; show "moved up" feedback visually
  (currently status text only).

### P2
- Dark/light palette following `userInterfaceStyle`.
- Sync with clipboard-manager-frontend once it has an API.

## Done in this pass

- `lib/snippets.ts`: parse, add (trim, cap length, dedupe to top), limit
  (never evicts pinned while unpinned remain), filter/sort — 10 new Jest tests
  in `__tests__/snippets-test.ts`; home screen uses it.
- Jest `testTimeout` 20s so the first screen test no longer flakes on a cold
  babel cache.
- Security: override `brace-expansion` 1.x to 1.1.21 (under `minimatch@3`) and
  update `js-yaml`/`brace-expansion` 5.x within range; production audit now
  reports only `image-size`.
- CI: audit moved to its own advisory job with the reason documented;
  lint/typecheck/test/export remain blocking.

## Done in this pass (pass 2)

Score: 8/10 (unchanged scale; one data-loss bug fixed) — archive export and stronger screen tests.

- Bug fix (data loss): if the initial AsyncStorage read failed, the save effect still ran and overwrote the stored archive with an empty list. Saving is now enabled only after a successful read (regression test proves the old behaviour failed).
- Export: "Export archive (JSON)" shares a versioned backup (`exportArchive`) through the core `Share` API. Import remains TODO (P1).
- Screen tests (jest-expo): duplicate filing moves the snippet up without a copy; failed read never writes; export payload shape. 17 tests total.
- Advisories: unchanged — only `image-size` (high, metro), `uuid`, `decode-uri-component` remain and have no same-major fix.
- Verified: typecheck, lint, jest (17), Android `expo export` bundle.

## Done in this pass (pass 3)

Score: 8/10 (was 7.5/10) — edge-case hunt in `lib/snippets.ts`.

- Bug (data loss): pass 2 guarded against a *rejected* storage read, but corrupt JSON or entries this version cannot read still parsed to `[]`/a partial list and the save effect then overwrote the stored archive. New `readStoredSnippets` reports `intact`; the screen only enables saving for an intact archive and shows "ARCHIVE DAMAGED / NOT OVERWRITTEN" otherwise.
- Bug: the same text copied with CRLF, a lone CR, U+2028 or a leading zero-width space/BOM was filed as a new snippet; duplicates now compare `snippetKey` (normalised line endings, invisible chars stripped, NFC). Zero-width-only input is rejected as blank.
- Bug: the 5,000-unit cap could store half an emoji.
- a11y: stats label says "1 file" instead of "1 files".
- Verified: typecheck, lint, 20 Jest tests, Android `expo export`.
