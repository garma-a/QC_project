import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useQcResults } from '../useQcResults';
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

describe('useQcResults hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    useAuthStore.getState().setAuth({ id: '1' } as any, 'token');
  });

  it('fetches data successfully when lotId is provided', async () => {
    const mockResponse = {
      lot: { id: 1, lotNumber: 'LOT-123' },
      results: [{ id: 1, value: 5.5 }]
    };
    (clientFetch as any).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useQcResults(1), { wrapper });

    expect(result.current.loading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockResponse);
    expect(clientFetch).toHaveBeenCalledWith('/api/v1/qc-results?lotId=1', expect.any(Object), 'token');
  });

  it('does not fetch when lotId is null', async () => {
    const { result } = renderHook(() => useQcResults(null), { wrapper });

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
    expect(clientFetch).not.toHaveBeenCalled();
  });

  it('handles server errors correctly', async () => {
    (clientFetch as any).mockRejectedValue(new Error('Failed to load'));

    const { result } = renderHook(() => useQcResults(2), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load');
    expect(result.current.data).toBeNull();
  });
});
