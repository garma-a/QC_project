"use client";

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  type TooltipProps,
  XAxis,
  YAxis,
} from 'recharts';
import { useTheme } from '@/contexts/ThemeContext';
import { TrendingUp, AlertTriangle, CheckCircle2, XCircle, Filter } from 'lucide-react';
import type { MachineResponseDto, QcResultResponseDto } from '@/lib/types/api';

const getPointColor = (status: string, isDark: boolean) => {
  if (status === 'reject') return isDark ? '#e84855' : '#c41e3a';
  if (status === 'warning') return isDark ? '#ffd700' : '#b8860b';
  return isDark ? '#4ade80' : '#22c55e';
};

const formatWestgardStats = (stats: any, decimals: number = 3) => ({
  'Mean': stats.mean.toFixed(decimals),
  'SD': stats.stdDev.toFixed(decimals),
  '+3s': stats.plus3s.toFixed(decimals),
  '+2s': stats.plus2s.toFixed(decimals),
  '+1s': stats.plus1s.toFixed(decimals),
  '-1s': stats.minus1s.toFixed(decimals),
  '-2s': stats.minus2s.toFixed(decimals),
  '-3s': stats.minus3s.toFixed(decimals),
});

interface MachineChartsProps {
  machine?: MachineForCharts;
  qcHistory: MonitorResultEntry[];
}

type MonitorResultEntry = QcResultResponseDto & {
  machineId: number;
  testId: number;
  testName: string;
  lotId: number;
  level: number;
  lotNumber: string;
};

