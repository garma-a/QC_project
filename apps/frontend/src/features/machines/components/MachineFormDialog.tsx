'use client';

import { useState, useTransition } from 'react';
import { createMachine, updateMachine } from '@/lib/actions';
import type { SectionResponseDto, MachineResponseDto } from '@/lib/types/api';
import { Plus, Heart, X, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MachineFormDialogProps {
  mode: 'create' | 'edit';
  initialData?: MachineResponseDto;
  sections: SectionResponseDto[];
}

export function MachineFormDialog({ mode, initialData, sections }: MachineFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  
  // Managing sectionId via state since Select requires controlled state to easily extract value
  const [sectionId, setSectionId] = useState<string>(initialData?.sectionId.toString() || '');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const hospCode = formData.get('hospCode') as string;

    if (!name || !sectionId) {
      setError('Machine Name and Section are required.');
      return;
    }

    const payload = {
      name,
      hospCode: hospCode || undefined,
      sectionId: Number(sectionId),
    };

    startTransition(async () => {
      let result;
      if (mode === 'create') {
        result = await createMachine(payload);
      } else {
        result = await updateMachine(initialData!.id, payload);
      }

      if (result?.error) {
        setError(result.error);
      } else {
        setOpen(false);
        // Reset state for next open if creating
        if (mode === 'create') setSectionId('');
      }
    });
  }

  const resetFormFields = () => {
    if (mode === 'create') {
      setSectionId('');
    } else {
      setSectionId(initialData?.sectionId.toString() || '');
    }
  };

  const handleOpenClick = () => {
    setOpen(true);
    resetFormFields();
  };

  return (
    <>
      {mode === 'create' ? (
        <button 
          onClick={handleOpenClick}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-[#c41e3a] to-[#8b1e3f] dark:from-[#e84855] dark:to-[#c75b7a] text-white rounded-xl hover:from-[#8b1e3f] hover:to-[#c41e3a] dark:hover:from-[#c75b7a] dark:hover:to-[#e84855] transition-all shadow-lg hover:shadow-xl shadow-[#c41e3a]/30 dark:shadow-[#e84855]/30 whitespace-nowrap font-semibold ring-2 ring-[#b8860b]/50 dark:ring-[#ffd700]/50"
        >
          <Plus size={20} />
          Add Machine
        </button>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          onClick={handleOpenClick}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      )}

      {open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-[#c41e3a]/30 dark:border-[#e84855]/40">
            <div className="flex items-center justify-between p-5 sm:p-6 border-b-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 sticky top-0 bg-white dark:bg-[#1e1e1e] z-10">
              <div className="flex items-center gap-3">
                <Heart size={24} className="text-[#c41e3a] dark:text-[#e84855]" fill="currentColor" />
                <h2 className="text-gray-900 dark:text-white font-bold text-lg sm:text-xl">
                  {mode === 'create' ? 'Add Machine' : 'Edit Machine'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setError(null);
                  resetFormFields();
                }}
                className="text-gray-400 dark:text-gray-500 hover:text-[#c41e3a] dark:hover:text-[#e84855] p-2 rounded-lg hover:bg-[#fff8f0] dark:hover:bg-[#2a2a2a] transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6">
              {error && <div className="text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">{error}</div>}

              {/* Machine Name - Required */}
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-2 font-semibold">Machine Name *</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="e.g. Sysmex XN-1000"
                  defaultValue={initialData?.name}
                  required
                  minLength={2}
                  className="w-full px-4 py-3 border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>

              {/* Hospital Code - Optional */}
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-2 font-semibold">Hospital Code <span className="font-normal text-gray-400">(Optional)</span></label>
                <input
                  id="hospCode"
                  name="hospCode"
                  type="text"
                  placeholder="e.g. LAB-HEM-01"
                  defaultValue={initialData?.hospCode || ''}
                  className="w-full px-4 py-3 border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>

              {/* Section - Required */}
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-2 font-semibold">Section *</label>
                <select
                  id="section"
                  value={sectionId}
                  onChange={(e) => setSectionId(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent"
                >
                  <option value="">Select a section</option>
                  {sections.map((section) => (
                    <option key={section.id} value={section.id.toString()}>
                      {section.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t-2 border-[#c41e3a]/10 dark:border-[#e84855]/20 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setError(null);
                    resetFormFields();
                  }}
                  disabled={isPending}
                  className="flex-1 px-6 py-3 rounded-xl border-2 border-[#c41e3a]/30 dark:border-[#e84855]/40 text-[#c41e3a] dark:text-[#e84855] hover:bg-[#c41e3a]/10 dark:hover:bg-[#e84855]/20 transition-all font-semibold disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !sectionId}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#c41e3a] to-[#8b1e3f] dark:from-[#e84855] dark:to-[#c75b7a] text-white rounded-xl hover:from-[#8b1e3f] hover:to-[#c41e3a] dark:hover:from-[#c75b7a] dark:hover:to-[#e84855] transition-all shadow-lg hover:shadow-xl shadow-[#c41e3a]/30 dark:shadow-[#e84855]/30 font-semibold ring-2 ring-[#b8860b]/50 dark:ring-[#ffd700]/50 disabled:opacity-50"
                >
                  {isPending ? 'Saving...' : 'Save Machine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
