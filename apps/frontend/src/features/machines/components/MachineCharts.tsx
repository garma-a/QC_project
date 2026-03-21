"use client";

import { useMemo, useState } from 'react';
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
import { applyWestgardRules, getPointColor, formatWestgardStats } from '@/utils/westgardRules';
import { getAvailableMachines, getAvailableTests, getQCData } from '@/utils/dataProcessor';

interface MachineChartsProps {
  machineId?: number; // Passed down from MonitorClient
}

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

export function MachineCharts({ machineId: initialMachineId }: MachineChartsProps) {
  const { theme } = useTheme();

  // Get available options
  const machines = useMemo(() => getAvailableMachines(), []);
  const initialMachine =
    initialMachineId && machines.includes(initialMachineId.toString())
      ? initialMachineId.toString()
      : (machines[0] ?? '');

  const [selectedMachine, setSelectedMachine] = useState<string>(initialMachine);
  const [selectedTest, setSelectedTest] = useState<string>(() => {
    if (!initialMachine) {
      return '';
    }

    const initialTests = getAvailableTests(initialMachine);
    return initialTests[0] ?? '';
  });

  const tests = useMemo(
    () => (selectedMachine ? getAvailableTests(selectedMachine) : []),
    [selectedMachine]
  );
  const activeTest = tests.includes(selectedTest) ? selectedTest : (tests[0] ?? '');

  const handleMachineChange = (nextMachine: string) => {
    const nextTests = getAvailableTests(nextMachine);
    setSelectedMachine(nextMachine);
    setSelectedTest((prev) =>
      nextTests.includes(prev) ? prev : (nextTests[0] ?? '')
    );
  };


  // Get QC Data
  const qcData = useMemo(() => {
    if (!selectedMachine || !activeTest) return [];
    return getQCData(selectedMachine, activeTest);
  }, [selectedMachine, activeTest]);

  // Apply Westgard Rules
  const westgardAnalysis = useMemo(() => {
    return applyWestgardRules(qcData);
  }, [qcData]);

  // Magdi Yacoub Theme Colors
  const isDark = theme === 'dark';
  const gridColor = isDark ? '#2a2a2a' : '#fef3e2';
  const textColor = isDark ? '#a0a0a0' : '#666666';
  const tooltipBorder = isDark ? '#e84855' : '#c41e3a';

  // Magdi Yacoub Brand Colors
  const secondaryGold = isDark ? '#ffd700' : '#b8860b';
  const successGreen = isDark ? '#4ade80' : '#22c55e';
  const warningYellow = isDark ? '#ffd700' : '#b8860b';
  const rejectRed = isDark ? '#e84855' : '#c41e3a';

  // Prepare chart data
  const chartData: ChartDataPoint[] = westgardAnalysis.pointsWithStatus.map((point) => ({
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

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 p-4 shadow-lg flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-semibold">
          <Filter size={20} />
          <span>Filters:</span>
        </div>

        <div className="w-48">
          <label className="text-xs text-gray-500 dark:text-gray-400 ml-1 mb-1 block">Machine ID</label>
          <select
            className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white"
            value={selectedMachine}
            onChange={(e) => handleMachineChange(e.target.value)}
          >
            {machines.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div className="w-48">
          <label className="text-xs text-gray-500 dark:text-gray-400 ml-1 mb-1 block">Test Code</label>
          <select
            className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white"
            value={activeTest}
            onChange={(e) => setSelectedTest(e.target.value)}
            disabled={!selectedMachine}
          >
            {tests.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Westgard QC Chart */}
      {chartData.length > 0 ? (
        <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 p-5 sm:p-6 shadow-lg myc-pattern relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#b8860b]/10 to-transparent dark:from-[#ffd700]/10 rounded-bl-full" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#b8860b]/10 dark:bg-[#ffd700]/20 rounded-lg">
                <TrendingUp className="text-[#b8860b] dark:text-[#ffd700]" size={24} />
              </div>
              <div>
                <h3 className="text-gray-900 dark:text-white font-bold text-lg">Westgard QC Chart</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Machine: {selectedMachine} | Test: {activeTest}</p>
              </div>
            </div>

            {/* Violation Summary */}
            <div className="flex gap-2 text-xs">
              <div className="flex items-center gap-1 px-2 py-1 bg-green-500/10 rounded-lg">
                <CheckCircle2 size={14} className="text-green-500" />
                <span className="text-green-700 dark:text-green-400">
                  {westgardAnalysis.pointsWithStatus.filter(p => p.status === 'normal').length}
                </span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/10 rounded-lg">
                <AlertTriangle size={14} className="text-yellow-500" />
                <span className="text-yellow-700 dark:text-yellow-400">
                  {westgardAnalysis.pointsWithStatus.filter(p => p.status === 'warning').length}
                </span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-red-500/10 rounded-lg">
                <XCircle size={14} className="text-red-500" />
                <span className="text-red-700 dark:text-red-400">
                  {westgardAnalysis.pointsWithStatus.filter(p => p.status === 'reject').length}
                </span>
              </div>
            </div>
          </div>

          {/* Westgard Statistics */}
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-4 relative z-10">
            {Object.entries(formatWestgardStats(westgardAnalysis.stats, 3)).map(([key, value]) => (
              <div key={key} className="text-center">
                <p className="text-xs text-gray-600 dark:text-gray-400">{key}</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{value}</p>
              </div>
            ))}
          </div>

          <div style={{ width: '100%', height: '500px' }} className="relative z-10">
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
                    westgardAnalysis.stats.mean - (westgardAnalysis.stats.stdDev * 3.5),
                    westgardAnalysis.stats.mean + (westgardAnalysis.stats.stdDev * 3.5)
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

                {/* Control Limit Lines */}
                <ReferenceLine y={westgardAnalysis.stats.plus3s} stroke={rejectRed} strokeWidth={2} />
                <ReferenceLine y={westgardAnalysis.stats.plus2s} stroke={warningYellow} strokeDasharray="5 5" strokeWidth={2} />
                <ReferenceLine y={westgardAnalysis.stats.plus1s} stroke={successGreen} strokeDasharray="3 3" strokeWidth={1} />
                <ReferenceLine y={westgardAnalysis.stats.mean} stroke={textColor} strokeWidth={2} />
                <ReferenceLine y={westgardAnalysis.stats.minus1s} stroke={successGreen} strokeDasharray="3 3" strokeWidth={1} />
                <ReferenceLine y={westgardAnalysis.stats.minus2s} stroke={warningYellow} strokeDasharray="5 5" strokeWidth={2} />
                <ReferenceLine y={westgardAnalysis.stats.minus3s} stroke={rejectRed} strokeWidth={2} />

                {/* Connect points with a line */}
                <Line
                  dataKey="value"
                  stroke={secondaryGold}
                  strokeWidth={2}
                  dot={false}
                  activeDot={false}
                  isAnimationActive={false}
                />

                {/* Data Points */}
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

          {/* Violations List */}
          {westgardAnalysis.violations.length > 0 ? (
            <div className="mt-4 space-y-2 relative z-10">
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Westgard Rule Violations:</h4>
              {westgardAnalysis.violations.map((violation, index) => (
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
      ) : (
        <div className="p-12 text-center bg-gray-50 dark:bg-[#1e1e1e] rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">No data available for the selected machine and test.</p>
        </div>
      )}
    </div>
  );
}
