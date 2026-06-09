'use client';

import { useEffect } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { clientFetch, API_BASE_URL } from '@/lib/api/clientFetch';
import { useAuthStore } from '@/store/useAuthStore';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import type { MachineResponseDto } from '@/lib/types/api';

interface UseMachinesReturn {
  machines: MachineResponseDto[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
}

export function useMachines(): UseMachinesReturn {
  const token = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();

    const connectSse = async () => {
      try {
        await fetchEventSource(`${API_BASE_URL}/api/v1/machines/stream`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'text/event-stream',
          },
          signal: controller.signal,
          onmessage(msg) {
            if (!msg.event || msg.event === 'message') {
              try {
                const parsed = JSON.parse(msg.data);
                queryClient.setQueryData(['machines'], (oldData: any) => {
                  if (!oldData) return oldData;
                  const newPages = oldData.pages.map((page: any[]) => [...page]);
                  
                  if (parsed.type === 'create') {
                    if (newPages.length > 0) {
                      newPages[0].unshift(parsed.data);
                    } else {
                      newPages.push([parsed.data]);
                    }
                  } else if (parsed.type === 'update') {
                    for (let i = 0; i < newPages.length; i++) {
                      const idx = newPages[i].findIndex((m) => m.id === parsed.data.id);
                      if (idx !== -1) {
                        newPages[i][idx] = parsed.data;
                        break;
                      }
                    }
                  } else if (parsed.type === 'delete') {
                    for (let i = 0; i < newPages.length; i++) {
                      newPages[i] = newPages[i].filter((m) => m.id !== parsed.data.id);
                    }
                  }
                  
                  return { ...oldData, pages: newPages };
                });
              } catch (e) {
                queryClient.invalidateQueries({ queryKey: ['machines'] });
              }
            }
          },
          onerror(err) {
            if (err instanceof DOMException && err.name === 'AbortError') throw err;
            console.error('SSE Error:', err);
            return 5000; // Retry after 5s
          }
        });
      } catch (err) {
        // Silently ignore connection errors to prevent crashing
      }
    };

    connectSse();

    return () => {
      controller.abort();
    };
  }, [token, queryClient]);

  const {
    data,
    isLoading,
    isError,
    error: rawError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['machines'],
    queryFn: ({ pageParam = 0, signal }) =>
      clientFetch<MachineResponseDto[]>(`/api/v1/machines?limit=50&offset=${pageParam}`, { signal }, token),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 50 ? allPages.length * 50 : undefined;
    },
    initialPageParam: 0,
    enabled: !!token,
  });

  const machines = data?.pages.flat() || [];

  return {
    machines,
    loading: isLoading,
    error: isError ? (rawError instanceof Error ? rawError.message : 'Failed to fetch machines') : null,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}
