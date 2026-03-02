"use client";

import { useState } from 'react';
import { UserPlus, Users, Mail, User, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { LogoCompact } from '@/components/Logo';

export default function UsersPage() {
  const { users, addDoctor, isAdmin, currentUser } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    email: ''
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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

  const handleSubmit = (e: React.FormEvent) => {
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

    const success = addDoctor(formData.username, formData.password, formData.fullName, formData.email);
    
    if (success) {
      setMessage({ type: 'success', text: `Doctor account created successfully for ${formData.fullName}` });
      setFormData({ username: '', password: '', fullName: '', email: '' });
      setShowAddForm(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: 'Username already exists. Please choose a different username.' });
    }
  };

  const doctors = users.filter(u => u.role === 'doctor');

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

      {/* Add Doctor Button */}
      <button
        onClick={() => setShowAddForm(!showAddForm)}
        className="mb-6 px-6 py-3 rounded-xl bg-gradient-to-r from-[#c41e3a] to-[#8b1e3f] dark:from-[#e84855] dark:to-[#c75b7a] text-white hover:from-[#8b1e3f] hover:to-[#c41e3a] dark:hover:from-[#c75b7a] dark:hover:to-[#e84855] transition-all shadow-lg hover:shadow-xl shadow-[#c41e3a]/30 dark:shadow-[#e84855]/30 flex items-center gap-2 w-full sm:w-auto justify-center font-semibold ring-2 ring-[#b8860b]/50 dark:ring-[#ffd700]/50"
      >
        <UserPlus size={20} />
        {showAddForm ? 'Cancel' : 'Add New Doctor'}
      </button>

      {/* Add Doctor Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 p-6 mb-6 shadow-lg">
          <h2 className="text-gray-900 dark:text-white mb-6 font-bold text-lg">Create New Doctor Account</h2>
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
                  placeholder="doctor@myghc.eg"
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
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-[#c41e3a] to-[#8b1e3f] dark:from-[#e84855] dark:to-[#c75b7a] text-white hover:from-[#8b1e3f] hover:to-[#c41e3a] dark:hover:from-[#c75b7a] dark:hover:to-[#e84855] transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 font-semibold ring-2 ring-[#b8860b]/50 dark:ring-[#ffd700]/50"
            >
              <CheckCircle size={18} />
              Create Doctor Account
            </button>
          </form>
        </div>
      )}

      {/* Doctors List */}
      <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-[#c41e3a]/10 dark:border-[#e84855]/20">
          <div className="flex items-center gap-3">
            <Users size={24} className="text-[#c41e3a] dark:text-[#e84855]" />
            <h2 className="text-gray-900 dark:text-white font-bold text-lg">Doctor Accounts</h2>
          </div>
          <span className="px-4 py-2 rounded-lg bg-[#b8860b]/10 dark:bg-[#ffd700]/20 text-[#b8860b] dark:text-[#ffd700] font-semibold">
            {doctors.length} {doctors.length === 1 ? 'doctor' : 'doctors'}
          </span>
        </div>

        <div className="space-y-3">
          {doctors.map((doctor) => (
            <div
              key={doctor.username}
              className="p-5 bg-[#fff8f0] dark:bg-[#2a2a2a] rounded-xl hover:bg-[#fef3e2] dark:hover:bg-[#333333] transition-colors border border-[#c41e3a]/10 dark:border-[#e84855]/20"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#c41e3a] to-[#8b1e3f] dark:from-[#e84855] dark:to-[#c75b7a] flex items-center justify-center text-white flex-shrink-0 shadow-lg ring-2 ring-[#b8860b] dark:ring-[#ffd700] font-bold">
                  {doctor.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-gray-900 dark:text-white font-semibold mb-1">{doctor.fullName}</h3>
                  <div className="space-y-1">
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      <span className="font-medium">Username:</span> {doctor.username}
                    </p>
                    {doctor.email && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        <span className="font-medium">Email:</span> {doctor.email}
                      </p>
                    )}
                  </div>
                  <span className="inline-block mt-2 px-3 py-1 rounded-lg bg-[#003366]/10 dark:bg-[#4a90e2]/20 text-[#003366] dark:text-[#4a90e2] text-xs font-semibold">
                    Doctor
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
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#b8860b] to-[#d4af37] dark:from-[#ffd700] dark:to-[#f4c430] flex items-center justify-center text-white dark:text-[#1e1e1e] flex-shrink-0 shadow-lg ring-4 ring-[#b8860b]/30 dark:ring-[#ffd700]/30 font-bold text-lg">
            {currentUser?.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
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
    </div>
  );
}
