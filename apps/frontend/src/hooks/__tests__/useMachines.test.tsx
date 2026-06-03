import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMachines } from '../useMachines';
import { useAuthStore } from '@/store/useAuthStore';
import { clientFetch } from '@/lib/api/clientFetch';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock clientFetch
vi.mock('@/lib/api/clientFetch', () => ({
  clientFetch: vi.fn(),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useMachines hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    useAuthStore.getState().setAuth({ id: '1' } as any, 'valid-token');
  });

  it('fetches machines from the server and matches expected schema', async () => {
    const mockData = [
      { id: 'm1', name: 'Machine 1', category: 'chemistry' },
      { id: 'm2', name: 'Machine 2', category: 'hematology' },
    ];
    (clientFetch as any).mockResolvedValue(mockData);

    const { result } = renderHook(() => useMachines(), { wrapper });

    expect(result.current.loading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.machines).toEqual(mockData);
    expect(result.current.error).toBeNull();
    expect(clientFetch).toHaveBeenCalledWith('/api/v1/machines?limit=50&offset=0', expect.any(Object), 'valid-token');
  });

  it('handles server errors correctly', async () => {
    (clientFetch as any).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useMachines(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.machines).toEqual([]);
  });

  it('does not fetch if token is missing', async () => {
    useAuthStore.getState().clearAuth(); // Remove token
    
    const { result } = renderHook(() => useMachines(), { wrapper });

    expect(result.current.loading).toBe(false); // Should not load if not enabled
    expect(clientFetch).not.toHaveBeenCalled();
  });
});
