# Flight Booking — Android Implementation Guide

## Overview
Full flight booking flow for the Jetsetter Android app (React Native / Expo).
API base URL: `https://www.jetsetterss.com/api`

---

## Part 1: Screen Flow

| # | Screen | File to Create | Route/Nav |
|---|--------|---------------|-----------|
| 1 | Flight Landing / Home | Already in HomeScreen | Tab: Flights |
| 2 | Flight Search Results | `FlightSearchScreen.js` | Push from Home |
| 3 | Passenger Details | `FlightBookingScreen.js` | Push from Results |
| 4 | Payment Redirect | `FlightPaymentScreen.js` | Push from Booking |
| 5 | Order Processing | `FlightCreateOrderScreen.js` | Push after ARC Pay callback |
| 6 | Booking Success | `FlightSuccessScreen.js` | Push from Order Processing |
| 7 | Manage Booking | `ManageBookingScreen.js` | Push from Success or Profile |

Navigation flow:
```
HomeScreen (search form)
  → FlightSearchScreen (results + filters)
    → FlightBookingScreen (passenger details + fare summary)
      → [ARC Pay Hosted Checkout — external browser/WebView]
        → FlightCreateOrderScreen (order processing)
          → FlightSuccessScreen (e-ticket)
            → ManageBookingScreen (view/cancel)
```

---

## Part 2: API Endpoints

### 2.1 Airport Search (Autocomplete)
```
POST https://www.jetsetterss.com/api/airports/search
Content-Type: application/json

Body: { "keyword": "New Y", "limit": 10 }
```
Response:
```json
{
  "success": true,
  "data": [
    {
      "name": "John F Kennedy International Airport",
      "code": "JFK",
      "type": "airport",
      "cityName": "New York",
      "cityCode": "NYC",
      "country": "United States",
      "countryCode": "US",
      "displayName": "New York (JFK) - John F Kennedy International Airport"
    }
  ]
}
```

### 2.2 Flight Search
```
POST https://www.jetsetterss.com/api/flights/search
Content-Type: application/json

Body:
{
  "from": "DEL",
  "to": "BOM",
  "departDate": "2026-05-15",
  "returnDate": "2026-05-20",   // only for round trip
  "tripType": "oneWay",          // "oneWay" | "roundTrip"
  "travelers": 2,
  "travelClass": "ECONOMY"       // ECONOMY | PREMIUM_ECONOMY | BUSINESS | FIRST
}
```
Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "offer-id-string",
      "airline": "Air India",
      "airlineCode": "AI",
      "flightNumber": "AI9731",
      "price": {
        "total": "299.00",
        "amount": 299.00,
        "currency": "USD",
        "base": "250.00",
        "grandTotal": "299.00",
        "fees": []
      },
      "duration": "PT1H5M",
      "departure": {
        "time": "10:30",
        "airport": "DEL",
        "terminal": "3",
        "date": "2026-05-15"
      },
      "arrival": {
        "time": "11:35",
        "airport": "BOM",
        "terminal": "2",
        "date": "2026-05-15"
      },
      "stops": 0,
      "stopDetails": [],
      "cabin": "ECONOMY",
      "baggage": "23 KG",
      "baggageDetails": {
        "checked": { "weight": 23, "weightUnit": "KG" },
        "cabin": null
      },
      "refundable": false,
      "numberOfBookableSeats": 9,
      "brandedFare": null,
      "brandedFareLabel": null,
      "aircraft": "320"
    }
  ],
  "meta": {
    "searchParams": {},
    "resultCount": 15,
    "totalResults": 15
  }
}
```

### 2.3 Create Flight Order (after payment)
```
POST https://www.jetsetterss.com/api/flights/order
Authorization: Bearer {jwt_token}
Content-Type: application/json

