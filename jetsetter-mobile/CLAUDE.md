# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Jetsetters is a React Native mobile application for travel booking built with Expo. The app allows users to search and book flights, hotels, cruises, and vacation packages with integrated ARC Pay payment processing.

**Key Technologies:**
- React Native 0.81.4 with Expo 54
- Redux Toolkit for state management
- React Navigation (Stack + Bottom Tabs)
- Firebase Authentication
- Supabase for database
- Amadeus API for flights/hotels
- ARC Pay for payment processing

**Package:** com.jetsetterss.mobile
**Expo Owner:** shubhamkush
**Project ID:** ef6b16d3-6cf1-4174-9e38-73fda97b94a9

## Development Commands

### Start Development Server
```bash
npm start                    # Start Expo dev server
npx expo start --clear       # Start with cache cleared
```

### Running on Platforms
```bash
npm run android             # Run on Android device/emulator
npm run ios                 # Run on iOS simulator (macOS only)
npm run web                 # Run in web browser
```

### Building APK
```bash
# Build preview APK for testing (recommended)
eas build --platform android --profile preview

# Build production APK
eas build --platform android --profile production

# Build development client
eas build --platform android --profile development
```

**Build Profiles (eas.json):**
- `preview`: Creates APK for internal testing with remote credentials
- `production`: Creates production-ready APK
- `development`: Creates development client with dev tools

### Environment Setup
Environment variables are managed through:
1. Local `.env` file for development
2. EAS Environment Variables (preview/production) for builds
3. `expo-constants` for accessing env vars in code

Access via: `Constants.expoConfig?.extra?.VARIABLE_NAME || process.env.VARIABLE_NAME`

## Architecture

### Navigation Structure

The app uses a nested navigation architecture:

```
AppNavigator (Root)
├── AuthStack (when not authenticated)
│   ├── Login
│   └── Signup
└── MainStack (when authenticated)
    ├── MainTabs (Bottom Tab Navigator)
    │   ├── Home
    │   ├── Flights (FlightSearchScreen)
    │   ├── Hotels (HotelSearchScreen)
    │   ├── Packages (PackageListScreen)
    │   └── MyTrips
    └── Stacked Screens (no tabs)
        ├── Profile
        ├── FlightResults → FlightPayment → FlightConfirmation
        ├── HotelResults → HotelDetails → HotelPayment → HotelConfirmation
        ├── CruiseSearch → CruiseResults → CruiseDetails → CruiseBooking → CruiseConfirmation
        └── PackageDetails → PackageBooking → PackageConfirmation
```

**Authentication Check:** Redux state `state.auth.isAuthenticated` determines which stack renders.

### Service Layer

All external API integrations are in `src/services/`:

**Core Services:**
- `authService.js` - Firebase authentication (Google OAuth, email/password)
- `flightService.js` - Amadeus API for flight search and booking
- `hotelService.js` - Amadeus API for hotel search and booking
- `cruiseService.js` - Cruise data and booking
- `packageService.js` - Vacation package data and booking
- `arcPayService.js` - ARC Pay payment processing

### Payment Flow Architecture

All booking screens (Flights, Hotels, Packages, Cruises) follow this standardized payment flow:

1. **Payment Information State**
   ```javascript
   const [paymentInfo, setPaymentInfo] = useState({
     cardNumber: '',
     cardHolder: '',
     expiryDate: '',  // MM/YY format
     cvv: '',
   });
   ```

2. **Validation**
   - Validate all traveler/guest fields
   - Validate email format
   - Validate payment fields (card number, holder, expiry, CVV)
   - Use `arcPayService.validateCardNumber()` (Luhn algorithm)
   - Parse expiry with `arcPayService.parseExpiryDate()`

