import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import hotelService from '../../services/hotelService';

export function useHotelSearch(params, options = {}) {
  return useQuery({
    queryKey: queryKeys.hotels.search(params),
    queryFn: async () => {
      const res = await hotelService.searchHotels(params);
      if (!res.success) throw new Error(res.error || 'Hotel search failed');
      return { hotels: res.hotels || [], meta: res.meta || {} };
    },
    enabled: options.enabled ?? !!(params?.cityCode && params?.checkInDate && params?.checkOutDate),
    ...options,
  });
}

export function useHotelDestinations(options = {}) {
  return useQuery({
    queryKey: queryKeys.hotels.destinations(),
    queryFn: async () => {
      const res = await hotelService.getDestinations();
      if (!res.success) throw new Error(res.error || 'Failed to load destinations');
      return res.destinations || [];
    },
    staleTime: 1000 * 60 * 60,
    ...options,
  });
}

export function useCreateHotelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookingData) => hotelService.createBooking(bookingData),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.trips.all }),
  });
}

export function useCancelHotelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, reason }) => hotelService.cancelBooking(bookingId, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.trips.all }),
  });
}
