"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectOption } from "@/components/ui/select";
import { PlusCircle, AlertTriangle } from "lucide-react";
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

// ─── helpers ────────────────────────────────────────────────────────────────

function NumInput({
  id, label, value, onChange, required = false, placeholder = "",
}: {
  id: string; label: string; value: string;
  onChange: (v: string) => void; required?: boolean; placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Input
        id={id}
        type="number"
        step="0.0001"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        required={required}
      />
    </div>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

export function ControlLotManager({ initialLots, machines, allTests }: ControlLotManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Filter state
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");
  const [filterMachineId, setFilterMachineId] = useState("");
  const [filterNeedsChecking, setFilterNeedsChecking] = useState(false);

  // Form state — required
  const [selectedMachineId, setSelectedMachineId] = useState("");
  const [selectedTestId, setSelectedTestId] = useState("");
  const [lotNumber, setLotNumber] = useState("");
  const [expirationDate, setExpirationDate] = useState("");

  // Form state — optional numeric fields from schema
  const [targetValue, setTargetValue] = useState("");
  const [mean, setMean] = useState("");
  const [standardDeviation, setStandardDeviation] = useState("");
  const [upperControlLimit, setUpperControlLimit] = useState("");
  const [lowerControlLimit, setLowerControlLimit] = useState("");
  const [upperWarningLimit, setUpperWarningLimit] = useState("");
  const [lowerWarningLimit, setLowerWarningLimit] = useState("");

  // ── derived ──────────────────────────────────────────────────────────────

  const availableTests = allTests.filter(
    (t) => t.machineId.toString() === selectedMachineId,
  );

  const getTestName = (testId: number) =>
    allTests.find((x) => x.test.id === testId)?.test.testName ?? `Test #${testId}`;

  const getMachine = (testId: number) => {
    const entry = allTests.find((x) => x.test.id === testId);
    if (!entry) return null;
    return machines.find((m) => m.id === entry.machineId) ?? null;
  };

  const needsCheckingCount = initialLots.filter((l) => l.isActive && l.needsChecking).length;

  const filteredLots = initialLots
    .filter((lot) => {
      if (filterActive === "active" && !lot.isActive) return false;
      if (filterActive === "inactive" && lot.isActive) return false;
      if (filterNeedsChecking && !lot.needsChecking) return false;
      if (filterMachineId) {
        const machine = getMachine(lot.testId);
        if (!machine || machine.id.toString() !== filterMachineId) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      if ((a.needsChecking ?? false) !== (b.needsChecking ?? false))
        return (a.needsChecking ?? false) ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // ── form ─────────────────────────────────────────────────────────────────

  const resetForm = () => {
    setSelectedMachineId(""); setSelectedTestId("");
    setLotNumber(""); setExpirationDate("");
    setTargetValue(""); setMean(""); setStandardDeviation("");
    setUpperControlLimit(""); setLowerControlLimit("");
    setUpperWarningLimit(""); setLowerWarningLimit("");
    setFormError(null);
  };

  const toNum = (s: string) => (s.trim() === "" ? undefined : parseFloat(s));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Extra validation beyond HTML required
    if (!selectedMachineId) { setFormError("Please select a machine."); return; }
    if (!selectedTestId) { setFormError("Please select a QC test."); return; }
    if (!lotNumber.trim()) { setFormError("Lot number is required."); return; }
    if (!expirationDate) { setFormError("Expiration date is required."); return; }

    setFormError(null);
    setIsSubmitting(true);

    const result = await createControlLot({
      testId: parseInt(selectedTestId),
      lotNumber: lotNumber.trim(),
      expirationDate: new Date(expirationDate).toISOString(),
      targetValue: toNum(targetValue),
      mean: toNum(mean),
      standardDeviation: toNum(standardDeviation),
      upperControlLimit: toNum(upperControlLimit),
      lowerControlLimit: toNum(lowerControlLimit),
      upperWarningLimit: toNum(upperWarningLimit),
      lowerWarningLimit: toNum(lowerWarningLimit),
    });

    setIsSubmitting(false);
    if (result.error) {
      setFormError(result.error);
    } else {
      setIsDialogOpen(false);
      resetForm();
      window.location.reload();
    }
  };

  // ─── render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Control Lots</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Creating a new lot for a test automatically deactivates the previous one.
          </p>
        </div>

        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild onClick={() => setIsDialogOpen(true)}>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Control Lot
            </Button>
          </DialogTrigger>

          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle>Create Control Lot</DialogTitle>
              <DialogDescription>
                Pick a machine then a test from the list. The previous active lot for that
                test will be deactivated automatically. Fields marked{" "}
                <span className="text-destructive font-semibold">*</span> are required.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              {formError && (
                <div className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">
                  {formError}
                </div>
              )}

              {/* ── Step 1: Machine (determines test list) ── */}
              <div className="rounded-lg border border-border p-4 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Step 1 — Identify the Test
                </p>

                <div className="space-y-1.5">
                  <Label htmlFor="dlg-machine">
                    Machine <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    id="dlg-machine"
                    value={selectedMachineId}
                    onChange={(e) => {
                      setSelectedMachineId(e.target.value);
                      setSelectedTestId("");
                    }}
                    placeholder="— Select machine —"
                    required
                  >
                    {machines.map((m) => (
                      <SelectOption key={m.id} value={m.id.toString()}>
                        {m.name}
                      </SelectOption>
                    ))}
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="dlg-test">
                    QC Test <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    id="dlg-test"
                    value={selectedTestId}
                    onChange={(e) => setSelectedTestId(e.target.value)}
                    placeholder={
                      !selectedMachineId
                        ? "— Pick a machine first —"
                        : availableTests.length === 0
                        ? "— No tests found —"
                        : "— Select test —"
                    }
                    disabled={!selectedMachineId || availableTests.length === 0}
                    required
                  >
                    {availableTests.map((t) => (
                      <SelectOption key={t.test.id} value={t.test.id.toString()}>
                        {t.test.testName}
                      </SelectOption>
                    ))}
                  </Select>
                </div>
              </div>

              {/* ── Step 2: Lot identity ── */}
              <div className="rounded-lg border border-border p-4 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Step 2 — Lot Identity
                </p>

                <div className="space-y-1.5">
                  <Label htmlFor="dlg-lot">
                    Lot Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="dlg-lot"
                    value={lotNumber}
                    onChange={(e) => setLotNumber(e.target.value)}
                    placeholder="e.g. LOT-2026-HGB-A"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="dlg-exp">
                    Expiration Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="dlg-exp"
                    type="date"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* ── Step 3: Statistical parameters (optional) ── */}
              <div className="rounded-lg border border-border p-4 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Step 3 — Statistical Parameters (optional)
                </p>
                <p className="text-xs text-muted-foreground -mt-2">
                  Leave blank if not yet established. These can be set later via update.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <NumInput id="dlg-target" label="Target Value"   value={targetValue}         onChange={setTargetValue}         placeholder="Manufacturer target" />
                  <NumInput id="dlg-mean"   label="Mean"           value={mean}                onChange={setMean}               placeholder="Established mean" />
                  <NumInput id="dlg-sd"     label="Std Deviation"  value={standardDeviation}   onChange={setStandardDeviation}  placeholder="SD" />
                  <NumInput id="dlg-ucl"    label="Upper Control Limit" value={upperControlLimit}  onChange={setUpperControlLimit}  placeholder="Mean + 3SD" />
                  <NumInput id="dlg-lcl"    label="Lower Control Limit" value={lowerControlLimit}  onChange={setLowerControlLimit}  placeholder="Mean − 3SD" />
                  <NumInput id="dlg-uwl"    label="Upper Warning Limit" value={upperWarningLimit}  onChange={setUpperWarningLimit}  placeholder="Mean + 2SD" />
                  <NumInput id="dlg-lwl"    label="Lower Warning Limit" value={lowerWarningLimit}  onChange={setLowerWarningLimit}  placeholder="Mean − 2SD" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setIsDialogOpen(false); resetForm(); }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving…" : "Create Lot"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alert banner */}
      {needsCheckingCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            <strong>
              {needsCheckingCount} active lot{needsCheckingCount > 1 ? "s are" : " is"}
            </strong>{" "}
            older than 10 days and may need review.
          </span>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="filter-status">Status</Label>
              <Select
                id="filter-status"
                value={filterActive}
                onChange={(e) =>
                  setFilterActive(e.target.value as "all" | "active" | "inactive")
                }
                className="w-36"
              >
                <SelectOption value="all">All</SelectOption>
                <SelectOption value="active">Active only</SelectOption>
                <SelectOption value="inactive">Inactive only</SelectOption>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="filter-machine">Machine</Label>
              <Select
                id="filter-machine"
                value={filterMachineId}
                onChange={(e) => setFilterMachineId(e.target.value)}
                className="w-52"
                placeholder="All machines"
              >
                <SelectOption value="">All machines</SelectOption>
                {machines.map((m) => (
                  <SelectOption key={m.id} value={m.id.toString()}>
                    {m.name}
                  </SelectOption>
                ))}
              </Select>
            </div>

            <div className="flex items-end pb-0.5">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={filterNeedsChecking}
                  onChange={(e) => setFilterNeedsChecking(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                Needs checking only
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Control Lot Inventory{" "}
            <span className="font-normal text-base text-muted-foreground">
              ({filteredLots.length} lots)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lot Number</TableHead>
                  <TableHead>Test</TableHead>
                  <TableHead>Machine</TableHead>
                  <TableHead>Expiration Date</TableHead>
                  <TableHead>Mean</TableHead>
                  <TableHead>SD</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Days Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLots.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No lots match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLots.map((lot) => {
                    const isWarn = lot.isActive && lot.needsChecking;
                    const machine = getMachine(lot.testId);
                    return (
                      <TableRow
                        key={lot.id}
                        className={isWarn ? "bg-amber-500/10 hover:bg-amber-500/20" : ""}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {isWarn && (
                              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                            )}
                            {lot.lotNumber}
                          </div>
                        </TableCell>
                        <TableCell>{getTestName(lot.testId)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {machine?.name ?? "—"}
                        </TableCell>
                        <TableCell>
                          {new Date(lot.expirationDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-sm">
                          {lot.mean != null ? lot.mean.toFixed(2) : "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {lot.standardDeviation != null
                            ? lot.standardDeviation.toFixed(3)
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {lot.isActive ? (
                            <Badge variant="success">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {lot.isActive ? (
                            <span
                              className={
                                isWarn
                                  ? "font-semibold text-amber-600 dark:text-amber-400"
                                  : ""
                              }
                            >
                              {lot.daysActive ?? 0} days
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