Body:
{
  "flightOffer": { /* full offer object from search */ },
  "travelers": [
    {
      "id": "1",
      "firstName": "John",
      "lastName": "Doe",
      "dateOfBirth": "1990-05-15",
      "gender": "male",
      "mobile": "+919876543210",
      "email": "john@example.com",
      "nationality": "IN",
      "passportNumber": "A1234567",
      "passportExpiry": "2030-01-01",
      "documentType": "PASSPORT",
      "requiresWheelchair": false
    }
  ],
  "contactInfo": {
    "email": "john@example.com",
    "countryCode": "+91",
    "phoneNumber": "9876543210"
  },
  "totalAmount": 299.00,
  "transactionId": "TXN-abc123",
  "orderId": "FLTabc123",
  "userId": "user-uuid",
  "fareBreakdown": {
    "baseFare": 250,
    "taxes": 49,
    "addons": 0,
    "vipFee": 0,
    "couponDiscount": 0,
    "total": 299
  }
}
```
Response:
```json
{
  "success": true,
  "data": {
    "id": "amadeus-order-id",
    "orderId": "FLTabc123",
    "pnr": "XYZ789",
    "status": "CONFIRMED",
    "bookingReference": "BOOK-m5kp2q3r",
    "totalPrice": "299.00",
    "createdAt": "2026-05-15T10:30:00Z"
  },
  "pnr": "XYZ789",
  "bookingReference": "BOOK-m5kp2q3r",
  "message": "Flight booked successfully"
}
```

### 2.4 Get User Bookings
```
GET https://www.jetsetterss.com/api/flights/bookings?userId={userId}
Authorization: Bearer {jwt_token}
```
Response: array of booking objects (see booking_details shape in Part 3).

### 2.5 Get Booking by Reference
```
GET https://www.jetsetterss.com/api/flights/bookings/{bookingReference}
Authorization: Bearer {jwt_token}
```

### 2.6 Validate Coupon
```
POST https://www.jetsetterss.com/api/coupons/validate
Content-Type: application/json

Body: {
  "code": "SAVE20",
  "orderTotal": 299.00,
  "bookingType": "flight",
  "userId": "user-uuid"
}
```
Response:
```json
{
  "success": true,
  "coupon": {
    "id": "coupon-uuid",
    "code": "SAVE20",
    "description": "Save 20% on flights",
    "discountType": "percentage",
    "discountValue": 20
  },
  "discountAmount": 59.80,
  "finalTotal": 239.20
}
```

### 2.7 ARC Pay Hosted Checkout (initiate payment)
```
POST https://www.jetsetterss.com/api/payments?action=hosted-checkout
Content-Type: application/json

Body:
{
  "amount": 299.00,
  "currency": "USD",
  "orderId": "FLTabc123",
  "bookingType": "flight",
  "customerEmail": "john@example.com",
  "customerName": "John Doe",
  "customerPhone": "+919876543210",
  "description": "Flight DEL → BOM - AI9731",
  "returnUrl": "jetsettermobile://payment/callback?orderId=FLTabc123&bookingType=flight",
  "cancelUrl": "jetsettermobile://payment/cancel?orderId=FLTabc123",
  "bookingData": { /* full booking object */ },
  "flightData": { /* flight offer object */ }
}
```
Response:
```json
{
  "success": true,
  "checkoutUrl": "https://api.arcpay.travel/checkout/pay/SESSION-ID",
  "sessionId": "SESSION-ID",
  "orderId": "FLTabc123"
}
```

### 2.8 Get Pending Booking (after payment callback)
```
GET https://www.jetsetterss.com/api/payments?action=get-pending-booking&orderId=FLTabc123
```

### 2.9 Cancel Booking
```
POST https://www.jetsetterss.com/api/payments?action=cancel-booking
Authorization: Bearer {jwt_token}
Content-Type: application/json

Body: { "bookingReference": "BOOK-m5kp2q3r", "reason": "Change of plans" }
```
Response:
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "refundAmount": 249.00,
  "cancellationFee": 50.00
}
```

