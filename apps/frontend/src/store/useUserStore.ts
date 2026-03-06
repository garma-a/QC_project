import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { users as initialUsers } from '@/data/users';
import type { User as UserType } from '@/data/users';

interface UserStoreState {
  usersList: UserType[];
  deleteUser: (id: string) => void;
  updateUser: (updatedUser: UserType) => void;
  addUser: (newUser: UserType) => void;
}

export const useUserStore = create<UserStoreState>()(
  persist(
    (set) => ({
      usersList: initialUsers,
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
