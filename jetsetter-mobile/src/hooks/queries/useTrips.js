import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import MyTripsService from '../../services/MyTripsService';
import bookingService from '../../services/bookingService';

/**
 * My Trips = bookings + inquiries, fetched together (mirrors MyTripsScreen).
 * Returns { bookings, inquiries } and normalizes the various response shapes.
 */
export function useMyTrips(options = {}) {
  return useQuery({
    queryKey: queryKeys.trips.list(),
    queryFn: async () => {
      const [inquiriesData, bookingsData] = await Promise.all([
        MyTripsService.getMyInquiries().catch(() => ({ success: false, data: [] })),
        MyTripsService.getMyBookings().catch(() => ({ success: false, data: [] })),
      ]);
      const inquiries = inquiriesData.success
        ? (inquiriesData.data || inquiriesData.inquiries || [])
        : [];
      const bookings = bookingsData.success
        ? (bookingsData.data || bookingsData.bookings || [])
        : [];
      return {
        bookings: Array.isArray(bookings) ? bookings : [],
        inquiries: Array.isArray(inquiries) ? inquiries : [],
      };
    },
    ...options,
  });
}

export function useModifyBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, bookingType, modifications }) =>
      bookingService.modifyBooking(bookingId, bookingType, modifications),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.trips.all }),
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, bookingType, reason }) =>
      bookingService.cancelBooking(bookingId, bookingType, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.trips.all }),
  });
}
