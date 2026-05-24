'use client';

import { useState, useTransition } from 'react';
import { Plus, Heart, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

import { createControlLot, deactivateControlLot } from '@/lib/actions';
import type { ControlLotResponseDto, CreateControlLotDto, QcTestResponseDto } from '@/lib/types/api';

interface CreateControlLotDialogProps {
  availableTests: QcTestResponseDto[];
  initialLots: ControlLotResponseDto[];
}

export function CreateControlLotDialog({ availableTests, initialLots }: CreateControlLotDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [testId, setTestId] = useState<string>('');
  const [lotNumber, setLotNumber] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [mean, setMean] = useState('');
  const [sd, setSd] = useState('');
  const [ucl, setUcl] = useState('');
  const [lcl, setLcl] = useState('');
  const [uwl, setUwl] = useState('');
  const [lwl, setLwl] = useState('');

  // Smart deactivation: holds the conflicting lot and the payload to submit after confirmation
  const [conflictLot, setConflictLot] = useState<ControlLotResponseDto | null>(null);
  const [pendingPayload, setPendingPayload] = useState<CreateControlLotDto | null>(null);

  // Auto-calculate limits: Mean ± 2SD for warning, Mean ± 3SD for control
  const handleAutoCalculateLimits = () => {
    if (!mean || !sd) {
      setError('Please enter Mean and Standard Deviation first.');
      return;
    }

    const meanVal = parseFloat(mean);
    const sdVal = parseFloat(sd);

    if (isNaN(meanVal) || isNaN(sdVal)) {
      setError('Please enter valid numbers for Mean and SD.');
      return;
    }

    setError(null);

    const uclValue = (meanVal + 3 * sdVal).toFixed(2);
    const lclValue = (meanVal - 3 * sdVal).toFixed(2);
    const uwlValue = (meanVal + 2 * sdVal).toFixed(2);
    const lwlValue = (meanVal - 2 * sdVal).toFixed(2);

    setUcl(uclValue);
    setLcl(lclValue);
    setUwl(uwlValue);
    setLwl(lwlValue);
  };

  const resetFormFields = () => {
    setTestId('');
    setLotNumber('');
    setExpirationDate('');
    setTargetValue('');
    setMean('');
    setSd('');
    setUcl('');
    setLcl('');
    setUwl('');
    setLwl('');
  };

  const buildPayload = (): CreateControlLotDto => ({
    testId: parseInt(testId),
    lotNumber,
    expirationDate,
    targetValue: targetValue ? parseFloat(targetValue) : undefined,
    mean: mean ? parseFloat(mean) : undefined,
    standardDeviation: sd ? parseFloat(sd) : undefined,
    upperControlLimit: ucl ? parseFloat(ucl) : undefined,
    lowerControlLimit: lcl ? parseFloat(lcl) : undefined,
    upperWarningLimit: uwl ? parseFloat(uwl) : undefined,
    lowerWarningLimit: lwl ? parseFloat(lwl) : undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!testId || !lotNumber || !expirationDate) {
      setError('Please fill in all required fields: QC Test, Lot Number, and Expiration Date.');
      return;
    }

    const payload = buildPayload();

    // Smart Deactivation: check for an existing active lot for the same test
    const existingActiveLot = initialLots.find(
      (lot) => lot.isActive && lot.testId === payload.testId,
    );

    if (existingActiveLot) {
      // Pause — ask the admin to confirm deactivation first
      setPendingPayload(payload);
      setConflictLot(existingActiveLot);
      return;
    }

    // No conflict — proceed directly
    startTransition(async () => {
      const result = await createControlLot(payload);
      if (result?.error) {
        setError(result.error);
      } else {
        setOpen(false);
        setError(null);
        resetFormFields();
      }
    });
  };

  // Called when the admin clicks "Yes, Deactivate" in the AlertDialog
  const handleConfirmDeactivate = () => {
    if (!conflictLot || !pendingPayload) return;

    const lotToDeactivate = conflictLot;
    const payload = pendingPayload;

    // Clear confirmation state immediately so the dialog closes
    setConflictLot(null);
    setPendingPayload(null);

    startTransition(async () => {
      // Step 1: deactivate the old lot
      const deactivateResult = await deactivateControlLot(lotToDeactivate.id);
      if (deactivateResult?.error) {
        setError(`Failed to deactivate old lot: ${deactivateResult.error}`);
        return;
      }

      // Step 2: create the new lot
      const createResult = await createControlLot(payload);
      if (createResult?.error) {
        setError(createResult.error);
      } else {
        setOpen(false);
        setError(null);
        resetFormFields();
      }
    });
  };

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-[#c41e3a] to-[#8b1e3f] dark:from-[#e84855] dark:to-[#c75b7a] text-white rounded-xl hover:from-[#8b1e3f] hover:to-[#c41e3a] dark:hover:from-[#c75b7a] dark:hover:to-[#e84855] transition-all shadow-lg hover:shadow-xl shadow-[#c41e3a]/30 dark:shadow-[#e84855]/30 whitespace-nowrap font-semibold ring-2 ring-[#b8860b]/50 dark:ring-[#ffd700]/50"
      >
        <Plus size={20} />
        Add Control Lot
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-[#c41e3a]/30 dark:border-[#e84855]/40">
            <div className="flex items-center justify-between p-5 sm:p-6 border-b-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 sticky top-0 bg-white dark:bg-[#1e1e1e] z-10">
              <div className="flex items-center gap-3">
                <Heart size={24} className="text-[#c41e3a] dark:text-[#e84855]" fill="currentColor" />
                <h2 className="text-gray-900 dark:text-white font-bold text-lg sm:text-xl">Create Control Lot</h2>
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

            {/* QC Test - Required */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2 font-semibold">QC Test *</label>
              <select
                id="test-select"
                value={testId}
                onChange={(e) => setTestId(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent"
              >
                <option value="">Select a QC Test</option>
                {availableTests.map((test) => (
                  <option key={test.id} value={test.id.toString()}>{test.testName}</option>
                ))}
              </select>
            </div>

            {/* Lot Number - Required */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2 font-semibold">Lot Number *</label>
              <input
                id="lot-number"
                type="text"
                placeholder="e.g., LOT-2026-001"
                value={lotNumber}
                onChange={(e) => setLotNumber(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>

            {/* Expiration Date - Required */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2 font-semibold">Expiration Date *</label>
              <input
                id="expiration-date"
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent"
              />
            </div>

            {/* Target Value - Optional */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2 font-semibold">Target Value <span className="font-normal text-gray-400">(Optional)</span></label>
              <input
                id="target-value"
                type="number"
                step="0.01"
                placeholder="e.g., 10.5"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="w-full px-4 py-3 border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>

            {/* Mean and SD */}
            <div className="space-y-3">
              <p className="text-gray-700 dark:text-gray-300 font-semibold text-sm">Statistical Parameters <span className="font-normal text-gray-400">(Optional)</span></p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-600 dark:text-gray-400 mb-2 text-sm font-medium">Mean</label>
                  <input
                    id="mean"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 10.0"
                    value={mean}
                    onChange={(e) => setMean(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 dark:text-gray-400 mb-2 text-sm font-medium">Standard Deviation</label>
                  <input
                    id="sd"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 0.5"
                    value={sd}
                    onChange={(e) => setSd(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleAutoCalculateLimits}
                disabled={isPending || !mean || !sd}
                className="w-full px-4 py-2.5 border-2 border-[#c41e3a]/30 dark:border-[#e84855]/40 text-[#c41e3a] dark:text-[#e84855] hover:bg-[#c41e3a]/10 dark:hover:bg-[#e84855]/20 transition-all font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed text-sm"
              >
                Auto-Calculate Limits (Mean ± 2SD / 3SD)
              </button>
            </div>

            {/* Control Limits */}
            <div className="space-y-3">
              <p className="text-gray-700 dark:text-gray-300 font-semibold text-sm">Control Limits <span className="font-normal text-gray-400">(Mean ± 3SD, Optional)</span></p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-600 dark:text-gray-400 mb-2 text-sm font-medium">Upper Control Limit</label>
                  <input
                    id="ucl"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 11.5"
                    value={ucl}
                    onChange={(e) => setUcl(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 dark:text-gray-400 mb-2 text-sm font-medium">Lower Control Limit</label>
                  <input
                    id="lcl"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 8.5"
                    value={lcl}
                    onChange={(e) => setLcl(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Warning Limits */}
            <div className="space-y-3">
              <p className="text-gray-700 dark:text-gray-300 font-semibold text-sm">Warning Limits <span className="font-normal text-gray-400">(Mean ± 2SD, Optional)</span></p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-600 dark:text-gray-400 mb-2 text-sm font-medium">Upper Warning Limit</label>
                  <input
                    id="uwl"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 11.0"
                    value={uwl}
                    onChange={(e) => setUwl(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 dark:text-gray-400 mb-2 text-sm font-medium">Lower Warning Limit</label>
                  <input
                    id="lwl"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 9.0"
                    value={lwl}
                    onChange={(e) => setLwl(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="flex-1 px-6 py-3 rounded-xl border-2 border-[#c41e3a]/30 dark:border-[#e84855]/40 text-[#c41e3a] dark:text-[#e84855] hover:bg-[#c41e3a]/10 dark:hover:bg-[#e84855]/20 transition-all font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-[#c41e3a] to-[#8b1e3f] dark:from-[#e84855] dark:to-[#c75b7a] text-white rounded-xl hover:from-[#8b1e3f] hover:to-[#c41e3a] dark:hover:from-[#c75b7a] dark:hover:to-[#e84855] transition-all shadow-lg hover:shadow-xl shadow-[#c41e3a]/30 dark:shadow-[#e84855]/30 font-semibold ring-2 ring-[#b8860b]/50 dark:ring-[#ffd700]/50"
              >
                {isPending ? 'Creating...' : 'Create Control Lot'}
              </button>
            </div>
          </form>
          </div>
        </div>
      )}

      {/* Smart Deactivation Confirmation */}
      <AlertDialog open={!!conflictLot} onOpenChange={(open) => { if (!open) { setConflictLot(null); setPendingPayload(null); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Active Lot Already Exists</AlertDialogTitle>
            <AlertDialogDescription>
              An active lot <strong>&ldquo;{conflictLot?.lotNumber}&rdquo;</strong> already exists for
              this test. Do you want to automatically deactivate the old lot and create the new one?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeactivate}
              disabled={isPending}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isPending ? 'Processing…' : 'Yes, Deactivate Old &amp; Create New'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
