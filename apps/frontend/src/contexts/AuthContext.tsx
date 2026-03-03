"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '../data/users';
import { useUserStore } from '@/store/useUserStore';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: (username: string, password: string) => boolean;
  logout: () => void;
  addDoctor: (username: string, password: string, fullName: string, email?: string, profileImage?: string) => boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const users = useUserStore((state) => state.usersList);
  const addUser = useUserStore((state) => state.addUser);
  const updateUser = useUserStore((state) => state.updateUser);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    const savedUser = window.localStorage?.getItem('currentUser');
    if (!savedUser) {
      return null;
    }

    try {
      return JSON.parse(savedUser) as User;
    } catch {
      window.localStorage?.removeItem('currentUser');
      return null;
    }
  });
  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const updatedUser = users.find((user) => user.id === currentUser.id);
    if (!updatedUser) {
      return;
    }

    setCurrentUser(updatedUser);
    if (typeof window !== 'undefined') {
      window.localStorage?.setItem('currentUser', JSON.stringify(updatedUser));
    }
  }, [users, currentUser]);

  const login = (username: string, password: string): boolean => {
    const user = users.find(u => u.username === username && u.password === password);
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
      setCurrentUser(activeUser);
      return true;
    }
    return false;
  };

  const logout = () => {
    if (currentUser) {
      updateUser({
        ...currentUser,
        isActive: false,
        lastActiveAt: new Date().toISOString(),
      });
    }
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      window.localStorage?.removeItem('currentUser');
    }
  };

  const addDoctor = (username: string, password: string, fullName: string, email?: string, profileImage?: string): boolean => {
    // Check if username already exists
    if (users.find(u => u.username === username)) {
      return false;
    }

    const newDoctor: User = {
      id: `doctor-${Date.now()}`,
      username,
      password,
      role: 'doctor',
      fullName,
      email,
      profileImage,
      createdAt: new Date().toISOString().split('T')[0],
      isActive: false,
      lastActiveAt: new Date().toISOString(),
    };

    addUser(newDoctor);
    return true;
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <AuthContext.Provider value={{ currentUser, users, login, logout, addDoctor, isAdmin }}>
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
