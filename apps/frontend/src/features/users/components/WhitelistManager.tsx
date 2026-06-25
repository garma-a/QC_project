"use client";

import { useState, useEffect, useTransition } from 'react';
import { Mail, Plus, Trash2, AlertCircle, CheckCircle2, Clock, Search } from 'lucide-react';
import {
  addEmailToWhitelistAction,
  removeEmailFromWhitelistAction,
  getWhitelistedEmailsAction,
} from '@/lib/actions';

type WhitelistEntry = {
  id: number;
  email: string;
  createdAt: string;
};

export function WhitelistManager() {
  const [entries, setEntries] = useState<WhitelistEntry[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loadingInit, setLoadingInit] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getWhitelistedEmailsAction().then((res) => {
      if (res.success && res.data) setEntries(res.data);
      setLoadingInit(false);
    });
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    startTransition(async () => {
      const result = await addEmailToWhitelistAction(newEmail.trim().toLowerCase());
      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        setEntries((prev) => [...prev, result.data!]);
        setNewEmail('');
        setSuccessMsg(`${result.data.email} added to whitelist.`);
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    });
  };

  const handleRemove = async (email: string) => {
    setError('');
    setSuccessMsg('');

    startTransition(async () => {
      const result = await removeEmailFromWhitelistAction(email);
      if (result.error) {
        setError(result.error);
      } else {
        setEntries((prev) => prev.filter((e) => e.email !== email));
        setSuccessMsg(`${email} removed from whitelist.`);
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    });
  };

  const filtered = entries.filter((e) =>
    e.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] shadow-md overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 dark:border-[#2a2a2a] bg-gradient-to-r from-[#003366]/5 to-transparent dark:from-[#4a90e2]/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#003366]/10 dark:bg-[#4a90e2]/20 flex items-center justify-center">
            <Mail size={20} className="text-[#003366] dark:text-[#4a90e2]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Email Whitelist</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Add technician emails to allow them to self-register
            </p>
          </div>
          <div className="ml-auto">
            <span className="text-xs font-semibold bg-[#003366]/10 dark:bg-[#4a90e2]/20 text-[#003366] dark:text-[#4a90e2] px-2.5 py-1 rounded-full">
              {entries.length} email{entries.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Feedback messages */}
        {error && (
          <div className="p-3.5 rounded-xl bg-[#c41e3a]/10 dark:bg-[#e84855]/20 border border-[#c41e3a]/30 dark:border-[#e84855]/40 flex items-start gap-3">
            <AlertCircle size={16} className="text-[#c41e3a] dark:text-[#e84855] flex-shrink-0 mt-0.5" />
            <p className="text-[#c41e3a] dark:text-[#e84855] text-sm">{error}</p>
          </div>
        )}
        {successMsg && (
          <div className="p-3.5 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700/50 flex items-start gap-3">
            <CheckCircle2 size={16} className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-green-700 dark:text-green-300 text-sm">{successMsg}</p>
          </div>
        )}

        {/* Add email form */}
        <form onSubmit={handleAdd} className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              <Mail size={16} />
            </div>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
              disabled={isPending}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#2a2a2a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003366] dark:focus:ring-[#4a90e2] focus:border-transparent transition-all text-sm placeholder:text-gray-400"
              placeholder="technician@hospital.com"
            />
          </div>
          <button
            type="submit"
            disabled={isPending || !newEmail}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#003366] dark:bg-[#4a90e2] text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60 shadow-sm"
          >
            <Plus size={16} />
            Add
          </button>
        </form>

        {/* Search */}
        {entries.length > 4 && (
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              <Search size={16} />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#2a2a2a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 focus:border-transparent transition-all text-sm placeholder:text-gray-400"
              placeholder="Search emails..."
            />
          </div>
        )}

        {/* Email list */}
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {loadingInit ? (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
              {search ? 'No matching emails found.' : 'No emails whitelisted yet. Add one above.'}
            </div>
          ) : (
            filtered.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#2a2a2a] border border-gray-100 dark:border-[#333] hover:border-gray-200 dark:hover:border-[#444] transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#003366]/10 dark:bg-[#4a90e2]/20 flex items-center justify-center flex-shrink-0">
                  <Mail size={14} className="text-[#003366] dark:text-[#4a90e2]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{entry.email}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock size={10} className="text-gray-400" />
                    <span className="text-[11px] text-gray-400 dark:text-gray-500">
                      Added {new Date(entry.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(entry.email)}
                  disabled={isPending}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#c41e3a] dark:hover:text-[#e84855] hover:bg-[#c41e3a]/10 dark:hover:bg-[#e84855]/10 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-30 flex-shrink-0"
                  title={`Remove ${entry.email}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
