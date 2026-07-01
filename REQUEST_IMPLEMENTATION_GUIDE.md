# Request Page — Android Implementation Guide

## Overview
The Request page has 3 tabs:
1. **New Inquiry** — submit a travel inquiry (flight/hotel/cruise/package/general)
2. **Modify Booking** — redirects user to contact support (no form, just a message + email link)
3. **Cancel Booking** — cancel an existing booking by reference number

API base URL: `https://www.jetsetterss.com/api`

---

## Part 1: Screen Structure

Single screen `RequestScreen.js` with tab navigation at the top.

```
RequestScreen
├── Header (gradient banner)
├── Tab Bar: [New Inquiry] [Modify Booking] [Cancel Booking]
└── Tab Content (scrollable)
    ├── Tab 1 (inquiry): type selector + dynamic form + submit
    ├── Tab 2 (modify): info card + contact support button
    └── Tab 3 (cancel): booking ref form + result display
```

---

## Part 2: API Endpoints

### 2.1 Submit Inquiry
```
POST https://www.jetsetterss.com/api/inquiries
Content-Type: application/json
Authorization: Bearer {token}   ← optional, omit for guests

Body (flight inquiry example):
{
  "inquiry_type": "flight",
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "customer_phone": "+91 9876543210",
  "customer_country": "India",
  "special_requirements": "Vegetarian meal",
  "budget_range": "moderate",
  "preferred_contact_method": "email",
  "flight_origin": "New York (JFK)",
  "flight_destination": "London (LHR)",
  "flight_departure_date": "2026-06-15",
  "flight_return_date": "2026-06-25",
  "flight_passengers": 2,
  "flight_class": "economy"
}
```

Response (success):
```json
{
  "success": true,
  "message": "Your inquiry has been submitted successfully! Our travel experts will get back to you within 24 hours.",
  "data": { "id": "uuid", "status": "pending", ... }
}
```

Response (error):
```json
{ "success": false, "message": "Email address is required" }
```

### 2.2 Cancel Booking
```
POST https://www.jetsetterss.com/api/payments?action=cancel-booking
Content-Type: application/json
Authorization: Bearer {token}   ← optional

Body:
{
  "bookingReference": "BOOK-m5kp2q3r",
  "reason": "Change of plans"
}
```

