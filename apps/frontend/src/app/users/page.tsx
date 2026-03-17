import { cookies } from 'next/headers';
import { api } from '@/lib/api/serverFetch';
import { UsersManager } from '@/components/client/UsersManager';
import { decodeJwt } from '@/lib/utils/jwt';
import type { UserListItemDto } from '@/lib/types/api';
import type { UserType } from '@/components/client/UsersManager';

// Auth redirects are handled by middleware.ts — no need for redirect() here.

/**
 * Safely read cookies. Returns null if cookies() is not available
 * (e.g. when running in vinext dev where server context may not be set up).
 */
async function safeGetCookies() {
  try {
    return await cookies();
  } catch {
    return null;
  }
}

export default async function UsersPage() {
  const cookieStore = await safeGetCookies();
  const token = cookieStore?.get('auth_token')?.value;

  // Determine the current user from multiple sources (in priority order):
  // 1. Try parsing the user_info cookie
  // 2. Fall back to decoding the JWT token directly
  // If neither works, UsersManager will read from the Zustand store on the client.
  let currentUser: UserType | null = null;

  const userInfoStr = cookieStore?.get('user_info')?.value;
  if (userInfoStr) {
    try {
      // The cookie value may be URL-encoded by the browser/Next.js
      const decoded = decodeURIComponent(userInfoStr);
      currentUser = JSON.parse(decoded) as UserType;
    } catch {
      try {
        // Try without decoding in case it's already plain JSON
        currentUser = JSON.parse(userInfoStr) as UserType;
      } catch { /* ignore */ }
    }
  }

  // Fallback: decode JWT to get role and userId
  if (!currentUser && token) {
    const jwtPayload = decodeJwt(token);
    if (jwtPayload) {
      currentUser = {
        id: jwtPayload.userId,
        firstName: '',
        lastName: '',
        email: '',
        role: jwtPayload.role,
        isActive: true,
      };
    }
  }

  let initialUsers: UserType[] = [];
  try {
    const fetchedUsers = await api.get<UserListItemDto[]>('/api/v1/users');
    if (fetchedUsers && Array.isArray(fetchedUsers)) {
      initialUsers = fetchedUsers;
    }
  } catch {
    console.error("Failed to fetch users");
  }

  return (
    <UsersManager initialUsers={initialUsers} currentUser={currentUser} />
  );
}
