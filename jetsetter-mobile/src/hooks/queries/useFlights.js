import { useQuery, useMutation } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import flightService from '../../services/flightService';

/**
 * Flight data hooks (TanStack Query).
 * queryFns throw on a failed result so `isError`/`error` work; components read
 * `data` directly instead of juggling their own loading/error/state flags.
 */

export function useFlightSearch(params, options = {}) {
  return useQuery({
    queryKey: queryKeys.flights.search(params),
    queryFn: async () => {
      const res = await flightService.searchFlights(params);
      if (!res.success) throw new Error(res.error || 'Flight search failed');
      return { flights: res.flights || [], meta: res.meta || {} };
    },
    enabled: options.enabled ?? !!(params?.from && params?.to && params?.departDate),
    ...options,
  });
}

export function useAirportSearch(keyword, options = {}) {
  return useQuery({
    queryKey: queryKeys.flights.airports(keyword),
    queryFn: () => flightService.searchAirports(keyword),
    enabled: (options.enabled ?? true) && !!keyword && keyword.trim().length >= 2,
    staleTime: 1000 * 60 * 60, // airport lists rarely change
    ...options,
  });
}

export function useFlightPricingConfig(options = {}) {
  return useQuery({
    queryKey: queryKeys.flights.pricingConfig(),
    queryFn: () => flightService.getFlightPricingConfig(),
    staleTime: 1000 * 60 * 10,
    ...options,
  });
}

export function useSeatMap(flightOffer, options = {}) {
  return useQuery({
    queryKey: queryKeys.flights.seatMap(flightOffer?.id ?? flightOffer?.originalOffer?.id),
    queryFn: () => flightService.getSeatMap(flightOffer),
    enabled: (options.enabled ?? true) && !!flightOffer,
    ...options,
  });
}

export function useFareRules(flightOffer, options = {}) {
  return useQuery({
    queryKey: queryKeys.flights.fareRules(flightOffer?.id ?? flightOffer?.originalOffer?.id),
    queryFn: () => flightService.getFareRules(flightOffer),
    enabled: (options.enabled ?? true) && !!flightOffer,
    ...options,
  });
}

export function useFareOptions(flightOffer, options = {}) {
  return useQuery({
    queryKey: queryKeys.flights.fareOptions(flightOffer?.id ?? flightOffer?.originalOffer?.id),
    queryFn: () => flightService.getFareOptions(flightOffer),
    enabled: (options.enabled ?? true) && !!flightOffer,
    ...options,
  });
}

export function useValidateCoupon() {
  return useMutation({
    mutationFn: ({ code, amount, service }) =>
      flightService.validateCoupon(code, amount, service ?? null),
  });
}
