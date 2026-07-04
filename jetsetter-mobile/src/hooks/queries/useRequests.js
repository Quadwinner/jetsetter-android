import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import requestService from '../../services/requestService';

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
