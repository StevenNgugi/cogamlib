# COGAM DIGITAL LIBRARY – Android App

This is the Android companion for the live COGAM DIGITAL LIBRARY:
https://cogam-digital-library-6kql36.v2.appdeploy.ai/

## Download APK

The latest Android APK (v1.0.1) is published at:
https://github.com/StevenNgugi/cogamlib/releases/download/android-v1.0.1/COGAM-Digital-Library-v1.0.1.apk

You can also find it in the GitHub Actions build artifacts.

## What's new in v1.0.1

- Uses the COGAM icon supplied for the app.
- Adds a persistent Home button to return to the library homepage from any screen.
- Matches the Android shell to the deep-slate and muted-navy app palette.
- Loads the current hosted library, so the latest website features are available when the app is online.

## Notes

- This is an Android WebView companion. Internet access is required.
- The APK does not bundle library content or the backend; it opens the current hosted COGAM DIGITAL LIBRARY website.
- This is a debug-signed APK for testing/personal installation, not a production-signed Play Store release.
- If Android rejects this as an update over an earlier test APK because the debug signing certificate differs, uninstall the previous test build before installing this one. You may need to sign in again.
- Some sign-in providers block embedded browsers. Use the in-app Browser button for full account login.
- Building needs Java 17, Android SDK 35 and Gradle 8.10.2.
- Run `gradle :app:assembleDebug` from this `android` folder.
