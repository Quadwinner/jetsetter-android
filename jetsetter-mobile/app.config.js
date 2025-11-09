require('dotenv').config();

module.exports = {
  expo: {
    name: 'Jetsetters',
    slug: 'jetsetterss-mobile',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#1e40af',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.jetsetterss.mobile',
      googleServicesFile: process.env.GOOGLE_SERVICES_INFOPLIST,
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
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON,
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      '@react-native-google-signin/google-signin',
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
