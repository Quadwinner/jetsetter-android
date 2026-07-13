// Disable iOS autolinking for packages that require Firebase iOS config
// (GoogleService-Info.plist) which isn't set up yet. Android is unaffected.
module.exports = {
  dependencies: {
    '@react-native-google-signin/google-signin': {
      platforms: {
        ios: null, // don't autolink on iOS
      },
    },
  },
};
