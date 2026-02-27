// Westgard Quality Control Rules Implementation
// Statistical calculations and rule violation detection for lab QC

export interface QCDataPoint {
  date: string;
  value: number;
  testName?: string;
  qcLevel?: string;
}

export interface WestgardStats {
  mean: number;
  stdDev: number;
  plus1s: number;
  plus2s: number;
  plus3s: number;
  minus1s: number;
  minus2s: number;
  minus3s: number;
}

export interface WestgardViolation {
  rule: string;
  description: string;
  severity: 'warning' | 'reject';
  affectedPoints: number[];
  message: string;
}

export interface QCPointWithStatus extends QCDataPoint {
  status: 'normal' | 'warning' | 'reject';
  violations: string[];
  zScore: number;
}

/**
 * Calculate mean (average) of values
 */
export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calculate standard deviation
 */
export function calculateStdDev(values: number[], mean?: number): number {
  if (values.length < 2) return 0;
  
  const avg = mean !== undefined ? mean : calculateMean(values);
  const squareDiffs = values.map(value => Math.pow(value - avg, 2));
  const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / (values.length - 1);
  
  return Math.sqrt(avgSquareDiff);
}

/**
 * Calculate Westgard control limits
 */
export function calculateWestgardStats(values: number[]): WestgardStats {
  const mean = calculateMean(values);
  const stdDev = calculateStdDev(values, mean);
  
  return {
    mean,
    stdDev,
    plus1s: mean + stdDev,
    plus2s: mean + 2 * stdDev,
    plus3s: mean + 3 * stdDev,
    minus1s: mean - stdDev,
    minus2s: mean - 2 * stdDev,
    minus3s: mean - 3 * stdDev,
  };
}

/**
 * Calculate Z-score (number of standard deviations from mean)
 */
export function calculateZScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

/**
 * Check 1-2s rule: Warning when one control exceeds ±2 standard deviations
 */
function check_1_2s(points: QCDataPoint[], stats: WestgardStats): WestgardViolation | null {
  const violations = points
    .map((point, index) => ({ point, index }))
    .filter(({ point }) => point.value > stats.plus2s || point.value < stats.minus2s);
  
  if (violations.length > 0) {
    return {
      rule: '1-2s',
      description: 'One control exceeds ±2 SD',
      severity: 'warning',
      affectedPoints: violations.map(v => v.index),
      message: `${violations.length} point(s) exceed ±2 standard deviations - Warning level`,
    };
  }
  
  return null;
}

/**
 * Check 1-3s rule: Reject when one control exceeds ±3 standard deviations
 */
function check_1_3s(points: QCDataPoint[], stats: WestgardStats): WestgardViolation | null {
  const violations = points
    .map((point, index) => ({ point, index }))
    .filter(({ point }) => point.value > stats.plus3s || point.value < stats.minus3s);
  
  if (violations.length > 0) {
    return {
      rule: '1-3s',
      description: 'One control exceeds ±3 SD',
      severity: 'reject',
      affectedPoints: violations.map(v => v.index),
      message: `${violations.length} point(s) exceed ±3 standard deviations - REJECT run`,
    };
  }
  
  return null;
}

/**
 * Check 2-2s rule: Reject when two consecutive controls exceed +2s or both exceed -2s
 */
function check_2_2s(points: QCDataPoint[], stats: WestgardStats): WestgardViolation | null {
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i].value;
    const next = points[i + 1].value;
    
    // Both exceed +2s
    if (current > stats.plus2s && next > stats.plus2s) {
      return {
        rule: '2-2s',
        description: 'Two consecutive controls exceed same ±2 SD',
        severity: 'reject',
        affectedPoints: [i, i + 1],
        message: 'Two consecutive points exceed +2 SD - REJECT run (systematic error)',
      };
    }
    
    // Both exceed -2s
    if (current < stats.minus2s && next < stats.minus2s) {
      return {
        rule: '2-2s',
        description: 'Two consecutive controls exceed same ±2 SD',
        severity: 'reject',
        affectedPoints: [i, i + 1],
        message: 'Two consecutive points exceed -2 SD - REJECT run (systematic error)',
      };
    }
  }
  
  return null;
}

/**
 * Check R-4s rule: Reject when range between consecutive controls exceeds 4 standard deviations
 */
function check_R_4s(points: QCDataPoint[], stats: WestgardStats): WestgardViolation | null {
  for (let i = 0; i < points.length - 1; i++) {
    const range = Math.abs(points[i + 1].value - points[i].value);
    
    if (range > 4 * stats.stdDev) {
      return {
        rule: 'R-4s',
        description: 'Range between consecutive controls exceeds 4 SD',
        severity: 'reject',
        affectedPoints: [i, i + 1],
        message: `Range of ${range.toFixed(2)} exceeds 4 SD - REJECT run (random error)`,
      };
    }
  }
  
  return null;
}

/**
 * Check 4-1s rule: Reject when four consecutive controls exceed +1s or all exceed -1s
 */