### 2.10 Cheapest Dates
```
GET https://www.jetsetterss.com/api/flights/cheapest-dates?origin=DEL&destination=BOM
```
Response:
```json
{
  "success": true,
  "data": [
    { "departureDate": "2026-05-10", "price": { "total": "199.00", "currency": "USD" } }
  ]
}
```

### 2.11 Most Booked Destinations (for home screen popular destinations)
```
GET https://www.jetsetterss.com/api/flights/analytics/booked?origin=DEL&period=2025-01
```


---

## Part 3: Service File

Create `src/services/flightService.js`:

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://www.jetsetterss.com/api';

const getAuthHeader = async () => {
  const token = await AsyncStorage.getItem('userToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const flightService = {
  searchAirports: async (keyword) => {
    const res = await fetch(`${BASE_URL}/airports/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword, limit: 10 }),
    });
    const data = await res.json();
    return data.success ? data.data : [];
  },

  searchFlights: async (params) => {
    const res = await fetch(`${BASE_URL}/flights/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Flight search failed');
    const data = await res.json();
    return data.success ? data.data : [];
  },

  getCheapestDates: async (origin, destination) => {
    const res = await fetch(
      `${BASE_URL}/flights/cheapest-dates?origin=${origin}&destination=${destination}`
    );
    const data = await res.json();
    return data.success ? data.data : [];
  },

  validateCoupon: async (code, orderTotal, userId) => {
    const res = await fetch(`${BASE_URL}/coupons/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, orderTotal, bookingType: 'flight', userId }),
    });
    return res.json();
  },

  initiatePayment: async (paymentData) => {
    const res = await fetch(`${BASE_URL}/payments?action=hosted-checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData),
    });
    return res.json();
  },

  getPendingBooking: async (orderId) => {
    const res = await fetch(
      `${BASE_URL}/payments?action=get-pending-booking&orderId=${orderId}`
    );
    return res.json();
  },

  createOrder: async (orderData) => {
    const headers = await getAuthHeader();
    const res = await fetch(`${BASE_URL}/flights/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(orderData),
    });
    if (!res.ok) throw new Error('Order creation failed');
    return res.json();
  },

  getUserBookings: async (userId) => {
    const headers = await getAuthHeader();
    const res = await fetch(`${BASE_URL}/flights/bookings?userId=${userId}`, {
      headers,
    });
    const data = await res.json();
    return data.success ? data.data : [];
  },

  getBookingByRef: async (bookingRef) => {
    const headers = await getAuthHeader();
    const res = await fetch(`${BASE_URL}/flights/bookings/${bookingRef}`, {
      headers,
    });
    return res.json();
  },

  cancelBooking: async (bookingReference, reason) => {
    const headers = await getAuthHeader();
    const res = await fetch(`${BASE_URL}/payments?action=cancel-booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ bookingReference, reason }),
    });
    return res.json();
  },
};

export default flightService;
```

---

## Part 4: Fare Calculation Logic

```javascript
// Mirrors PricingService.js from web app
// Default admin-configured values (fetched from /admin/price-config if needed)
const DEFAULT_PRICE_CONFIG = {
  flight_taxes_fees: 25,           // fixed USD per booking
  flight_taxes_fees_percentage: 5, // % of base fare
  cancellation_fee: 50,            // fixed USD
};

