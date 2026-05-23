/**
 * How many prior z-scores to fetch from the DB before evaluating rules.
 * The 10ₓ rule needs 10 consecutive points total → 1 current + 9 history.
 */
export const WESTGARD_HISTORY_SIZE = 9;

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

    // 4₁s — four consecutive on same side, all > ±1 SD → systematic drift
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

    // 10ₓ — ten consecutive on same side of mean → long-term systematic error
    if (zScores.length >= 10) {
        const last10 = zScores.slice(0, 10);
        if (last10.every(z => z > 0) || last10.every(z => z < 0)) {
            return {
                status: 'FAIL',
                violatedRule: '10_x',
                suggestedSolution: 'Long-term systematic shift. Recalibrate and review reagent lot performance over past days.',
            };
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
