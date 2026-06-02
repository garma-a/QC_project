import { describe, it, expect, beforeEach } from 'vitest';
import { useUserStore } from '../useUserStore';
import type { UserType } from '@/features/users/components/UsersManager';

const mockUser: UserType = {
  id: 1,
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  role: 'TECHNICIAN',
  isActive: true,
};

describe('useUserStore', () => {
  beforeEach(() => {
    useUserStore.setState({ usersList: [] });
  });

  it('adds a new user', () => {
    useUserStore.getState().addUser(mockUser);
    const state = useUserStore.getState();
    expect(state.usersList).toHaveLength(1);
    expect(state.usersList[0]).toEqual(mockUser);
  });

  it('updates an existing user', () => {
    useUserStore.getState().addUser(mockUser);
    
    const updatedUser = { ...mockUser, firstName: 'Jane', role: 'ADMIN' as any };
    useUserStore.getState().updateUser(updatedUser);
    
    const state = useUserStore.getState();
    expect(state.usersList[0].firstName).toBe('Jane');
    expect(state.usersList[0].role).toBe('ADMIN');
  });

  it('deletes a user', () => {
    useUserStore.getState().addUser(mockUser);
    expect(useUserStore.getState().usersList).toHaveLength(1);
    
    useUserStore.getState().deleteUser(1);
    
    const state = useUserStore.getState();
    expect(state.usersList).toHaveLength(0);
  });
});
