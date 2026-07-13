#!/bin/bash
# EAS Build post-install hook
# Runs after `npm install` but before native build (prebuild/pod install).

# On iOS: remove the google-signin iOS native code so pod install doesn't try
# to resolve the GoogleSignIn pod (which requires GoogleService-Info.plist).
# Android builds are unaffected.
if [ "$EAS_BUILD_PLATFORM" = "ios" ]; then
  echo "🍏 iOS build: removing @react-native-google-signin iOS native code (no Firebase plist yet)"
  rm -rf node_modules/@react-native-google-signin/google-signin/ios
  rm -rf node_modules/@react-native-google-signin/google-signin/RNGoogleSignin.podspec
  echo "   Done — google-signin won't be linked on iOS"
fi
