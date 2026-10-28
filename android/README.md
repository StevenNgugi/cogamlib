# COGAM DIGITAL LIBRARY – Android App

This is the Android companion for the live COGAM DIGITAL LIBRARY:
https://cogam-digital-library-6kql36.v2.appdeploy.ai/

## Download APK
When the GitHub Actions workflow completes successfully, the APK is published at:
https://github.com/StevenNgugi/cogamlib/releases/download/android-v1.0.0/COGAM-Digital-Library-v1.0.0.apk

You can also find it in the GitHub Actions build artifacts.

## Notes
- Version 1.0.0 is an Android WebView client. **Internet access is required.**
- It is distributed as a **debug-signed Android APK** for testing/personal installation, not a production-signed Play Store release.
- Some sign-in providers block embedded browsers. Use the in-app **Browser** button for full account login.
- No app or backend data is copied into the APK; it opens the current COGAM DIGITAL LIBRARY website.
- Building needs Java 17, Android SDK 35 and Gradle 8.10.2.
- Run `gradle :app:assembleDebug` from this `android` folder.