const calculateFlightFare = (flightOffer, passengerCount, addons, appliedCoupon, config = DEFAULT_PRICE_CONFIG) => {
  const grandTotal = parseFloat(flightOffer.price.grandTotal);
  const baseFare = grandTotal * passengerCount;

  const fixedTax = config.flight_taxes_fees;
  const percentTax = (baseFare * config.flight_taxes_fees_percentage) / 100;
  const taxes = (fixedTax + percentTax) * passengerCount;

  const addonsTotal = addons.reduce((sum, a) => sum + a.price, 0);
  const vipFee = addons.find(a => a.id === 'vip') ? 30 : 0;

  const couponDiscount = appliedCoupon ? appliedCoupon.discountAmount : 0;

  const totalAmount = baseFare + taxes + addonsTotal - couponDiscount;

  return {
    baseFare: baseFare.toFixed(2),
    taxes: taxes.toFixed(2),
    addonsTotal: addonsTotal.toFixed(2),
    vipFee: vipFee.toFixed(2),
    couponDiscount: couponDiscount.toFixed(2),
    totalAmount: Math.max(0, totalAmount).toFixed(2),
    currency: flightOffer.price.currency || 'USD',
  };
};
```

---

## Part 5: Add-ons

| ID | Name | Price | Description |
|----|------|-------|-------------|
| `travel_insurance` | Travel Insurance | $25 | Trip cancellation, medical, lost baggage |
| `airport_transfer` | Airport Transfer | $35 | 24/7 professional drivers, free waiting |
| `vip_service` | VIP Service | $30 | Priority check-in, boarding, baggage |

---

## Part 6: Payment Flow (ARC Pay Deep Link)

1. User taps "Proceed to Payment" on `FlightBookingScreen`
2. Save pending booking to AsyncStorage: `await AsyncStorage.setItem('pendingFlightBooking', JSON.stringify(bookingData))`
3. Generate orderId: `'FLT' + Date.now().toString(36).toUpperCase()`
4. Call `flightService.initiatePayment()` → get `checkoutUrl`
5. Open ARC Pay in browser: `Linking.openURL(checkoutUrl)`
6. ARC Pay redirects to: `jetsettermobile://payment/callback?orderId=FLTabc&bookingType=flight&resultIndicator=XYZ`
7. Handle deep link in app (configure in `app.json` scheme: `jetsettermobile`)
8. In deep link handler: call `flightService.getPendingBooking(orderId)` → get stored booking data
9. Navigate to `FlightCreateOrderScreen` with `{ transactionId, orderId, amount, selectedFlight, passengerData }`
10. `FlightCreateOrderScreen` calls `flightService.createOrder()` → get PNR + bookingReference
11. Navigate to `FlightSuccessScreen`

### Deep Link Setup (app.json)
```json
{
  "expo": {
    "scheme": "jetsettermobile",
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [{ "scheme": "jetsettermobile" }],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

### Deep Link Handler
```javascript
import { Linking } from 'react-native';
import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';

const useDeepLink = () => {
  const navigation = useNavigation();

  useEffect(() => {
    const handleUrl = async ({ url }) => {
      if (!url) return;
      const parsed = new URL(url);
      const orderId = parsed.searchParams.get('orderId');
      const bookingType = parsed.searchParams.get('bookingType');
      const resultIndicator = parsed.searchParams.get('resultIndicator');

      if (bookingType === 'flight' && orderId) {
        const stored = await AsyncStorage.getItem('pendingFlightBooking');
        const bookingData = stored ? JSON.parse(stored) : null;

        navigation.navigate('FlightCreateOrder', {
          orderId,
          transactionId: resultIndicator,
          bookingData,
        });
      }
    };

    const sub = Linking.addEventListener('url', handleUrl);
    Linking.getInitialURL().then(url => url && handleUrl({ url }));
    return () => sub.remove();
  }, []);
};
```


---

## Part 7: UI/UX Design Specifications

### Color Palette

```javascript
const THEME = {
  primary: '#055B75',
  primaryDark: '#034457',
  primaryHover: '#044A5F',
  secondary: '#65B3CF',
  secondaryLight: '#E0F7FA',
  pageBg: '#F8FAFC',
  cardBg: '#FFFFFF',
  border: '#E2E8F0',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  trendingStart: '#FF6B6B',
  trendingEnd: '#FF8E53',
  cheapestCardBg: '#B9D0DC',
  starYellow: '#FFD700',
  white: '#FFFFFF',
};
```

### Typography

| Element | fontSize | fontWeight | color |
|---------|----------|------------|-------|
| Page title | 28 | '700' | `#1E293B` |
| Section heading | 22 | '700' | `#1E293B` |
| Card title | 18 | '600' | `#1E293B` |
| Body text | 14 | '400' | `#64748B` |
| Caption | 12 | '400' | `#94A3B8` |
| Price large | 22 | '800' | `#055B75` |
| Price small | 14 | '600' | `#055B75` |
| Button label | 16 | '700' | `#FFFFFF` |
| Input text | 14 | '400' | `#1E293B` |
| Placeholder | 14 | '400' | `#94A3B8` |
| Label | 12 | '600' | `#64748B` |

