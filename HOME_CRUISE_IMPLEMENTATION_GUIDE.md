# Home Page & Cruise Page — Android Implementation Guide

## Overview
This guide covers implementing/upgrading the **Home Screen** and **Cruise Flow** for the Jetsetter Android app (React Native / Expo). All data comes from the same backend API at `https://www.jetsetterss.com/api`.

---

## Part 1: Home Screen

### Existing File
`src/screens/home/HomeScreen.js` — already exists. This guide covers the **API-integrated** version.

### UI Sections (top to bottom)

| # | Section | Description |
|---|---------|-------------|
| 1 | Special Offer Banner | "$50 OFF" badge, phone number CTA |
| 2 | Hero Section | Background image, "Find Your Perfect Flight" heading |
| 3 | Flight Search Form | From/To airport autocomplete, dates, travelers, class |
| 4 | Popular Destinations | 8-card grid from live trending API |
| 5 | Cheapest Flights | 3-6 cards with live prices from Amadeus |
| 6 | Why Choose JetSetters | 3 feature cards (Best Price, Secure Booking, 24/7 Support) |
| 7 | Subscribe Section | Email newsletter form |

### API Endpoints Used

#### 1. Airport Search (autocomplete)
```
POST /api/airports/search
Body: { "keyword": "New Y", "limit": 10 }
Response: {
  "success": true,
  "data": [
    { "name": "New York John F Kennedy", "code": "JFK", "country": "US", "type": "AIRPORT" },
    { "name": "Newark Liberty International", "code": "EWR", "country": "US", "type": "AIRPORT" }
  ]
}
```

#### 2. Flight Search
```
POST /api/flights/search
Body: {
  "from": "JFK",
  "to": "LAX",
  "departDate": "2026-05-15",
  "returnDate": "2026-05-22",
  "tripType": "roundTrip",
  "travelers": "1",
  "travelClass": "ECONOMY",
  "fromCode": "JFK",
  "toCode": "LAX"
}
Response: {
  "success": true,
  "data": [
    {
      "id": "1",
      "airline": "American Airlines",
      "airlineCode": "AA",
      "flightNumber": "AA 100",
      "departure": { "airport": "JFK", "terminal": "8", "time": "08:00" },
      "arrival": { "airport": "LAX", "terminal": "4", "time": "11:30" },
      "duration": "5h 30m",
      "stops": 0,
      "price": { "total": "245.00", "currency": "USD" },
      "cabinClass": "ECONOMY",
      "seatsAvailable": 9
    }
  ],
  "meta": { "resultCount": 25, "totalResults": 25 }
}
```

#### 3. Most Booked Destinations (Popular/Trending)
```
GET /api/flights/analytics/booked?origin=JFK
Response: {
  "success": true,
  "data": [
    { "destination": "MIA", "subType": "POINT_OF_INTEREST", "flightScore": 98, "travelerScore": 95 },
    { "destination": "LAX", "subType": "POINT_OF_INTEREST", "flightScore": 92, "travelerScore": 88 }
  ]
}
```
Frontend maps IATA codes to city names using local airports data.

#### 4. Cheapest Flight Dates
```
GET /api/flights/cheapest-dates?origin=JFK&destination=MIA&oneWay=true&departureDate=2026-05-01
Response: {
  "success": true,
  "data": [
    { "departureDate": "2026-05-03", "price": { "total": "89.00", "currency": "USD" } },
    { "departureDate": "2026-05-10", "price": { "total": "95.00", "currency": "USD" } }
  ]
}
```
Call in batches of 2 destinations with 300ms delay to avoid rate limits. Reduce to find cheapest per destination.

#### 5. Geo Location (auto-detect user city)
```
GET /api/geo/location
Response: { "country_name": "United States", "country_code": "US", "city": "New York", "currency": "USD" }
```
Map city → nearest IATA code using local airport data.

### Home Screen Service File

**Location:** `src/services/homeService.js`