function check_4_1s(points: QCDataPoint[], stats: WestgardStats): WestgardViolation | null {
  if (points.length < 4) return null;
  
  for (let i = 0; i <= points.length - 4; i++) {
    const fourPoints = points.slice(i, i + 4);
    
    // All exceed +1s
    const allAbovePlus1s = fourPoints.every(p => p.value > stats.plus1s);
    if (allAbovePlus1s) {
      return {
        rule: '4-1s',
        description: 'Four consecutive controls exceed same ±1 SD',
        severity: 'reject',
        affectedPoints: [i, i + 1, i + 2, i + 3],
        message: 'Four consecutive points exceed +1 SD - REJECT run (systematic error)',
      };
    }
    
    // All exceed -1s
    const allBelowMinus1s = fourPoints.every(p => p.value < stats.minus1s);
    if (allBelowMinus1s) {
      return {
        rule: '4-1s',
        description: 'Four consecutive controls exceed same ±1 SD',
        severity: 'reject',
        affectedPoints: [i, i + 1, i + 2, i + 3],
        message: 'Four consecutive points exceed -1 SD - REJECT run (systematic error)',
      };
    }
  }
  
  return null;
}

/**
 * Check 10x rule: Reject when ten consecutive controls fall on same side of mean
 */
function check_10x(points: QCDataPoint[], stats: WestgardStats): WestgardViolation | null {
  if (points.length < 10) return null;
  
  for (let i = 0; i <= points.length - 10; i++) {
    const tenPoints = points.slice(i, i + 10);
    
    // All above mean
    const allAboveMean = tenPoints.every(p => p.value > stats.mean);
    if (allAboveMean) {
      return {
        rule: '10x',
        description: 'Ten consecutive controls on same side of mean',
        severity: 'reject',
        affectedPoints: Array.from({ length: 10 }, (_, idx) => i + idx),
        message: 'Ten consecutive points above mean - REJECT run (systematic error)',
      };
    }
    
    // All below mean
    const allBelowMean = tenPoints.every(p => p.value < stats.mean);
    if (allBelowMean) {
      return {
        rule: '10x',
        description: 'Ten consecutive controls on same side of mean',
        severity: 'reject',
        affectedPoints: Array.from({ length: 10 }, (_, idx) => i + idx),
        message: 'Ten consecutive points below mean - REJECT run (systematic error)',
      };
    }
  }
  
  return null;
}

/**
 * Apply all Westgard rules to QC data
 */
export function applyWestgardRules(points: QCDataPoint[]): {
  violations: WestgardViolation[];
  stats: WestgardStats;
  pointsWithStatus: QCPointWithStatus[];
} {
  if (points.length < 2) {
    const stats = { mean: 0, stdDev: 0, plus1s: 0, plus2s: 0, plus3s: 0, minus1s: 0, minus2s: 0, minus3s: 0 };
    return {
      violations: [],
      stats,
      pointsWithStatus: points.map(p => ({ ...p, status: 'normal' as const, violations: [], zScore: 0 })),
    };
  }
  
  const values = points.map(p => p.value);
  const stats = calculateWestgardStats(values);
  
  // Check all rules
  const violations: WestgardViolation[] = [];
  
  const rule_1_3s = check_1_3s(points, stats);
  if (rule_1_3s) violations.push(rule_1_3s);
  
  const rule_2_2s = check_2_2s(points, stats);
  if (rule_2_2s) violations.push(rule_2_2s);
  
  const rule_R_4s = check_R_4s(points, stats);
  if (rule_R_4s) violations.push(rule_R_4s);
  
  const rule_4_1s = check_4_1s(points, stats);
  if (rule_4_1s) violations.push(rule_4_1s);
  
  const rule_10x = check_10x(points, stats);
  if (rule_10x) violations.push(rule_10x);
  
  const rule_1_2s = check_1_2s(points, stats);
  if (rule_1_2s) violations.push(rule_1_2s);
  
  // Create points with status
  const pointsWithStatus: QCPointWithStatus[] = points.map((point, index) => {
    const zScore = calculateZScore(point.value, stats.mean, stats.stdDev);
    const affectedViolations = violations.filter(v => v.affectedPoints.includes(index));
    
    let status: 'normal' | 'warning' | 'reject' = 'normal';
    const violationRules: string[] = [];
    
    for (const violation of affectedViolations) {
      violationRules.push(violation.rule);
      if (violation.severity === 'reject') {
        status = 'reject';
      } else if (violation.severity === 'warning' && status === 'normal') {
        status = 'warning';
      }
    }
    
    return {
      ...point,
      status,
      violations: violationRules,
      zScore,
    };
  });
  
  return {
    violations,
    stats,
    pointsWithStatus,
  };
}

/**
 * Get color for data point based on status
 */
export function getPointColor(status: 'normal' | 'warning' | 'reject', isDark: boolean): string {
  if (status === 'reject') {
    return isDark ? '#e84855' : '#c41e3a';
  }
  if (status === 'warning') {
    return isDark ? '#ffd700' : '#b8860b';
  }
  return isDark ? '#4ade80' : '#22c55e';
}

/**
 * Format Westgard statistics for display
 */
export function formatWestgardStats(stats: WestgardStats, decimals: number = 2): Record<string, string> {
  return {
    'Mean': stats.mean.toFixed(decimals),
    '+1 SD': stats.plus1s.toFixed(decimals),
    '+2 SD': stats.plus2s.toFixed(decimals),
    '+3 SD': stats.plus3s.toFixed(decimals),
    '-1 SD': stats.minus1s.toFixed(decimals),
    '-2 SD': stats.minus2s.toFixed(decimals),
    '-3 SD': stats.minus3s.toFixed(decimals),
    'Std Dev': stats.stdDev.toFixed(decimals),
  };
}
