import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserType } from '@/components/client/UsersManager';

interface UserStoreState {
  usersList: UserType[];
  deleteUser: (id: string) => void;
  updateUser: (updatedUser: UserType) => void;
  addUser: (newUser: UserType) => void;
}

export const useUserStore = create<UserStoreState>()(
  persist(
    (set) => ({
      usersList: [],
      deleteUser: (id) =>
        set((state) => ({
          usersList: state.usersList.filter((user) => user.id !== id),
        })),
      updateUser: (updatedUser) =>
        set((state) => ({
          usersList: state.usersList.map((user) =>
            user.id === updatedUser.id ? updatedUser : user,
          ),
        })),
      addUser: (newUser) =>
        set((state) => ({
          usersList: [...state.usersList, newUser],
        })),
    }),
    {
      name: 'qc-users-storage',
    },
  ),
);