```javascript
import axios from 'axios';
import { API_CONFIG } from '../constants/config';

const BASE = API_CONFIG.BASE_URL;

const homeService = {
  async searchAirports(keyword) {
    const { data } = await axios.post(`${BASE}/airports/search`, { keyword, limit: 10 });
    return data;
  },

  async searchFlights(searchParams) {
    const { data } = await axios.post(`${BASE}/flights/search`, searchParams, { timeout: 15000 });
    return data;
  },

  async getMostBookedDestinations(origin) {
    const { data } = await axios.get(`${BASE}/flights/analytics/booked`, { params: { origin } });
    return data;
  },

  async getCheapestDates(origin, destination) {
    const departureDate = new Date();
    departureDate.setDate(departureDate.getDate() + 7);
    const dateStr = departureDate.toISOString().split('T')[0];
    const { data } = await axios.get(`${BASE}/flights/cheapest-dates`, {
      params: { origin, destination, oneWay: true, departureDate: dateStr }
    });
    return data;
  },

  async getGeoLocation() {
    try {
      const { data } = await axios.get(`${BASE}/geo/location`);
      return data;
    } catch {
      return { city: 'New York', country_code: 'US', currency: 'USD' };
    }
  },
};

export default homeService;
```

### Navigation from Home Screen

```
HomeScreen (Tab)
  → FlightSearchScreen (on search submit, pass searchData + apiResponse)
  → FlightSearchScreen (on "Explore More" tap, pass default origin)
  → FlightSearchScreen (on Popular Destination card tap, pass origin + destination)
  → FlightSearchScreen (on Cheapest Flight "Book" tap, pass origin + destination)
  → CruiseHomeScreen (on "Cruises" section tap or bottom tab)
```

---

## Part 2: Cruise Flow

### Existing Files
All screens already exist at `src/screens/booking/Cruise*.js`. This guide covers the **correct API integration**.

### Screen Flow

```
CruiseHomeScreen (Tab or navigate from Home)
  → CruiseResultsScreen (search/filter results)
    → CruiseDetailsScreen (itinerary, amenities, cabin types)
      → CruiseBookingScreen (passenger form + pricing)
        → ARC Pay Hosted Checkout (external browser/WebView)
          → CruiseConfirmationScreen (boarding pass)
```

### API Endpoints Used

#### 1. Get All Cruises
```
GET /api/cruises
Response: {
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Caribbean Paradise",
      "cruise_line": "Royal Caribbean",
      "ship": "Symphony of the Seas",
      "duration": 7,
      "departure_port": "Miami, FL",
      "destinations": ["Cozumel", "Jamaica", "Bahamas"],
      "departure_date": "2024-07-15",
      "return_date": "2024-07-22",
      "price_per_person": 899,
      "image": "https://images.unsplash.com/...",
      "description": "Experience the ultimate Caribbean cruise...",
      "amenities": ["Pool deck", "Spa", "Fine dining", "Casino", "Theater"],
      "cabin_types": [
        { "type": "Interior", "price": 899 },
        { "type": "Ocean View", "price": 1199 },
        { "type": "Balcony", "price": 1599 },
        { "type": "Suite", "price": 2499 }
      ]
    }
  ],
  "total": 3
}
```
The app also has local fallback data in `src/data/cruiselines.json` with richer details (itinerary, highlights, reviews).

#### 2. Check Payment Gateway Status
```
GET /api/payments?action=gateway-status
Response: { "success": true, "gateway": "active", "message": "Gateway is operational" }
```

#### 3. Create Hosted Checkout (ARC Pay)
```
POST /api/payments?action=hosted-checkout
Body: {
  "amount": 419.00,
  "currency": "USD",
  "orderId": "CRZ1ABC2DEF3",
  "bookingType": "cruise",
  "returnUrl": "jetsetters://payment/callback?orderId=CRZ1ABC2DEF3&bookingType=cruise",
  "cancelUrl": "jetsetters://cruise-booking",
  "bookingData": {
    "cruiseName": "Royal Caribbean",
    "duration": "7 Nights",
    "departure": "Miami",
    "totalAmount": 419
  }
}
Response: {
  "success": true,
  "sessionId": "SESSION_ABC123",
  "checkoutUrl": "https://na.gateway.mastercard.com/checkout/pay/SESSION_ABC123",
  "orderId": "CRZ1ABC2DEF3"
}
```
For mobile: open `checkoutUrl` in a WebView or `Linking.openURL()`. On return, verify payment.

