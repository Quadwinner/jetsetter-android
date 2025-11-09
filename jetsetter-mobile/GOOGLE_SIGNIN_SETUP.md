# Google Sign-In Setup Guide

## 📱 Current Status

Google Sign-In is **configured but requires additional setup** to work properly.

## ⚠️ Important Notes

- **Expo Go does NOT support Google Sign-In** - You need a development build
- Google Sign-In requires native configuration files from Firebase
- The app configuration has been updated to support Google Sign-In

---

## 🔧 Required Setup Steps

### Step 1: Download Google Services Files from Firebase

#### For Android (`google-services.json`):

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **jets-1b5fa**
3. Click on ⚙️ Settings → Project Settings
4. Scroll down to "Your apps" section
5. Click on your Android app or add a new Android app:
   - **Package name**: `com.jetsetterss.mobile`
   - **App nickname**: Jetsetters (optional)
6. Download `google-services.json`
7. Place it in: `/home/user/jetsetter-android/jetsetter-mobile/google-services.json`

#### For iOS (`GoogleService-Info.plist`):

1. In the same Firebase Console project settings
2. Click on your iOS app or add a new iOS app:
   - **Bundle ID**: `com.jetsetterss.mobile`
   - **App nickname**: Jetsetters (optional)
3. Download `GoogleService-Info.plist`
4. Place it in: `/home/user/jetsetter-android/jetsetter-mobile/GoogleService-Info.plist`

### Step 2: Update .env File (Already Done ✅)

The `.env` file already contains:
```
FIREBASE_WEB_CLIENT_ID=84512959275-l25c7c0qagj87bbpb7fdtomiseubmnju.apps.googleusercontent.com
```

### Step 3: Add File Paths to .env

Add these lines to your `.env` file:
```
GOOGLE_SERVICES_JSON=./google-services.json
GOOGLE_SERVICES_INFOPLIST=./GoogleService-Info.plist
```

### Step 4: Build a Development Build

**Option A: Local Development Build (Recommended for testing)**

For Android:
```bash
cd jetsetter-mobile
npx expo prebuild
npx expo run:android
```

For iOS (requires Mac):
```bash
cd jetsetter-mobile
npx expo prebuild
npx expo run:ios
```

**Option B: EAS Build (Cloud build)**

```bash
cd jetsetter-mobile
npx eas build --profile development --platform android
# or
npx eas build --profile development --platform ios
```

---

## 🧪 Testing Google Sign-In

### What Works NOW:
- ✅ Email/Password authentication (works everywhere)
- ✅ Google Sign-In configuration (ready, needs files)

### What WILL Work After Setup:
- 🔒 Google Sign-In on Android devices
- 🔒 Google Sign-In on iOS devices

### What WON'T Work:
- ❌ Google Sign-In in Expo Go (native module limitation)
- ❌ Google Sign-In on web (use email/password)

---

## 🚀 Quick Start (After Setup)

1. **Place Google service files** in the project root
2. **Update .env** with file paths
3. **Run prebuild**: `npx expo prebuild --clean`
4. **Build for Android**: `npx expo run:android`
5. **Test Google Sign-In** on your device

---

## 🐛 Troubleshooting

### Error: "Google Sign-In requires a development build"
- **Solution**: You're running in Expo Go. Build a development build using `npx expo run:android`

### Error: "Google Play Services is not available"
- **Solution**: Update Google Play Services on your Android device/emulator

### Error: "No ID token received from Google"
- **Solution**: Check that `google-services.json` is correctly placed and contains valid OAuth credentials

### Error: Sign-in works but Firebase fails
- **Solution**: Verify the Web Client ID in Firebase Console matches the one in `.env`

---

## 📝 Alternative: Email/Password Login

If you want to skip Google Sign-In setup for now:
- Email/Password authentication is **fully functional**
- Users can sign up and sign in without any additional setup
- Works in Expo Go, development builds, and production

---

## 📚 Additional Resources

- [Firebase Android Setup](https://firebase.google.com/docs/android/setup)
- [Firebase iOS Setup](https://firebase.google.com/docs/ios/setup)
- [Expo Google Sign-In](https://docs.expo.dev/guides/google-authentication/)
- [React Native Google Sign-In](https://github.com/react-native-google-signin/google-signin)

---

## 🎯 Current Implementation Details

### Files Modified:
- ✅ `app.config.js` - Added Google Sign-In plugin
- ✅ `authService.js` - Improved error handling and logging
- ✅ `.env` - Contains Firebase Web Client ID

### Configuration:
- **Firebase Project**: jets-1b5fa
- **Web Client ID**: 84512959275-l25c7c0qagj87bbpb7fdtomiseubmnju.apps.googleusercontent.com
- **Android Package**: com.jetsetterss.mobile
- **iOS Bundle ID**: com.jetsetterss.mobile

---

## ⚡ Quick Fix for Immediate Use

If you need authentication to work RIGHT NOW without Google Sign-In:
1. Use **email/password login** (fully functional)
2. Create an account with any email
3. Sign in and test the app

Google Sign-In can be enabled later by following the setup steps above.
