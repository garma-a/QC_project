import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Sidebar } from '../Sidebar';
import { useAuthStore } from '@/store/useAuthStore';
import * as actions from '@/lib/actions';
import { useRouter } from 'next/navigation';
import React from 'react';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/dashboard'),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, className, onClick }: any) => (
    <a href={href} className={className} onClick={onClick} data-testid={`link-${href}`}>
      {children}
    </a>
  ),
}));

// Mock contexts and actions
vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: vi.fn(() => ({ theme: 'light', toggleTheme: vi.fn() })),
}));
vi.mock('@/lib/actions', () => ({
  logoutAccount: vi.fn(),
}));

describe('Sidebar component routing and data management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().clearAuth();
  });

  it('renders standard links for non-admin users', () => {
    useAuthStore.getState().setAuth({ id: '1', role: 'TECHNICIAN' } as any, 'token');
    render(<Sidebar isOpen={true} onClose={vi.fn()} />);
    
    expect(screen.getByTestId('link-/monitor')).toBeInTheDocument();
    expect(screen.getByTestId('link-/qc')).toBeInTheDocument();
    expect(screen.getByTestId('link-/machines')).toBeInTheDocument();
    expect(screen.queryByTestId('link-/users')).not.toBeInTheDocument();
  });

  it('renders admin links when user is admin', () => {
    useAuthStore.getState().setAuth({ id: '1', role: 'ADMIN' } as any, 'token');
    render(<Sidebar isOpen={true} onClose={vi.fn()} />);
    
    expect(screen.getByTestId('link-/users')).toBeInTheDocument();
  });

  it('navigates to correct page on link click without backward redirect logic', () => {
    useAuthStore.getState().setAuth({ id: '1', role: 'TECHNICIAN' } as any, 'token');
    const onCloseMock = vi.fn();
    render(<Sidebar isOpen={true} onClose={onCloseMock} />);
    
    const monitorLink = screen.getByTestId('link-/monitor');
    expect(monitorLink).toHaveAttribute('href', '/monitor');
    
    fireEvent.click(monitorLink);
    // Should call onClose to close sidebar on mobile
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('handles logout flow correctly', async () => {
    const mockPush = vi.fn();
    (useRouter as any).mockReturnValue({ push: mockPush });
    
    useAuthStore.getState().setAuth({ id: '1', role: 'TECHNICIAN', firstName: 'John' } as any, 'token');
    render(<Sidebar isOpen={true} onClose={vi.fn()} />);
    
    // Auth store should have data
    expect(useAuthStore.getState().accessToken).toBe('token');
    
    const logoutBtn = screen.getByText('Logout').closest('button');
    fireEvent.click(logoutBtn!);
    
    await waitFor(() => {
      // 1. Auth store should be cleared
      expect(useAuthStore.getState().accessToken).toBeNull();
      // 2. Server action should be called
      expect(actions.logoutAccount).toHaveBeenCalled();
      // 3. Router should redirect to login
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });
});