#### 4. Verify Payment
```
GET /api/payments?action=payment-verify&orderId=CRZ1ABC2DEF3
Response: {
  "success": true,
  "status": "CAPTURED",
  "orderId": "CRZ1ABC2DEF3",
  "amount": 419.00,
  "currency": "USD"
}
```

#### 5. Save Cruise Booking
```
POST /api/cruises/bookings
Body: {
  "orderId": "CRZ1ABC2DEF3",
  "cruiseName": "Royal Caribbean",
  "cruiseImage": "https://...",
  "duration": "7 Nights",
  "departure": "Miami, FL",
  "arrival": "Caribbean",
  "departureDate": "Jul 15, 2026",
  "returnDate": "Jul 22, 2026",
  "basePrice": 899,
  "taxesAndFees": 150,
  "portCharges": 200,
  "totalAmount": 1249,
  "passengerDetails": {
    "adults": [{ "firstName": "John", "lastName": "Doe", "age": "35", "nationality": "US" }],
    "children": []
  },
  "transactionId": "TXN_123",
  "sessionId": "SESSION_ABC123",
  "userId": "uuid-or-null"
}
Response: {
  "success": true,
  "data": {
    "id": 1,
    "orderId": "CRZ1ABC2DEF3",
    "bookingReference": "CRZ1ABC2DEF3",
    "status": "confirmed"
  }
}
```

#### 6. Validate Coupon (optional, on booking screen)
```
POST /api/coupons/validate
Body: { "code": "CRUISE20", "bookingType": "cruises", "amount": 1249 }
Response: {
  "success": true,
  "coupon": { "code": "CRUISE20", "discount_type": "percentage", "discount_value": 20, "max_discount": 200 },
  "discount": 200,
  "finalAmount": 1049
}
```

### Cruise Service File

**Location:** `src/services/CruiseApiService.js` (already exists, update to match)

```javascript
import axios from 'axios';
import { API_CONFIG } from '../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE = API_CONFIG.BASE_URL;

const CruiseApiService = {
  async getAllCruises() {
    const { data } = await axios.get(`${BASE}/cruises`);
    return data;
  },

  async checkGatewayStatus() {
    const { data } = await axios.get(`${BASE}/payments`, { params: { action: 'gateway-status' } });
    return data;
  },

  async createHostedCheckout(paymentData) {
    const { data } = await axios.post(`${BASE}/payments`, {
      ...paymentData,
      action: 'hosted-checkout',
    });
    return data;
  },

  async verifyPayment(orderId) {
    const { data } = await axios.get(`${BASE}/payments`, {
      params: { action: 'payment-verify', orderId }
    });
    return data;
  },

  async saveBooking(bookingData) {
    const { data } = await axios.post(`${BASE}/cruises/bookings`, bookingData);
    return data;
  },

  async validateCoupon(code, bookingType, amount) {
    const { data } = await axios.post(`${BASE}/coupons/validate`, { code, bookingType, amount });
    return data;
  },

  generateOrderId() {
    return 'CRZ' + Date.now().toString(36).toUpperCase();
  },

  async storePendingBooking(booking) {
    await AsyncStorage.setItem('pendingCruiseBooking', JSON.stringify(booking));
  },

  async getPendingBooking() {
    const raw = await AsyncStorage.getItem('pendingCruiseBooking');
    return raw ? JSON.parse(raw) : null;
  },

  async clearPendingBooking() {
    await AsyncStorage.removeItem('pendingCruiseBooking');
  },
};

export default CruiseApiService;
```

### Cruise Data Structure (from local `cruiselines.json`)

