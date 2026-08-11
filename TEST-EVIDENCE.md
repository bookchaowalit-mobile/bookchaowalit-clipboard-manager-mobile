# Clipboard Manager Mobile Test Evidence

## Candidate

| Field | Value |
|---|---|
| Test date | 2026-08-08 |
| Source state | Uncommitted candidate based on `bab4993161f6a8eb318431006319d32538b74102` |
| Framework | Expo SDK 57 / React Native 0.86.2 |
| Android package | `com.bookchaowalit.clipboardmanager` |
| Version | `1.0.0` (`versionCode` 1) |
| Local artifact | `android/app/build/outputs/apk/release/app-release.apk` (gitignored) |
| Artifact size | 99,653,146 bytes |
| Artifact SHA-256 | `2468277c4ee3ccdf78c8ae0ee6562889c738fdcad75e0f44b3ae85e24f736e7d` |
| Test signing | Android Debug certificate; not a production signing identity |

## Passed evidence

- `npm run lint`
- `npm run typecheck`
- Jest: 1 suite and 2 tests passed
- Expo dependency compatibility: packages match SDK 57
- Android release build: `assembleRelease` passed with target SDK 36
- APK signature verification: APK Signature Scheme v2 passed
- Android Emulator: `solo_empire_api_35` boot and APK installation passed
- Maestro: launch plus Home, Explore, Profile, and return-to-Home flow passed
- App-scoped fatal/ANR log check: no findings

## Production blockers

The candidate is not approved for production while any item below remains:

1. `npm run security:audit` exits 1 with 14 high and 7 moderate transitive
   advisories in the current Expo/React Native toolchain. The high findings
   flow through Metro 0.84.4 to `image-size` 1.2.1 (the registry's latest
   release, 2.0.2, is still in the affected range); the moderate finding is
   `uuid` 7.0.3 through `xcode`. `npm audit fix` has no compatible fix and
   `npm audit fix --force` proposes the breaking Expo SDK 53 / React Native
   0.72 downgrade, so it was deliberately not run.
2. Expo Doctor passes 19 local checks, but its remote app-config schema check
   cannot reach `exp.host` from this environment (`EAI_AGAIN`).
3. The tested source is not an immutable Git commit or CI-produced artifact.
4. The APK uses a local debug certificate rather than the production signing
   identity.
5. Managed device-matrix testing, physical-device acceptance, rollback
   verification, and owner approval are not recorded.

Do not upload this local APK to a store. Rebuild from a reviewed commit in CI,
resolve or explicitly approve the dependency risk, use the production signing
boundary, and repeat the device and acceptance gates first.
