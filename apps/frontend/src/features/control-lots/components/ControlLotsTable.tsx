'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { Button } from '@/components/ui/button';

import { Trash2, Search, AlertTriangle } from 'lucide-react';
import { deactivateControlLot } from '@/lib/actions';
import { ControlLotFormDialog } from './ControlLotFormDialog';
import { useControlLots } from '@/hooks/useControlLots';
import type { ControlLotResponseDto, QualityControlTestResponseDto } from '@/lib/types/api';

interface ControlLotsTableProps {
  initialLots: ControlLotResponseDto[];
  availableTests: QualityControlTestResponseDto[];
}

export function ControlLotsTable({ initialLots, availableTests }: ControlLotsTableProps) {
  const { lots: fetchedLots, fetchNextPage, hasNextPage, isFetchingNextPage } = useControlLots();
  const displayLots = fetchedLots.length > 0 ? fetchedLots : initialLots;
  const [isMounted, setIsMounted] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [lotToDeactivate, setLotToDeactivate] = useState<ControlLotResponseDto | null>(null);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');
  const [expiringOnly, setExpiringOnly] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Helper to get test name from testId
  const getTestName = (testId: number): string => {
    const test = availableTests.find((t) => t.id === testId);
    return test ? test.testName : 'Unknown Test';
  };

  // Helper to determine expiry date badge color
  const getExpiryBadgeColor = (expirationDate: string | Date | null): string => {
    if (!isMounted || !expirationDate) return 'bg-gray-100 text-gray-700';

    try {
      const expiry = new Date(expirationDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expiry.setHours(0, 0, 0, 0);

      if (expiry < today) {
        return 'bg-red-100 text-red-700'; // Expired
      }

      const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry < 30) {
        return 'bg-yellow-100 text-yellow-700'; // Warning: < 30 days
      }

      return 'bg-green-100 text-green-700'; // OK
    } catch {
      return 'bg-gray-100 text-gray-700';
    }
  };

  // Helper to format expiry date for display
  const formatExpiryDate = (expirationDate: string | Date | null): string => {
    if (!isMounted) return '...';
    if (!expirationDate) return 'N/A';
    try {
      return new Date(expirationDate).toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  // Helper for status badge
  const getStatusBadge = (isActive: boolean) => {
    const colorClass = isActive
      ? 'bg-green-100 text-green-700 hover:bg-green-100 hover:text-green-700'
      : 'bg-red-100 text-red-700 hover:bg-red-100 hover:text-red-700';

    return (
      <Badge className={`border-none ${colorClass}`} variant="outline">
        {isActive ? 'Active' : 'Inactive'}
      </Badge>
    );
  };

  const calculateDaysActive = (date: string | Date | null): number => {
    if (!date) return 0;
    try {
      const creationDate = new Date(date);
      const today = new Date();
      creationDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      return Math.floor((today.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  };

  const handleDeactivateClick = (lot: ControlLotResponseDto) => {
    setLotToDeactivate(lot);
    setDeactivateError(null);
    setDeleteConfirmOpen(true);
  };

  const confirmDeactivate = () => {
    if (!lotToDeactivate) return;

    startTransition(async () => {
      const result = await deactivateControlLot(lotToDeactivate.id);
      if (result?.error) {
        setDeactivateError(result.error);
      } else {
        setDeleteConfirmOpen(false);
        setLotToDeactivate(null);
        setDeactivateError(null);
      }
    });
  };

  // Derive filtered lots from all three predicates
  const filteredLots = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    return displayLots.filter((lot) => {
      // 1. Search by lot number (case-insensitive)
      if (search.trim() && !lot.lotNumber.toLowerCase().includes(search.trim().toLowerCase())) {
        return false;
      }

      // 2. Status filter
      if (statusFilter === 'active' && !lot.isActive) return false;
      if (statusFilter === 'inactive' && lot.isActive) return false;

      // 3. Expiring soon (< 30 days, including already-expired)
      if (expiringOnly) {
        if (!lot.expirationDate) return false;
        try {
          const expiry = new Date(lot.expirationDate);
          expiry.setHours(0, 0, 0, 0);
          if (expiry.getTime() - now.getTime() >= thirtyDaysMs) return false;
        } catch {
          return false;
        }
      }

      return true;
    });
  }, [displayLots, search, statusFilter, expiringOnly]);

  const expiredLotsCount = displayLots.filter((lot) => {
    if (!lot.isActive || !lot.expirationDate) return false;
    try {
      const expiry = new Date(lot.expirationDate);
      expiry.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return expiry < today;
    } catch {
      return false;
    }
  }).length;

  return (
    <>
      {/* Search bar — matches QC Management search exactly */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#c41e3a]/60 dark:text-[#e84855]/60" size={20} />
          <input
            id="lot-search"
            type="text"
            placeholder="Search by lot number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#1e1e1e] text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* Filter row — matches QC Management date-filter grid style */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Status filter */}
        <select
          id="lot-status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'active' | 'inactive' | 'all')}
          className="w-full px-4 py-3 border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#1e1e1e] text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent"
        >
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
          <option value="all">All Statuses</option>
        </select>

        {/* Expiring soon — styled as a clickable filter tile matching the select height */}
        <label
          htmlFor="lot-expiring-soon"
          className={`flex items-center gap-3 px-4 py-3 border-2 rounded-xl cursor-pointer transition-colors select-none ${expiringOnly
            ? 'border-[#b8860b] bg-amber-50 dark:bg-amber-500/10 text-amber-900 dark:text-amber-200'
            : 'border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#1e1e1e] text-gray-900 dark:text-white'
            }`}
        >
          <input
            type="checkbox"
            id="lot-expiring-soon"
            checked={expiringOnly}
            onChange={(e) => setExpiringOnly(e.target.checked)}
            className="h-4 w-4 rounded accent-[#b8860b]"
          />
          <span className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Expiring Soon (&lt; 30 days)
          </span>
        </label>

        {/* Spacer so the grid aligns when only 2 filters used */}
        <div />
      </div>

      {/* Auto-deactivation notice */}
      <div className="flex items-start gap-3 p-4 mb-6 rounded-xl border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-500/10 dark:border-y-transparent dark:border-r-transparent border-y-amber-200 border-r-amber-200 text-amber-900 dark:text-amber-200 shadow-sm">
        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="text-sm">
          <p className="font-semibold leading-none mb-1">Notice</p>
          <p className="text-amber-800 dark:text-amber-300">
            You will be prompted to deactivate the previous lot when creating a new one.
          </p>
        </div>
      </div>

      {expiredLotsCount > 0 && (
        <div className="bg-amber-50/50 dark:bg-amber-950/20 border-2 border-amber-500/50 text-amber-700 dark:text-amber-400 p-4 rounded-xl mb-6 flex items-center gap-3 font-medium">
          <AlertTriangle className="h-5 w-5" />
          <span>{expiredLotsCount} active {expiredLotsCount === 1 ? 'lot has' : 'lots have'} passed their expiration date and require review or replacement.</span>
        </div>
      )}

      {/* Table card — matches QC history card style */}
      <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-[#c41e3a]/10 dark:border-[#e84855]/20 shadow-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/80 dark:bg-zinc-900/50 border-b-2 border-[#c41e3a]/10 dark:border-[#e84855]/20">
              <TableHead className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider py-4 pl-6">Lot Number</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider py-4">Test</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider py-4">Expiry Date</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider py-4">Mean ± SD</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider py-4">Limits (UCL/LCL)</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider py-4">Days Active</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider py-4">Status</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider py-4 text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLots.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground text-sm py-4">
                  {displayLots.length === 0
                    ? 'No control lots found. Click "Add Control Lot" to create one.'
                    : 'No lots match the current filters.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredLots.map((lot) => (
                <TableRow
                  key={lot.id}
                  className="border-b border-[#c41e3a]/10 dark:border-[#e84855]/10 hover:bg-[#fff8f0] dark:hover:bg-[#2a2a2a] transition-colors"
                >
                  <TableCell className="font-semibold text-sm py-4 pl-6 text-gray-900 dark:text-white">{lot.lotNumber}</TableCell>
                  <TableCell className="text-sm py-4 text-gray-700 dark:text-gray-300">{getTestName(lot.testId)}</TableCell>
                  <TableCell className="text-sm py-4">
                    <Badge
                      className={`border-none ${getExpiryBadgeColor(lot.expirationDate)}`}
                      variant="outline"
                    >
                      {formatExpiryDate(lot.expirationDate)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm py-4 text-gray-600 dark:text-gray-400 font-mono">
                    {lot.mean != null && lot.standardDeviation != null
                      ? `${lot.mean.toFixed(2)} ± ${lot.standardDeviation.toFixed(2)}`
                      : <span className="text-gray-400">—</span>}
                  </TableCell>
                  <TableCell className="text-sm py-4 text-gray-600 dark:text-gray-400 font-mono">
                    {lot.upperControlLimit != null && lot.lowerControlLimit != null
                      ? `${lot.upperControlLimit.toFixed(2)} / ${lot.lowerControlLimit.toFixed(2)}`
                      : <span className="text-gray-400">—</span>}
                  </TableCell>
                  <TableCell className="text-sm py-4">
                    {(() => {
                      const days = calculateDaysActive(lot.createdAt);
                      const isExpired = lot.isActive && days > 10;
                      return (
                        <div className={`flex items-center gap-2 ${isExpired ? 'font-bold text-amber-600 dark:text-amber-500' : 'text-gray-700 dark:text-gray-300'}`}>
                          {days} {days === 1 ? 'day' : 'days'}
                          {isExpired && <AlertTriangle className="h-4 w-4" />}
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="text-sm py-4">{getStatusBadge(lot.isActive)}</TableCell>
                  <TableCell className="text-right flex items-center justify-end gap-2 text-sm py-4 pr-6">
                    <ControlLotFormDialog mode="edit" initialData={lot} availableTests={availableTests} />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => handleDeactivateClick(lot)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
            {hasNextPage && (
              <TableRow>
                <TableCell colSpan={8} className="py-4 text-center text-sm text-gray-500">
                  <div
                    ref={(node) => {
                      if (!node) return;
                      const observer = new IntersectionObserver(
                        (entries) => {
                          if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                            fetchNextPage();
                          }
                        },
                        { threshold: 0.1 }
                      );
                      observer.observe(node);
                      return () => observer.disconnect();
                    }}
                  >
                    {isFetchingNextPage ? 'Loading more...' : 'Scroll for more'}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={(open) => { setDeleteConfirmOpen(open); if (!open) setDeactivateError(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Control Lot</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate &quot;{lotToDeactivate?.lotNumber}&quot;? This action can be
              reversed by editing the lot.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deactivateError && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
              {deactivateError}
            </p>
          )}
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeactivate}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {isPending ? 'Deactivating...' : 'Deactivate'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
