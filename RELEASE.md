# Clipboard Manager — Android and iOS release runbook

Status: blocked for public production release. This document is for the
single candidate `1.0.0`; it does not approve a portfolio-wide release.

## Fixed app identity

| Field | Value |
|---|---|
| Display name | Clipboard Manager |
| Expo slug | `clipboard-manager-mobile` |
| Android package | `com.bookchaowalit.clipboardmanager` |
| iOS bundle ID | `com.bookchaowalit.clipboard-managermobile` |
| Version | `1.0.0` |
| Android version code | `1` |
| iOS build number | `1` |
| Build configuration | `eas.json` `production` profile |

Package and bundle identifiers are permanent store identities. Create the
Play Console app and App Store Connect app with these exact values before
uploading a production artifact.

## Evidence already available

The repository currently passes the local structural check, lint, TypeScript,
and Jest checks. Android and iOS JavaScript exports also complete locally.
The committed smoke flow is `.maestro/smoke.yaml`.

These results do not make the candidate store-ready. `TEST-EVIDENCE.md` and
`SECURITY-REVIEW.md` remain the authoritative records of the open release and
security findings.

## Release blockers to close

- The current binary implements local snippet save, search, pin, copy, and
  delete. Re-run the committed smoke flow against the exact production build
  and keep the listing limited to those implemented, local-only behaviours;
  it does not provide background clipboard monitoring, accounts, sync, or a
  backend.
- `npm run release:check` fails at `npm audit` because the Expo/Metro graph has
  unresolved high and moderate advisories. Do not use `npm audit fix --force`;
  it proposes a breaking Expo/React Native downgrade. Resolve the graph or
  record a time-bound, owner-approved exception with compensating controls.
- The existing APK evidence is local and debug-signed. It cannot be uploaded
  to either store. Build a production-signed artifact from an immutable CI
  commit and record its digest.
- Listing copy, privacy notes, and review notes now have drafts in
  `STORE-LISTING.md` and `PRIVACY.md`; the public privacy/support URLs,
  screenshots, data declarations, content/age rating, and final owner review
  are still required.
- Physical-device acceptance, a managed device matrix, crash monitoring, and a
  rollback target are not recorded.

## Reproducible preflight

Run from this app repository after the product and security blockers are
resolved:

```bash
npm ci
npm run lint
npm run typecheck
npm test -- --runInBand
npm audit --omit=dev --audit-level=high
npx expo export --platform android --output-dir /tmp/clipboard-manager-export-android
npx expo export --platform ios --output-dir /tmp/clipboard-manager-export-ios
```

Run the exact APK through the committed Maestro flow and one physical Android
device. Run the iOS equivalent on a physical iPhone or a managed macOS device.
Record the source commit, build IDs, signing identities, SHA-256 digests,
device results, and rollback target in `TEST-EVIDENCE.md`.

## Fastest compliant distribution paths

### Android internal testing

This is a store-hosted test track and does not make the app public. It is the
fastest way to distribute an Android build without waiting for the new-personal
account production-access gate.

1. Create the Play Console app with package
   `com.bookchaowalit.clipboardmanager`.
2. Configure Play App Signing and an upload key in the approved secret
   boundary.
3. Upload a production `.aab` (the `preview` APK profile is not a Play
   production artifact).
4. Add internal testers and install the Play-delivered build.
5. Complete the Data safety form and privacy-policy URL before using any track
   that requires the listing to be published.

For a newly created personal Play developer account, internal testing does not
grant production access. Public production still requires the Play Console
closed test requirement shown in the account.

### iOS internal TestFlight

Use a production `.ipa` built with the iOS distribution credentials and upload
it to App Store Connect. Internal TestFlight distribution is useful for device
acceptance; it is not an App Store release. The public App Store version still
requires complete metadata and App Review.

## Production build and submission commands

Install the pinned CLI or use the same version in CI:

```bash
npm install --global eas-cli@16.19.3
eas login
eas build --platform all --profile production
```

The Android build must be an `.aab`; the iOS build must be an `.ipa`. Keep
`EXPO_TOKEN`, Play service-account keys, Apple API keys, certificates, and
profiles in the CI/EAS credential store. Never place them in this repository
or paste them into chat.

After both builds pass the release gate and the store records are complete:

```bash
eas submit --platform android --profile production
eas submit --platform ios --profile production
```

The Android submission needs a Google Play service-account key configured in
EAS. The iOS submission needs an App Store Connect app record whose bundle ID
matches the value above and an App Store Connect API key or equivalent EAS
credential. The commands upload; the owner must still review and submit the
release in each store console.

## Account and policy gates

Do not treat a successful EAS upload as approval. Google Play still checks app
content, Data safety, target API, signing, and store policy. Apple requires
accurate metadata, privacy details, age rating, screenshots, review access,
and a functioning app. If the app uses accounts or a backend later, provide a
working demo account or demo mode and keep the backend available during review.

## Rollback

Keep the last known-good commit and artifact digest. Android recovery requires
a new higher version code; Play does not roll users back to a lower version
code. For iOS, retain the previous approved build and pause phased release or
submit a fixed build if the crash or acceptance threshold is breached.
