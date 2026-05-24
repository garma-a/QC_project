'use client';

import { useState, useTransition } from 'react';
import { updateQcTest } from '@/lib/actions';
import type { MachineResponseDto, QcTestResponseDto } from '@/lib/types/api';
import { Pencil, Heart, X } from 'lucide-react';

interface EditQcTestDialogProps {
  machines: MachineResponseDto[];
  test: QcTestResponseDto;
}

export function EditQcTestDialog({ machines, test }: EditQcTestDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [testName, setTestName] = useState(test.testName);
  const [testType, setTestType] = useState(test.testType || '');
  const [machineId, setMachineId] = useState<string>(test.machineId.toString());

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!testName) {
      setError('Test Name is required.');
      return;
    }

    if (!machineId) {
      setError('Machine is required.');
      return;
    }

    const payload = {
      testName,
      testType: testType || undefined,
      machineId: Number(machineId),
    };

    startTransition(async () => {
      const result = await updateQcTest(test.id, payload);
      if (result?.error) {
        setError(result.error);
      } else {
        setOpen(false);
      }
    });
  }

  const resetFormFields = () => {
    setTestName(test.testName);
    setTestType(test.testType || '');
    setMachineId(test.machineId.toString());
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 text-gray-500 dark:text-gray-400 hover:text-[#c41e3a] dark:hover:text-[#e84855] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-lg transition-all"
        title="Edit QC Test"
      >
        <Pencil size={18} />
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 text-left">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-[#c41e3a]/30 dark:border-[#e84855]/40">
            <div className="flex items-center justify-between p-5 sm:p-6 border-b-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 sticky top-0 bg-white dark:bg-[#1e1e1e] z-10">
              <div className="flex items-center gap-3">
                <Heart size={24} className="text-[#c41e3a] dark:text-[#e84855]" fill="currentColor" />
                <h2 className="text-gray-900 dark:text-white font-bold text-lg sm:text-xl">Edit QC Test</h2>
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

              {/* Test Name - Required */}
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-2 font-semibold">Test Name *</label>
                <input
                  id="testName"
                  type="text"
                  placeholder="e.g. Hemoglobin Test"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  required
                  minLength={2}
                  className="w-full px-4 py-3 border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>

              {/* Test Type - Optional */}
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-2 font-semibold">Test Type <span className="font-normal text-gray-400">(Optional)</span></label>
                <input
                  id="testType"
                  type="text"
                  placeholder="e.g. Quantitative, Qualitative"
                  value={testType}
                  onChange={(e) => setTestType(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>

              {/* Machine - Required */}
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-2 font-semibold">Machine *</label>
                <select
                  id="machine"
                  value={machineId}
                  onChange={(e) => setMachineId(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent"
                >
                  <option value="">Select a machine</option>
                  {machines.map((machine) => (
                    <option key={machine.id} value={machine.id.toString()}>
                      {machine.name}
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
                  disabled={isPending || !machineId || !testName}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#c41e3a] to-[#8b1e3f] dark:from-[#e84855] dark:to-[#c75b7a] text-white rounded-xl hover:from-[#8b1e3f] hover:to-[#c41e3a] dark:hover:from-[#c75b7a] dark:hover:to-[#e84855] transition-all shadow-lg hover:shadow-xl shadow-[#c41e3a]/30 dark:shadow-[#e84855]/30 font-semibold ring-2 ring-[#b8860b]/50 dark:ring-[#ffd700]/50 disabled:opacity-50"
                >
                  {isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
