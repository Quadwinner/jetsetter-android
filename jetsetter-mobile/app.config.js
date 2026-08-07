require('dotenv').config();

// Google Sign-In native module is intentionally excluded from iOS autolinking
// (see package.json > expo.autolinking.ios.exclude). To keep the iOS CocoaPods
// install consistent with that exclude, we only register the google-signin
// config plugin for non-iOS builds. iOS Google Sign-In is not configured yet
// (no GoogleService-Info.plist / iOS OAuth client), so this loses nothing on
// iOS while unblocking `pod install`. Android + email/password are unaffected.
const isIOSBuild = process.env.EAS_BUILD_PLATFORM === 'ios';

const plugins = [];
if (!isIOSBuild) {
  plugins.push([
    '@react-native-google-signin/google-signin',
    {
      iosUrlScheme:
        process.env.GOOGLE_IOS_URL_SCHEME || 'com.googleusercontent.apps.placeholder',
    },
  ]);
}

module.exports = {
  expo: {
    name: 'Jetsetters',
    slug: 'jetsetterss-mobile',
    version: '1.0.0',
    scheme: ['jetsettermobile', 'jetsetterss'],
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#055B75',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.jetsetterss.mobile',
      buildNumber: '1',
      ...(process.env.GOOGLE_SERVICES_INFOPLIST
        ? { googleServicesFile: process.env.GOOGLE_SERVICES_INFOPLIST }
        : {}),
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSCameraUsageDescription: 'Jetsetters needs camera access to scan documents and take photos for visa applications.',
        NSPhotoLibraryUsageDescription: 'Jetsetters needs photo library access to upload documents and profile pictures.',
        NSLocationWhenInUseUsageDescription: 'Jetsetters uses your location to show nearby airports and local currency.',
        UIBackgroundModes: ['remote-notification'],
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#055B75',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: 'com.jetsetterss.mobile',
      versionCode: 1,
      intentFilters: [
        {
          action: 'VIEW',
          data: [{ scheme: 'jetsettermobile' }],
          category: ['BROWSABLE', 'DEFAULT'],
        },
        {
          action: 'VIEW',
          data: [{ scheme: 'jetsetterss' }],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
      permissions: [
        'android.permission.INTERNET',
        'android.permission.ACCESS_NETWORK_STATE',
        'android.permission.POST_NOTIFICATIONS',
      ],
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON || './google-services.json',
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins,
    extra: {
      eas: {
        projectId: 'ef6b16d3-6cf1-4174-9e38-73fda97b94a9',
      },
      // Google Sign-In Configuration
      GOOGLE_WEB_CLIENT_ID: process.env.FIREBASE_WEB_CLIENT_ID,
      // Other config
      API_BASE_URL: process.env.API_BASE_URL,
      APP_ENV: process.env.APP_ENV,
    },
    owner: 'shubhamkush',
  },
};
