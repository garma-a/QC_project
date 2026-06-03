import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserResponseDto, Role } from '@/lib/types/api';
import { getQueryClient } from '@/lib/query/queryClient';

interface AuthState {
  /** The currently authenticated user */
  currentUser: UserResponseDto | null;
  /** JWT access token stored client-side for hooks */
  accessToken: string | null;
  /** Convenience getters */
  role: Role | null;
  sectionIds: number[];
  isAdmin: boolean;
  /** Actions */
  setAuth: (user: UserResponseDto, token: string) => void;
  clearAuth: () => void;
  setUser: (user: UserResponseDto) => void;
  /** Hydrate from cookies on app load */
  hydrateFromCookies: () => void;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      accessToken: null,
      role: null,
      sectionIds: [],
      isAdmin: false,

      setAuth: (user, token) =>
        set({
          currentUser: user,
          accessToken: token,
          role: user.role,
          sectionIds: user.sectionIds ?? [],
          isAdmin: user.role === 'ADMIN',
        }),

      clearAuth: () => {
        // Clear React Query cache so stale authenticated data doesn't
        // persist after logout (important since token is no longer in queryKeys)
        try {
          getQueryClient().clear();
        } catch {
          // QueryClient may not be initialized in SSR
        }
        set({
          currentUser: null,
          accessToken: null,
          role: null,
          sectionIds: [],
          isAdmin: false,
        });
      },

      setUser: (user) =>
        set({
          currentUser: user,
          role: user.role,
          sectionIds: user.sectionIds ?? [],
          isAdmin: user.role === 'ADMIN',
        }),

      hydrateFromCookies: () => {
        const userInfoStr = getCookie('user_info');
        const token = getCookie('auth_token');

        if (userInfoStr) {
          try {
            const user = JSON.parse(userInfoStr) as UserResponseDto;
            set({
              currentUser: user,
              accessToken: token,
              role: user.role,
              sectionIds: user.sectionIds ?? [],
              isAdmin: user.role === 'ADMIN',
            });
          } catch {
            // Invalid cookie data
          }
        }
      },
    }),
    {
      name: 'qc-auth-storage',
    },
  ),
);
