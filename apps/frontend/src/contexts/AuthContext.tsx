"use client";

import { createContext, useContext, useState, ReactNode } from 'react';
import { User, users as initialUsers } from '../data/users';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: (username: string, password: string) => boolean;
  logout: () => void;
  addDoctor: (username: string, password: string, fullName: string, email?: string) => boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
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
  const [users, setUsers] = useState<User[]>(initialUsers);

  const login = (username: string, password: string): boolean => {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      setCurrentUser(user);
      if (typeof window !== 'undefined') {
        window.localStorage?.setItem('currentUser', JSON.stringify(user));
      }
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      window.localStorage?.removeItem('currentUser');
    }
  };

  const addDoctor = (username: string, password: string, fullName: string, email?: string): boolean => {
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
      createdAt: new Date().toISOString().split('T')[0]
    };

    setUsers([...users, newDoctor]);
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
