import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { api } from '@/lib/api/serverFetch';
import { UsersManager } from '@/components/client/UsersManager';
import type { UserListItemDto } from '@/lib/types/api';
import type { UserType } from '@/components/client/UsersManager';

export default async function UsersPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  const userInfoStr = cookieStore.get('user_info')?.value;
  
  // Enforce authentication at page level
  if (!token) {
    redirect('/login');
  }

  let currentUser: UserType | null = null;
  if (userInfoStr) {
    try {
      currentUser = JSON.parse(userInfoStr) as UserType;
    } catch { /* ignore parse errors */ }
  }

  let initialUsers: UserType[] = [];
  try {
    const fetchedUsers = await api.get<UserListItemDto[]>('/api/v1/users');
    if (fetchedUsers && Array.isArray(fetchedUsers)) {
      // UserListItemDto already matches UserType shape (id, firstName, lastName, email, role, isActive, sectionName)
      initialUsers = fetchedUsers;
    }
  } catch {
    console.error("Failed to fetch users");
  }

  return (
    <UsersManager initialUsers={initialUsers} currentUser={currentUser} />
  );
}
