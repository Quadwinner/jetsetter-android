export const parseDuration = (iso) => {
  if (!iso) return 'N/A';
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return iso;
  const h = m[1] ? `${m[1]}h ` : '';
  const min = m[2] ? `${m[2]}m` : '';
  return `${h}${min}`.trim() || 'N/A';
};

export const generateOrderId = () =>
  'FLT' + Date.now().toString(36).toUpperCase();

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
  });
};

export const formatTime = (timeStr) => {
  if (!timeStr) return '';
  // Handle both "10:30" and ISO datetime strings
  const time = timeStr.includes('T') ? timeStr.split('T')[1].substring(0, 5) : timeStr;
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
};

export const getAirlineLogo = (iataCode) =>
  `https://pics.avs.io/32/32/${(iataCode || 'XX').toUpperCase()}.png`;

export const getStopsBadge = (stops) => {
  if (stops === 0) return { label: 'Non-stop', color: '#10B981', bg: '#D1FAE5' };
  if (stops === 1) return { label: '1 Stop', color: '#92400E', bg: '#FEF3C7' };
  return { label: `${stops}+ Stops`, color: '#991B1B', bg: '#FEE2E2' };
};

/**
 * Build the fare breakdown exactly like the website's booking page:
 *   - Base Fare           = real Amadeus base (price.base) × passengers
 *   - Taxes & Surcharges  = (grandTotal − base) × passengers   (real airline taxes)
 *   - Service Fee         = (taxesFees + grandTotal × taxesFeesPercentage%) × passengers
 *                           — the admin-configured "Jetsetters convenience fee"
 *   - Add-ons, Seats, Discount
 *
 * Fees are NOT hardcoded: pass `opts.config` from
 * flightService.getFlightPricingConfig() ({ taxesFees, taxesFeesPercentage }),
 * which comes from the admin panel via /admin/price-config/flights.
 * opts.seatFee (already in the offer's currency) is folded into the total here.
 */
export const calculateFare = (flightOffer, passengerCount = 1, addons = [], couponDiscount = 0, opts = {}) => {
  const price = flightOffer?.price || {};
  const orig = flightOffer?.originalOffer?.price || {};

  const fareTotal = parseFloat(
    price.grandTotal || price.amount || price.total || orig.grandTotal || orig.total || 0
  );
  const amaBase = parseFloat(price.base || orig.base || 0);
  const perPassengerBase = amaBase > 0 && amaBase <= fareTotal ? amaBase : fareTotal;
  const perPassengerTax = Math.max(0, fareTotal - perPassengerBase);

  // Admin-configured platform service fee (from /admin/price-config/flights).
  const cfg = opts.config || {};
  const serviceFixed = Number(cfg.taxesFees) || 0;
  const servicePercent = Number(cfg.taxesFeesPercentage) || 0;
  const perPassengerServiceFee = serviceFixed + (fareTotal * servicePercent) / 100;

  const count = Math.max(1, passengerCount);
  const baseFare = perPassengerBase * count;
  const taxes = perPassengerTax * count;
  const serviceFee = perPassengerServiceFee * count;

  const addonsTotal = addons.reduce((sum, a) => sum + (a.price || 0), 0);
  const seatFee = Number(opts.seatFee) || 0;
  const discount = Number(couponDiscount) || 0;

  const total = Math.max(0, baseFare + taxes + serviceFee + addonsTotal + seatFee - discount);

  return {
    baseFare: baseFare.toFixed(2),
    perPassengerBase: perPassengerBase.toFixed(2),
    taxes: taxes.toFixed(2),
    serviceFee: serviceFee.toFixed(2),
    addonsTotal: addonsTotal.toFixed(2),
    seatFee: seatFee.toFixed(2),
    couponDiscount: discount.toFixed(2),
    passengerCount: count,
    totalAmount: total.toFixed(2),
    currency: price.currency || orig.currency || 'USD',
  };
};
