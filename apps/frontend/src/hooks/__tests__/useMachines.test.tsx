import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMachines } from '../useMachines';
import { useAuthStore } from '@/store/useAuthStore';
import { clientFetch } from '@/lib/api/clientFetch';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

vi.mock('@/lib/api/clientFetch', () => ({
  clientFetch: vi.fn(),
  API_BASE_URL: 'http://localhost',
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return {
    queryClient,
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

describe('useMachines hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().setAuth({ id: '1' } as any, 'valid-token');
  });

  it('fetches machines and flattens pages', async () => {
    const mockPage = [
      { id: 1, name: 'Machine 1', sectionId: 1 },
      { id: 2, name: 'Machine 2', sectionId: 2 },
    ];
    (clientFetch as any).mockResolvedValue(mockPage);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useMachines(), { wrapper });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.machines).toEqual(mockPage);
    expect(result.current.error).toBeNull();
    expect(clientFetch).toHaveBeenCalledWith(
      '/api/v1/machines?limit=50&offset=0',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
      'valid-token',
    );
  });

  it('handles server errors correctly', async () => {
    (clientFetch as any).mockRejectedValue(new Error('Network error'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useMachines(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.machines).toEqual([]);
  });

  it('does not fetch if token is missing', () => {
    useAuthStore.getState().clearAuth();

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useMachines(), { wrapper });

    expect(result.current.loading).toBe(false);
    expect(clientFetch).not.toHaveBeenCalled();
  });

  it('refetches when queryClient invalidates machines key', async () => {
    const mockPage = [{ id: 1, name: 'Machine 1', sectionId: 1 }];
    (clientFetch as any).mockResolvedValue(mockPage);

    const { wrapper, queryClient } = createWrapper();
    renderHook(() => useMachines(), { wrapper });

    await waitFor(() => {
      expect(clientFetch).toHaveBeenCalledTimes(1);
    });

    queryClient.invalidateQueries({ queryKey: ['machines'] });

    await waitFor(() => {
      expect(clientFetch).toHaveBeenCalledTimes(2);
    });
  });
});