Response (success):
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "booking": {
    "reference": "BOOK-m5kp2q3r",
    "refundAmount": "249.00",
    "paymentAction": "REFUND"
  }
}
```

Response (error):
```json
{ "success": false, "error": "Booking not found or already cancelled" }
```

### 2.3 Get My Inquiries (for profile/history)
```
GET https://www.jetsetterss.com/api/inquiries/my
Authorization: Bearer {token}   ← required
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "inquiry_type": "flight",
      "status": "pending",
      "customer_name": "John Doe",
      "flight_origin": "JFK",
      "flight_destination": "LHR",
      "created_at": "2026-05-15T10:30:00Z",
      "quotes": []
    }
  ]
}
```

---

## Part 3: Form Fields Reference

### Common Fields (shown on all inquiry types)

| Field | Type | Required | Placeholder |
|-------|------|----------|-------------|
| customer_name | TextInput | Yes | "Enter your full name" |
| customer_email | TextInput (email) | Yes | "your.email@example.com" |
| customer_phone | TextInput (phone) | Yes | "+(877) 538-7380" |
| customer_country | TextInput | No | "Your country" |

### Additional Fields (shown below type-specific form)

| Field | Type | Options |
|-------|------|---------|
| budget_range | Picker | "", "budget" ($1k-$2.5k), "moderate" ($2.5k-$5k), "luxury" ($5k-$10k), "ultra_luxury" ($10k+) |
| preferred_contact_method | Radio | "email", "phone", "whatsapp" |
| special_requirements | TextInput multiline | "Any dietary restrictions, accessibility needs, etc." |

### Flight-Specific Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| flight_origin | TextInput | Yes | "e.g., New York (JFK)" |
| flight_destination | TextInput | Yes | "e.g., London (LHR)" |
| flight_departure_date | DatePicker | Yes | min: today |
| flight_return_date | DatePicker | No | min: departure date |
| flight_passengers | Picker | Yes | 1–10 |
| flight_class | Picker | No | economy, premium_economy, business, first |

### Hotel-Specific Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| hotel_destination | TextInput | Yes | "e.g., Paris, France" |
| hotel_checkin_date | DatePicker | Yes | min: today |
| hotel_checkout_date | DatePicker | Yes | min: checkin date |
| hotel_rooms | Picker | Yes | 1–5 |
| hotel_guests | Picker | Yes | 1–10 |
| hotel_room_type | Picker | No | "", standard, deluxe, suite, executive |

### Cruise-Specific Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| cruise_destination | TextInput | Yes | "e.g., Caribbean, Mediterranean" |
| cruise_departure_date | DatePicker | Yes | min: today |
| cruise_duration | Picker | Yes | 3,4,5,6,7,8,9,10,11,12,13,14,21 days |
| cruise_passengers | Picker | Yes | 1–6 |
| cruise_cabin_type | Picker | No | "", inside, oceanview, balcony, suite |

### Package-Specific Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| package_destination | TextInput | Yes | "e.g., Hawaii, Europe" |
| package_start_date | DatePicker | Yes | min: today |
| package_end_date | DatePicker | Yes | min: start date |
| package_travelers | Picker | Yes | 1–10 |
| package_budget_range | Picker | No | same options as budget_range |
| package_interests | Multi-select checkboxes | No | Adventure, Culture, Relaxation, Food & Wine, Shopping, Wildlife, History, Beach |

### General Inquiry Fields

| Field | Type | Required |
|-------|------|----------|
| inquiry_subject | TextInput | Yes |
| inquiry_message | TextInput multiline (6 rows) | Yes |

### Cancel Booking Fields

| Field | Type | Required | Placeholder |
|-------|------|----------|-------------|
| bookingReference | TextInput | Yes | "e.g. BOOK-m5kp2q3r" |
| cancelEmail | TextInput (email) | No | "Email used when booking" |
| cancelReason | Picker | No | "Change of plans", "Found a better deal", "Schedule conflict", "Personal reasons", "Medical emergency", "Other" |

---

## Part 4: Validation Rules

### Common (always validated)
- `customer_name` — required, not empty
- `customer_email` — required, valid email format (`/\S+@\S+\.\S+/`)
- `customer_phone` — required, not empty

### Per inquiry type
- **flight**: `flight_origin`, `flight_destination`, `flight_departure_date` required; `flight_passengers >= 1`
- **hotel**: `hotel_destination`, `hotel_checkin_date`, `hotel_checkout_date` required; `hotel_rooms >= 1`, `hotel_guests >= 1`
- **cruise**: `cruise_destination`, `cruise_departure_date` required; `cruise_duration >= 1`, `cruise_passengers >= 1`
- **package**: `package_destination`, `package_start_date`, `package_end_date` required; `package_travelers >= 1`
- **general**: `inquiry_subject`, `inquiry_message` both required

### Cancel booking
- `bookingReference` — required, not empty

---

## Part 5: Service File

Create `src/services/requestService.js`:

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://www.jetsetterss.com/api';

const getAuthHeader = async () => {
  const token = await AsyncStorage.getItem('userToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const requestService = {
  submitInquiry: async (inquiryData) => {
    const headers = await getAuthHeader();
    const res = await fetch(`${BASE_URL}/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(inquiryData),
    });
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Server error: ${res.status}`);
    }
  },

  cancelBooking: async (bookingReference, email, reason) => {
    const headers = await getAuthHeader();
    const res = await fetch(`${BASE_URL}/payments?action=cancel-booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ bookingReference, reason }),
    });
    return res.json();
  },

  getMyInquiries: async () => {
    const headers = await getAuthHeader();
    const res = await fetch(`${BASE_URL}/inquiries/my`, { headers });
    const data = await res.json();
    return data.success ? data.data : [];
  },
};

