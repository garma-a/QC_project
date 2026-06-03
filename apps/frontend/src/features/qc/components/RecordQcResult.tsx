"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Heart } from 'lucide-react';
import { submitQcResult } from '@/lib/actions';
import { CreateQcResultDto } from '@/lib/types/api';

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
  const [isPending, setIsPending] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedMachine, setSelectedMachine] = useState('');
  const [selectedLot, setSelectedLot] = useState('');
  const [measuredValue, setMeasuredValue] = useState('');
  const [comments, setComments] = useState('');

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredMachines = selectedCategory
    ? machines.filter(m => m.category === selectedCategory)
    : [];

  const selectedMachineObj = machines.find(m => m.id === selectedMachine);
  const activeLots = selectedMachineObj?.tests?.filter(t => t.lotId !== -1 && t.isActive) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numericMachineId = parseInt(selectedMachine, 10);
    const numericLotId = parseInt(selectedLot, 10);
    const numericValue = parseFloat(measuredValue);

    if (isNaN(numericMachineId) || isNaN(numericLotId) || isNaN(numericValue)) {
      alert("Please ensure Machine, Lot, and Measured Value are correctly filled.");
      return;
    }

    setIsPending(true);
    const payload: CreateQcResultDto = {
      machineId: numericMachineId,
      results: [
        {
          lotId: numericLotId,
          measuredValue: numericValue,
          comments: comments || undefined,
        }
      ]
    };
    
    const res = await submitQcResult(payload);
    setIsPending(false);

    if (res.error) {
      alert("Failed: " + res.error);
    } else {
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
                setSelectedLot('');
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
                setSelectedLot('');
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

          {/* Lot Selection */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2 font-semibold">Select Control Lot (Test Type)</label>
            <select
              value={selectedLot}
              onChange={(e) => setSelectedLot(e.target.value)}
              required
              disabled={!selectedMachine}
              className="w-full px-4 py-3 border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select a control lot</option>
              {activeLots.map(lot => (
                <option key={`${lot.id}-${lot.lotId}`} value={lot.lotId}>
                  {lot.name} - Lot {lot.lotNumber} (Level {lot.level})
                </option>
              ))}
            </select>
            {selectedMachine && activeLots.length === 0 && (
              <p className="text-[#c41e3a] dark:text-[#e84855] text-sm mt-2 font-medium">
                No active control lots found for this machine.
              </p>
            )}
          </div>

          {/* Measured Value */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2 font-semibold">Measured Value</label>
            <input
              type="number"
              step="any"
              value={measuredValue}
              onChange={(e) => setMeasuredValue(e.target.value)}
              required
              disabled={!selectedLot}
              placeholder="e.g., 95.5"
              className="w-full px-4 py-3 border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

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
              disabled={isPending || !selectedLot || !measuredValue}
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