type MachineForCharts = MachineResponseDto & {
  testsToday?: number;
  lastQC?: { date: string; status: string };
  tests?: {
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
};

type TestOption = {
  testId: string;
  testName: string;
  category: string;
  lots: {
    lotId: number;
    level: number;
    lotNumber: string;
    isActive: boolean;
    mean: number;
    standardDeviation: number;
  }[];
};

interface ChartDataPoint {
  date: string;
  value: number;
  mean: number;
  plus1s: number;
  plus2s: number;
  plus3s: number;
  minus1s: number;
  minus2s: number;
  minus3s: number;
  status: 'normal' | 'warning' | 'reject';
  zScore: number;
  violations: string;
  fill: string;
}

interface WestgardTooltipProps extends TooltipProps<number, string> {
  tooltipBorder: string;
  active?: boolean;
  payload?: Array<{ payload: ChartDataPoint }>;
}

function WestgardTooltip({ active, payload, tooltipBorder }: WestgardTooltipProps) {
  const data = payload?.[0]?.payload as ChartDataPoint | undefined;

  if (!active || !data) {
    return null;
  }

  return (
    <div
      className="bg-white dark:bg-[#1e1e1e] border-2 rounded-xl p-4 shadow-lg z-50"
      style={{ borderColor: tooltipBorder }}
    >
      <p className="font-bold text-gray-900 dark:text-white mb-2">{data.date}</p>
      <p className="text-gray-700 dark:text-gray-300">
        <span className="font-semibold">Value:</span> {data.value.toFixed(3)}
      </p>
      <p className="text-gray-700 dark:text-gray-300">
        <span className="font-semibold">Z-Score:</span> {data.zScore.toFixed(2)} SD
      </p>
      <p className="flex items-center gap-2 mt-2">
        {data.status === 'normal' && (
          <>
            <CheckCircle2 size={16} className="text-green-500" />
            <span className="text-green-600 dark:text-green-400 font-semibold">Normal</span>
          </>
        )}
        {data.status === 'warning' && (
          <>
            <AlertTriangle size={16} className="text-yellow-500" />
            <span className="text-yellow-600 dark:text-yellow-400 font-semibold">Warning</span>
          </>
        )}
        {data.status === 'reject' && (
          <>
            <XCircle size={16} className="text-red-500" />
            <span className="text-red-600 dark:text-red-400 font-semibold">Reject</span>
          </>
        )}
      </p>
      {data.violations && (
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          Rules: {data.violations}
        </p>
      )}
    </div>
  );
}

function LotChart({ lot, qcHistory, mode, startDate, endDate, machineName, testName, theme }: any) {
  const qcData = useMemo(() => {
    let filtered = qcHistory.filter((entry: any) => entry.lotId === lot.lotId);

    if (mode === 'archive') {
      const start = startDate ? new Date(startDate + 'T00:00:00').getTime() : 0;
      const end = endDate ? new Date(endDate + 'T23:59:59').getTime() : Infinity;
      filtered = filtered.filter((entry: any) => {
        const t = new Date(entry.testDate).getTime();
        return t >= start && t <= end;
      });
    }

    return filtered
      .slice()
      .sort((a: any, b: any) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime())
      .map((entry: any) => ({
        date: new Date(entry.testDate).toLocaleString(),
        value: entry.measuredValue,
        testName: entry.testName,
        zScore: entry.zScore,
        violatedRule: entry.violatedRule,
        status: entry.status === 'FAIL' ? 'reject' : entry.status === 'WARNING' ? 'warning' : 'normal',
      }));
  }, [lot, qcHistory, mode, startDate, endDate]);

  const westgardAnalysis = useMemo(() => {
    const mean = lot?.mean ?? 0;
    const stdDev = lot?.standardDeviation ?? 1;

    return {
      violations: qcData
        .filter((t: any) => t.violatedRule)
        .map((t: any) => ({
          severity: t.status === 'reject' ? 'reject' : 'warning',
          rule: t.violatedRule!,
          description: `${t.violatedRule} Violation`,
          message: `Violated on ${t.date}`,
        })),
      stats: {
        mean,
        stdDev,
        plus3s: mean + 3 * stdDev,
        plus2s: mean + 2 * stdDev,
        plus1s: mean + 1 * stdDev,
        minus1s: mean - 1 * stdDev,
        minus2s: mean - 2 * stdDev,
        minus3s: mean - 3 * stdDev,
      },
      pointsWithStatus: qcData.map((t: any) => ({
        status: t.status as 'normal' | 'warning' | 'reject',
        date: t.date,
        value: t.value,
        zScore: t.zScore,
        violations: t.violatedRule ? [t.violatedRule] : [],
      })),
    };
  }, [qcData, lot]);

  const isDark = theme === 'dark';
  const gridColor = isDark ? '#2a2a2a' : '#fef3e2';
  const textColor = isDark ? '#a0a0a0' : '#666666';
  const tooltipBorder = isDark ? '#e84855' : '#c41e3a';
  const secondaryGold = isDark ? '#ffd700' : '#b8860b';
  const successGreen = isDark ? '#4ade80' : '#22c55e';
  const warningYellow = isDark ? '#ffd700' : '#b8860b';
  const rejectRed = isDark ? '#e84855' : '#c41e3a';

  const chartData: ChartDataPoint[] = westgardAnalysis.pointsWithStatus.map((point: any) => ({
    date: point.date,
    value: point.value,
    mean: westgardAnalysis.stats.mean,
    plus1s: westgardAnalysis.stats.plus1s,
    plus2s: westgardAnalysis.stats.plus2s,
    plus3s: westgardAnalysis.stats.plus3s,
    minus1s: westgardAnalysis.stats.minus1s,
    minus2s: westgardAnalysis.stats.minus2s,
    minus3s: westgardAnalysis.stats.minus3s,
    status: point.status,
    zScore: point.zScore,
    violations: point.violations.join(', '),
    fill: getPointColor(point.status, isDark),
  }));

  if (chartData.length === 0) {
    return (
      <div className="p-8 text-center bg-gray-50 dark:bg-[#1e1e1e] rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 mb-6">
        <h3 className="text-gray-900 dark:text-white font-bold text-lg mb-2">Level {lot.level} (Lot: {lot.lotNumber})</h3>
        <p className="text-gray-500 dark:text-gray-400">No data available for this lot in the selected range.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 p-5 sm:p-6 shadow-lg myc-pattern relative mb-8">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#b8860b]/10 to-transparent dark:from-[#ffd700]/10 rounded-bl-full" />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#b8860b]/10 dark:bg-[#ffd700]/20 rounded-lg">
            <TrendingUp className="text-[#b8860b] dark:text-[#ffd700]" size={24} />
          </div>
          <div>
            <h3 className="text-gray-900 dark:text-white font-bold text-lg">
              Level {lot.level} Control Lot (Lot: {lot.lotNumber}) {mode === 'archive' && '[Archived]'}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Machine: {machineName} | Test: {testName}
            </p>
          </div>
        </div>

        <div className="flex gap-2 text-xs">
          <div className="flex items-center gap-1 px-2 py-1 bg-green-500/10 rounded-lg">
            <CheckCircle2 size={14} className="text-green-500" />
            <span className="text-green-700 dark:text-green-400">
              {westgardAnalysis.pointsWithStatus.filter((p: any) => p.status === 'normal').length}
            </span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/10 rounded-lg">
            <AlertTriangle size={14} className="text-yellow-500" />
            <span className="text-yellow-700 dark:text-yellow-400">
              {westgardAnalysis.pointsWithStatus.filter((p: any) => p.status === 'warning').length}
            </span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 bg-red-500/10 rounded-lg">
            <XCircle size={14} className="text-red-500" />
            <span className="text-red-700 dark:text-red-400">
              {westgardAnalysis.pointsWithStatus.filter((p: any) => p.status === 'reject').length}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-4 relative z-10">
        {Object.entries(formatWestgardStats(westgardAnalysis.stats, 3)).map(([key, value]) => (
          <div key={key} className="text-center">
            <p className="text-xs text-gray-600 dark:text-gray-400">{key}</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{value}</p>
          </div>
        ))}
      </div>

      <div style={{ width: '100%', height: '500px' }} className="relative z-10 min-w-0">
        <ResponsiveContainer width="100%" height={500}>
          <ComposedChart data={chartData} margin={{ top: 20, right: 50, left: 10, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={true} horizontal={true} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: textColor }}
              angle={-45}
              textAnchor="end"
              height={80}
              stroke={gridColor}
              type="category"
              allowDuplicatedCategory={false}
              interval={0}
            />
            <YAxis
              tick={{ fontSize: 12, fill: textColor, fontWeight: 'bold' }}
              stroke={gridColor}
              domain={[
                (dataMin: number) => Math.min(westgardAnalysis.stats.mean - (westgardAnalysis.stats.stdDev * 3.5), dataMin),
                (dataMax: number) => Math.max(westgardAnalysis.stats.mean + (westgardAnalysis.stats.stdDev * 3.5), dataMax)
              ]}
              ticks={[
                westgardAnalysis.stats.minus3s,
                westgardAnalysis.stats.minus2s,
                westgardAnalysis.stats.minus1s,
                westgardAnalysis.stats.mean,
                westgardAnalysis.stats.plus1s,
                westgardAnalysis.stats.plus2s,
                westgardAnalysis.stats.plus3s
              ]}
              tickFormatter={(value) => {
                if (Math.abs(value - westgardAnalysis.stats.mean) < 0.001) return 'Mean';
                if (Math.abs(value - westgardAnalysis.stats.plus1s) < 0.001) return '+1s';
                if (Math.abs(value - westgardAnalysis.stats.plus2s) < 0.001) return '+2s';
                if (Math.abs(value - westgardAnalysis.stats.plus3s) < 0.001) return '+3s';
                if (Math.abs(value - westgardAnalysis.stats.minus1s) < 0.001) return '-1s';
                if (Math.abs(value - westgardAnalysis.stats.minus2s) < 0.001) return '-2s';
                if (Math.abs(value - westgardAnalysis.stats.minus3s) < 0.001) return '-3s';
                return value.toFixed(2);
              }}
              width={60}
            />
            <Tooltip
              content={<WestgardTooltip tooltipBorder={tooltipBorder} />}
              cursor={{ strokeDasharray: '3 3' }}
            />

            <ReferenceLine y={westgardAnalysis.stats.plus3s} stroke={rejectRed} strokeWidth={2} />
            <ReferenceLine y={westgardAnalysis.stats.plus2s} stroke={warningYellow} strokeDasharray="5 5" strokeWidth={2} />
            <ReferenceLine y={westgardAnalysis.stats.plus1s} stroke={successGreen} strokeDasharray="3 3" strokeWidth={1} />
            <ReferenceLine y={westgardAnalysis.stats.mean} stroke={textColor} strokeWidth={2} />
            <ReferenceLine y={westgardAnalysis.stats.minus1s} stroke={successGreen} strokeDasharray="3 3" strokeWidth={1} />
            <ReferenceLine y={westgardAnalysis.stats.minus2s} stroke={warningYellow} strokeDasharray="5 5" strokeWidth={2} />
            <ReferenceLine y={westgardAnalysis.stats.minus3s} stroke={rejectRed} strokeWidth={2} />

            <Line
              dataKey="value"
              stroke={secondaryGold}
              strokeWidth={2}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />

            <Scatter
              data={chartData}
              dataKey="value"
              shape="circle"
              isAnimationActive={false}
            >
              {chartData.map((point, index) => (
                <Cell
                  key={`${point.date}-${index}`}
                  fill={point.fill}
                  stroke={isDark ? '#000' : '#fff'}
                  strokeWidth={1.5}
                />
              ))}
            </Scatter>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {westgardAnalysis.violations.length > 0 ? (
        <div className="mt-4 space-y-2 relative z-10">
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Westgard Rule Violations:</h4>
          {westgardAnalysis.violations.map((violation: any, index: number) => (
            <div
              key={index}
              className={`p-3 rounded-lg border-2 ${violation.severity === 'reject'
                ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700'
                }`}
            >
              <div className="flex items-start gap-2">
                {violation.severity === 'reject' ? (
                  <XCircle size={18} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle size={18} className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">
                    {violation.rule} - {violation.description}
                  </p>
                  <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">{violation.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 flex items-center gap-2">
          <CheckCircle2 size={20} className="text-green-600 dark:text-green-400" />
          <p className="text-sm font-medium text-green-800 dark:text-green-300">No Westgard rule violations detected.</p>
        </div>
      )}
    </div>
  );
}

export function MachineCharts({ machine, qcHistory }: MachineChartsProps) {
  const { theme } = useTheme();

  const availableTests = useMemo(() => {
    const testMap = new Map<string, TestOption>();

    if (machine?.tests && machine.tests.length > 0) {
      for (const t of machine.tests) {
        if (!testMap.has(t.id)) {
          testMap.set(t.id, {
            testId: t.id,
            testName: t.name,
            category: t.category,
            lots: [],
          });
        }
        if (t.lotId !== -1) {
          testMap.get(t.id)!.lots.push({
            lotId: t.lotId,
            level: t.level ?? 1,
            lotNumber: t.lotNumber,
            isActive: t.isActive,
            mean: t.mean,
            standardDeviation: t.standardDeviation,
          });
        }
      }
    } else {
      for (const result of qcHistory) {
        const tIdStr = result.testId.toString();
        if (!testMap.has(tIdStr)) {
          testMap.set(tIdStr, {
            testId: tIdStr,
            testName: result.testName,
            category: 'General',
            lots: [],
          });
        }
        const testObj = testMap.get(tIdStr)!;
        if (!testObj.lots.find((l) => l.lotId === result.lotId)) {
          testObj.lots.push({
            lotId: result.lotId,
            level: result.level ?? 1,
            lotNumber: result.lotNumber,
            isActive: false,
            mean: 0,
            standardDeviation: 1,
          });
        }
      }
    }

    for (const test of testMap.values()) {
      test.lots.sort((a, b) => a.level - b.level);
    }

    return Array.from(testMap.values());
  }, [machine, qcHistory]);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlTestId = searchParams.get('testId');

  const activeTest = availableTests.find((test) => test.testId === urlTestId) ?? availableTests[0];

  const [mode, setMode] = useState<'live' | 'archive'>('live');

  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const archivedLots = useMemo(() => {
    if (!activeTest) return [];
    const start = startDate ? new Date(startDate + 'T00:00:00').getTime() : 0;
    const end = endDate ? new Date(endDate + 'T23:59:59').getTime() : Infinity;

    return activeTest.lots.filter(lot => {
      const hasResultsInRange = qcHistory.some(
        r => r.lotId === lot.lotId && 
             new Date(r.testDate).getTime() >= start && 
             new Date(r.testDate).getTime() <= end
      );
      return hasResultsInRange || lot.isActive;
    });
  }, [activeTest, startDate, endDate, qcHistory]);

  const visibleLots = useMemo(() => {
    if (!activeTest) return [];
    return activeTest.lots.filter(l => l.isActive);
  }, [activeTest]);

  const handleTestChange = (newTestId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('testId', newTestId);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const lotsToRender = mode === 'live' ? visibleLots : archivedLots;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 p-4 shadow-lg flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-semibold">
          <Filter size={20} />
          <span>Filters:</span>
        </div>

        <div className="w-64">
          <label className="text-xs text-gray-500 dark:text-gray-400 ml-1 mb-1 block">QC Test</label>
          <select
            className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white"
            value={activeTest?.testId ?? ''}
            onChange={(e) => handleTestChange(e.target.value)}
            disabled={availableTests.length === 0}
          >
            {availableTests.map((test) => (
              <option key={test.testId} value={test.testId}>{test.testName}</option>
            ))}
          </select>
        </div>

        <div className="flex bg-gray-100 dark:bg-[#2a2a2a] p-1 rounded-xl border border-gray-200 dark:border-gray-700 ml-auto self-end">
          <button
            type="button"
            onClick={() => setMode('live')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              mode === 'live'
                ? 'bg-gradient-to-r from-[#c41e3a] to-[#8b1e3f] dark:from-[#e84855] dark:to-[#c75b7a] text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Live Operations
          </button>
          <button
            type="button"
            onClick={() => setMode('archive')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              mode === 'archive'
                ? 'bg-gradient-to-r from-[#c41e3a] to-[#8b1e3f] dark:from-[#e84855] dark:to-[#c75b7a] text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Historical Archive
          </button>
        </div>
      </div>

      {mode === 'archive' && (
        <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-[#b8860b]/20 dark:border-[#ffd700]/30 p-4 mb-6 shadow-md flex flex-wrap gap-4 items-center relative z-10 animate-fadeIn">
          <div className="w-48">
            <label className="text-xs text-gray-500 dark:text-gray-400 ml-1 mb-1 block">Start Date</label>
            <input
              type="date"
              className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="w-48">
            <label className="text-xs text-gray-500 dark:text-gray-400 ml-1 mb-1 block">End Date</label>
            <input
              type="date"
              className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      )}

      {lotsToRender.length > 0 ? (
        lotsToRender.map((lot) => (
          <LotChart 
            key={lot.lotId}
            lot={lot}
            qcHistory={qcHistory}
            mode={mode}
            startDate={startDate}
            endDate={endDate}
            machineName={machine?.name ?? 'Unknown'}
            testName={activeTest?.testName ?? 'Unknown'}
            theme={theme}
          />
        ))
      ) : (
        <div className="p-12 text-center bg-gray-50 dark:bg-[#1e1e1e] rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">No data available for the selected machine and test.</p>
        </div>
      )}
    </div>
  );
}
