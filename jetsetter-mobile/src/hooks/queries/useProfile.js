import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import profileService from '../../services/profileService';

export function useProfile(options = {}) {
  return useQuery({
    queryKey: queryKeys.profile.me(),
    queryFn: async () => {
      const res = await profileService.getProfile();
      if (!res.success) throw new Error(res.error || 'Failed to load profile');
      return res.profile;
    },
    ...options,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fields) => profileService.updateProfile(fields),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.profile.me() }),
  });
}