export default requestService;
```

---

## Part 6: UI/UX Design Specifications

### Colors
```javascript
const THEME = {
  primary: '#055B75',       // header gradient start, section headings
  primaryDark: '#034457',   // header gradient end
  accent: '#0066b2',        // active tab, active type card, submit button, input focus
  accentHover: '#005091',   // submit button hover
  pageBg: '#F9FAFB',        // page background
  cardBg: '#FFFFFF',
  border: '#E5E7EB',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  error: '#EF4444',
  success: '#10B981',
  dangerBtn: '#DC2626',     // cancel booking button
};
```

### Header Banner
- Background: Linear gradient `#055B75 → #034457`
- Background image overlay: airplane photo, `opacity: 0.1`
- Padding: vertical 64px
- Title: "Start Your Journey" — white, bold, 28px
- Subtitle: "Tell us about your dream trip…" — `#BFDBFE` (blue-100), 16px, light weight

### Tab Bar
- White background, bottom border `#F3F4F6`
- Tab item: `paddingHorizontal: 20, paddingVertical: 16`
- Icon + label side by side (4px gap)
- **Active:** `#0066b2` text + 2px bottom border `#0066b2` + `#EFF6FF` bg tint
- **Inactive:** `#6B7280` text

Tab icons (Ionicons):
- New Inquiry → `send-outline`
- Modify Booking → `refresh-outline`
- Cancel Booking → `checkmark-circle-outline`

### Inquiry Type Selector (Tab 1)
- Row of 5 cards: Flights, Hotels, Cruises, Packages, General
- Card: `borderRadius: 12, padding: 16, alignItems: 'center'`
- **Active:** `borderWidth: 2, borderColor: '#0066b2', backgroundColor: '#EFF6FF'` + `scale(1.05)` transform
- **Inactive:** `borderWidth: 2, borderColor: 'transparent', backgroundColor: '#F9FAFB'`
- Icon: 32px, active `#0066b2`, inactive `#9CA3AF`
- Label: 12px semibold below icon

Icons:
- Flights → `Ionicons airplane-outline`
- Hotels → `Ionicons bed-outline`
- Cruises → `FontAwesome5 ship`
- Packages → `Ionicons gift-outline`
- General → `Ionicons chatbubble-ellipses-outline`

### Section Cards (form sections)
```javascript
{
  backgroundColor: '#FFFFFF',
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#F3F4F6',
  padding: 20,
  marginBottom: 16,
  elevation: 2,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius: 4,
}
```

Section heading: `#055B75`, bold 18px, with icon on the left (20px, same color)

### Input Fields
```javascript
{
  borderWidth: 1,
  borderColor: '#E5E7EB',
  borderRadius: 8,
  paddingHorizontal: 16,
  paddingVertical: 12,
  fontSize: 14,
  color: '#1F2937',
  backgroundColor: '#FFFFFF',
}
// focused:
{ borderColor: '#0066b2', borderWidth: 2 }
// error:
{ borderColor: '#EF4444', borderWidth: 1 }
```

Label: 12px semibold `#374151` above field
Error text: 12px `#EF4444` below field
Required asterisk: `#EF4444`

### Package Interests (multi-select chips)
- 2-column grid of toggle chips
- Each chip: `borderRadius: 8, borderWidth: 1, padding: 12`
- **Selected:** `borderColor: '#0066b2', backgroundColor: '#EFF6FF'`, text `#0066b2`
- **Unselected:** `borderColor: '#E5E7EB', backgroundColor: '#FFFFFF'`, text `#6B7280`
- Options: Adventure, Culture, Relaxation, Food & Wine, Shopping, Wildlife, History, Beach

### Preferred Contact Method (radio row)
- 3 radio buttons horizontally: Email, Phone, WhatsApp
- Active radio: `#0066b2`

### Action Buttons
**Submit Request:**
```javascript
{
  backgroundColor: '#0066b2',
  paddingHorizontal: 32,
  paddingVertical: 16,
  borderRadius: 12,
  // shadow:
  elevation: 4,
  shadowColor: '#0066b2',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
}
// text: white, 16px bold
// disabled: opacity 0.7
// with Send icon (Ionicons send) left of text
// loading state: ActivityIndicator instead of icon
```

**Clear Form:**
```javascript
{
  backgroundColor: '#F3F4F6',
  paddingHorizontal: 32,
  paddingVertical: 16,
  borderRadius: 12,
}
// text: #4B5563, 14px semibold
```

### Cancel Booking Tab

**Form card:** same section card style, `maxWidth: 480`

