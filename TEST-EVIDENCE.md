# Clipboard Manager Mobile Test Evidence

## Candidate

| Field | Value |
|---|---|
| Test date | 2026-09-08 |
| Source state | Uncommitted candidate based on nested-repo `5ed1f94` plus the local implementation changes in this working tree |
| Framework | Expo SDK 57 / React Native 0.86.2 |
| Android package | `com.bookchaowalit.clipboardmanager` |
| Version | `1.0.0` (`versionCode` 1) |
| Local artifact | `android/app/build/outputs/apk/release/app-release.apk` (gitignored) |
| Artifact size | 100,251,462 bytes |
| Artifact SHA-256 | `5e0f736de35b09ba81a8d60116c2e1a4abfe9a8cda74d4743536a5685605dd5e` |
| Test signing | Android Debug certificate; not a production signing identity |

## Passed evidence

- `npm run lint`
- `npm run typecheck`
- `task mobile:check -- bookchaowalit-clipboard-manager-mobile --json`
- Jest: 1 suite and 4 tests passed, including persistence, search, pin,
  copy, delete, and on-demand clipboard read coverage
- Expo dependency compatibility: packages match SDK 57
- `npx expo install --check`: dependencies up to date
- `npm ci --dry-run`: lockfile resolves successfully
- Expo export: Android and iOS JavaScript bundles exported locally
- EAS production profile explicitly selects Android `app-bundle` output
- Android release build: `assembleRelease` passed with target SDK 36
- APK signature verification: APK Signature Scheme v2 passed
- Android Emulator: `solo_empire_api_35` boot and APK installation passed
- Maestro: CRUD flow plus Home, Explore, Profile, and return-to-Home flow
  passed against the rebuilt APK
- Android manifest contains only the app's dynamic receiver permission; the
  default `INTERNET`, storage, overlay, and vibration permissions are blocked
- App-scoped fatal/ANR log check: no findings

## Production blockers

The candidate is not approved for production while any item below remains:

1. `npm run release:check` exits 1 at `npm audit` with 17 moderate and 4 high
   transitive advisories in the current Expo/React Native toolchain. The high
   findings flow through Metro to `image-size`; the moderate findings include
   `decode-uri-component`, `@xmldom/xmldom`, and `uuid` through Expo tooling.
   `npm audit fix --force` proposes a breaking Expo downgrade, so it was
   deliberately not run.
2. Expo Doctor passes 20 local checks, but its remote app-config schema check
   cannot reach `exp.host` from this environment (`EAI_AGAIN`).
3. The tested source is not an immutable Git commit or CI-produced artifact.
4. The APK uses a local debug certificate rather than the production signing
   identity.
5. Store assets and records are still drafts: a public privacy-policy URL,
   screenshots, support URL, ratings, data-safety answers, physical-device
   acceptance, managed device matrix, rollback verification, and owner
   approval are not recorded.

Do not upload this local APK to a store. Rebuild from a reviewed commit in CI,
resolve or explicitly approve the dependency risk, use the production signing
boundary, and repeat the device and acceptance gates first.
