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

export const calculateFare = (flightOffer, passengerCount = 1, addons = [], couponDiscount = 0) => {
  const grandTotal = parseFloat(flightOffer?.price?.grandTotal || flightOffer?.price?.total || 0);
  const baseFare = grandTotal * passengerCount;
  const fixedTax = 25;
  const percentTax = (baseFare * 5) / 100;
  const taxes = (fixedTax + percentTax) * passengerCount;
  const addonsTotal = addons.reduce((sum, a) => sum + (a.price || 0), 0);
  const total = Math.max(0, baseFare + taxes + addonsTotal - couponDiscount);

  return {
    baseFare: baseFare.toFixed(2),
    taxes: taxes.toFixed(2),
    addonsTotal: addonsTotal.toFixed(2),
    couponDiscount: couponDiscount.toFixed(2),
    totalAmount: total.toFixed(2),
    currency: flightOffer?.price?.currency || 'USD',
  };
};
