import { describe, it, expect, beforeEach } from 'vitest';
import { useQCStore } from '../useQCStore';

describe('useQCStore', () => {
  beforeEach(() => {
    useQCStore.getState().resetForm();
  });

  it('initializes with default empty values', () => {
    const state = useQCStore.getState();
    expect(state.selectedCategory).toBe('');
    expect(state.selectedMachine).toBe('');
    expect(state.testName).toBe('');
    expect(state.result).toBe('');
    expect(state.expectedRange).toBe('');
    expect(state.notes).toBe('');
  });

  it('updates selected category correctly', () => {
    useQCStore.getState().setSelectedCategory('chemistry');
    expect(useQCStore.getState().selectedCategory).toBe('chemistry');
  });

  it('updates multiple fields correctly', () => {
    const { setSelectedMachine, setTestName, setResult, setExpectedRange, setNotes } = useQCStore.getState();
    
    setSelectedMachine('M1');
    setTestName('Test1');
    setResult('100');
    setExpectedRange('90-110');
    setNotes('Some notes');

    const state = useQCStore.getState();
    expect(state.selectedMachine).toBe('M1');
    expect(state.testName).toBe('Test1');
    expect(state.result).toBe('100');
    expect(state.expectedRange).toBe('90-110');
    expect(state.notes).toBe('Some notes');
  });

  it('resets form to initial values', () => {
    const { setSelectedCategory, setResult, resetForm } = useQCStore.getState();
    
    setSelectedCategory('hematology');
    setResult('50');
    
    expect(useQCStore.getState().selectedCategory).toBe('hematology');
    expect(useQCStore.getState().result).toBe('50');

    resetForm();

    const state = useQCStore.getState();
    expect(state.selectedCategory).toBe('');
    expect(state.result).toBe('');
  });
});