Each cruise line object has:
```json
{
  "id": 1,
  "name": "Royal Caribbean",
  "logo": "/cruise/logos/royal-caribbean.png",
  "image": "https://...",
  "price": "From $69",
  "priceValue": 69,
  "duration": "7 Nights",
  "description": "Caribbean & Bahamas Cruises",
  "rating": 4.7,
  "reviews": 3245,
  "destinations": ["Caribbean", "Bahamas", "Mexico"],
  "departurePorts": ["Miami", "Fort Lauderdale"],
  "amenities": ["Waterslides", "Rock Climbing", "Surf Simulator"],
  "popular": true,
  "ships": ["Wonder of the Seas", "Icon of the Seas"],
  "departureDate": "Jan 13th",
  "returnDate": "Jan 17th",
  "itinerary": [
    { "day": 1, "port": "Miami", "subtitle": "Departure", "arrival": "4:00 PM", "description": "Board the ship...", "activities": ["Welcome party", "Ship tour"] },
    { "day": 2, "port": "At Sea", "subtitle": "Fun Day", "arrival": "", "description": "Enjoy onboard...", "activities": ["Pool", "Spa"] },
    { "day": 3, "port": "Cozumel", "subtitle": "Mexico", "arrival": "8:00 AM", "description": "Explore...", "activities": ["Snorkeling", "Shopping"] }
  ],
  "cabin_types": [
    { "type": "Interior", "price": 69 },
    { "type": "Ocean View", "price": 99 },
    { "type": "Balcony", "price": 149 },
    { "type": "Suite", "price": 249 }
  ],
  "highlights": [{ "title": "Perfect Day at CocoCay", "img": "https://..." }]
}
```

### Booking Summary Pricing Breakdown

```
Base Price (cabin_type.price × passengers)  = $899
Taxes & Fees (flat $150)                    = $150
Port Charges (flat $200)                    = $200
Coupon Discount                             = -$0
─────────────────────────────────────────────
Total                                       = $1,249
```

### Payment Flow (Mobile)

1. User fills passenger details on `CruiseBookingScreen`
2. App calls `CruiseApiService.checkGatewayStatus()`
3. App generates `orderId` with `CruiseApiService.generateOrderId()`
4. App stores booking in `AsyncStorage` via `storePendingBooking()`
5. App calls `CruiseApiService.createHostedCheckout()` with:
   - `returnUrl`: deep link like `jetsetters://payment/callback?orderId=X&bookingType=cruise`
   - Or a web URL your app intercepts
6. App opens `checkoutUrl` via `Linking.openURL()` or in-app WebView
7. After payment, user returns to app
8. App calls `CruiseApiService.verifyPayment(orderId)`
9. If verified, calls `CruiseApiService.saveBooking()` with full booking data
10. Navigate to `CruiseConfirmationScreen` with booking reference

### Navigation Setup

Add to `AppNavigator.js`:
```javascript
<Stack.Screen name="CruiseHome" component={CruiseHomeScreen} />
<Stack.Screen name="CruiseResults" component={CruiseResultsScreen} />
<Stack.Screen name="CruiseDetails" component={CruiseDetailsScreen} />
<Stack.Screen name="CruiseBooking" component={CruiseBookingScreen} />
<Stack.Screen name="CruiseConfirmation" component={CruiseConfirmationScreen} />
```

---

## Part 3: Callback/Contact Service

Both Home and Cruise pages use a callback request feature:

```
POST {BASE_URL}/send-email
Body: {
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "type": "cruise",
  "details": {
    "preferredTime": "Morning",
    "message": "Interested in Caribbean cruise"
  }
}
Response: { "success": true, "message": "Emails sent to: customer, admin" }
```

Also saves to Supabase `callback_requests` table directly if user is logged in.

---

## Files to Create/Modify

### New Files:
1. `src/services/homeService.js` — Home screen API service

### Files to Update:
1. `src/screens/home/HomeScreen.js` — Integrate live API for popular destinations + cheapest flights
2. `src/services/CruiseApiService.js` — Update to match endpoints above
3. `src/screens/booking/CruiseHomeScreen.js` — Use API data + local fallback
4. `src/screens/booking/CruiseBookingScreen.js` — Wire up ARC Pay hosted checkout
5. `src/screens/booking/CruiseConfirmationScreen.js` — Show booking reference from API
6. `src/navigation/AppNavigator.js` — Ensure all cruise screens are in stack

### No Changes Needed:
- `src/constants/config.js` — BASE_URL already correct
- `src/data/cruiselines.json` — Used as fallback data
- `src/data/destinations.json` — Used for cruise destination cards

---

## Important Notes

