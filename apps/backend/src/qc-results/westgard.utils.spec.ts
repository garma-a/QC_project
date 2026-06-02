import { evaluateWestgardRules, evaluateMultiLotRules, RunResultItem } from './westgard.utils';

describe('Westgard Rules', () => {
  describe('evaluateMultiLotRules', () => {
    it('should return null if there are less than 2 lots in the run', () => {
      expect(evaluateMultiLotRules([{ lotId: 1, zScore: 2.5 }], 1)).toBeNull();
    });

    it('should return null if there is no multi-lot violation', () => {
      const run: RunResultItem[] = [
        { lotId: 1, zScore: 1.0 },
        { lotId: 2, zScore: -1.0 },
      ];
      expect(evaluateMultiLotRules(run, 1)).toBeNull();
    });

    it('should catch R_4s (Cross-Material) when spread is exactly 4', () => {
      const run: RunResultItem[] = [
        { lotId: 1, zScore: 2.0 },
        { lotId: 2, zScore: -2.0 },
      ];
      const result = evaluateMultiLotRules(run, 1);
      expect(result).not.toBeNull();
      expect(result?.status).toBe('FAIL');
      expect(result?.violatedRule).toBe('R_4s');
    });

    it('should catch R_4s (Cross-Material) when spread is > 4', () => {
      const run: RunResultItem[] = [
        { lotId: 1, zScore: 2.1 },
        { lotId: 2, zScore: -2.1 },
      ];
      const result = evaluateMultiLotRules(run, 1);
      expect(result?.violatedRule).toBe('R_4s');
    });

    it('should catch 2_2s (Cross-Material) when both exceed +2 SD', () => {
      const run: RunResultItem[] = [
        { lotId: 1, zScore: 2.1 },
        { lotId: 2, zScore: 2.2 },
      ];
      const result = evaluateMultiLotRules(run, 1);
      expect(result?.violatedRule).toBe('2_2s');
      expect(result?.status).toBe('FAIL');
    });

    it('should catch 2_2s (Cross-Material) when both exceed -2 SD', () => {
      const run: RunResultItem[] = [
        { lotId: 1, zScore: -2.0 },
        { lotId: 2, zScore: -2.5 },
      ];
      const result = evaluateMultiLotRules(run, 1);
      expect(result?.violatedRule).toBe('2_2s');
      expect(result?.status).toBe('FAIL');
    });
  });

  describe('evaluateWestgardRules (Single-Lot Historical)', () => {
    it('should return PASS if history is empty', () => {
      expect(evaluateWestgardRules([])).toEqual(expect.objectContaining({ status: 'PASS' }));
    });

    it('should trigger multi-lot rules first if context is provided', () => {
      const run: RunResultItem[] = [
        { lotId: 1, zScore: 2.5 },
        { lotId: 2, zScore: -2.0 },
      ];
      // This has a spread of 4.5 -> R_4s Cross-Material
      const result = evaluateWestgardRules([2.5], run, 1);
      expect(result.violatedRule).toBe('R_4s');
      expect(result.status).toBe('FAIL');
    });

    it('should catch 1_3s when abs(z) > 3', () => {
      expect(evaluateWestgardRules([3.1]).violatedRule).toBe('1_3s');
      expect(evaluateWestgardRules([-3.01]).violatedRule).toBe('1_3s');
    });

    it('should NOT catch 1_3s when abs(z) === 3 (boundary check)', () => {
      const result = evaluateWestgardRules([3.0]);
      // Should fall through to 1_2s warning instead
      expect(result.violatedRule).toBe('1_2s');
      expect(result.status).toBe('WARNING');
    });

    it('should catch 2_2s (Historical) when two consecutive >= +2 SD', () => {
      expect(evaluateWestgardRules([2.1, 2.0]).violatedRule).toBe('2_2s');
    });

    it('should catch R_4s (Historical) when spread between current and last is >= 4', () => {
      expect(evaluateWestgardRules([2.0, -2.0]).violatedRule).toBe('R_4s');
    });

    it('should catch 2of3_2s when 2 of 3 points are >= 2 SD', () => {
      expect(evaluateWestgardRules([2.1, 1.0, 2.0]).violatedRule).toBe('2of3_2s');
      expect(evaluateWestgardRules([-2.1, -1.0, -2.0]).violatedRule).toBe('2of3_2s');
    });

    it('should catch 3_1s when 3 consecutive are >= +1 SD', () => {
      expect(evaluateWestgardRules([1.1, 1.2, 1.0]).violatedRule).toBe('3_1s');
    });

    it('should catch 4_1s when 4 consecutive are >= +1 SD', () => {
      expect(evaluateWestgardRules([1.1, 1.2, 1.0, 1.5]).violatedRule).toBe('4_1s');
    });

    it('should catch 7_T when 7 points trend in one direction (ascending)', () => {
      // Note: zScores are newest-first, so zScores[0] > zScores[1] ... means ascending
      expect(evaluateWestgardRules([1.5, 1.0, 0.5, 0.0, -0.5, -1.0, -1.5]).violatedRule).toBe('7_T');
    });

    it('should catch 7_T when 7 points trend in one direction (descending)', () => {
      expect(evaluateWestgardRules([-1.5, -1.0, -0.5, 0.0, 0.5, 1.0, 1.5]).violatedRule).toBe('7_T');
    });

    it('should NOT catch 7_T for 6 points', () => {
      expect(evaluateWestgardRules([1.8, 1.7, 1.6, 1.5, 1.4, 1.3]).violatedRule).not.toBe('7_T');
    });

    it('should catch 6_x when 6 consecutive points are on the same side of mean', () => {
      expect(evaluateWestgardRules([0.5, 0.2, 0.8, 0.9, 0.1, 0.3]).violatedRule).toBe('6_x');
    });

    it('should catch 1_2s warning when abs(z) >= 2', () => {
      expect(evaluateWestgardRules([2.0]).violatedRule).toBe('1_2s');
      expect(evaluateWestgardRules([2.0]).status).toBe('WARNING');
    });

    it('should return PASS if no rules are violated', () => {
      expect(evaluateWestgardRules([1.0, -1.0, 0.5, -0.5]).status).toBe('PASS');
    });
  });
});
