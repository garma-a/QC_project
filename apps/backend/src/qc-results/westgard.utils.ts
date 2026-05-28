/**
 * How many prior z-scores to fetch from the DB before evaluating rules.
 * The 12ₓ rule needs 12 consecutive points total → 1 current + 11 history.
 */
export const WESTGARD_HISTORY_SIZE = 11;

export type QcStatus = 'PASS' | 'WARNING' | 'FAIL';

export interface WestgardEvaluation {
    status: QcStatus;
    violatedRule: string | null;
    suggestedSolution: string;
}

/**
 * Evaluates Westgard multi-rule analysis.
 * @param zScores - Z-scores newest-first (index 0 = current point just submitted)
 */
export function evaluateWestgardRules(zScores: number[]): WestgardEvaluation {
    if (zScores.length === 0) return { status: 'PASS', violatedRule: null, suggestedSolution: '' };

    const z = zScores[0]; // current point

    // 1₃s — single point > ±3 SD → random error, reject immediately
    if (Math.abs(z) >= 3) {
        return {
            status: 'FAIL',
            violatedRule: '1_3s',
            suggestedSolution: 'Stop patient testing. Rerun control. If failure persists, recalibrate and troubleshoot the analyzer.',
        };
    }

    if (zScores.length >= 2) {
        const zPrev = zScores[1];

        // 2₂s — two consecutive on same side, both > ±2 SD → systematic error
        if ((z >= 2 && zPrev >= 2) || (z <= -2 && zPrev <= -2)) {
            return {
                status: 'FAIL',
                violatedRule: '2_2s',
                suggestedSolution: 'Systematic bias detected. Check calibration, reagent lot change, or instrument drift.',
            };
        }

        // R₄s — spread between consecutive > 4 SD → random error
        if (Math.abs(z - zPrev) >= 4) {
            return {
                status: 'FAIL',
                violatedRule: 'R_4s',
                suggestedSolution: 'Large random error. Check for sample mix-up, pipetting error, or reagent contamination.',
            };
        }
    }

    // 2 of 3_2s — 2 out of 3 consecutive points > ±2 SD on the same side
    if (zScores.length >= 3) {
        const last3 = zScores.slice(0, 3);
        const countPlus2 = last3.filter(z => z >= 2).length;
        const countMinus2 = last3.filter(z => z <= -2).length;
        if (countPlus2 >= 2 || countMinus2 >= 2) {
            return {
                status: 'FAIL',
                violatedRule: '2of3_2s',
                suggestedSolution: '2 out of 3 points exceeded 2 SD on the same side. Systematic bias.',
            };
        }
        
        // 3_1s — 3 consecutive points > ±1 SD on the same side
        if (last3.every(z => z >= 1) || last3.every(z => z <= -1)) {
            return {
                status: 'FAIL',
                violatedRule: '3_1s',
                suggestedSolution: '3 consecutive points exceeded 1 SD. Shift in the mean.',
            };
        }
    }

    // 4₁s — four consecutive on same side, all > ±1 SD
    if (zScores.length >= 4) {
        const last4 = zScores.slice(0, 4);
        if (last4.every(z => z >= 1) || last4.every(z => z <= -1)) {
            return {
                status: 'FAIL',
                violatedRule: '4_1s',
                suggestedSolution: 'Systematic drift over 4 runs. Inspect reagent stability, temperature, and calibration status.',
            };
        }
    }

    // 7_T (Trend Rule) — 7 consecutive points trending in the same direction
    if (zScores.length >= 7) {
        const last7 = zScores.slice(0, 7);
        let trendingUp = true;
        let trendingDown = true;
        // zScores are newest-first: zScores[0] is newest.
        // Trending up means zScores[0] > zScores[1] > zScores[2] ...
        for (let i = 0; i < 6; i++) {
            if (last7[i] <= last7[i+1]) trendingUp = false;
            if (last7[i] >= last7[i+1]) trendingDown = false;
        }
        if (trendingUp || trendingDown) {
            return {
                status: 'FAIL',
                violatedRule: '7_T',
                suggestedSolution: 'Systematic drift detected (7 points trending). Inspect reagent aging or instrument drift.',
            };
        }
    }

    // X consecutive points on same side of mean (12_x, 10_x, 9_x, 8_x, 6_x)
    const shiftRules = [
        { count: 12, rule: '12_x' },
        { count: 10, rule: '10_x' },
        { count: 9, rule: '9_x' },
        { count: 8, rule: '8_x' },
        { count: 6, rule: '6_x' }
    ];

    for (const { count, rule } of shiftRules) {
        if (zScores.length >= count) {
            const lastX = zScores.slice(0, count);
            if (lastX.every(z => z > 0) || lastX.every(z => z < 0)) {
                return {
                    status: 'FAIL',
                    violatedRule: rule,
                    suggestedSolution: `Long-term systematic shift (${count} points). Recalibrate and review reagent lot performance.`,
                };
            }
        }
    }

    // 1₂s — single point > ±2 SD → warning only, do not reject
    if (Math.abs(z) >= 2) {
        return {
            status: 'WARNING',
            violatedRule: '1_2s',
            suggestedSolution: 'Repeat QC run and monitor trend. Inspect reagents and calibration logs if warning repeats.',
        };
    }

    return { status: 'PASS', violatedRule: null, suggestedSolution: '' };
}
