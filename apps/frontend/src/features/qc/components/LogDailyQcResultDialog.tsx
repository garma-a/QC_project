'use client';

import { useState } from 'react';
import { z } from 'zod';
import { Heart, X } from 'lucide-react';
import { submitQcResult } from '@/lib/actions';

// ---------------------------------------------------------------------------
// Zod schema — strictly matches the qc_results DB columns
// ---------------------------------------------------------------------------
const logResultSchema = z.object({
  lotId: z.number({ invalid_type_error: 'Please select a Control Lot.' }).int().positive('Please select a Control Lot.'),
  measuredValue: z
    .number({ invalid_type_error: 'Measured value must be a number.' })
    .finite('Measured value must be a finite number.'),
  comments: z.string().optional(),
});

type LogResultForm = z.infer<typeof logResultSchema>;

// ---------------------------------------------------------------------------
// Prop types
// ---------------------------------------------------------------------------
export type LotOption = {
  lotId: number;
  lotNumber: string;
  testName: string;
  machineId: number;
  machineName: string;
};

interface LogDailyQcResultDialogProps {
  onClose: () => void;
  lots: LotOption[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function LogDailyQcResultDialog({ onClose, lots }: LogDailyQcResultDialogProps) {
  const [selectedMachineId, setSelectedMachineId] = useState<string>('');
  const [lotId, setLotId] = useState<string>('');
  const [measuredValue, setMeasuredValue] = useState<string>('');
  const [comments, setComments] = useState<string>('');
  const [errors, setErrors] = useState<Partial<Record<keyof LogResultForm | 'form', string>>>({});
  const [isPending, setIsPending] = useState(false);

  // Derive unique machines from the lots list so we can filter lots by machine
  const machines = Array.from(
    new Map(lots.map((l) => [l.machineId, { id: l.machineId, name: l.machineName }])).values(),
  );

  const filteredLots = selectedMachineId
    ? lots.filter((l) => l.machineId.toString() === selectedMachineId)
    : lots;

  const handleMachineChange = (value: string) => {
    setSelectedMachineId(value);
    setLotId(''); // reset lot when machine changes
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Parse and validate
    const parsed = logResultSchema.safeParse({
      lotId: lotId ? parseInt(lotId, 10) : undefined,
      measuredValue: measuredValue !== '' ? parseFloat(measuredValue) : undefined,
      comments: comments.trim() || undefined,
    });

    if (!parsed.success) {
      const fieldErrors: typeof errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof LogResultForm;
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setIsPending(true);
    const result = await submitQcResult(parsed.data);
    setIsPending(false);

    if (result?.error) {
      setErrors({ form: result.error });
    } else {
      onClose();
    }
  };

  const inputClass =
    'w-full px-4 py-3 border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed';
  const errorClass = 'mt-1 text-sm text-red-600 dark:text-red-400';
  const labelClass = 'block text-gray-700 dark:text-gray-300 mb-2 font-semibold';

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-[#c41e3a]/30 dark:border-[#e84855]/40">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 sticky top-0 bg-white dark:bg-[#1e1e1e] z-10">
          <div className="flex items-center gap-3">
            <Heart size={24} className="text-[#c41e3a] dark:text-[#e84855]" fill="currentColor" />
            <h2 className="text-gray-900 dark:text-white font-bold text-lg sm:text-xl">
              Log Daily QC Result
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-[#c41e3a] dark:hover:text-[#e84855] p-2 rounded-lg hover:bg-[#fff8f0] dark:hover:bg-[#2a2a2a] transition-all"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          {/* Form-level error */}
          {errors.form && (
            <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
              {errors.form}
            </div>
          )}

          {/* Machine filter (optional — narrows the lot list) */}
          <div>
            <label className={labelClass}>Filter by Machine (optional)</label>
            <select
              id="log-machine-select"
              value={selectedMachineId}
              onChange={(e) => handleMachineChange(e.target.value)}
              className={inputClass}
            >
              <option value="">All machines</option>
              {machines.map((m) => (
                <option key={m.id} value={m.id.toString()}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Control Lot / Test — required */}
          <div>
            <label htmlFor="log-lot-select" className={labelClass}>
              Control Lot / Test <span className="text-red-500">*</span>
            </label>
            <select
              id="log-lot-select"
              value={lotId}
              onChange={(e) => setLotId(e.target.value)}
              required
              className={inputClass}
            >
              <option value="">Select a control lot…</option>
              {filteredLots.map((l) => (
                <option key={l.lotId} value={l.lotId.toString()}>
                  {l.testName} — Lot {l.lotNumber} ({l.machineName})
                </option>
              ))}
            </select>
            {errors.lotId && <p className={errorClass}>{errors.lotId}</p>}
          </div>

          {/* Measured Value — required */}
          <div>
            <label htmlFor="log-measured-value" className={labelClass}>
              Measured Value <span className="text-red-500">*</span>
            </label>
            <input
              id="log-measured-value"
              type="number"
              step="any"
              value={measuredValue}
              onChange={(e) => setMeasuredValue(e.target.value)}
              required
              placeholder="e.g. 95.5"
              className={inputClass}
            />
            {errors.measuredValue && <p className={errorClass}>{errors.measuredValue}</p>}
          </div>

          {/* Comments — optional */}
          <div>
            <label htmlFor="log-comments" className={labelClass}>
              Comments (Optional)
            </label>
            <textarea
              id="log-comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
              placeholder="Add any observations or notes…"
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl border-2 border-[#c41e3a]/30 dark:border-[#e84855]/40 text-[#c41e3a] dark:text-[#e84855] hover:bg-[#c41e3a]/10 dark:hover:bg-[#e84855]/20 transition-all font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#c41e3a] to-[#8b1e3f] dark:from-[#e84855] dark:to-[#c75b7a] text-white rounded-xl hover:from-[#8b1e3f] hover:to-[#c41e3a] dark:hover:from-[#c75b7a] dark:hover:to-[#e84855] transition-all shadow-lg hover:shadow-xl shadow-[#c41e3a]/30 dark:shadow-[#e84855]/30 font-semibold ring-2 ring-[#b8860b]/50 dark:ring-[#ffd700]/50 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? 'Logging…' : 'Log QC Result'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
