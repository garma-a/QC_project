import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useQcTests } from '../useQcTests';
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

describe('useQcTests hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    useAuthStore.getState().setAuth({ id: '1' } as any, 'valid-token');
  });

  it('fetches qc tests successfully when machineId is provided', async () => {
    const mockTests = [
      { id: 1, name: 'Glucose' },
      { id: 2, name: 'Cholesterol' },
    ];
    (clientFetch as any).mockResolvedValue(mockTests);

    const { result } = renderHook(() => useQcTests(1), { wrapper });

    expect(result.current.loading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tests).toEqual(mockTests);
    expect(clientFetch).toHaveBeenCalledWith('/api/v1/qc-tests/machine/1', expect.any(Object), 'valid-token');
  });

  it('does not fetch when machineId is null', async () => {
    const { result } = renderHook(() => useQcTests(null), { wrapper });

    expect(result.current.loading).toBe(false);
    expect(result.current.tests).toEqual([]);
    expect(clientFetch).not.toHaveBeenCalled();
  });

  it('handles server errors correctly', async () => {
    (clientFetch as any).mockRejectedValue(new Error('Failed to load'));

    const { result } = renderHook(() => useQcTests(2), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load');
    expect(result.current.tests).toEqual([]);
  });
});
