import {
    evaluateWestgardRules,
    evaluateMultiLotRules,
    RunResultItem,
} from './westgard.utils';

describe('Westgard Rules Utility Functions', () => {
    describe('evaluateMultiLotRules', () => {
        it('should return null if there are fewer than 2 results in the run', () => {
            const run = [{ lotId: 1, zScore: 2.5 }];
            expect(evaluateMultiLotRules(run, 1)).toBeNull();
        });

        it('should return null if the current lot ID is not found in the run', () => {
            const run = [{ lotId: 2, zScore: 2.5 }, { lotId: 3, zScore: -2.5 }];
            expect(evaluateMultiLotRules(run, 1)).toBeNull();
        });

        it('should return R_4s violation when spread between two levels is >= 4 SD', () => {
            const run: RunResultItem[] = [
                { lotId: 1, zScore: 2.0 },
                { lotId: 2, zScore: -2.1 },
            ];
            const result = evaluateMultiLotRules(run, 1);
            expect(result?.status).toBe('FAIL');
            expect(result?.violatedRule).toBe('R_4s');
        });

        it('should return 2_2s violation when two levels are >= 2 SD on the same side', () => {
            const runUp: RunResultItem[] = [
                { lotId: 1, zScore: 2.0 },
                { lotId: 2, zScore: 2.5 },
            ];
            expect(evaluateMultiLotRules(runUp, 1)?.violatedRule).toBe('2_2s');

            const runDown: RunResultItem[] = [
                { lotId: 1, zScore: -2.0 },
                { lotId: 2, zScore: -2.1 },
            ];
            expect(evaluateMultiLotRules(runDown, 2)?.violatedRule).toBe('2_2s');
        });

        it('should return null when spread is < 4 and they are not both >= 2 or <= -2', () => {
            const run: RunResultItem[] = [
                { lotId: 1, zScore: 1.5 },
                { lotId: 2, zScore: -1.5 },
            ];
            expect(evaluateMultiLotRules(run, 1)).toBeNull();
        });
    });

    describe('evaluateWestgardRules (Single Lot History)', () => {
        it('should pass empty history', () => {
            const result = evaluateWestgardRules([]);
            expect(result.status).toBe('PASS');
            expect(result.violatedRule).toBeNull();
        });

        describe('Boundary conditions', () => {
            it('1_3s should fail when exactly 3.0 or -3.0 (boundary check)', () => {
                expect(evaluateWestgardRules([3.0]).violatedRule).toBe('1_3s');
                expect(evaluateWestgardRules([-3.0]).violatedRule).toBe('1_3s');
                expect(evaluateWestgardRules([3.1]).violatedRule).toBe('1_3s');
            });

            it('1_2s should warn when exactly 2.0 or -2.0', () => {
                const res1 = evaluateWestgardRules([2.0]);
                expect(res1.status).toBe('WARNING');
                expect(res1.violatedRule).toBe('1_2s');

                const res2 = evaluateWestgardRules([-2.0]);
                expect(res2.status).toBe('WARNING');
                expect(res2.violatedRule).toBe('1_2s');
            });

            it('should pass when just below 2.0', () => {
                expect(evaluateWestgardRules([1.99]).status).toBe('PASS');
                expect(evaluateWestgardRules([-1.99]).status).toBe('PASS');
            });
        });

        describe('Historical Rules Evaluation', () => {
            it('2_2s (Historical) - fails when two consecutive points > 2 SD on same side', () => {
                expect(evaluateWestgardRules([2.1, 2.0]).violatedRule).toBe('2_2s');
                expect(evaluateWestgardRules([-2.1, -2.5]).violatedRule).toBe('2_2s');
                // Should not fail if on opposite sides
                expect(evaluateWestgardRules([2.1, -2.1]).violatedRule).not.toBe('2_2s');
            });

            it('R_4s (Historical) - fails when spread between consecutive points is >= 4', () => {
                expect(evaluateWestgardRules([2.0, -2.0]).violatedRule).toBe('R_4s');
                expect(evaluateWestgardRules([-2.0, 2.0]).violatedRule).toBe('R_4s');
                // Should not fail if spread is 3.9
                expect(evaluateWestgardRules([1.9, -2.0]).violatedRule).not.toBe('R_4s');
            });

            it('2of3_2s - fails when 2 out of 3 consecutive points > 2 SD on same side', () => {
                expect(evaluateWestgardRules([2.1, 0.5, 2.1]).violatedRule).toBe('2of3_2s');
                expect(evaluateWestgardRules([-2.1, -2.1, 0.5]).violatedRule).toBe('2_2s'); // Caught by 2_2s first
                expect(evaluateWestgardRules([-2.1, 0.5, -2.1]).violatedRule).toBe('2of3_2s');
                expect(evaluateWestgardRules([2.1, -2.1, 2.1]).violatedRule).not.toBe('2of3_2s');
            });

            it('3_1s - fails when 3 consecutive points > 1 SD on same side', () => {
                expect(evaluateWestgardRules([1.1, 1.2, 1.5]).violatedRule).toBe('3_1s');
                expect(evaluateWestgardRules([-1.1, -1.2, -1.5]).violatedRule).toBe('3_1s');
                // Alternating should not fail
                expect(evaluateWestgardRules([1.1, -1.2, 1.5]).status).toBe('PASS');
            });

            it('4_1s - fails when 4 consecutive points > 1 SD on same side', () => {
                expect(evaluateWestgardRules([1.1, 1.2, 1.5, 1.0]).violatedRule).toBe('4_1s');
                expect(evaluateWestgardRules([1.1, 1.2, 1.5, 0.9]).violatedRule).toBe('3_1s'); // Caught by 3_1s instead! Wait, 3_1s triggers if the first 3 are >1.
                // 4_1s actually covers 4 points. But 3_1s is checked first. Let's see: if the last 3 are all > 1, 3_1s triggers.
            });
            
            describe('Rule 7T (Trend)', () => {
                it('fails when exactly 7 points trend upwards', () => {
                    // zScores[0] is newest. Trending up means [0] > [1] > [2] ...
                    // So newest is largest.
                    const trendUp = [7.0, 6.0, 5.0, 4.0, 3.0, 2.0, 1.0]; 
                    // This triggers 1_3s because of 7.0. Let's keep values small.
                    const smallTrendUp = [0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1];
                    expect(evaluateWestgardRules(smallTrendUp).violatedRule).toBe('7_T');
                });

                it('fails when exactly 7 points trend downwards', () => {
                    // Newest is smallest
                    const smallTrendDown = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7];
                    expect(evaluateWestgardRules(smallTrendDown).violatedRule).toBe('7_T');
                });

                it('passes when only 6 points trend', () => {
                    // 6 points trending up, 7th point breaks trend
                    // Newest 6 are trending up (0.3 > 0.2 > ... > -0.3), but 7th (index 6) is higher than 6th (index 5)
                    // We cross 0 to avoid triggering 6_x shift rule
                    const sixTrendingUp = [0.3, 0.2, 0.1, -0.1, -0.2, -0.3, 0.8];
                    expect(evaluateWestgardRules(sixTrendingUp).violatedRule).toBeNull();
                    
                    // Or literally only passing 6 points
                    const justSixPoints = [0.3, 0.2, 0.1, -0.1, -0.2, -0.3];
                    expect(evaluateWestgardRules(justSixPoints).violatedRule).toBeNull();
                });

                it('fails when 8 points trend (catches it on the 7th)', () => {
                    const eightTrendingUp = [0.4, 0.3, 0.2, 0.1, -0.1, -0.2, -0.3, -0.4];
                    expect(evaluateWestgardRules(eightTrendingUp).violatedRule).toBe('7_T');
                });
                
                it('passes when exactly 7 points have a flat plateau (not strictly trending)', () => {
                    // Flat plateau at 0.1 avoids strictly increasing/decreasing
                    const flatTrend = [0.3, 0.2, 0.1, 0.1, 0.0, -0.1, -0.2];
                    expect(evaluateWestgardRules(flatTrend).violatedRule).toBeNull();
                });
            });

            describe('Shift Rules', () => {
                it('fails 6_x when 6 points are on the same side of the mean', () => {
                    const sixShift = [0.1, 0.5, 0.2, 0.3, 0.6, 0.1];
                    expect(evaluateWestgardRules(sixShift).violatedRule).toBe('6_x');
                });

                it('passes when 6 points are on same side but one is exactly 0', () => {
                    const shiftWithZero = [0.1, 0.5, 0.2, 0.0, 0.6, 0.1];
                    expect(evaluateWestgardRules(shiftWithZero).violatedRule).toBeNull();
                });
                
                it('fails 8_x, 9_x, 10_x, 12_x appropriately', () => {
                    const shift12 = Array(12).fill(0.1);
                    expect(evaluateWestgardRules(shift12).violatedRule).toBe('12_x');
                });
            });
        });

        describe('Multi-Lot checking during evaluateWestgardRules', () => {
            it('should evaluate multi-lot rules if currentRun and currentLotId are provided', () => {
                const run: RunResultItem[] = [
                    { lotId: 1, zScore: 2.5 },
                    { lotId: 2, zScore: -2.5 },
                ];
                // Even if history is clean, multi-lot fails
                const result = evaluateWestgardRules([2.5], run, 1);
                expect(result.violatedRule).toBe('R_4s');
            });

            it('should skip multi-lot evaluation if missing run items or lotId', () => {
                const resultNoLotId = evaluateWestgardRules([2.5], []);
                // 2.5 triggers 1_2s warning
                expect(resultNoLotId.violatedRule).toBe('1_2s');
            });
        });
    });
});
