"use client";

import { useState } from 'react';
import { UserPlus, Users, Mail, User, Lock, CheckCircle, AlertCircle, Pencil, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { LogoCompact } from '@/components/Logo';
import { createUser, deleteUser, updateUser } from '@/lib/actions';
import { AdminUpdateUserDto } from '@/lib/types/api';

export type UserType = {
  id: string;
  username: string;
  fullName: string;
  email?: string | null;
  profileImage?: string | null;
  role: 'admin' | 'technician' | 'doctor';
  isActive?: boolean;
  lastActiveAt?: string;
};

type EditTechnicianModalProps = {
  user: UserType;
  onCancel: () => void;
  onSave: (updatedUser: Partial<UserType>) => Promise<void>;
};

function EditTechnicianModal({ user, onCancel, onSave }: EditTechnicianModalProps) {
  const [fullName, setFullName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email ?? '');
  const [username, setUsername] = useState(user.username);
  const [profileImage, setProfileImage] = useState(user.profileImage ?? '');
  const [isPending, setIsPending] = useState(false);

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProfileImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    await onSave({
      fullName,
      email,
      username,
      profileImage,
    });
    setIsPending(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 p-6 shadow-2xl">
        <h2 className="text-gray-900 dark:text-white mb-6 font-bold text-lg">Edit Technician</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2 font-semibold">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent"
              required
              disabled={isPending}
            />
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2 font-semibold">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent"
              disabled={isPending}
            />
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2 font-semibold">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent"
              required
              disabled={isPending}
            />
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2 font-semibold">Profile Picture</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleProfileImageChange}
              className="w-full px-4 py-3 rounded-xl border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white"
              disabled={isPending}
            />
            {profileImage && (
              <div className="mt-3">
                <Image
                  src={profileImage}
                  alt="Technician profile preview"
                  width={56}
                  height={56}
                  unoptimized
                  className="w-14 h-14 rounded-full object-cover border-2 border-[#c41e3a]/30 dark:border-[#e84855]/40"
                />
              </div>
            )}
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

const getLastActiveLabel = (lastActiveAt?: string | null) => {
  if (!lastActiveAt) {
    return 'Last active unknown';
  }

  const lastActiveDate = new Date(lastActiveAt);
  const now = new Date();
  const diffMs = now.getTime() - lastActiveDate.getTime();
  const dayMs = 1000 * 60 * 60 * 24;
  const days = Math.max(1, Math.floor(diffMs / dayMs));

  if (days < 7) {
    return `Last active ${days} day${days === 1 ? '' : 's'} ago`;
  }

  const weeks = Math.floor(days / 7);
  if (weeks < 5) {
    return `Last active ${weeks} week${weeks === 1 ? '' : 's'} ago`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return `Last active ${months} month${months === 1 ? '' : 's'} ago`;
  }

  const years = Math.floor(days / 365);
  return `Last active ${years} year${years === 1 ? '' : 's'} ago`;
};

export function UsersManager({ initialUsers, currentUser }: { initialUsers: UserType[], currentUser: UserType | null }) {
  const isAdmin = currentUser?.role === 'admin';
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    profileImage: '',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleEditUser = (user: UserType) => {
    setEditingUser(user);
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this technician?')) {
      setIsPending(true);
      const res = await deleteUser(Number(id));
      setIsPending(false);
      if (res.error) {
        alert(res.error);
      }
    }
  };

  const handleSaveEdit = async (updatedFields: Partial<UserType>) => {
    if (!editingUser) return;
    const res = await updateUser(Number(editingUser.id), updatedFields as unknown as AdminUpdateUserDto);
    if (!res.error) {
      setEditingUser(null);
    } else {
      alert(res.error);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-gray-900 dark:text-white">Access Denied</h1>
        </div>
        <div className="bg-[#c41e3a]/10 dark:bg-[#e84855]/20 border-2 border-[#c41e3a]/30 dark:border-[#e84855]/40 rounded-2xl p-8 text-center">
          <AlertCircle size={48} className="text-[#c41e3a] dark:text-[#e84855] mx-auto mb-4" />
          <p className="text-gray-900 dark:text-white font-semibold text-lg">Only administrators can access this page.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!formData.username || !formData.password || !formData.fullName) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    if (formData.username.length < 3) {
      setMessage({ type: 'error', text: 'Username must be at least 3 characters' });
      return;
    }

    if (formData.password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setIsPending(true);
    const res = await createUser({
      firstName: formData.fullName.split(' ')[0] || formData.fullName,
      lastName: formData.fullName.split(' ').slice(1).join(' ') || '',
      password: formData.password,
      email: formData.email || `${formData.username}@lab.local`,
      role: 'TECHNICIAN',
    });
    setIsPending(false);
    
    if (res.success) {
      setMessage({ type: 'success', text: `Technician account created successfully for ${formData.fullName}` });
      setFormData({ username: '', password: '', fullName: '', email: '', profileImage: '' });
      setShowAddForm(false);
      
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to create technician' });
    }
  };

  const technicians = initialUsers.filter((u) => u.role === 'doctor' || u.role === 'technician');

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
        <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${
          message.type === 'success' 
            ? 'bg-[#10b981]/10 dark:bg-[#10b981]/20 border-2 border-[#10b981]/30' 
            : 'bg-[#c41e3a]/10 dark:bg-[#e84855]/20 border-2 border-[#c41e3a]/30 dark:border-[#e84855]/40'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle size={20} className="text-[#10b981] flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle size={20} className="text-[#c41e3a] dark:text-[#e84855] flex-shrink-0 mt-0.5" />
          )}
          <p className={`font-medium ${
            message.type === 'success' ? 'text-[#10b981]' : 'text-[#c41e3a] dark:text-[#e84855]'
          }`}>
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
          <h2 className="text-gray-900 dark:text-white mb-6 font-bold text-lg">Create New Technician Account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2 font-semibold">Full Name *</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#c41e3a]/60 dark:text-[#e84855]/60" size={18} />
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  placeholder="Dr. John Doe"
                  disabled={isPending}
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2 font-semibold">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#c41e3a]/60 dark:text-[#e84855]/60" size={18} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  placeholder="technician@myghc.eg"
                  disabled={isPending}
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2 font-semibold">Username *</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#c41e3a]/60 dark:text-[#e84855]/60" size={18} />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  placeholder="johndoe"
                  disabled={isPending}
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2 font-semibold">Password *</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#c41e3a]/60 dark:text-[#e84855]/60" size={18} />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  placeholder="Minimum 6 characters"
                  disabled={isPending}
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2 font-semibold">Profile Picture</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) {
                    return;
                  }

                  const reader = new FileReader();
                  reader.onload = () => {
                    if (typeof reader.result === 'string') {
                      setFormData((prev) => ({ ...prev, profileImage: reader.result as string }));
                    }
                  };
                  reader.readAsDataURL(file);
                }}
                className="w-full px-4 py-3 rounded-xl border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white"
                disabled={isPending}
              />
              {formData.profileImage && (
                <div className="mt-3">
                  <Image
                    src={formData.profileImage}
                    alt="New technician profile preview"
                    width={56}
                    height={56}
                    unoptimized
                    className="w-14 h-14 rounded-full object-cover border-2 border-[#c41e3a]/30 dark:border-[#e84855]/40"
                  />
                </div>
              )}
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
            <h2 className="text-gray-900 dark:text-white font-bold text-lg">Technician Accounts</h2>
          </div>
          <span className="px-4 py-2 rounded-lg bg-[#b8860b]/10 dark:bg-[#ffd700]/20 text-[#b8860b] dark:text-[#ffd700] font-semibold">
            {technicians.length} {technicians.length === 1 ? 'technician' : 'technicians'}
          </span>
        </div>

        <div className="space-y-3">
          {technicians.map((technician) => (
            <div
              key={technician.username}
              className="p-5 bg-[#fff8f0] dark:bg-[#2a2a2a] rounded-xl hover:bg-[#fef3e2] dark:hover:bg-[#333333] transition-colors border border-[#c41e3a]/10 dark:border-[#e84855]/20"
            >
              <div className="flex items-start gap-4">
                {technician.profileImage ? (
                  <Image
                    src={technician.profileImage}
                    alt={`${technician.fullName} profile`}
                    width={48}
                    height={48}
                    unoptimized
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0 shadow-lg ring-2 ring-[#b8860b] dark:ring-[#ffd700]"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#c41e3a] to-[#8b1e3f] dark:from-[#e84855] dark:to-[#c75b7a] flex items-center justify-center text-white flex-shrink-0 shadow-lg ring-2 ring-[#b8860b] dark:ring-[#ffd700] font-bold">
                    {technician.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '?'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div>
                      <h3 className="text-gray-900 dark:text-white font-semibold">{technician.fullName}</h3>
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className={`inline-block w-2.5 h-2.5 rounded-full ${
                            technician.isActive ? 'bg-[#10b981]' : 'bg-[#c41e3a] dark:bg-[#e84855]'
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
                          onClick={() => handleDeleteUser(technician.id)}
                          disabled={isPending}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-[#c41e3a]/10 dark:hover:bg-[#e84855]/20 hover:text-[#c41e3a] dark:hover:text-[#e84855] transition-colors"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      <span className="font-medium">Username:</span> {technician.username}
                    </p>
                    {technician.email && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        <span className="font-medium">Email:</span> {technician.email}
                      </p>
                    )}
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      <span className="font-medium">{getLastActiveLabel(technician.lastActiveAt)}</span>
                    </p>
                  </div>
                  <span className="inline-block mt-2 px-3 py-1 rounded-lg bg-[#003366]/10 dark:bg-[#4a90e2]/20 text-[#003366] dark:text-[#4a90e2] text-xs font-semibold">
                    Technician
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Admin Info */}
      <div className="mt-6 bg-gradient-to-br from-[#b8860b]/5 to-[#fef3e2] dark:from-[#ffd700]/10 dark:to-[#2a2a2a] rounded-2xl border-2 border-[#b8860b]/30 dark:border-[#ffd700]/30 p-6 shadow-lg">
        <div className="flex items-start gap-4">
          {currentUser?.profileImage ? (
            <Image
              src={currentUser.profileImage}
              alt={`${currentUser.fullName} profile`}
              width={56}
              height={56}
              unoptimized
              className="w-14 h-14 rounded-full object-cover flex-shrink-0 shadow-lg ring-4 ring-[#b8860b]/30 dark:ring-[#ffd700]/30"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#b8860b] to-[#d4af37] dark:from-[#ffd700] dark:to-[#f4c430] flex items-center justify-center text-white dark:text-[#1e1e1e] flex-shrink-0 shadow-lg ring-4 ring-[#b8860b]/30 dark:ring-[#ffd700]/30 font-bold text-lg">
              {currentUser?.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '?'}
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-gray-900 dark:text-white font-bold text-lg mb-1">{currentUser?.fullName}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              <span className="font-medium">Username:</span> {currentUser?.username}
            </p>
            {currentUser?.email && (
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                <span className="font-medium">Email:</span> {currentUser.email}
              </p>
            )}
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
