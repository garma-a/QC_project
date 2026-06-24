import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientFetch } from '@/lib/api/clientFetch';
import type { ProfileResponseDto, UpdateProfileDto } from '@qc/shared';

export const profileKeys = {
  all: ['profile'] as const,
  details: () => [...profileKeys.all, 'details'] as const,
};

export function useProfile() {
  return useQuery<ProfileResponseDto>({
    queryKey: profileKeys.details(),
    queryFn: () => clientFetch<ProfileResponseDto>('/api/v1/users/me/profile'),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileDto) =>
      clientFetch<ProfileResponseDto>('/api/v1/users/me/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileKeys.details(), updatedProfile);
    },
  });
}
