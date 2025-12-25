# 🔐 Google Sign-In Setup Guide - Complete Solution

## 📱 Current Status

Google Sign-In is **configured but failing with DEVELOPER_ERROR**. This guide provides the permanent fix.

## ⚠️ The Problem

You're seeing this error when trying to sign in with Google:
```
Google Sign-In Failed
DEVELOPER_ERROR
```

**Root Cause**: Firebase cannot verify your app because the SHA-1 fingerprint is missing from Firebase Console.

---

## ✅ PERMANENT SOLUTION (5 Steps)

### Step 1: Get SHA-1 Fingerprint from EAS

Your app is built with EAS (Expo Application Services). You need to get the SHA-1 fingerprint from your EAS keystore.

Run this command in your terminal:

```bash
cd "/media/OS/for linux work/jetsetter android/jetsetter-mobile"
eas credentials
```

Then follow these steps:
1. Select: **Android**
2. Select: **production** (or whichever profile you used for your build)
3. Select: **Keystore: Manage everything related to your Keystore**
4. Select: **Set up a new keystore** OR **View credentials**

You'll see output like this:
```
Keystore
  Keystore password: ********************
  Key alias:         *******************
  Key password:      ********************

Keystore Fingerprints
  MD5:  XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX
  SHA1: AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12  👈 COPY THIS
  SHA256: ...
```

**📋 Copy the SHA-1 fingerprint** - it looks like: `AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12`

---

### Step 2: Add SHA-1 to Firebase Console ⭐ (THIS IS THE KEY FIX)

This is the **most important step** that fixes the DEVELOPER_ERROR.