---

### Screen 1: Flight Search Form (on HomeScreen)

**Trip type toggle:**
- Container: `borderRadius: 24, overflow: 'hidden', flexDirection: 'row', width: 240`
- Active tab: `backgroundColor: '#055B75'`, white text
- Inactive tab: `backgroundColor: '#F1F5F9'`, `#64748B` text

**Search fields layout (stacked vertically on mobile):**
```
┌─────────────────────────────┐
│ From (airport autocomplete) │  ← #055B75 border on focus
├─────────────────────────────┤
│ To   (airport autocomplete) │
├──────────────┬──────────────┤
│ Depart Date  │ Return Date  │
├──────────────┴──────────────┤
│ Travelers (picker)          │
├─────────────────────────────┤
│ Class (picker)              │
├─────────────────────────────┤
│     [  SEARCH FLIGHTS  ]    │  ← bg #055B75, rounded 12, h 52
└─────────────────────────────┘
```

**Input style:**
```javascript
{
  borderWidth: 1,
  borderColor: '#E2E8F0',
  borderRadius: 8,
  paddingHorizontal: 12,
  paddingVertical: 12,
  fontSize: 14,
  color: '#1E293B',
  backgroundColor: '#FFFFFF',
}
// focused:
{ borderColor: '#055B75', borderWidth: 2 }
```

**Autocomplete dropdown:**
- `backgroundColor: '#FFF'`, `borderRadius: 8`, `elevation: 8`
- Each item: `paddingHorizontal: 16, paddingVertical: 12`
- City name: bold 14px `#1E293B`
- IATA code: 12px `#65B3CF`
- Country: 12px `#94A3B8`
- Separator: `borderBottomWidth: 1, borderBottomColor: '#F1F5F9'`

**Special fares row (below search button):**
- Row of pill buttons: `borderRadius: 20, borderWidth: 1, borderColor: '#055B75'`
- Active: `backgroundColor: '#055B75'`, white text
- Inactive: `backgroundColor: '#FFF'`, `#055B75` text
- Labels: "Student", "Senior Citizen", "Armed Forces"

---

### Screen 2: Flight Search Results (FlightSearchScreen)

**Layout:**
- Filter bar at top (horizontal scroll of active filters)
- Sort dropdown: "Price ↑", "Duration", "Departure", "Arrival"
- Date slider: 7 horizontal date pills (3 before + selected + 3 after)
  - Selected: `backgroundColor: '#055B75'`, white text
  - Others: `backgroundColor: '#F0FAFC'`, `#055B75` text
  - Sub-label: cheapest price if available (green text 11px)
- FlatList of flight cards below

**Flight Result Card:**
```
┌────────────────────────────────────────┐
│ [Airline Logo]  Air India  AI9731      │ ← airline row
│                                        │
│  10:30    ──────────────────  11:35    │ ← route row
│  DEL                           BOM     │
│  New Delhi                  Mumbai     │
│                                        │
│  1h 5m · Non-stop · Economy           │ ← meta row
│  ✓ 23KG checked bag                   │
│────────────────────────────────────────│
│  $299      Non-refundable   [Book Now] │ ← price row
└────────────────────────────────────────┘
```

Card styles:
```javascript
{
  backgroundColor: '#FFFFFF',
  borderRadius: 12,
  marginHorizontal: 16,
  marginBottom: 12,
  elevation: 3,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  padding: 16,
}
```

