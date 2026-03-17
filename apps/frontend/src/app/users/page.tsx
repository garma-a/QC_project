import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { api } from '@/lib/api/serverFetch';
import { UsersManager } from '@/components/client/UsersManager';
import { UserResponseDto } from '@/lib/types/api';

import { UserType } from '@/components/client/UsersManager';

export default async function UsersPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  const userInfoStr = cookieStore.get('user_info')?.value;
  
  // Enforce authentication at page level
  if (!token) {
    redirect('/login');
  }

  let currentUser = null;
  if (userInfoStr) {
    try {
      currentUser = JSON.parse(userInfoStr);
    } catch { }
  }

  let initialUsers: UserType[] = [];
  try {
    const fetchedUsers = await api.get<UserResponseDto[]>('/api/v1/users');
    if (fetchedUsers && Array.isArray(fetchedUsers)) {
      initialUsers = fetchedUsers as unknown as UserType[];
    }
  } catch {
    console.error("Failed to fetch users");
  }

  return (
    <UsersManager initialUsers={initialUsers} currentUser={currentUser} />
  );
}
