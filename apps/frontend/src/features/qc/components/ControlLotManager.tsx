"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Heart, AlertTriangle } from "lucide-react";
import { createControlLot } from "@/lib/actions";
import type {
  ControlLotResponseDto,
  MachineResponseDto,
  QcTestResponseDto,
} from "@/lib/types/api";

interface ControlLotManagerProps {
  initialLots: ControlLotResponseDto[];
  machines: MachineResponseDto[];
  allTests: { machineId: number; test: QcTestResponseDto }[];
}

// ─── shared input / select class strings ────────────────────────────────────
const inputCls =
  "w-full px-4 py-3 border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500";
const labelCls = "block text-gray-700 dark:text-gray-300 mb-2 font-semibold text-sm";

// ─── tiny helper for number fields ──────────────────────────────────────────
function NumField({
  label, id, value, onChange, placeholder,
}: { label: string; id: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label htmlFor={id} className={labelCls}>{label}</label>
      <input
        id={id}
        type="number"
        step="0.0001"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? label}
        className={inputCls}
      />
    </div>
  );
}

// ─── main component ──────────────────────────────────────────────────────────
export function ControlLotManager({ initialLots, machines, allTests }: ControlLotManagerProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // filter state
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");
  const [filterMachineId, setFilterMachineId] = useState("");
  const [filterNeedsChecking, setFilterNeedsChecking] = useState(false);

  // form state
  const [selectedMachineId, setSelectedMachineId] = useState("");
  const [selectedTestId, setSelectedTestId]   = useState("");
  const [lotNumber, setLotNumber]             = useState("");
  const [expirationDate, setExpirationDate]   = useState("");
  const [targetValue, setTargetValue]         = useState("");
  const [mean, setMean]                       = useState("");
  const [standardDeviation, setSD]            = useState("");
  const [upperControlLimit, setUCL]           = useState("");
  const [lowerControlLimit, setLCL]           = useState("");
  const [upperWarningLimit, setUWL]           = useState("");
  const [lowerWarningLimit, setLWL]           = useState("");

  // ── derived ──────────────────────────────────────────────────────────────
  const availableTests = allTests.filter((t) => t.machineId.toString() === selectedMachineId);

  const getTestName = (testId: number) =>
    allTests.find((x) => x.test.id === testId)?.test.testName ?? `Test #${testId}`;

  const getMachine = (testId: number) => {
    const entry = allTests.find((x) => x.test.id === testId);
    return entry ? machines.find((m) => m.id === entry.machineId) ?? null : null;
  };

  const needsCheckingCount = initialLots.filter((l) => l.isActive && l.needsChecking).length;

  const filteredLots = initialLots
    .filter((lot) => {
      if (filterActive === "active" && !lot.isActive) return false;
      if (filterActive === "inactive" && lot.isActive) return false;
      if (filterNeedsChecking && !lot.needsChecking) return false;
      if (filterMachineId) {
        const m = getMachine(lot.testId);
        if (!m || m.id.toString() !== filterMachineId) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      if ((a.needsChecking ?? false) !== (b.needsChecking ?? false))
        return (a.needsChecking ?? false) ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // ── form helpers ─────────────────────────────────────────────────────────
  const resetForm = () => {
    setSelectedMachineId(""); setSelectedTestId(""); setLotNumber("");
    setExpirationDate(""); setTargetValue(""); setMean(""); setSD("");
    setUCL(""); setLCL(""); setUWL(""); setLWL(""); setFormError(null);
  };

  const toNum = (s: string) => (s.trim() === "" ? undefined : parseFloat(s));

  const handleClose = () => { setShowForm(false); resetForm(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMachineId) { setFormError("Please select a machine."); return; }
    if (!selectedTestId)    { setFormError("Please select a QC test."); return; }
    if (!lotNumber.trim())  { setFormError("Lot number is required."); return; }
    if (!expirationDate)    { setFormError("Expiration date is required."); return; }

    setFormError(null);
    setIsPending(true);

    const result = await createControlLot({
      testId: parseInt(selectedTestId),
      lotNumber: lotNumber.trim(),
      expirationDate: new Date(expirationDate).toISOString(),
      targetValue:         toNum(targetValue),
      mean:                toNum(mean),
      standardDeviation:   toNum(standardDeviation),
      upperControlLimit:   toNum(upperControlLimit),
      lowerControlLimit:   toNum(lowerControlLimit),
      upperWarningLimit:   toNum(upperWarningLimit),
      lowerWarningLimit:   toNum(lowerWarningLimit),
    });

    setIsPending(false);
    if (result.error) {
      setFormError(result.error);
    } else {
      handleClose();
      router.refresh();
    }
  };

  // ─── render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Top bar with button ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div />
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-[#c41e3a] to-[#8b1e3f] dark:from-[#e84855] dark:to-[#c75b7a] text-white rounded-xl hover:from-[#8b1e3f] hover:to-[#c41e3a] dark:hover:from-[#c75b7a] dark:hover:to-[#e84855] transition-all shadow-lg hover:shadow-xl shadow-[#c41e3a]/30 dark:shadow-[#e84855]/30 whitespace-nowrap font-semibold ring-2 ring-[#b8860b]/50 dark:ring-[#ffd700]/50"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Create New Control Lot</span>
          <span className="sm:hidden">New Lot</span>
        </button>
      </div>

      {/* decorative line */}
      <div className="h-1 bg-gradient-to-r from-[#c41e3a] via-[#b8860b] to-[#003366] dark:from-[#e84855] dark:via-[#ffd700] dark:to-[#4a90e2] rounded-full mb-6" />

      {/* ── Alert banner ─────────────────────────────────────────────────── */}
      {needsCheckingCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-600 dark:text-amber-400 mb-6">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            <strong>
              {needsCheckingCount} active lot{needsCheckingCount > 1 ? "s are" : " is"}
            </strong>{" "}
            older than 10 days and may need review.
          </span>
        </div>
      )}

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 p-5 mb-6">
        <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">Filters</h3>
        <div className="flex flex-wrap gap-4">
          <div>
            <label className={labelCls}>Status</label>
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value as "all" | "active" | "inactive")}
              className={`${inputCls} w-36`}
            >
              <option value="all">All</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>
          </div>

          <div>
            <label className={labelCls}>Machine</label>
            <select
              value={filterMachineId}
              onChange={(e) => setFilterMachineId(e.target.value)}
              className={`${inputCls} w-52`}
            >
              <option value="">All machines</option>
              {machines.map((m) => (
                <option key={m.id} value={m.id.toString()}>{m.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end pb-1">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300 font-semibold">
              <input
                type="checkbox"
                checked={filterNeedsChecking}
                onChange={(e) => setFilterNeedsChecking(e.target.checked)}
                className="h-4 w-4 rounded"
              />
              Needs checking only
            </label>
          </div>
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 overflow-hidden">
        <div className="p-5 border-b-2 border-[#c41e3a]/20 dark:border-[#e84855]/30">
          <h3 className="font-bold text-gray-900 dark:text-white text-lg">
            Control Lot Inventory{" "}
            <span className="font-normal text-sm text-gray-500">({filteredLots.length} lots)</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#c41e3a]/10 dark:border-[#e84855]/10 bg-gray-50 dark:bg-[#252525]">
                {["Lot Number", "Test", "Machine", "Expiration Date", "Mean", "SD", "Status", "Days Active"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredLots.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                    No lots match the current filters.
                  </td>
                </tr>
              ) : (
                filteredLots.map((lot) => {
                  const isWarn = lot.isActive && lot.needsChecking;
                  const machine = getMachine(lot.testId);
                  return (
                    <tr
                      key={lot.id}
                      className={`border-b border-gray-100 dark:border-[#2a2a2a] transition-colors ${
                        isWarn
                          ? "bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100 dark:hover:bg-amber-900/20"
                          : "hover:bg-gray-50 dark:hover:bg-[#252525]"
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          {isWarn && <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />}
                          {lot.lotNumber}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{getTestName(lot.testId)}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{machine?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {new Date(lot.expirationDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {lot.mean != null ? lot.mean.toFixed(2) : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {lot.standardDeviation != null ? lot.standardDeviation.toFixed(3) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {lot.isActive ? (
                          <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-0.5 text-xs font-semibold text-green-700 dark:text-green-400">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 text-xs font-semibold text-gray-600 dark:text-gray-400">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {lot.isActive ? (
                          <span className={isWarn ? "font-bold text-amber-600 dark:text-amber-400" : "text-gray-700 dark:text-gray-300"}>
                            {lot.daysActive ?? 0} days
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Create Control Lot Modal ────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-[#c41e3a]/30 dark:border-[#e84855]/40">

            {/* modal header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 sticky top-0 bg-white dark:bg-[#1e1e1e] z-10">
              <div className="flex items-center gap-3">
                <Heart size={24} className="text-[#c41e3a] dark:text-[#e84855]" fill="currentColor" />
                <h2 className="text-gray-900 dark:text-white font-bold text-lg sm:text-xl">
                  Create New Control Lot
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 dark:text-gray-500 hover:text-[#c41e3a] dark:hover:text-[#e84855] p-2 rounded-lg hover:bg-[#fff8f0] dark:hover:bg-[#2a2a2a] transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
              {formError && (
                <div className="rounded-xl border-2 border-red-300 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                  {formError}
                </div>
              )}

              {/* Step 1 */}
              <div className="rounded-xl border-2 border-[#c41e3a]/15 dark:border-[#e84855]/20 p-4 space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-[#c41e3a] dark:text-[#e84855]">
                  Step 1 — Identify the Test
                </p>

                <div>
                  <label className={labelCls}>Machine <span className="text-red-500">*</span></label>
                  <select
                    value={selectedMachineId}
                    onChange={(e) => { setSelectedMachineId(e.target.value); setSelectedTestId(""); }}
                    required
                    className={inputCls}
                  >
                    <option value="">— Select machine —</option>
                    {machines.map((m) => (
                      <option key={m.id} value={m.id.toString()}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelCls}>QC Test <span className="text-red-500">*</span></label>
                  <select
                    value={selectedTestId}
                    onChange={(e) => setSelectedTestId(e.target.value)}
                    required
                    disabled={!selectedMachineId || availableTests.length === 0}
                    className={`${inputCls} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <option value="">
                      {!selectedMachineId ? "— Pick a machine first —" : availableTests.length === 0 ? "— No tests found —" : "— Select test —"}
                    </option>
                    {availableTests.map((t) => (
                      <option key={t.test.id} value={t.test.id.toString()}>{t.test.testName}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Step 2 */}
              <div className="rounded-xl border-2 border-[#c41e3a]/15 dark:border-[#e84855]/20 p-4 space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-[#c41e3a] dark:text-[#e84855]">
                  Step 2 — Lot Identity
                </p>

                <div>
                  <label className={labelCls}>Lot Number <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={lotNumber}
                    onChange={(e) => setLotNumber(e.target.value)}
                    required
                    placeholder="e.g. LOT-2026-HGB-A"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>Expiration Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    required
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Step 3 */}
              <div className="rounded-xl border-2 border-[#c41e3a]/15 dark:border-[#e84855]/20 p-4 space-y-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#c41e3a] dark:text-[#e84855]">
                    Step 3 — Statistical Parameters
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    All optional — leave blank if not yet established.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <NumField id="f-target" label="Target Value"        value={targetValue}       onChange={setTargetValue}   placeholder="Manufacturer target" />
                  <NumField id="f-mean"   label="Mean"                value={mean}              onChange={setMean}          placeholder="Established mean" />
                  <NumField id="f-sd"     label="Standard Deviation"  value={standardDeviation} onChange={setSD}            placeholder="SD" />
                  <NumField id="f-ucl"    label="Upper Control Limit" value={upperControlLimit} onChange={setUCL}           placeholder="Mean + 3SD" />
                  <NumField id="f-lcl"    label="Lower Control Limit" value={lowerControlLimit} onChange={setLCL}           placeholder="Mean − 3SD" />
                  <NumField id="f-uwl"    label="Upper Warning Limit" value={upperWarningLimit} onChange={setUWL}           placeholder="Mean + 2SD" />
                  <NumField id="f-lwl"    label="Lower Warning Limit" value={lowerWarningLimit} onChange={setLWL}           placeholder="Mean − 2SD" />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-6 py-3 rounded-xl border-2 border-[#c41e3a]/30 dark:border-[#e84855]/40 text-[#c41e3a] dark:text-[#e84855] hover:bg-[#c41e3a]/10 dark:hover:bg-[#e84855]/20 transition-all font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#c41e3a] to-[#8b1e3f] dark:from-[#e84855] dark:to-[#c75b7a] text-white rounded-xl hover:from-[#8b1e3f] hover:to-[#c41e3a] dark:hover:from-[#c75b7a] dark:hover:to-[#e84855] transition-all shadow-lg hover:shadow-xl shadow-[#c41e3a]/30 dark:shadow-[#e84855]/30 font-semibold ring-2 ring-[#b8860b]/50 dark:ring-[#ffd700]/50"
                >
                  {isPending ? "Saving…" : "Create Control Lot"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