- Airline logo: 32x32 from `https://pics.avs.io/32/32/{IATA_CODE}.png`
- Airline name: bold 14px `#1E293B`
- Flight number: 12px `#94A3B8`
- Departure/Arrival times: bold 20px `#1E293B`
- Airport code: 14px `#64748B`
- City name: 12px `#94A3B8`
- Route line: dashed `#E2E8F0`, airplane icon `#055B75` center
- Duration + stops: 12px `#64748B`
- Stop badge (if stops > 0): amber pill `#FEF3C7` text `#92400E`
- Baggage icon: green checkmark + "23KG"
- Price: bold 22px `#055B75`
- Refundable tag: 11px green if refundable
- "Book Now" button: `backgroundColor: '#055B75'`, white, `borderRadius: 8`, `paddingHorizontal: 16, paddingVertical: 8`

**Filters panel (bottom sheet):**
Sections: Price Range (slider), Stops, Airlines (checkboxes), Departure Time (4 time blocks), Baggage, Refundable
- Filter chips: active `#055B75` bg white text, inactive border `#055B75`
- "Apply Filters" button: full width, gradient `#055B75 → #034457`

---

### Screen 3: Passenger Details (FlightBookingScreen)

**Layout:** ScrollView with sticky fare summary at bottom

**Flight Summary Card (top):**
```
┌────────────────────────────────────┐
│ ✈ DEL → BOM   Mon, 15 May 2026    │
│ Air India AI9731 · Economy         │
│ 10:30 – 11:35 · 1h 5m · Non-stop  │
│ Includes 23KG checked bag          │
└────────────────────────────────────┘
```
- Background: `linear-gradient` from `#055B75` to `#034457` (use `expo-linear-gradient`)
- All text: white
- Border radius: 12px

**Passenger Form (per passenger, in expandable section):**
```
┌─────────────────────────────────────┐
│ Passenger 1 (Adult)           ▾     │
├─────────────────────────────────────┤
│ [First Name*]   [Last Name*]        │
│ [Date of Birth*]                    │
│ Gender:  [Male ●]  [Female ○]       │  ← toggle, active: #055B75 bg
│ [Country Code ▾] [Mobile No*]       │
│ [Email]                             │
│ [Nationality ▾]                     │
│ [Passport Number]                   │
│ [Passport Expiry]                   │
│ ☐ Requires wheelchair assistance    │
└─────────────────────────────────────┘
```

Required fields show red `*`. Validation error: red border + 11px red message below field.

**Gender toggle:**
```javascript
// Two buttons side by side
{ borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', flex: 1, paddingVertical: 10, alignItems: 'center' }
// active: { backgroundColor: '#055B75', borderColor: '#055B75' }
```

**Add-ons section:**
```
┌────────────────────────────────────┐
│ ☐  ✈ Travel Insurance        $25  │
│    Trip cancellation & medical     │
├────────────────────────────────────┤
│ ☐  🚗 Airport Transfer        $35  │
│    24/7 professional drivers       │
└────────────────────────────────────┘
```
Card border: 1px `#E2E8F0`, rounded 10, selected border `#055B75` 2px

**VIP Service:**
```
┌────────────────────────────────────┐
│ ⭐ VIP Service                $30  │
│    Priority check-in & boarding    │
│                              [Add] │
└────────────────────────────────────┘
```

**Coupon input:**
```
┌──────────────────────┬────────────┐
│  Enter promo code    │  [APPLY]   │
└──────────────────────┴────────────┘
```
Applied state: green border + "SAVE20 applied — saving $59.80"

**Sticky Fare Summary (bottom card):**
```
┌────────────────────────────────────┐  ← bg gradient #055B75→#034457
│ Fare Summary                       │
│ Base Fare (2x)        $598.00      │
│ Taxes & Fees           $64.90      │
│ Add-ons                $60.00      │
│ Coupon Discount       -$59.80      │
│ ──────────────────────────────     │
│ Total                 $663.10  USD │
│                                    │
│  [    Proceed to Payment    ]      │  ← white bg, #055B75 text, bold
└────────────────────────────────────┘
```