- **Base URL:** `https://www.jetsetterss.com/api` (already in `config.js`)
- **No mock data** — All screens must use real API calls with fallback to local JSON data only when API fails
- **ARC Pay:** For mobile, use `Linking.openURL(checkoutUrl)` or an in-app WebView. Handle return via deep linking
- **Order ID format:** Cruise bookings use `CRZ` + `Date.now().toString(36).toUpperCase()`
- **Supabase:** Direct insert for `callback_requests` table; booking saves go through the backend API
- **Rate limiting:** When calling cheapest-dates API, batch 2 destinations at a time with 300ms delay
- **Timeout:** Set 15s timeout on flight search, 30s on payment operations
- **Currency:** All prices in USD

---

## Part 4: UI/UX Design Specifications

### Color Palette

| Token | Hex | Usage |
|---|---|---|
| Primary | `#055B75` | Buttons, headings, badges, icons, links, CTAs |
| Primary Dark | `#034457` | Gradient endpoints, dark sections |
| Primary Hover | `#044A5F` | Button hover states |
| Accent Blue | `#0099CC` | Secondary button gradients |
| Bright Blue | `#0d99ff` | Cruise line accent, ship icons |
| Light Blue Accent | `#65B3CF` | IATA codes, star icons, subscribe accents |
| Light Teal BG | `#E0F7FA` | Tag badges, feature icon backgrounds |
| Page BG Teal | `#F0FAFC` | Section backgrounds |
| Card BG Blue | `#B9D0DC` | Cheapest flights container |
| CTA Blue | `#0066FF` | $50 OFF badge |
| Trending Gradient | `#FF6B6B → #FF8E53` | Trending badge |
| Green Success | `#10b981` / `#059669` | Success states, confirmed badges |
| Amber/Yellow | `#FFD700` | Star ratings |
| Navy Dark | `#0c1e30` | Booking success page bg |
| Text Primary | `#1a202c` / `gray-900` | Main headings |
| Text Secondary | `gray-800` | Card headings |
| Text Body | `gray-600` | Body text |
| Text Muted | `gray-500` | Metadata, dates, placeholders |
| Error | `#EF4444` | Form validation |

### React Native Color Constants
```javascript
const THEME = {
  primary: '#055B75',
  primaryDark: '#034457',
  primaryHover: '#044A5F',
  accentBlue: '#0099CC',
  brightBlue: '#0d99ff',
  lightBlue: '#65B3CF',
  lightTealBg: '#E0F7FA',
  pageBg: '#F0FAFC',
  cardBg: '#B9D0DC',
  trendingStart: '#FF6B6B',
  trendingEnd: '#FF8E53',
  success: '#10b981',
  successDark: '#059669',
  starYellow: '#FFD700',
  navyDark: '#0c1e30',
  textPrimary: '#1a202c',
  textSecondary: '#374151',
  textBody: '#4b5563',
  textMuted: '#6b7280',
  textLight: '#9ca3af',
  error: '#EF4444',
  white: '#FFFFFF',
  border: '#e5e7eb',
};
```

---

### Home Screen UI/UX

