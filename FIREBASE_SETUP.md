# Firebase Setup for Suhad App

## Current Status
- **Android**: Connected via `google-services.json`.
- **Initialization**: Added `await Firebase.initializeApp()` in `lib/main.dart`.
- **Dependencies**: `firebase_core`, `firebase_auth`, `cloud_firestore`, `firebase_messaging` are included in `pubspec.yaml`.

## Next Steps

### 1. Test the Connection
Run the app on an Android emulator or device to verify connection:
```bash
flutter run
```

### 2. Add More Services
To use other Firebase services (Storage, Functions, etc.), add them to `pubspec.yaml` and run `flutter pub get`.

### 3. iOS & Web Support
If you plan to support iOS or Web, run:
```bash
flutterfire configure
```
This will generate `firebase_options.dart` to handle platform-specific configurations automatically.

## Debugging
If you encounter `multidex` errors on Android (common with Firebase):
1. Open `android/app/build.gradle`
2. Set `multiDexEnabled true` in `defaultConfig`.
