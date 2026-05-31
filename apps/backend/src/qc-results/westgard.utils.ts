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
 * Represents a single result from the current run being evaluated.
 * Used only by the Multi-Lot rules which need to compare results across
 * different control levels (materials) submitted in the same batch.
 */
export interface RunResultItem {
    lotId: number;
    zScore: number;
}

// ─── PHASE 1: MULTI-LOT RULES ────────────────────────────────────────────────
// These rules are only meaningful when 2+ materials (levels) are submitted in
// the SAME run. They compare z-scores across different control lots, not across
// time. This is why they must run before the single-lot historical rules.

/**
 * Evaluates Westgard rules that require multiple control materials in the same run.
 * Returns a violation if found, or null if the run is clean across all materials.
 *
 * @param currentRun - All results from the current submission batch.
 * @param currentLotId - The lot being evaluated now (used to pair it with others).
 */
export function evaluateMultiLotRules(
    currentRun: RunResultItem[],
    currentLotId: number,
): WestgardEvaluation | null {
    // Multi-Lot rules only apply when there are 2 or more levels in the run.
    if (currentRun.length < 2) return null;

    const currentItem = currentRun.find(r => r.lotId === currentLotId);
    if (!currentItem) return null;

    const z = currentItem.zScore;

    for (const other of currentRun) {
        if (other.lotId === currentLotId) continue; // Don't compare a lot to itself

        // R₄s (Cross-Material) — the spread between Level 1 and Level 2 exceeds 4 SD.
        // This is the DEFINITIVE multi-lot rule. It catches random error that would be
        // completely invisible if you only looked at each level's history separately.
        // Example: Level 1 = +2.1 SD, Level 2 = -2.1 SD → spread = 4.2 → FAIL.
        if (Math.abs(z - other.zScore) >= 4) {
            return {
                status: 'FAIL',
                violatedRule: 'R_4s',
                suggestedSolution:
                    'Large random error detected across control levels. The spread between materials exceeds 4 SD. Check for sample mix-up, pipetting error, or reagent contamination.',
            };
        }

        // 2₂s (Cross-Material) — both Level 1 and Level 2 exceed 2 SD on the SAME side.
        // This catches a calibration shift that pushes all materials in the same direction.
        // Single-lot 2₂s catches this over TIME; this cross-material check catches it INSTANTLY
        // in a single run, making it a much faster early-warning system.
        if ((z >= 2 && other.zScore >= 2) || (z <= -2 && other.zScore <= -2)) {
            return {
                status: 'FAIL',
                violatedRule: '2_2s',
                suggestedSolution:
                    'Systematic bias detected across control levels. Both materials deviated in the same direction. Check calibration and reagent lot integrity.',
            };
        }
    }

    return null; // No multi-lot violation found for this lot
}

// ─── PHASE 2: SINGLE-LOT HISTORICAL RULES ────────────────────────────────────
// These rules evaluate a single lot against its own history over time.
// They detect slow drifts, trends, and systematic shifts that build up over days.

/**
 * Evaluates Westgard multi-rule analysis for a single control lot using its history.
 *
 * @param zScores - Z-scores newest-first (index 0 = current point just submitted).
 * @param currentRun - All results from the current submission batch (for multi-lot checks).
 * @param currentLotId - The lot being evaluated (to identify itself within the run).
 */
export function evaluateWestgardRules(
    zScores: number[],
    currentRun: RunResultItem[] = [],
    currentLotId?: number,
): WestgardEvaluation {
    if (zScores.length === 0) return { status: 'PASS', violatedRule: null, suggestedSolution: '' };

    // --- PHASE 1: Check Multi-Lot rules first (instant cross-material detection) ---
    // We only run this if the caller provided the full run context.
    if (currentRun.length >= 2 && currentLotId !== undefined) {
        const multiLotViolation = evaluateMultiLotRules(currentRun, currentLotId);
        if (multiLotViolation) return multiLotViolation;
    }

    // --- PHASE 2: Single-Lot Historical rules ---
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

        // 2₂s (Historical) — two consecutive on same side, both > ±2 SD → systematic error over time
        if ((z >= 2 && zPrev >= 2) || (z <= -2 && zPrev <= -2)) {
            return {
                status: 'FAIL',
                violatedRule: '2_2s',
                suggestedSolution: 'Systematic bias detected. Check calibration, reagent lot change, or instrument drift.',
            };
        }

        // R₄s (Historical) — spread between this point and the PREVIOUS run's point > 4 SD
        // Note: The cross-material R₄s (Phase 1) is more powerful. This catches large swings
        // in a single lot over consecutive runs (e.g., day 1 = +2.5, day 2 = -2.0).
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
