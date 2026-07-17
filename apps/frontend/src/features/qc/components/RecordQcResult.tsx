"use client";

import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createPortal } from 'react-dom';
import { X, Heart } from 'lucide-react';
import { submitQcResult } from '@/lib/actions';
import { CreateQualityControlResultDto } from '@/lib/types/api';

interface RecordQcResultProps {
  onClose: () => void;
  machines: {
    id: string;
    name: string;
    category: string;
    model: string;
    tests: {
      id: string;
      name: string;
      category: string;
      code: string;
      unit: string;
      lowRange: number;
      highRange: number;
      lotId: number;
      level: number;
      lotNumber: string;
      isActive: boolean;
      mean: number;
      standardDeviation: number;
    }[];
  }[];
  categories: { id: string; name: string }[];
}

export function RecordQcResult({ onClose, machines, categories }: RecordQcResultProps) {
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedMachine, setSelectedMachine] = useState('');
  const [selectedTest, setSelectedTest] = useState('');
  const [measuredValues, setMeasuredValues] = useState<Record<number, string>>({});
  const [comments, setComments] = useState('');

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Step 1: Filter machines by selected category. If no category chosen yet, show nothing.
  const filteredMachines = selectedCategory
    ? machines.filter((m) => m.category === selectedCategory)
    : machines; // show all until a category is chosen

  // Step 2: Filter lots to only active lots belonging to the selected machine.
  const selectedMachineObj = machines.find((m) => m.id === selectedMachine);
  const allActiveLots = selectedMachineObj?.tests?.filter((t) => t.isActive) || [];

  const uniqueTests = Array.from(new Set(allActiveLots.map(t => t.id))).map(testId => {
    return allActiveLots.find(t => t.id === testId)!;
  });

  const testLots = allActiveLots.filter(t => t.id === selectedTest).sort((a, b) => a.level - b.level);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numericMachineId = parseInt(selectedMachine, 10);

    const results = testLots.map(lot => ({
      lotId: lot.lotId,
      measuredValue: parseFloat(measuredValues[lot.lotId]),
      comments: comments || undefined,
    }));

    if (isNaN(numericMachineId) || results.length === 0 || results.some(r => isNaN(r.measuredValue))) {
      alert("Please ensure Machine and all Measured Values are correctly filled.");
      return;
    }

    setIsPending(true);
    const payload: CreateQualityControlResultDto = {
      machineId: numericMachineId,
      results
    };
    
    const res = await submitQcResult(payload);
    setIsPending(false);

    if (res.error) {
      alert("Failed: " + res.error);
    } else {
      // Bust the React Query client-side cache so the history table
      // refetches immediately without a hard page refresh.
      await queryClient.invalidateQueries({ queryKey: ['qc-results-infinite'] });
      await queryClient.invalidateQueries({ queryKey: ['qc-context-data'] });
      onClose();
    }
  };

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-[#c41e3a]/30 dark:border-[#e84855]/40">
        <div className="flex items-center justify-between p-5 sm:p-6 border-b-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 sticky top-0 bg-white dark:bg-[#1e1e1e] z-10">
          <div className="flex items-center gap-3">
            <Heart size={24} className="text-[#c41e3a] dark:text-[#e84855]" fill="currentColor" />
            <h2 className="text-gray-900 dark:text-white font-bold text-lg sm:text-xl">Record QC Result</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-[#c41e3a] dark:hover:text-[#e84855] p-2 rounded-lg hover:bg-[#fff8f0] dark:hover:bg-[#2a2a2a] transition-all"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          {/* Category Selection */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2 font-semibold">Machine Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedMachine('');
                setSelectedTest('');
                setMeasuredValues({});
              }}
              required
              className="w-full px-4 py-3 border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent"
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Machine Selection */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2 font-semibold">Select Machine</label>
            <select
              value={selectedMachine}
              onChange={(e) => {
                setSelectedMachine(e.target.value);
                setSelectedTest('');
                setMeasuredValues({});
              }}
              required
              disabled={!selectedCategory}
              className="w-full px-4 py-3 border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select a machine</option>
              {filteredMachines.map(machine => (
                <option key={machine.id} value={machine.id}>
                  {machine.name} - {machine.model}
                </option>
              ))}
            </select>
          </div>

          {/* Test Selection */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2 font-semibold">Select Test</label>
            <select
              value={selectedTest}
              onChange={(e) => {
                setSelectedTest(e.target.value);
                setMeasuredValues({});
              }}
              required
              disabled={!selectedMachine}
              className="w-full px-4 py-3 border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select a test</option>
              {uniqueTests.map((test) => (
                <option key={test.id} value={test.id}>
                  {test.name}
                </option>
              ))}
            </select>
            {selectedMachine && uniqueTests.length === 0 && (
              <p className="text-[#c41e3a] dark:text-[#e84855] text-sm mt-2 font-medium">
                No active tests found for this machine. Please add control lots first.
              </p>
            )}
          </div>

          {/* Measured Values */}
          {selectedTest && testLots.length > 0 && (
            <div className="space-y-3">
              <label className="block text-gray-700 dark:text-gray-300 font-semibold">Measured Values</label>
              {testLots.map((lot) => (
                <div key={lot.lotId} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 bg-gray-50 dark:bg-[#2a2a2a] p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-48 shrink-0">
                    Level {lot.level} (Lot: {lot.lotNumber})
                  </span>
                  <input
                    type="number"
                    step="any"
                    value={measuredValues[lot.lotId] || ''}
                    onChange={(e) => setMeasuredValues({ ...measuredValues, [lot.lotId]: e.target.value })}
                    required
                    placeholder={`e.g., ${lot.mean}`}
                    className="w-full px-4 py-2 border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#1e1e1e] text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2 font-semibold">Notes (Optional)</label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
              placeholder="Add any additional comments or observations..."
              className="w-full px-4 py-3 border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl border-2 border-[#c41e3a]/30 dark:border-[#e84855]/40 text-[#c41e3a] dark:text-[#e84855] hover:bg-[#c41e3a]/10 dark:hover:bg-[#e84855]/20 transition-all font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !selectedTest || testLots.length === 0 || testLots.some(lot => !measuredValues[lot.lotId])}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#c41e3a] to-[#8b1e3f] dark:from-[#e84855] dark:to-[#c75b7a] text-white rounded-xl hover:from-[#8b1e3f] hover:to-[#c41e3a] dark:hover:from-[#c75b7a] dark:hover:to-[#e84855] transition-all shadow-lg hover:shadow-xl shadow-[#c41e3a]/30 dark:shadow-[#e84855]/30 font-semibold ring-2 ring-[#b8860b]/50 dark:ring-[#ffd700]/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? 'Submitting...' : 'Submit Result'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
