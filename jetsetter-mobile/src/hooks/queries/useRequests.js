import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import requestService from '../../services/requestService';
import MyTripsService from '../../services/MyTripsService';

export function useInquiry(inquiryId, options = {}) {
  return useQuery({
    queryKey: queryKeys.requests.detail(inquiryId),
    queryFn: async () => {
      const result = await MyTripsService.getInquiryById(inquiryId);
      // Normalize the several possible response shapes (mirrors the screen).
      let data = null;
      if (result?.success && result?.data) data = result.data;
      else if (result?.id || result?.inquiry_type) data = result;
      else if (result?.data?.id || result?.data?.inquiry_type) data = result.data;
      if (!data || !(data.id || data.inquiry_type)) throw new Error('Inquiry not found');
      return data;
    },
    enabled: (options.enabled ?? true) && !!inquiryId,
    ...options,
  });
}

export function useMyInquiries(options = {}) {
  return useQuery({
    queryKey: queryKeys.requests.list(),
    queryFn: async () => {
      const res = await requestService.getMyInquiries();
      if (res && res.success === false) throw new Error(res.error || 'Failed to load requests');
      return res?.data || res?.inquiries || res || [];
    },
    ...options,
  });
}

export function useSubmitInquiry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inquiryData) => requestService.submitInquiry(inquiryData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.requests.all });
      qc.invalidateQueries({ queryKey: queryKeys.trips.all });
    },
  });
}
