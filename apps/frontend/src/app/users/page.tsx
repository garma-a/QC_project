import { Suspense } from "react";
import UsersClient from "./UsersClient";
import { users as mockUsers } from "@/data/users";
import type { UserSchema } from "@/types/schema";

interface UsersDataResponse {
  users: UserSchema[];
}

function UsersLoadingSkeleton() {
  return (
    <div className="qc-users-page">
      <div className="mb-6 h-1 rounded-full bg-gradient-to-r from-[#c41e3a] via-[#b8860b] to-[#003366] dark:from-[#e84855] dark:via-[#ffd700] dark:to-[#4a90e2]" />
      <div className="mb-6 h-12 w-56 animate-pulse rounded-xl bg-[#c41e3a]/10 dark:bg-[#e84855]/20" />
      <div className="mb-6 rounded-2xl border-2 border-[#c41e3a]/20 bg-white p-6 shadow-lg dark:border-[#e84855]/30 dark:bg-[#1e1e1e]">
        <div className="mb-4 h-6 w-48 animate-pulse rounded-lg bg-[#c41e3a]/10 dark:bg-[#e84855]/20" />
        <div className="space-y-3">
          <div className="h-16 animate-pulse rounded-xl bg-[#c41e3a]/10 dark:bg-[#e84855]/20" />
          <div className="h-16 animate-pulse rounded-xl bg-[#c41e3a]/10 dark:bg-[#e84855]/20" />
          <div className="h-16 animate-pulse rounded-xl bg-[#c41e3a]/10 dark:bg-[#e84855]/20" />
        </div>
      </div>
    </div>
  );
}

async function fetchUsersData(): Promise<UsersDataResponse> {
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return {
    users: mockUsers,
  };
}

export default async function UsersPage() {
  const { users } = await fetchUsersData();

  return (
    <Suspense fallback={<UsersLoadingSkeleton />}>
      <UsersClient users={users} />
    </Suspense>
  );
}
