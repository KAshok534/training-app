# Digital Asset Links — for Trusted Web Activity (TWA)

When the Android APK is generated via Bubblewrap / PWABuilder, a file named
**`assetlinks.json`** must live at:

    https://training-app-tawny.vercel.app/.well-known/assetlinks.json

This file proves that the AIWMR Training Academy website and the published
Android app are owned by the same party. **Without it, the TWA will show the
Chrome address bar and look like a website, not a native app.**

## Why it's not generated yet

The file content includes the **SHA-256 fingerprint of the signing keystore**,
which doesn't exist until the TWA generation step. So the workflow is:

1. Generate the TWA Android project (e.g. `bubblewrap init`)
2. Bubblewrap creates a signing keystore — note the SHA-256 fingerprint it prints
3. Drop `assetlinks.json` into this directory with that fingerprint
4. Commit + deploy to Vercel
5. Submit the APK to Play Store — Android will verify the link on install

## What it looks like (template)

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "org.aiwmr.training",
      "sha256_cert_fingerprints": [
        "AA:BB:CC:DD:EE:FF:..."
      ]
    }
  }
]
```

Replace `package_name` with whatever Bubblewrap chooses (typically the
reverse-DNS of your domain). Replace the fingerprint with the real one from
`keytool -list -v -keystore android.keystore`.

## How to verify after deploy

```bash
curl https://training-app-tawny.vercel.app/.well-known/assetlinks.json
```

Should return the JSON with HTTP 200 and Content-Type `application/json`.

Google's verifier:
https://developers.google.com/digital-asset-links/tools/generator
