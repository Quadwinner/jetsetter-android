import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import packageService from '../../services/packageService';

export function usePackageSearch(params, options = {}) {
  return useQuery({
    queryKey: queryKeys.packages.search(params),
    queryFn: async () => {
      const res = await packageService.searchPackages(params);
      if (!res.success) throw new Error(res.error || 'Package search failed');
      return { packages: res.packages || [], meta: res.meta || {} };
    },
    enabled: options.enabled ?? true,
    ...options,
  });
}

export function usePackageDetails(packageId, options = {}) {
  return useQuery({
    queryKey: queryKeys.packages.details(packageId),
    queryFn: async () => {
      const res = await packageService.getPackageDetails(packageId);
      if (!res.success) throw new Error(res.error || 'Failed to load package');
      return res.package;
    },
    enabled: (options.enabled ?? true) && !!packageId,
    ...options,
  });
}

export function useCreatePackageBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookingData) => packageService.createBooking(bookingData),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.trips.all }),
  });
}
