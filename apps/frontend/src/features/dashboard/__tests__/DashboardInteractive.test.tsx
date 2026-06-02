import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DashboardInteractive } from '../components/DashboardInteractive';

// Mock useRouter
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('DashboardInteractive', () => {
  it('renders gracefully when data is empty (e.g., fetch failed on server)', () => {
    render(<DashboardInteractive machinesWithStatus={[]} categories={[]} />);
    
    // Should render the 'All Machines' filter button
    expect(screen.getByText('All Machines')).toBeInTheDocument();
    
    // There shouldn't be any machine cards rendered, but it shouldn't crash
    const machineCards = screen.queryByText(/Westgard rule/);
    expect(machineCards).not.toBeInTheDocument();
  });

  it('renders correctly with partial or malformed data', () => {
    // Missing lastQC, violationCount 0
    const malformedMachines = [{
      id: 1,
      name: 'Machine A',
      hospCode: 'H-A',
      sectionId: 999,
      currentStatus: 'IDLE' as const,
      qcStatus: 'pass' as const,
      violationCount: 0,
      isActive: true,
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01'
    }];
    
    const categories = [{ id: '999', name: 'Unknown Section' }];

    render(<DashboardInteractive machinesWithStatus={malformedMachines} categories={categories} />);
    
    // Should render the machine name
    expect(screen.getByText('Machine A')).toBeInTheDocument();
    // Should render fallback for lastQC
    expect(screen.getByText('Last QC: N/A')).toBeInTheDocument();
    // Category name should be present
    expect(screen.getAllByText('Unknown Section').length).toBeGreaterThan(0);
  });

  it('handles category filtering gracefully even if data categories are unmatched', () => {
    const machines = [{
      id: 1,
      name: 'Machine A',
      hospCode: 'H-A',
      sectionId: 1,
      currentStatus: 'IDLE' as const,
      qcStatus: 'pass' as const,
      violationCount: 0,
      isActive: true,
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01'
    }];
    
    // Categories list doesn't match the machine's sectionId
    const categories = [{ id: '2', name: 'Other Section' }];

    render(<DashboardInteractive machinesWithStatus={machines} categories={categories} />);
    
    // Filter button for 'Other Section'
    const filterBtn = screen.getByText('Other Section');
    
    fireEvent.click(filterBtn);
    
    // Should filter out Machine A because it doesn't match sectionId 2
    expect(screen.queryByText('Machine A')).not.toBeInTheDocument();
  });
  
  it('renders warning and error QC states without crashing', () => {
    const machines = [
      {
        id: 1, name: 'Machine B', hospCode: 'H-B', sectionId: 1, currentStatus: 'MAINTENANCE' as const,
        qcStatus: 'warning' as const, violationCount: 1, isActive: true, createdAt: '', updatedAt: ''
      },
      {
        id: 2, name: 'Machine C', hospCode: 'H-C', sectionId: 1, currentStatus: 'OFFLINE' as const,
        qcStatus: 'error' as const, violationCount: 3, isActive: true, createdAt: '', updatedAt: ''
      }
    ];

    render(<DashboardInteractive machinesWithStatus={machines} categories={[]} />);
    
    expect(screen.getByText('QC Status: Warning')).toBeInTheDocument();
    expect(screen.getByText('1 Westgard rule violation')).toBeInTheDocument();
    
    expect(screen.getByText('QC Status: Reject')).toBeInTheDocument();
    expect(screen.getByText('3 Westgard rule violations')).toBeInTheDocument();
  });
});