**Cancel Result (success):**
```javascript
{
  backgroundColor: '#F0FDF4',
  borderWidth: 1,
  borderColor: '#BBF7D0',
  borderRadius: 8,
  padding: 16,
  marginBottom: 20,
}
// CheckCircle icon: #10B981, 20px
// Heading: #166534, semibold 14px
// Refund amount: #15803D, 13px
```

**Cancel Result (failure):**
```javascript
{
  backgroundColor: '#FEF2F2',
  borderWidth: 1,
  borderColor: '#FECACA',
  borderRadius: 8,
  padding: 16,
}
// AlertCircle icon: #EF4444
// Heading: #991B1B
// Message: #B91C1C
```

**Cancel Booking button:**
```javascript
{
  backgroundColor: '#DC2626',
  paddingHorizontal: 32,
  paddingVertical: 16,
  borderRadius: 12,
}
// text: white, 14px semibold
// disabled: opacity 0.5 (when ref is empty or loading)
// refresh icon (Ionicons refresh-outline) left of text
```

### Modify Booking Tab (info screen only)
- Centered layout, 80px vertical padding
- Gray circle bg `#F3F4F6` with `refresh` icon 48px `#9CA3AF`
- Heading: "Modify Booking" bold 22px `#1F2937`
- Body text: max width 320px, centered, `#6B7280`
- **Contact Support button:** `backgroundColor: '#055B75'`, white text, `borderRadius: 8`, `paddingHorizontal: 24, paddingVertical: 12`
- Links to: `mailto:support@jetsetterss.com`

---

## Part 7: Auto-fill Behavior

If user is logged in, pre-fill on screen mount:
```javascript
// From AsyncStorage after login
const user = await AsyncStorage.getItem('userProfile');
if (user) {
  const parsed = JSON.parse(user);
  setFormData(prev => ({
    ...prev,
    customer_name: parsed.full_name || parsed.name || '',
    customer_email: parsed.email || '',
    customer_phone: parsed.phone || '',
  }));
}
```

---

## Part 8: Success Handling

After successful inquiry submission:
- Show a success Alert: "Your inquiry has been submitted successfully! Our travel experts will get back to you within 24 hours."
- Clear the form (reset all fields to defaults)
- Optionally navigate to a "My Inquiries" tab in profile

Default form state:
```javascript
const DEFAULT_FORM = {
  customer_name: '', customer_email: '', customer_phone: '',
  customer_country: '', special_requirements: '', budget_range: '',
  preferred_contact_method: 'email',
  flight_origin: '', flight_destination: '',
  flight_departure_date: '', flight_return_date: '',
  flight_passengers: 1, flight_class: 'economy',
  hotel_destination: '', hotel_checkin_date: '',
  hotel_checkout_date: '', hotel_rooms: 1,
  hotel_guests: 1, hotel_room_type: '',
  cruise_destination: '', cruise_departure_date: '',
  cruise_duration: 7, cruise_cabin_type: '', cruise_passengers: 1,
  package_destination: '', package_start_date: '',
  package_end_date: '', package_travelers: 1,
  package_budget_range: '', package_interests: [],
  inquiry_subject: '', inquiry_message: '',
};
```

---

## Part 9: Files to Create

```
src/screens/request/RequestScreen.js
src/screens/request/styles/RequestScreen.styles.js
src/services/requestService.js
```

Modify:
```
src/navigation/AppNavigator.js  ← add RequestScreen to bottom tabs or stack
```

---

## Part 10: Important Notes

- `POST /api/inquiries` works for both authenticated and guest users — attach token if available but don't block unauthenticated submissions
- The `inquiry_type` field determines which type-specific fields to include in the request body — only send fields relevant to the selected type
- `package_interests` is an array: `["Adventure", "Culture"]` — send as JSON array
- `preferred_contact_method` values: `"email"` | `"phone"` | `"whatsapp"` (lowercase)
- `flight_class` values: `"economy"` | `"premium_economy"` | `"business"` | `"first"` (lowercase)
- Cancel booking reference format: `BOOK-{base36}` (e.g., `BOOK-m5kp2q3r`) — from flight/cruise booking confirmation
- The Modify Booking tab has no form — it only shows a contact support message and email link
- Budget range values: `"budget"` | `"moderate"` | `"luxury"` | `"ultra_luxury"` (general) or `"ultra"` (package)
