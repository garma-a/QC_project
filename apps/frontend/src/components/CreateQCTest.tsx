"use client";

import { X, Heart } from 'lucide-react';
import { machines, categories } from '../data/mockData';
import { useQCStore } from '../store/useQCStore';

interface CreateQCTestProps {
  onClose: () => void;
}

export function CreateQCTest({ onClose }: CreateQCTestProps) {
  const selectedCategory = useQCStore((state) => state.selectedCategory);
  const selectedMachine = useQCStore((state) => state.selectedMachine);
  const testName = useQCStore((state) => state.testName);
  const result = useQCStore((state) => state.result);
  const expectedRange = useQCStore((state) => state.expectedRange);
  const notes = useQCStore((state) => state.notes);
  const setSelectedCategory = useQCStore((state) => state.setSelectedCategory);
  const setSelectedMachine = useQCStore((state) => state.setSelectedMachine);
  const setTestName = useQCStore((state) => state.setTestName);
  const setResult = useQCStore((state) => state.setResult);
  const setExpectedRange = useQCStore((state) => state.setExpectedRange);
  const setNotes = useQCStore((state) => state.setNotes);
  const resetForm = useQCStore((state) => state.resetForm);

  const filteredMachines = selectedCategory
    ? machines.filter(m => m.category === selectedCategory)
    : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real application, this would submit to a backend
    alert(`QC Test Created!\n\nMachine: ${machines.find(m => m.id === selectedMachine)?.name}\nTest: ${testName}\nResult: ${result}`);
    resetForm();
    onClose();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-[#c41e3a]/30 dark:border-[#e84855]/40">
        <div className="flex items-center justify-between p-5 sm:p-6 border-b-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 sticky top-0 bg-white dark:bg-[#1e1e1e] z-10">
          <div className="flex items-center gap-3">
            <Heart size={24} className="text-[#c41e3a] dark:text-[#e84855]" fill="currentColor" />
            <h2 className="text-gray-900 dark:text-white font-bold text-lg sm:text-xl">Create New QC Test</h2>
          </div>
          <button 
            onClick={handleClose} 
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
              onChange={(e) => setSelectedMachine(e.target.value)}
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

          {/* Test Name */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2 font-semibold">Test Name</label>
            <input
              type="text"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              required
              placeholder="e.g., Glucose QC Level 1"
              className="w-full px-4 py-3 border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>

          {/* Result */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2 font-semibold">Result Value</label>
            <input
              type="text"
              value={result}
              onChange={(e) => setResult(e.target.value)}
              required
              placeholder="e.g., 95.5 mg/dL"
              className="w-full px-4 py-3 border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>

          {/* Expected Range */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2 font-semibold">Expected Range</label>
            <input
              type="text"
              value={expectedRange}
              onChange={(e) => setExpectedRange(e.target.value)}
              required
              placeholder="e.g., 90-110 mg/dL"
              className="w-full px-4 py-3 border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2 font-semibold">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Add any additional notes or observations..."
              className="w-full px-4 py-3 border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-6 py-3 rounded-xl border-2 border-[#c41e3a]/30 dark:border-[#e84855]/40 text-[#c41e3a] dark:text-[#e84855] hover:bg-[#c41e3a]/10 dark:hover:bg-[#e84855]/20 transition-all font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#c41e3a] to-[#8b1e3f] dark:from-[#e84855] dark:to-[#c75b7a] text-white rounded-xl hover:from-[#8b1e3f] hover:to-[#c41e3a] dark:hover:from-[#c75b7a] dark:hover:to-[#e84855] transition-all shadow-lg hover:shadow-xl shadow-[#c41e3a]/30 dark:shadow-[#e84855]/30 font-semibold ring-2 ring-[#b8860b]/50 dark:ring-[#ffd700]/50"
            >
              Create QC Test
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
