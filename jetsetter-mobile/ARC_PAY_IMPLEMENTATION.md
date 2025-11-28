# ARC Pay Implementation - Jetsetter Mobile App

## ✅ Implementation Complete

The ARC Pay payment system has been fully integrated into the Jetsetter Mobile App using the **Hosted Checkout** flow.

---

## 📁 Files Created/Modified

### New Files Created:

| File | Purpose |
|------|---------|
| `src/services/payment/ArcPaymentService.js` | Core payment service - handles initiation & verification |
| `src/services/payment/index.js` | Service exports |
| `src/screens/payment/ArcPaymentScreen.js` | WebView-based payment screen |
| `src/screens/payment/PaymentSuccessScreen.js` | Payment success confirmation |
| `src/screens/payment/PaymentFailedScreen.js` | Payment failure with retry |
| `src/screens/payment/index.js` | Screen exports |
| `src/utils/useArcPayment.js` | React hook for easy integration |
| `src/components/payment/ArcPayIntegrationExample.js` | Usage examples |

### Modified Files:

| File | Changes |
|------|---------|
| `src/navigation/AppNavigator.js` | Added ArcPayment, PaymentSuccess, PaymentFailed screens |
| `src/constants/config.js` | Added ARC Pay backend URLs |
| `package.json` | Added react-native-webview, @react-native-community/netinfo |

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd jetsetter-mobile
npm install
# or
yarn install
```

### 2. Basic Usage

```javascript
import useArcPayment from '../utils/useArcPayment';

function MyBookingScreen() {
  const { initiatePayment, isProcessing } = useArcPayment();

  const handlePay = () => {
    initiatePayment({
      quoteId: 'your-quote-id',
      bookingType: 'flight',
      amount: 599.99,
      currency: 'USD',
      title: 'Flight Booking',
    });
  };

  return (
    <Button 
      title={isProcessing ? 'Processing...' : 'Pay Now'} 
      onPress={handlePay}
      disabled={isProcessing}
    />
  );
}
```

### 3. Direct Navigation

```javascript
navigation.navigate('ArcPayment', {
  quoteId: 'your-quote-id',
  bookingType: 'hotel',
  amount: 299.99,
  returnScreen: 'HotelConfirmation',
  failedScreen: 'PaymentFailed',
});
```

---

## 💳 Test Cards

| Card Number | Type | 3DS | Result |
|------------|------|-----|--------|
| `5123456789012346` | Mastercard | Frictionless | ✅ Approved |
| `4440000042200014` | Visa | Frictionless | ✅ Approved |
| `5123450000000008` | Mastercard | Challenge (OTP) | ✅ Approved |
| `4440000009900010` | Visa | Challenge (OTP) | ✅ Approved |

- **Expiry**: `01/39`
- **CVV**: Any 3 digits (e.g., `100`)
- **OTP**: Any 6 digits (e.g., `123456`)

---

## 🔄 Payment Flow

```
┌─────────────────┐
│  Booking Screen │
│  (e.g. Flight)  │
└────────┬────────┘
         │ initiatePayment({ quoteId })
         ▼
┌─────────────────┐
│ ArcPaymentScreen│
│   (WebView)     │
└────────┬────────┘
         │ Opens hosted payment page
         ▼
┌─────────────────┐
│  ARC Pay Page   │
│ (Mastercard)    │
└────────┬────────┘
         │ User enters card, 3DS auth
         ▼
┌─────────────────┐        ┌─────────────────┐
│ PaymentSuccess  │   OR   │ PaymentFailed   │
│    Screen       │        │    Screen       │
└─────────────────┘        └─────────────────┘
```

---

## 🔧 API Endpoints

The app communicates with the backend (same as web):

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/payments?action=initiate-payment` | POST | Start payment, get hosted page URL |
| `/api/payments?action=payment-callback` | GET | Verify payment after completion |
| `/api/payments?action=get-payment-details` | GET | Get payment status |

**Request (initiate-payment):**
```json
{
  "quote_id": "your-quote-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "SESSION0002...",
  "paymentId": "uuid...",
  "paymentPageUrl": "https://na.gateway.mastercard.com/checkout/pay/SESSION...",
  "successIndicator": "abc123..."
}
```

---

## 📱 Screen Navigation

The following screens are now available:

| Screen Name | Route | Description |
|-------------|-------|-------------|
| `ArcPayment` | Stack | WebView payment page |
| `PaymentSuccess` | Stack | Success confirmation |
| `PaymentFailed` | Stack | Failure with retry |

---

## 🛠️ Configuration

### config.js

```javascript
export const ARC_PAY_CONFIG = {
  MERCHANT_ID: 'TESTARC05511704',
  API_URL: 'https://api.arcpay.travel/api/rest/version/100/merchant/TESTARC05511704',
  BACKEND_PAYMENT_URL: 'https://www.jetsetterss.com/api/payments',
  DEV_PAYMENT_URL: 'https://prod-six-phi.vercel.app/api/payments',
  PAYMENT_PAGE_BASE: 'https://na.gateway.mastercard.com/checkout/pay',
  TEST_MODE: true,
};
```

---

## 🔐 Security Features

1. **WebView Security**:
   - Only allows approved domains (ARC Pay, Mastercard, 3DS)
   - Prevents unauthorized navigation
   - Handles back button to prevent accidental cancellation

2. **3DS Authentication**:
   - Automatic handling of frictionless and challenge flows
   - OTP verification in WebView

3. **Data Storage**:
   - Temporary payment data stored in AsyncStorage
   - Cleared after payment completion

---

## ⚠️ Important Notes

1. **Quote ID Required**: You must create a quote in Supabase first before initiating payment.

2. **Backend Handles Complexity**: The app only sends `quote_id` - backend fetches all payment details from database.

3. **Same Database**: Uses the same Supabase instance as the web platform - bookings sync across both.

4. **Test Mode**: Currently configured for test environment. Change `TEST_MODE` in config for production.

---

## 📞 Support

- **Email**: support@jetsetterss.com
- **Phone**: (877) 538-7380

---

## ✨ What's Next?

To fully integrate with existing booking flows:

1. Update `FlightPaymentScreen.js` to create a quote, then use `useArcPayment` hook
2. Update `HotelPaymentScreen.js` similarly
3. Update `CruiseBookingScreen.js` similarly
4. Update `PackageBookingScreen.js` similarly

See `src/components/payment/ArcPayIntegrationExample.js` for detailed examples.
