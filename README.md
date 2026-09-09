# Clipboard Manager — Mobile

React Native mobile app (Expo) for **Clipboard Manager**.

Part of [Chaowalit Greepoke](https://bookchaowalit.com)'s 101 Portfolio Projects.

## Tech Stack

- **Framework:** Expo SDK 57 + Expo Router
- **Language:** TypeScript
- **Navigation:** Expo Router (file-based)
- **UI:** React Native + Ionicons

## Getting Started

```bash
npm ci
npx expo start
```

## Validation

```bash
npm run validate
```

The validation command runs lint, TypeScript checks, and Jest tests. CI also
exports the Android JavaScript bundle. It fails on errors and never submits a
build to a store.

Run `npm run release:check` for the fail-closed validation plus production
dependency audit. See [TEST-EVIDENCE.md](./TEST-EVIDENCE.md) for the latest
local emulator result and unresolved release blockers.

The Android and iOS store paths, credentials boundary, and submission
commands are in [RELEASE.md](./RELEASE.md).
The current privacy-policy draft and store-copy draft are in
[PRIVACY.md](./PRIVACY.md) and [STORE-LISTING.md](./STORE-LISTING.md).

## Build

```bash
# Android
npx eas build --platform android --profile preview

# iOS
npx eas build --platform ios --profile preview
```

EAS preview builds run only through an owner-triggered GitHub Actions workflow
and require the `EXPO_TOKEN` secret. Before release, run the committed Maestro
flow against the exact APK and record its Git commit and SHA-256 checksum.

## Related

- **Frontend:** [bookchaowalit-website/clipboard-manager-frontend](https://github.com/bookchaowalit-website/clipboard-manager-frontend)
- **Portfolio:** [bookchaowalit.com](https://bookchaowalit.com)

## License

MIT