3. **Payment Processing Before Booking**
   ```javascript
   // Generate unique order reference
   const orderReference = `TYPE-${Date.now()}-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;

   // Process payment FIRST
   const paymentResult = await arcPayService.processPayment({
     amount, currency, orderReference,
     customerEmail, customerPhone, customerName,
     cardNumber, cardHolder, expiryMonth, expiryYear, cvv,
     description
   });

   // Only proceed to booking if payment succeeds
   if (!paymentResult.success) {
     Alert.alert('Payment Failed', paymentResult.error);
     return;
   }

   // Create booking after successful payment
   const bookingResult = await serviceAPI.createBooking(...);
   ```

4. **Confirmation Screen with AsyncStorage**
   All confirmation screens save bookings to AsyncStorage:
   ```javascript
   useEffect(() => {
     const saveBooking = async () => {
       await AsyncStorage.setItem('completedXXXBooking', JSON.stringify({
         orderId, bookingReference, type, payment, status: 'CONFIRMED',
         bookingDate, transactionId, ...bookingData
       }));
     };
     saveBooking();
   }, [dependencies]);
   ```

**AsyncStorage Keys:**
- `completedFlightBooking` - Flight bookings
- `completedHotelBooking` - Hotel bookings
- `completedPackageBooking` - Package bookings
- `completedBooking` - Cruise bookings

### ARC Pay Integration

**Current Mode:** Mock payment processing for testing (line 390 in arcPayService.js)

The service includes both real API integration and mock payment:
- Real API: `processPayment()` function (lines 93-202)
- Mock API: `processMockPayment()` function (lines 353-386)
- Currently exports: `processPayment: processMockPayment`

**Test Cards:**
- Success: `4111111111111111` (Visa test card)
- Decline: `4000000000000002` (insufficient funds)

**ARC Pay Configuration (from EAS environment):**
- Merchant ID: TESTARC05511704
- API URL: https://api.arcpay.travel/api/rest/version/100/merchant/TESTARC05511704
- Username: Administrator
- Password: Jetsetters@2025

To switch to real API, change line 390 in `arcPayService.js`:
```javascript
processPayment: processPayment,  // Instead of processMockPayment
```

## Platform-Specific Considerations

### Android Safe Areas
All screens use `useSafeAreaInsets()` from `react-native-safe-area-context` to handle:
- Bottom navigation bar overlap
- Notch/status bar areas

Apply to buttons/footers:
```javascript
const insets = useSafeAreaInsets();
<View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
```

### Keyboard Handling
Payment and booking screens wrap ScrollView with KeyboardAvoidingView:
```javascript
<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  style={{ flex: 1 }}
  keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
>
  <ScrollView keyboardShouldPersistTaps="handled">
```

### Redux Integration
Authentication state managed via Redux Toolkit:
- Store: `src/store/` (slices in `src/store/slices/`)
- Auth slice: `state.auth.isAuthenticated` and `state.auth.loading`
- Used in AppNavigator to switch between AuthStack and MainStack

## Key API Integrations

### Amadeus API (Flights & Hotels)
- Flight search requires origin, destination, departure date, adults count
- Hotel search requires city code, check-in/check-out dates, adults count
- Both require API key and secret from environment variables
- Token-based authentication (fetch token first, then use for requests)

### Firebase Authentication
- Google OAuth integration configured
- Email/password authentication
- User state synced to Redux store
- Firebase config from environment variables

### Supabase
- Shared database with web platform
- User profiles and booking history
- Accessed via `@supabase/supabase-js` client

## Booking Flow Pattern

All booking types follow this pattern:

1. **Search Screen** - Search form with filters
2. **Results Screen** - List of available options
3. **Details Screen** (hotels/cruises only) - Detailed view
4. **Payment/Booking Screen** - Payment info + traveler/guest details
5. **Confirmation Screen** - Success message + booking details + AsyncStorage save

Navigation always passes data via route params, never global state.

## Common Development Tasks

### Adding a New Booking Type
1. Create service in `src/services/` (follow existing pattern)
2. Create screens: Search → Results → Details → Payment → Confirmation
3. Add payment integration following the standardized payment flow
4. Add AsyncStorage save in confirmation screen
5. Add navigation routes in `AppNavigator.js`
6. Add tab or entry point in HomeScreen

### Updating Payment Integration
All payment screens follow the same pattern - update all booking types consistently:
- FlightPaymentScreen.js
- HotelPaymentScreen.js
- PackageBookingScreen.js
- CruiseBookingScreen.js

### Environment Variables
Required variables (stored in EAS for builds):
- SUPABASE_URL, SUPABASE_ANON_KEY
- FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID, etc.
- AMADEUS_API_KEY, AMADEUS_API_SECRET
- ARC_PAY_MERCHANT_ID, ARC_PAY_API_URL, ARC_PAY_API_USERNAME, ARC_PAY_API_PASSWORD
- API_BASE_URL

## Testing on Android Device

### Build and Install
1. Run `eas build --platform android --profile preview`
2. Wait for build to complete (5-10 minutes)
3. Download APK from provided URL or scan QR code
4. Enable "Install from unknown sources" on Android device
5. Install and test

### Test Payment Flow
Use test card `4111111111111111` with any future expiry (e.g., 12/25) and CVV (e.g., 123).

Check that:
- Payment validation works (card format, expiry format)
- Payment processing shows loading state
- Success navigates to confirmation
- Booking appears in My Trips screen (AsyncStorage)

## Important Notes

- All booking confirmation screens MUST save to AsyncStorage for My Trips to work
- Always use safe area insets for bottom buttons on Android
- Payment must process and succeed BEFORE creating booking
- Use `console.log` with emojis (🔐 💳 📤 📥 ✅ ❌) for debugging payment flow
- Navigation uses stack navigation - never break the navigation hierarchy
- Profile screen accessed via top-right icon on Home, not via tabs
