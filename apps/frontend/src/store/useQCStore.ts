import { create } from 'zustand';

export interface QCFormState {
  selectedCategory: string;
  selectedMachine: string;
  testName: string;
  result: string;
  expectedRange: string;
  notes: string;
  setSelectedCategory: (value: string) => void;
  setSelectedMachine: (value: string) => void;
  setTestName: (value: string) => void;
  setResult: (value: string) => void;
  setExpectedRange: (value: string) => void;
  setNotes: (value: string) => void;
  resetForm: () => void;
}

export const useQCStore = create<QCFormState>((set) => ({
  selectedCategory: '',
  selectedMachine: '',
  testName: '',
  result: '',
  expectedRange: '',
  notes: '',
  setSelectedCategory: (value) => set({ selectedCategory: value }),
  setSelectedMachine: (value) => set({ selectedMachine: value }),
  setTestName: (value) => set({ testName: value }),
  setResult: (value) => set({ result: value }),
  setExpectedRange: (value) => set({ expectedRange: value }),
  setNotes: (value) => set({ notes: value }),
  resetForm: () =>
    set({
      selectedCategory: '',
      selectedMachine: '',
      testName: '',
      result: '',
      expectedRange: '',
      notes: '',
    }),
}));