#### Section 1: Special Offer Banner
- **Background**: Linear gradient `#055B75 → #034457`
- **Height**: ~40px
- **Text**: White, 12px, medium weight
- **Highlights**: Yellow (#FCD34D) for phone/email
- **"$50 OFF" badge**: Blue (#0066FF) pill with bold white text

#### Section 2: Hero Section
- **Background**: Full-width airplane/sky image with white overlay gradient
- **Heading**: Bold, 28-36px (mobile), color `gray-900`, accent word in `#055B75`
- **Subtitle**: 16px, `gray-600`, below heading
- **Search form overlays the hero**

#### Section 3: Flight Search Form
- **Container**: White card, rounded-xl (12px radius), shadow-md, padding 16px
- **Trip type toggle**: Pill shape with 2 segments — active: `#055B75` bg white text, inactive: gray-100 bg
- **Fields layout (mobile)**: Stack vertically
- **Fields layout (tablet+)**: 2-column grid

| Field | Type | Placeholder | Icon |
|---|---|---|---|
| From | TextInput + autocomplete | "Departure city" | MapPin (right) |
| To | TextInput + autocomplete | "Destination city" | MapPin (right) |
| Depart Date | Date picker | "dd/mm/yyyy" | Calendar (right) |
| Return Date | Date picker (round trip only) | "dd/mm/yyyy" | Calendar (right) |
| Travelers | Picker/Select | "1 Traveler" | Users (right) |
| Class | Picker/Select | "Economy" | ChevronDown (right) |

- **Input style**: Border 1px `#e5e7eb`, rounded-md (8px), padding 12px, font 14px
- **Focus**: 2px ring `#055B75`
- **Search button**: `#055B75` bg, white text, bold, 48px height, full width on mobile
- **Special fares row**: Pill buttons — "Student", "Senior Citizen", "Armed Forces"
  - Active: `#055B75` bg, white text
  - Inactive: White bg, `#055B75` border + text

#### Autocomplete Dropdown
- White bg, rounded-lg (8px), shadow-xl, max 5 items visible
- Each item: city name bold, IATA code + country muted
- Debounce: 300ms, min 2 chars

#### Section 4: Popular Destinations
- **Section bg**: Gradient white → `#F0FAFC`
- **Header tag**: `#E0F7FA` pill, `#055B75` text, "Explore Popular Destinations"
- **Heading**: Bold 28px, `gray-900`
- **Grid**: 2 columns on mobile, 4 columns on tablet
- **Card**: 160px height, rounded-2xl (16px), overflow hidden, shadow-lg

**Destination Card:**
- Full-bleed image with `scale(1.05)` on press
- Gradient overlay: `from-black/80 via-black/50 to-black/30`
- **Trending badge** (top-left): Orange gradient pill `#FF6B6B → #FF8E53`, "🔥 #1 Trending"
- **"Popular Choice" badge**: `#055B75` bg, white text pill
- **Live dot** (top-right): Green pulsing dot
- **City name** (bottom): White, bold 20px
- **IATA code**: `#65B3CF`, 12px
- **Country/Region**: White/90, 14px
- **"Book Now" micro-button**: `white/20` bg, backdrop blur, white text

#### Section 5: Cheapest Flights
- **Container**: `#B9D0DC` bg, rounded-xl (12px), padding 24px, shadow-lg
- **Header**: "Cheapest Fares From [CITY]" in bold 20px `#055B75`, origin in white pill
- **Live indicator**: Green pulsing dot + "Live" text
- **Grid**: 1 column mobile, 2 tablet, 3 desktop
- **Card**: White bg, rounded-xl, shadow-md, hover lift

**Cheapest Flight Card:**
- Image: 128px height, `scale(1.05)` on hover, gradient overlay
- "Best Price" tag (bottom-right of image): `#055B75/90` bg, white text, bold
- **Destination**: Bold 16px `gray-800`
- **IATA code**: `#65B3CF` 12px
- **Date**: Clock icon + date text in `gray-500` 12px
- **Divider**: 1px `gray-100`
- **Price**: Bold 18px `#055B75`
- **"Book Flight" button**: `#055B75` bg, white text, 12px, rounded-lg, shadow-sm

#### Section 6: Why Choose JetSetters
- **Grid**: 1 col mobile, 3 col tablet
- **Card**: White bg, padding 24px, rounded-2xl (16px), shadow-lg, `gray-100` border
- **Icon**: 64x64 `#E0F7FA` bg, rounded-2xl, `#055B75` icon (32px)
- **Heading**: Bold 18px `gray-800`
- **Body**: 14px `gray-600`
- **3 features**: Best Prices (DollarSign), Secure Booking (Shield), 24/7 Support (Headset)

#### Section 7: Subscribe Section
- **Bg**: Gradient `#034457 → #055B75`
- **Inner card**: Travel background image with teal overlay
- **Left**: White text, "EXCLUSIVE OFFERS" tag in `#65B3CF` pill, heading 28px bold
- **Right**: White form card, email input + checkbox + gradient submit button
- **Submit button**: Gradient `#055B75 → #034457`, white text, bold, 16px, full width
- **Social proof**: Overlapping avatar circles + "2,500+ happy travelers"

---

### Cruise Flow UI/UX

#### CruiseHomeScreen
- **Hero**: Full-bleed cruise ship image, dark overlay
  - Heading: White, bold 36px, text shadow
  - Subtitle: `#0d99ff` gradient text, uppercase, 14px, letter-spacing 2px

**Search Form (on hero):**
- Glass morphism card: `white/15` bg, backdrop blur, rounded-2xl
- Fields: Destination, Cruise Line, Departure Port, Date, Budget Range
- Input style: `white/10` bg, white text, white/50 border
- Search button: `#2563EB` bg, bold white text, full width

**Destination Cards Section:**
- Grid: 2 cols mobile, 3 cols tablet
- Card: 200px, rounded-xl, image + gradient overlay
- Name: White bold 18px
- "From $X" price tag
- Star rating: Yellow stars
- Tags: colored pills at bottom

**Cruise Line Section:**
- Grid: 2 cols mobile, 4 cols tablet
- Card: `#fdf7fa` bg, rounded-xl, logo at top, name, description
- Price: Bold `#0066b2`
- "View Cruises →" link in `#0066b2`

#### CruiseResultsScreen (cruise-cards)
- **Filter bar**: Reads query params (`cruiseLine`, `destination`, etc.)
- **Results count**: "X cruises found"
- **Card layout**: Vertical list, each card:
  - Left: Image 40% width (desktop), full width (mobile)
  - Right: Cruise name (bold 22px), cruise line, duration, ports
  - Rating: Stars `#FFD700`
  - Price: Bold `#0066b2`, "per person" subtitle
  - Amenity icons: Small pills
  - "View Details" button: `#0066b2` bg, white text, rounded

#### CruiseDetailsScreen (Itinerary)
- **Hero**: Ship image, overlay with cruise name + cruise line
- **Tab sections**: Itinerary | Amenities | Cabins | Reviews

**Itinerary Tab:**
- Day-by-day vertical timeline
- Each day: Circle badge (`#1e4799` bg, white "Day N"), port name bold, description, activities list
- Connecting line between days

**Amenities Tab:**
- Grid of icon + label items
- Icons: Pool, Spa, Dining, Casino, Theater, Gym, etc.

**Cabins Tab:**
- Cards for each cabin type: Interior, Ocean View, Balcony, Suite
- Each: Name, price bold `#0066b2`, "per person" label
- Selected state: `#055B75` border, checkmark

**Sticky Footer:**
- Price display: "From $X" bold 24px `#055B75`
- "Book Now" button: Green `#00b894` bg, white text, bold, full width

#### CruiseBookingScreen (Summary)
- **Trip summary card**: Cruise image, name, dates, ports
- **Passenger form**: Adults + Children sections
  - Fields: First Name, Last Name, Age, Nationality
  - Add/remove passenger buttons
- **Pricing breakdown**:
  - Base price × passengers
  - Taxes & Fees: $150
  - Port Charges: $200
  - Coupon discount (if applied)
  - **Total**: Bold 24px `#055B75`
- **Coupon input**: TextInput + "Apply" button
- **"Confirm & Pay" button**: Gradient `#055B75 → #034457`, white text, bold, 56px height, full width

#### CruiseConfirmationScreen (Boarding Pass)
- **Page bg**: Dark navy `#0c1e30`
- **Ticket card**: White bg, rounded-2xl, shadow-2xl

**Ticket Header:**
- Gradient `#055B75 → #034457`, white text
- Ship icon (FaShip), cruise name bold 28px, cruise line 14px
- Decorative wave pattern at bottom

**Route Section:**
- Departure port (left) → Ship icon (center) → Arrival port (right)
- Departure icon: `#055B75` circle, FaShip white
- Arrival icon: Green circle, FaAnchor white
- Dotted line connecting them
- Port names: Bold 18px, dates below in `gray-500`

**Ticket Tear-off Effect:**
- Two half-circles cutting into the card edges (classic boarding pass look)

**Booking Info Grid:**
- 2 cols mobile, 4 cols tablet
- Labels: 10px uppercase, `gray-400`, letter-spacing 2px
- Values: Bold 16px `gray-900`
- Booking ref: Monospace font
- Status badge: Green `#d1fae5` bg, "Confirmed" with checkmark

**Passenger Cards:**
- Grid of cards with avatar circle (initial letter), name, type badge
- Adults: Blue avatar (`#055B75`)
- Children: Orange avatar (`#f59e0b`)

**Payment Summary:**
- Line items: Label left, value right
- Dashed divider before total
- Total: Bold 24px `#055B75`
- "Payment Successful" green box with checkmark

**Action Buttons:**
- "View All Trips": Gradient `#055B75 → #2563eb`, white text, 56px, rounded-2xl
- "Book Another Cruise": Glass effect, white text, bordered
- "Download Ticket": Glass effect + download icon
- "Print Ticket": Glass effect + print icon

---

### Icon Library (React Native equivalents)

Use `@expo/vector-icons` which includes Ionicons, FontAwesome, MaterialIcons:

| Web Icon | React Native Equivalent |
|---|---|
| Lucide `MapPin` | `Ionicons name="location-outline"` |
| Lucide `Calendar` | `Ionicons name="calendar-outline"` |
| Lucide `Users` | `Ionicons name="people-outline"` |
| Lucide `Search` | `Ionicons name="search"` |
| Lucide `ChevronDown` | `Ionicons name="chevron-down"` |
| Lucide `Mail` | `Ionicons name="mail-outline"` |
| Lucide `Phone` | `Ionicons name="call-outline"` |
| Lucide `Clock` | `Ionicons name="time-outline"` |
| Lucide `Check` | `Ionicons name="checkmark-circle"` |
| Lucide `AlertCircle` | `Ionicons name="alert-circle-outline"` |
| FaShip | `FontAwesome5 name="ship"` |
| FaAnchor | `FontAwesome5 name="anchor"` |
| FaStar | `FontAwesome name="star"` |
| FaUser | `FontAwesome5 name="user"` |
| FaCheckCircle | `FontAwesome5 name="check-circle"` |
| FaDownload | `Ionicons name="download-outline"` |
| FaPrint | `Ionicons name="print-outline"` |
| FaCopy | `Ionicons name="copy-outline"` |
| FaCompass | `Ionicons name="compass-outline"` |
| FaSuitcaseRolling | `FontAwesome5 name="suitcase-rolling"` |
| FaDollarSign | `FontAwesome5 name="dollar-sign"` |
| Shield SVG | `Ionicons name="shield-checkmark-outline"` |
| Headset SVG | `Ionicons name="headset-outline"` |

### Typography (React Native)

| Element | fontSize | fontWeight | color |
|---|---|---|---|
| Page heading (H1) | 28-36 | '700' (bold) | `#1a202c` |
| Section heading (H2) | 24-28 | '700' | `#1a202c` |
| Card title | 18-22 | '600' (semibold) | `#374151` |
| Body text | 14-16 | '400' | `#4b5563` |
| Caption/meta | 12 | '500' | `#6b7280` |
| Micro label | 10 | '700' | `#9ca3af` |
| Price large | 20-24 | '800' (extrabold) | `#055B75` |
| Price small | 14-16 | '600' | `#055B75` |
| Button text | 16 | '700' | `#FFFFFF` |
| Input text | 14 | '400' | `#374151` |
| Input placeholder | 14 | '400' | `#9ca3af` |
| Badge text | 12 | '600' | varies |

### Card Design Specs (React Native)

```javascript
const cardStyles = {
  destinationCard: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 200,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  flightCard: {
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cruiseCard: {
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  ticketCard: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
};
```

### Interaction Patterns (React Native)

- **Card press**: `scale(0.98)` with `Animated` spring, then navigate
- **Button press**: `opacity: 0.8` feedback via `TouchableOpacity activeOpacity={0.8}`
- **Image hover equivalent**: Use `Animated` scale 1.05 on press-in
- **Loading states**: `ActivityIndicator color="#055B75"` centered
- **Pull to refresh**: `RefreshControl tintColor="#055B75"`
- **Skeleton loaders**: Animated gradient shimmer (use `expo-linear-gradient` animated)
- **Success animation**: Green checkmark with scale-in animation
- **Form validation**: Red border + red error text below field
