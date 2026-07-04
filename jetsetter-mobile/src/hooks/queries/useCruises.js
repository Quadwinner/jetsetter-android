import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import cruiseService from '../../services/cruiseService';

export function useCruises(options = {}) {
  return useQuery({
    queryKey: queryKeys.cruises.list(),
    queryFn: async () => {
      const res = await cruiseService.getCruises();
      if (!res.success) throw new Error(res.error || 'Failed to load cruises');
      return res.data || [];
    },
    ...options,
  });
}

export function useCruiseSearch(params, options = {}) {
  return useQuery({
    queryKey: queryKeys.cruises.search(params),
    queryFn: async () => {
      const res = await cruiseService.searchCruises(params);
      if (!res.success) throw new Error(res.error || 'Cruise search failed');
      return { cruises: res.cruises || [], meta: res.meta || {} };
    },
    enabled: options.enabled ?? true,
    ...options,
  });
}

export function useCruiseDetails(cruiseId, options = {}) {
  return useQuery({
    queryKey: queryKeys.cruises.details(cruiseId),
    queryFn: async () => {
      const res = await cruiseService.getCruiseDetails(cruiseId);
      if (!res.success) throw new Error(res.error || 'Failed to load cruise');
      return res.cruise;
    },
    enabled: (options.enabled ?? true) && !!cruiseId,
    ...options,
  });
}

export function useCreateCruiseBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookingData) => cruiseService.createBooking(bookingData),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.trips.all }),
  });
}
