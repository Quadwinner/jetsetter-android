require('dotenv').config();

const isIOSBuild = process.env.EAS_BUILD_PLATFORM === 'ios';

module.exports = {
  expo: {
    name: 'Jetsetters',
    slug: 'jetsetterss-mobile',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: false,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#1e40af',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.jetsetterss.mobile',
      buildNumber: '1',
      ...(process.env.GOOGLE_SERVICES_INFOPLIST
        ? { googleServicesFile: process.env.GOOGLE_SERVICES_INFOPLIST }
        : {}),
      infoPlist: {
        NSCameraUsageDescription: 'Jetsetters needs camera access to scan documents and take photos for visa applications.',
        NSPhotoLibraryUsageDescription: 'Jetsetters needs photo library access to upload documents and profile pictures.',
        NSLocationWhenInUseUsageDescription: 'Jetsetters uses your location to show nearby airports and local currency.',
        UIBackgroundModes: ['remote-notification'],
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#1e40af',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: 'com.jetsetterss.mobile',
      versionCode: 1,
      permissions: [
        'android.permission.INTERNET',
        'android.permission.ACCESS_NETWORK_STATE',
        'android.permission.CAMERA',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
      ],
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON || './google-services.json',
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      // Google Sign-In: on iOS, only include when GOOGLE_IOS_URL_SCHEME is set
      // (requires GoogleService-Info.plist + the reversed client ID). On Android
      // it always works via google-services.json with no extra options needed.
      ...(isIOSBuild
        ? (process.env.GOOGLE_IOS_URL_SCHEME
            ? [['@react-native-google-signin/google-signin', { iosUrlScheme: process.env.GOOGLE_IOS_URL_SCHEME }]]
            : [])
        : ['@react-native-google-signin/google-signin']),
    ],
    extra: {
      eas: {
        projectId: 'ef6b16d3-6cf1-4174-9e38-73fda97b94a9',
      },
      // Google Sign-In Configuration
      GOOGLE_WEB_CLIENT_ID: process.env.FIREBASE_WEB_CLIENT_ID,
      // ARC Pay Configuration
      ARC_PAY_MERCHANT_ID: process.env.ARC_PAY_MERCHANT_ID,
      ARC_PAY_API_URL: process.env.ARC_PAY_API_URL,
      ARC_PAY_API_USERNAME: process.env.ARC_PAY_API_USERNAME,
      ARC_PAY_API_PASSWORD: process.env.ARC_PAY_API_PASSWORD,
      // Other config
      API_BASE_URL: process.env.API_BASE_URL,
      APP_ENV: process.env.APP_ENV,
    },
    owner: 'shubhamkush',
  },
};