---

### Screen 4: Payment Screen (FlightPaymentScreen)

**Loading state:**
- Full screen `#F8FAFC` bg
- Centered: animated airplane icon (Ionicons `airplane`) with circular spinner
- "Redirecting to Secure Payment" — bold 20px `#1E293B`
- "256-bit SSL Encrypted" — 13px `#64748B` + shield icon
- Progress steps (4): Search → Passenger Details → Payment → Confirmation
  - Active step: `#055B75` circle, pulse animation
  - Completed: green circle checkmark
  - Upcoming: `#E2E8F0` circle

**10-minute countdown timer:**
- Normal: blue pill `#EFF6FF` text `#2563EB`
- Under 60s: amber pill, pulse animation
- Expired: red pill, bounce animation

---

### Screen 5: Order Processing (FlightCreateOrderScreen)

- Full screen centered spinner
- "Processing your booking…" bold 20px
- "Please do not close the app" caption
- Animated progress bar (indeterminate), color `#055B75`
- On success: green checkmark animation → auto-navigate after 2s

**Error state:**
- Red icon + "Booking Failed"
- Error message text
- [Try Again] button + [Contact Support] button

---

### Screen 6: Booking Success / E-Ticket (FlightSuccessScreen)

**Layout (ScrollView):**

**Success banner:**
- Green gradient header: `#10B981 → #059669`
- Large checkmark icon (white, 60px)
- "Booking Confirmed!" — white bold 26px
- "Booking Ref: BOOK-m5kp2q3r" — white monospace 14px
- "PNR: XYZ789" — white monospace 14px

**E-Ticket Card:**
```
┌─────────────────────────────────────────┐
│  JETSETTER  ≈ BOARDING PASS             │  ← #055B75 header
│─────────────────────────────────────────│
│  ✈  DEL          →         BOM         │
│  New Delhi                 Mumbai       │
│  10:30 AM              11:35 AM         │
│  15 May 2026           15 May 2026      │
│─ ○ ─────────── (tear line) ─────────○ ─│
│  FLIGHT     DURATION    CLASS   STOPS   │
│  AI9731     1h 5m       Economy  0      │
│  TERMINAL   BOARDING    SEAT     BAG    │
│  T3         09:30       —        23KG   │
│─────────────────────────────────────────│
│  PASSENGER TABLE                        │
│  Name            Type    Status         │
│  John Doe        Adult   Confirmed ✓    │
└─────────────────────────────────────────┘
```

Ticket card styles:
```javascript
{
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  marginHorizontal: 16,
  elevation: 10,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.15,
  shadowRadius: 20,
}
```

Tear-off effect: two semicircles cut into edges using `borderRadius` trick.

**Payment Summary Card:**
- Same line-item layout as fare summary
- "Payment Successful" green box at bottom

**Important Info Card:**
- Amber `#FFFBEB` bg, `#92400E` border
- 4 items: Check-in time, Baggage policy, Support number, Email

**Action Buttons (bottom row):**
```
[📄 Download E-Ticket]  [📋 Manage Booking]
[↩ Back to Home      ]
```
- Download: `#055B75` bg, white, rounded 10
- Manage: border `#055B75`, `#055B75` text
- Home: `#F1F5F9` bg, `#64748B` text

---

### Screen 7: Manage Booking (ManageBookingScreen)

**Tab bar:** "Flight Details" | "Passengers" | "Payment"
- Active tab: `#055B75` underline + text
- Inactive: `#94A3B8` text

**Flight Details tab:** same E-ticket layout as success screen, without action buttons

