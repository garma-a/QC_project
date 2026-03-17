import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserResponseDto, Role } from '@/lib/types/api';

interface AuthState {
  /** The currently authenticated user (decoded from JWT or fetched after login) */
  currentUser: UserResponseDto | null;
  /** JWT access token stored client-side for hooks (SSR uses cookie) */
  accessToken: string | null;
  /** Convenience getters */
  role: Role | null;
  sectionId: number | null;
  isAdmin: boolean;
  /** Actions */
  setAuth: (user: UserResponseDto, token: string) => void;
  clearAuth: () => void;
  setUser: (user: UserResponseDto) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      accessToken: null,
      role: null,
      sectionId: null,
      isAdmin: false,

      setAuth: (user, token) =>
        set({
          currentUser: user,
          accessToken: token,
          role: user.role,
          sectionId: user.sectionId ?? null,
          isAdmin: user.role === 'ADMIN',
        }),

      clearAuth: () =>
        set({
          currentUser: null,
          accessToken: null,
          role: null,
          sectionId: null,
          isAdmin: false,
        }),

      setUser: (user) =>
        set({
          currentUser: user,
          role: user.role,
          sectionId: user.sectionId ?? null,
          isAdmin: user.role === 'ADMIN',
        }),
    }),
    {
      name: 'qc-auth-storage',
    },
  ),
);
