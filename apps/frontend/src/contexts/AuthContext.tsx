"use client";

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { UserType as User } from '@/components/client/UsersManager';
import { useUserStore } from '@/store/useUserStore';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: (username: string) => boolean;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const users = useUserStore((state) => state.usersList);
  const updateUser = useUserStore((state) => state.updateUser);
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    const savedUser = window.localStorage?.getItem('currentUser');
    if (!savedUser) {
      return null;
    }

    try {
      const parsed = JSON.parse(savedUser) as User;
      return parsed.id;
    } catch {
      window.localStorage?.removeItem('currentUser');
      return null;
    }
  });

  const currentUser = useMemo(
    () => users.find((user) => user.id === currentUserId) ?? null,
    [users, currentUserId],
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (currentUser) {
        window.localStorage?.setItem('currentUser', JSON.stringify(currentUser));
      } else {
        window.localStorage?.removeItem('currentUser');
      }
    }
  }, [currentUser]);

  // Client-side login now only sets the active user by username.
  // Real authentication is handled by the loginAccount Server Action.
  const login = (username: string): boolean => {
    const user = users.find(u => u.username === username);
    if (user) {
      const now = new Date().toISOString();
      const activeUser: User = {
        ...user,
        isActive: true,
        lastActiveAt: now,
      };

      updateUser(activeUser);
      if (typeof window !== 'undefined') {
        window.localStorage?.setItem('currentUser', JSON.stringify(activeUser));
      }
      setCurrentUserId(activeUser.id);
      return true;
    }
    return false;
  };

  const logout = () => {
    if (currentUser) {
      updateUser({
        ...currentUser,
        lastActiveAt: new Date().toISOString(),
      });
    }
    setCurrentUserId(null);
    if (typeof window !== 'undefined') {
      window.localStorage?.removeItem('currentUser');
    }
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <AuthContext.Provider value={{ currentUser, users, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
