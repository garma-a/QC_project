'use client';

import { useState } from 'react';
import {
  UserPlus,
  Users,
  Mail,
  User,
  Lock,
  CheckCircle,
  AlertCircle,
  Pencil,
  Power,
} from 'lucide-react';
import { LogoCompact } from '@/components/layout/Logo';
import { createUser, updateUser } from '@/lib/actions';
import { useAuthStore } from '@/store/useAuthStore';
import type { AdminUpdateUserDto, Role } from '@/lib/types/api';

export type UserType = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  isActive?: boolean;
  sectionIds?: number[];
  sectionNames?: string[];
  createdAt?: string;
};

type EditTechnicianModalProps = {
  user: UserType;
  onCancel: () => void;
  onSave: (updatedUser: AdminUpdateUserDto) => Promise<void>;
};

function EditTechnicianModal({
  user,
  onCancel,
  onSave,
}: EditTechnicianModalProps) {
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [email, setEmail] = useState(user.email);
  const [sectionIdsText, setSectionIdsText] = useState(
    (user.sectionIds ?? []).join(', '),
  );
  const [isPending, setIsPending] = useState(false);

  const parseSectionIds = (value: string) => {
    return value
      .split(',')
      .map((part) => Number(part.trim()))
      .filter((n) => Number.isInteger(n) && n > 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    await onSave({
      firstName,
      lastName,
      email,
      sectionIds: parseSectionIds(sectionIdsText),
    });
    setIsPending(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 p-6 shadow-2xl">
        <h2 className="text-gray-900 dark:text-white mb-6 font-bold text-lg">
          Edit Technician
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2 font-semibold">
              First Name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent"
              required
              disabled={isPending}
            />
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2 font-semibold">
              Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent"
              required
              disabled={isPending}
            />
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2 font-semibold">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent"
              disabled={isPending}
            />
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2 font-semibold">
              Section IDs
            </label>
            <input
              type="text"
              value={sectionIdsText}
              onChange={(e) => setSectionIdsText(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent"
              placeholder="e.g. 1, 3"
              disabled={isPending}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isPending}
              className="flex-1 px-4 py-3 rounded-xl border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 text-gray-700 dark:text-gray-300 hover:bg-[#c41e3a]/10 dark:hover:bg-[#e84855]/20 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-[#c41e3a] to-[#8b1e3f] dark:from-[#e84855] dark:to-[#c75b7a] text-white hover:from-[#8b1e3f] hover:to-[#c41e3a] dark:hover:from-[#c75b7a] dark:hover:to-[#e84855] transition-all font-semibold"
            >
              {isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function UsersManager({
  initialUsers,
  currentUser: serverCurrentUser,
}: {
  initialUsers: UserType[];
  currentUser: UserType | null;
}) {
  // Fall back to Zustand store if server couldn't provide currentUser (vinext cookies() limitation)
  const storeUser = useAuthStore((s) => s.currentUser);
  const currentUser =
    serverCurrentUser ??
    (storeUser
      ? ({
          id: storeUser.id,
          firstName: storeUser.firstName,
          lastName: storeUser.lastName,
          email: storeUser.email,
          role: storeUser.role,
          isActive: storeUser.isActive,
        } as UserType)
      : null);
  const isAdmin = currentUser?.role === 'ADMIN';
  const [users, setUsers] = useState<UserType[]>(initialUsers);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    email: '',
    sectionIdsText: '',
  });
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleEditUser = (user: UserType) => {
    setEditingUser(user);
  };

  const handleToggleUserActive = async (user: UserType) => {
    const nextIsActive = !user.isActive;
    const confirmMessage = nextIsActive
      ? 'Are you sure you want to activate this technician?'
      : 'Are you sure you want to deactivate this technician?';

    if (window.confirm(confirmMessage)) {
      setIsPending(true);
      try {
        const res = await updateUser(user.id, { isActive: nextIsActive });
        if (res.error) {
          setMessage({ type: 'error', text: res.error });
        } else {
          setUsers((prev) =>
            prev.map((u) =>
              u.id === user.id ? { ...u, isActive: nextIsActive } : u,
            ),
          );
          setMessage({
            type: 'success',
            text: nextIsActive
              ? 'Technician activated successfully'
              : 'Technician deactivated successfully',
          });
        }
      } catch (err) {
        setMessage({
          type: 'error',
          text:
            err instanceof Error ? err.message : 'Failed to update user status',
        });
      }
      setIsPending(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleSaveEdit = async (updatedFields: AdminUpdateUserDto) => {
    if (!editingUser) return;
    try {
      const res = await updateUser(editingUser.id, updatedFields);
      if (!res.error) {
        // Update user in local state
        setUsers((prev) =>
          prev.map((u) =>
            u.id === editingUser.id ? { ...u, ...updatedFields } : u,
          ),
        );
        setEditingUser(null);
        setMessage({
          type: 'success',
          text: 'Technician updated successfully',
        });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: res.error });
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update user',
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-gray-900 dark:text-white">Access Denied</h1>
        </div>
        <div className="bg-[#c41e3a]/10 dark:bg-[#e84855]/20 border-2 border-[#c41e3a]/30 dark:border-[#e84855]/40 rounded-2xl p-8 text-center">
          <AlertCircle
            size={48}
            className="text-[#c41e3a] dark:text-[#e84855] mx-auto mb-4"
          />
          <p className="text-gray-900 dark:text-white font-semibold text-lg">
            Only administrators can access this page.
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const parsedSectionIds = formData.sectionIdsText
      .split(',')
      .map((part) => Number(part.trim()))
      .filter((n) => Number.isInteger(n) && n > 0);

    if (!formData.firstName || !formData.password || !formData.email) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    if (formData.password.length < 8) {
      setMessage({
        type: 'error',
        text: 'Password must be at least 8 characters',
      });
      return;
    }

    setIsPending(true);
    try {
      const res = await createUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
        password: formData.password,
        email: formData.email,
        role: 'TECHNICIAN',
        sectionIds: parsedSectionIds,
      });

      if (res.success) {
        setMessage({
          type: 'success',
          text: `Technician account created successfully for ${formData.firstName} ${formData.lastName}`,
        });
        // Add new user to local state
        if (res.data) {
          setUsers((prev) => [
            ...prev,
            {
              id: res.data.id,
              firstName: res.data.firstName,
              lastName: res.data.lastName,
              email: res.data.email,
              role: res.data.role,
              isActive: res.data.isActive,
              sectionIds: res.data.sectionIds,
              sectionNames: res.data.sectionNames,
              createdAt: res.data.createdAt,
            },
          ]);
        }
        setFormData({
          firstName: '',
          lastName: '',
          password: '',
          email: '',
          sectionIdsText: '',
        });
        setShowAddForm(false);
      } else {
        setMessage({
          type: 'error',
          text: res.error || 'Failed to create technician',
        });
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text:
          err instanceof Error ? err.message : 'Failed to create technician',
      });
    }
    setIsPending(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const technicians = users.filter((u) => u.role === 'TECHNICIAN');

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div />
        <div className="lg:hidden">
          <LogoCompact />
        </div>
      </div>

      {/* Decorative line */}
      <div className="h-1 bg-gradient-to-r from-[#c41e3a] via-[#b8860b] to-[#003366] dark:from-[#e84855] dark:via-[#ffd700] dark:to-[#4a90e2] rounded-full mb-6" />

      {/* Success/Error Message */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${
            message.type === 'success'
              ? 'bg-[#10b981]/10 dark:bg-[#10b981]/20 border-2 border-[#10b981]/30'
              : 'bg-[#c41e3a]/10 dark:bg-[#e84855]/20 border-2 border-[#c41e3a]/30 dark:border-[#e84855]/40'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle
              size={20}
              className="text-[#10b981] flex-shrink-0 mt-0.5"
            />
          ) : (
            <AlertCircle
              size={20}
              className="text-[#c41e3a] dark:text-[#e84855] flex-shrink-0 mt-0.5"
            />
          )}
          <p
            className={`font-medium ${
              message.type === 'success'
                ? 'text-[#10b981]'
                : 'text-[#c41e3a] dark:text-[#e84855]'
            }`}
          >
            {message.text}
          </p>
        </div>
      )}

      {/* Add Technician Button */}
      <button
        onClick={() => setShowAddForm(!showAddForm)}
        className="mb-6 px-6 py-3 rounded-xl bg-gradient-to-r from-[#c41e3a] to-[#8b1e3f] dark:from-[#e84855] dark:to-[#c75b7a] text-white hover:from-[#8b1e3f] hover:to-[#c41e3a] dark:hover:from-[#c75b7a] dark:hover:to-[#e84855] transition-all shadow-lg hover:shadow-xl shadow-[#c41e3a]/30 dark:shadow-[#e84855]/30 flex items-center gap-2 w-full sm:w-auto justify-center font-semibold ring-2 ring-[#b8860b]/50 dark:ring-[#ffd700]/50"
      >
        <UserPlus size={20} />
        {showAddForm ? 'Cancel' : 'Add New Technician'}
      </button>

      {/* Add Technician Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 p-6 mb-6 shadow-lg">
          <h2 className="text-gray-900 dark:text-white mb-6 font-bold text-lg">
            Create New Technician Account
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-2 font-semibold">
                  First Name *
                </label>
                <div className="relative">
                  <User
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#c41e3a]/60 dark:text-[#e84855]/60"
                    size={18}
                  />
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    placeholder="John"
                    disabled={isPending}
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-2 font-semibold">
                  Last Name
                </label>
                <div className="relative">
                  <User
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#c41e3a]/60 dark:text-[#e84855]/60"
                    size={18}
                  />
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    placeholder="Doe"
                    disabled={isPending}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2 font-semibold">
                Email *
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#c41e3a]/60 dark:text-[#e84855]/60"
                  size={18}
                />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  placeholder="technician@lab.local"
                  disabled={isPending}
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2 font-semibold">
                Password *
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#c41e3a]/60 dark:text-[#e84855]/60"
                  size={18}
                />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  placeholder="Minimum 8 characters"
                  disabled={isPending}
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2 font-semibold">
                Section IDs
              </label>
              <input
                type="text"
                value={formData.sectionIdsText}
                onChange={(e) =>
                  setFormData({ ...formData, sectionIdsText: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
                placeholder="e.g. 1, 3"
                disabled={isPending}
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-[#c41e3a] to-[#8b1e3f] dark:from-[#e84855] dark:to-[#c75b7a] text-white hover:from-[#8b1e3f] hover:to-[#c41e3a] dark:hover:from-[#c75b7a] dark:hover:to-[#e84855] transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 font-semibold ring-2 ring-[#b8860b]/50 dark:ring-[#ffd700]/50"
            >
              <CheckCircle size={18} />
              {isPending ? 'Creating Account...' : 'Create Technician Account'}
            </button>
          </form>
        </div>
      )}

      {/* Technicians List */}
      <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-[#c41e3a]/10 dark:border-[#e84855]/20">
          <div className="flex items-center gap-3">
            <Users size={24} className="text-[#c41e3a] dark:text-[#e84855]" />
            <h2 className="text-gray-900 dark:text-white font-bold text-lg">
              Technician Accounts
            </h2>
          </div>
          <span className="px-4 py-2 rounded-lg bg-[#b8860b]/10 dark:bg-[#ffd700]/20 text-[#b8860b] dark:text-[#ffd700] font-semibold">
            {technicians.length}{' '}
            {technicians.length === 1 ? 'technician' : 'technicians'}
          </span>
        </div>

        <div className="space-y-3">
          {technicians.map((technician) => {
            const initials =
              `${technician.firstName?.[0] || ''}${technician.lastName?.[0] || ''}`.toUpperCase() ||
              '?';
            const fullName =
              `${technician.firstName} ${technician.lastName}`.trim();

            return (
              <div
                key={technician.id}
                className="p-5 bg-[#fff8f0] dark:bg-[#2a2a2a] rounded-xl hover:bg-[#fef3e2] dark:hover:bg-[#333333] transition-colors border border-[#c41e3a]/10 dark:border-[#e84855]/20"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#c41e3a] to-[#8b1e3f] dark:from-[#e84855] dark:to-[#c75b7a] flex items-center justify-center text-white flex-shrink-0 shadow-lg ring-2 ring-[#b8860b] dark:ring-[#ffd700] font-bold">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div>
                        <h3 className="text-gray-900 dark:text-white font-semibold">
                          {fullName}
                        </h3>
                        <div className="mt-1 flex items-center gap-2">
                          <span
                            className={`inline-block w-2.5 h-2.5 rounded-full ${
                              technician.isActive
                                ? 'bg-[#10b981]'
                                : 'bg-[#c41e3a] dark:bg-[#e84855]'
                            }`}
                          />
                          <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                            {technician.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditUser(technician)}
                            disabled={isPending}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-[#003366]/10 dark:hover:bg-[#4a90e2]/20 hover:text-[#003366] dark:hover:text-[#4a90e2] transition-colors"
                          >
                            <Pencil size={14} />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleUserActive(technician)}
                            disabled={isPending}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-[#c41e3a]/10 dark:hover:bg-[#e84855]/20 hover:text-[#c41e3a] dark:hover:text-[#e84855] transition-colors"
                          >
                            <Power size={14} />
                            {technician.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        <span className="font-medium">Email:</span>{' '}
                        {technician.email}
                      </p>
                      {technician.sectionNames &&
                        technician.sectionNames.length > 0 && (
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            <span className="font-medium">Sections:</span>{' '}
                            {technician.sectionNames.join(', ')}
                          </p>
                        )}
                      {(!technician.sectionNames ||
                        technician.sectionNames.length === 0) &&
                        technician.sectionIds &&
                        technician.sectionIds.length > 0 && (
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            <span className="font-medium">Section IDs:</span>{' '}
                            {technician.sectionIds.join(', ')}
                          </p>
                        )}
                      {technician.createdAt && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          <span className="font-medium">Joined:</span>{' '}
                          {new Date(technician.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <span className="inline-block mt-2 px-3 py-1 rounded-lg bg-[#003366]/10 dark:bg-[#4a90e2]/20 text-[#003366] dark:text-[#4a90e2] text-xs font-semibold">
                      Technician
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Admin Info */}
      <div className="mt-6 bg-gradient-to-br from-[#b8860b]/5 to-[#fef3e2] dark:from-[#ffd700]/10 dark:to-[#2a2a2a] rounded-2xl border-2 border-[#b8860b]/30 dark:border-[#ffd700]/30 p-6 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#b8860b] to-[#d4af37] dark:from-[#ffd700] dark:to-[#f4c430] flex items-center justify-center text-white dark:text-[#1e1e1e] flex-shrink-0 shadow-lg ring-4 ring-[#b8860b]/30 dark:ring-[#ffd700]/30 font-bold text-lg">
            {`${currentUser?.firstName?.[0] || ''}${currentUser?.lastName?.[0] || ''}`.toUpperCase() ||
              '?'}
          </div>
          <div className="flex-1">
            <h3 className="text-gray-900 dark:text-white font-bold text-lg mb-1">
              {currentUser?.firstName} {currentUser?.lastName}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              <span className="font-medium">Email:</span> {currentUser?.email}
            </p>
            <span className="inline-block px-4 py-1.5 rounded-lg bg-[#b8860b] dark:bg-[#ffd700] text-white dark:text-[#1e1e1e] font-bold shadow-md">
              Administrator
            </span>
          </div>
        </div>
      </div>

      {editingUser && (
        <EditTechnicianModal
          user={editingUser}
          onCancel={() => setEditingUser(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}
