import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAlerts } from '../useAlerts';
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

describe('useAlerts hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    useAuthStore.getState().setAuth({ id: '1' } as any, 'valid-token');
  });

  it('fetches alerts successfully', async () => {
    const mockAlerts = [{ id: 1, message: 'Test alert' }];
    (clientFetch as any).mockResolvedValue(mockAlerts);

    const { result } = renderHook(() => useAlerts(), { wrapper });

    expect(result.current.loading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.alerts).toEqual(mockAlerts);
    expect(clientFetch).toHaveBeenCalledWith('/api/v1/alerts', expect.any(Object), 'valid-token');
  });

  it('marks alert as seen via mutation', async () => {
    const mockAlerts = [{ id: 1, message: 'Test alert' }];
    (clientFetch as any).mockResolvedValue(mockAlerts);

    const { result } = renderHook(() => useAlerts(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Mock mutation response
    (clientFetch as any).mockResolvedValue([{ userId: '1', seen: true }]);

    await result.current.markSeen(1);

    expect(clientFetch).toHaveBeenCalledWith('/api/v1/alerts/mark-seen/1', { method: 'PATCH' }, 'valid-token');
  });

  it('marks alert as resolved via mutation', async () => {
    const mockAlerts = [{ id: 1, message: 'Test alert' }];
    (clientFetch as any).mockResolvedValue(mockAlerts);

    const { result } = renderHook(() => useAlerts(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Mock mutation response
    (clientFetch as any).mockResolvedValue([{ userId: '1', resolved: true }]);

    await result.current.markResolved(1, { resolutionNote: 'Resolved it' });

    expect(clientFetch).toHaveBeenCalledWith('/api/v1/alerts/mark-resolved/1', { method: 'PATCH', body: JSON.stringify({ resolutionNote: 'Resolved it' }) }, 'valid-token');
  });
});
