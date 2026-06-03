import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../useAuthStore';
import type { UserResponseDto } from '@/lib/types/api';

const mockUser: UserResponseDto = {
  id: 123,
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  role: 'ADMIN',
  sectionIds: [1, 2, 3],
  isActive: true,
  createdAt: '2023-01-01',
  updatedAt: '2023-01-01'
};

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('initializes with default values', () => {
    const state = useAuthStore.getState();
    expect(state.currentUser).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.role).toBeNull();
    expect(state.isAdmin).toBe(false);
    expect(state.sectionIds).toEqual([]);
  });

  it('sets authentication correctly', () => {
    useAuthStore.getState().setAuth(mockUser, 'fake-jwt-token');
    const state = useAuthStore.getState();
    
    expect(state.currentUser).toEqual(mockUser);
    expect(state.accessToken).toBe('fake-jwt-token');
    expect(state.role).toBe('ADMIN');
    expect(state.isAdmin).toBe(true);
    expect(state.sectionIds).toEqual([1, 2, 3]);
  });

  it('clears authentication correctly', () => {
    useAuthStore.getState().setAuth(mockUser, 'fake-jwt-token');
    useAuthStore.getState().clearAuth();
    
    const state = useAuthStore.getState();
    expect(state.currentUser).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.role).toBeNull();
    expect(state.isAdmin).toBe(false);
    expect(state.sectionIds).toEqual([]);
  });

  it('updates user without changing token', () => {
    useAuthStore.getState().setAuth(mockUser, 'fake-jwt-token');
    
    const updatedUser = { ...mockUser, firstName: 'Updated', role: 'TECHNICIAN' as any };
    useAuthStore.getState().setUser(updatedUser);
    
    const state = useAuthStore.getState();
    expect(state.currentUser?.firstName).toBe('Updated');
    expect(state.accessToken).toBe('fake-jwt-token');
    expect(state.role).toBe('TECHNICIAN');
    expect(state.isAdmin).toBe(false);
  });
});