1. Open Firebase Console: [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Select your project: **jets-1b5fa**
3. Click the gear icon ⚙️ → **Project Settings**
4. Scroll down to **Your apps** section
5. Find your **Android app** (com.jetsetterss.mobile)
   - If you don't see it, click **Add app** → **Android** and create it with package name: `com.jetsetterss.mobile`
6. Under **SHA certificate fingerprints**, click **Add fingerprint**
7. **Paste the SHA-1 fingerprint** you copied from Step 1
8. Click **Save**

✅ **This step authorizes your APK to use Google Sign-In**

---

### Step 3: Download google-services.json

While you're still in Firebase Console:

1. Stay on the **Project Settings** page
2. Under your **Android app** (com.jetsetterss.mobile)
3. Click the **Download google-services.json** button
4. Save the file to your project root:

```bash
# Save to this exact location:
/media/OS/for linux work/jetsetter android/jetsetter-mobile/google-services.json
```

You can also download it manually and move it:
```bash
# Move the downloaded file to your project
mv ~/Downloads/google-services.json "/media/OS/for linux work/jetsetter android/jetsetter-mobile/"
```

---

### Step 4: Update app.json Configuration

Open [app.json](./app.json) and add `googleServicesFile` to the Android section:

```json
{
  "expo": {
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/jetset.jpeg",
        "backgroundColor": "#ffffff"
      },
      "edgeToEdgeEnabled": true,
      "predictiveBackGestureEnabled": false,
      "package": "com.jetsetterss.mobile",
      "versionCode": 1,
      "googleServicesFile": "./google-services.json",  // ⭐ ADD THIS LINE
      "permissions": [
        "android.permission.INTERNET",
        "android.permission.ACCESS_NETWORK_STATE",
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.POST_NOTIFICATIONS"
      ]
    }
  }
}
```

I can help you add this line automatically. Just let me know!

---

### Step 5: Rebuild the APK with EAS

Now rebuild your APK with the new configuration:

```bash
cd "/media/OS/for linux work/jetsetter android/jetsetter-mobile"
eas build --platform android --profile preview
```

Or for production build:
```bash
eas build --platform android --profile production
```

⏱️ Wait for the build to complete (usually 10-15 minutes).

---

## 🎯 Test Google Sign-In

Once the build completes:

1. Download the new APK from the EAS build page
2. Uninstall the old version of the app from your device
3. Install the new APK
4. Open the app
5. Try **Google Sign-In** - it should work! ✅

---

## 🔍 Why This Fixes the Problem

The DEVELOPER_ERROR occurs because Firebase needs to verify your app's identity:

1. **SHA-1 Fingerprint** = Your app's unique signature (like a fingerprint)
2. **Without SHA-1 in Firebase** = Firebase doesn't recognize your app = DEVELOPER_ERROR
3. **With SHA-1 in Firebase** = Firebase trusts your app = Google Sign-In works ✅

Think of it like this:
- Firebase is a bouncer at a club
- The SHA-1 is your ID
- Without adding your ID to the guest list, the bouncer won't let you in
- After adding your ID, the bouncer says "Welcome!" ✅

---

## 📝 Important Notes

### About SHA-1 Fingerprints

- **Different builds = Different SHA-1**: Each EAS build profile (development, preview, production) might have different keystores
- **Add all SHA-1s**: You can add multiple SHA-1 fingerprints to Firebase
- **Debug vs Release**: Local development builds have different SHA-1 than EAS builds

### Security Best Practices

- ✅ **DO** commit google-services.json to your repository (it's NOT a secret - it's a config file)
- ❌ **DON'T** commit keystore files (.jks, .keystore) - these ARE secrets
- ✅ **DO** add SHA-1 for each build profile you use

### Platform Support

- ✅ **Android devices**: Google Sign-In works
- ✅ **iOS devices**: Requires similar setup with `GoogleService-Info.plist`
- ❌ **Expo Go**: Google Sign-In NOT supported (requires development build)
- ❌ **Web browser**: Google Sign-In NOT supported (use email/password)

---

## 🆘 Troubleshooting

### Still getting DEVELOPER_ERROR after following all steps?

**Check 1: Package Name Match**
- app.json: `com.jetsetterss.mobile`
- Firebase Console Android app: `com.jetsetterss.mobile`
- ✅ Must match exactly

**Check 2: SHA-1 is Correct**
- Run `eas credentials` again and verify you copied the right SHA-1
- Make sure you added it to the **Android app** in Firebase, not iOS

**Check 3: google-services.json Location**
```bash
# Verify file exists:
ls -la "/media/OS/for linux work/jetsetter android/jetsetter-mobile/google-services.json"

# Should show the file, not an error
```

**Check 4: Rebuilt After Changes**
- You MUST rebuild the APK after adding googleServicesFile to app.json
- Installing the old APK won't work

**Check 5: Web Client ID**
- The Web Client ID in [authService.js](./src/services/authService.js) line 23:
  ```javascript
  webClientId: '84512959275-l25c7c0qagj87bbpb7fdtomiseubmnju.apps.googleusercontent.com'
  ```
- Should match the Web Client ID in Firebase Console → Project Settings → OAuth 2.0 Client IDs

### How to verify your Firebase configuration?

1. Go to [Firebase Console](https://console.firebase.google.com/project/jets-1b5fa/settings/general)
2. Check that your Android app exists
3. Verify the package name is `com.jetsetterss.mobile`
4. Verify SHA-1 fingerprint is added
5. Download google-services.json again to make sure it's up to date

---

## 🎯 Quick Reference Checklist

Before you start:
- [ ] You have EAS CLI installed (`npm install -g eas-cli`)
- [ ] You're logged in to EAS (`eas login`)
- [ ] You have access to Firebase Console for project `jets-1b5fa`

Setup steps:
- [ ] Step 1: Got SHA-1 fingerprint from `eas credentials`
- [ ] Step 2: Added SHA-1 to Firebase Console (Android app settings)
- [ ] Step 3: Downloaded google-services.json from Firebase
- [ ] Step 4: Placed google-services.json in project root
- [ ] Step 5: Updated app.json with `googleServicesFile: "./google-services.json"`
- [ ] Step 6: Rebuilt APK with `eas build --platform android`

Testing:
- [ ] Uninstalled old APK from device
- [ ] Installed new APK
- [ ] Tested Google Sign-In ✅
- [ ] Google Sign-In works without DEVELOPER_ERROR

---

## 🚀 Alternative: Local Development Build

If you want to test locally instead of EAS build:

### Get Debug Keystore SHA-1:

```bash
# For Expo development build
cd "/media/OS/for linux work/jetsetter android/jetsetter-mobile/android"
./gradlew signingReport
```

Look for `Variant: debug` and copy the SHA-1.

### Add Debug SHA-1 to Firebase:
- Follow Step 2 above
- Add BOTH the EAS SHA-1 AND the debug SHA-1
- This way both builds will work

### Build Locally:
```bash
npx expo run:android
```

---

## 📚 Additional Resources

- [Firebase Android Setup](https://firebase.google.com/docs/android/setup)
- [Google Sign-In Troubleshooting](https://react-native-google-signin.github.io/docs/troubleshooting)
- [EAS Build Configuration](https://docs.expo.dev/build/introduction/)
- [SHA Certificate Fingerprints](https://developers.google.com/android/guides/client-auth)

---

## 📞 Support

**Current Configuration:**
- Firebase Project: `jets-1b5fa`
- Android Package: `com.jetsetterss.mobile`
- Web Client ID: `84512959275-l25c7c0qagj87bbpb7fdtomiseubmnju.apps.googleusercontent.com`

**Support Channels:**
- Phone: (877) 538-7380
- Firebase Console: [https://console.firebase.google.com/project/jets-1b5fa](https://console.firebase.google.com/project/jets-1b5fa)

---

## ⚡ Quick Fix for Immediate Use

**Can't complete Google Sign-In setup right now?**

Use **Email/Password login** instead:
- ✅ Fully functional
- ✅ Works everywhere (Expo Go, web, mobile)
- ✅ No additional setup needed
- ✅ Already working in your app

Google Sign-In can be enabled later by following this guide.

---

**Built with ❤️ by the Jetsetters Development Team**