**Cancel Booking:**
- Red "Cancel Booking" text button at bottom
- Confirmation modal:
  - "Are you sure?" heading
  - Cancellation policy text (non-refundable / partial refund)
  - Reason picker: "Change of plans", "Travel restrictions", "Schedule conflict", "Health reasons", "Weather concerns", "Other"
  - Refund breakdown: Original $299 - Fee $50 = Net $249
  - [Confirm Cancellation] red button + [Keep Booking] gray button

**Timeline tracker (after cancellation):**
```
● Cancellation Requested  ── ◌ Processing Refund  ── ◌ Refund Processed
```
Active dot: `#055B75`, inactive: `#E2E8F0`, line: dashed

---

## Part 8: Files to Create/Modify

### New Files
```
src/services/flightService.js
src/screens/flights/FlightSearchScreen.js
src/screens/flights/FlightBookingScreen.js
src/screens/flights/FlightPaymentScreen.js
src/screens/flights/FlightCreateOrderScreen.js
src/screens/flights/FlightSuccessScreen.js
src/screens/flights/ManageBookingScreen.js
src/screens/flights/styles/FlightSearchScreen.styles.js
src/screens/flights/styles/FlightBookingScreen.styles.js
src/screens/flights/styles/FlightSuccessScreen.styles.js
src/screens/flights/styles/ManageBookingScreen.styles.js
src/utils/flightUtils.js   ← duration parser, fare calculator, orderId generator
src/constants/flightConstants.js  ← TRAVEL_CLASSES, ADDON_LIST, NATIONALITY_LIST
```

### Modify
```
src/screens/home/HomeScreen.js   ← add flight search form (already has it)
app.json                          ← add deep link scheme
src/navigation/AppNavigator.js    ← add flight screens to stack
```

---

## Part 9: Key Utility Functions

```javascript
// src/utils/flightUtils.js

export const parseDuration = (iso) => {
  // "PT1H5M" → "1h 5m"
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  const h = m[1] ? `${m[1]}h ` : '';
  const min = m[2] ? `${m[2]}m` : '';
  return `${h}${min}`.trim();
};

export const generateOrderId = () =>
  'FLT' + Date.now().toString(36).toUpperCase();

export const formatDate = (dateStr) => {
  // "2026-05-15" → "Fri, 15 May 2026"
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
};

export const formatTime = (timeStr) => {
  // "10:30" → "10:30 AM"
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
};

export const getAirlineLogo = (iataCode) =>
  `https://pics.avs.io/32/32/${iataCode}.png`;
```

---

## Part 10: Important Notes

- **API Base URL:** Always `https://www.jetsetterss.com/api` — no trailing slash
- **ARC Pay return URL scheme:** Must be `jetsettermobile://` — register in `app.json`
- **AsyncStorage keys:**
  - `pendingFlightBooking` — stored before ARC Pay redirect, cleared after order creation
  - `completedFlightBookings` — array, max 50 items, store on success
- **Auth token:** Attach `Authorization: Bearer {token}` to all `/flights/order`, `/flights/bookings`, and `/payments?action=cancel-booking` calls
- **Passenger required fields:** `firstName`, `lastName`, `mobile`, `dateOfBirth` — validate before payment
- **PNR format:** 3 uppercase letters + 3 digits (e.g. `XYZ789`) — may be mock if Amadeus order fails
- **Booking reference format:** `BOOK-{base36_timestamp}` (e.g. `BOOK-M5KP2Q3R`)
- **Order ID format:** `FLT{base36_timestamp}` (e.g. `FLTM5KP2Q3R`)
- **Currency:** All prices in USD
- **Airline logo fallback:** If `pics.avs.io` fails, show first 2 letters of airline name in `#055B75` circle
- **Stops display:** 0 stops → "Non-stop" badge (green). 1 stop → "1 Stop" badge (amber). 2+ → "2+ Stops" badge (red)
- **Refundable flag:** Show green "Refundable" tag if `refundable: true`, red "Non-refundable" if false
- **Baggage:** Show "✓ {weight}KG checked" from `baggageDetails.checked.weight`. If null, show "Cabin only"
