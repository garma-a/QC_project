import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useControlLots } from '../useControlLots';
import { useAuthStore } from '@/store/useAuthStore';
import { clientFetch } from '@/lib/api/clientFetch';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

vi.mock('@/lib/api/clientFetch', () => ({
  clientFetch: vi.fn(),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useControlLots hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    useAuthStore.getState().setAuth({ id: '1' } as any, 'valid-token');
  });

  it('fetches control lots successfully', async () => {
    const mockLots = [
      { id: 1, lotNumber: 'LOT-A' },
      { id: 2, lotNumber: 'LOT-B' },
    ];
    (clientFetch as any).mockResolvedValue(mockLots);

    const { result } = renderHook(() => useControlLots(), { wrapper });

    expect(result.current.loading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.lots).toEqual(mockLots);
    expect(result.current.error).toBeNull();
    expect(clientFetch).toHaveBeenCalledWith('/api/v1/control-lots', expect.any(Object), 'valid-token');
  });

  it('handles server errors correctly', async () => {
    (clientFetch as any).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useControlLots(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.lots).toEqual([]);
  });
});
