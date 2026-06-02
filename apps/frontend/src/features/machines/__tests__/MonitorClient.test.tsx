import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MonitorClient } from '../components/MonitorClient';
import { useSearchParams } from 'next/navigation';

// Mock router
const mockPush = vi.fn();
const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: vi.fn(() => new URLSearchParams('')),
}));

// Mock machine charts component since we only want to test MonitorClient data handling
vi.mock('@/features/machines/components/MachineCharts', () => ({
  MachineCharts: () => <div data-testid="machine-charts-mock">Charts Mock</div>
}));

describe('MonitorClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams(''));
  });

  it('renders empty state gracefully when machines list is empty (fetch failed/no data)', () => {
    render(<MonitorClient machines={[]} categories={[]} qcHistory={[]} />);
    // Should not crash, just won't render any machines
    const heading = screen.queryByText(/Monitor/i);
    // As it renders categories based on map, it should render nothing if categories is empty
    expect(screen.queryByText('Last QC:')).not.toBeInTheDocument();
  });

  it('handles missing or partial data fields without crashing', () => {
    const malformedMachines = [{
      id: 1,
      name: 'Partial Machine',
      hospCode: 'H-01',
      sectionId: 1,
      currentStatus: 'IDLE' as const,
      isActive: true,
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01'
    }];
    const categories = [{ id: '1', name: 'Category 1' }];

    render(<MonitorClient machines={malformedMachines} categories={categories} qcHistory={[]} />);
    
    expect(screen.getByText('Partial Machine')).toBeInTheDocument();
    expect(screen.getByText('Category 1')).toBeInTheDocument();
    expect(screen.getByText('Last QC: Unknown')).toBeInTheDocument();
  });

  it('updates URL when a machine is selected', () => {
    const machine = {
      id: 1, name: 'Test Machine', hospCode: 'H-02', sectionId: 1, currentStatus: 'RUNNING' as const, isActive: true, createdAt: '2023-01-01', updatedAt: '2023-01-01', testsToday: 5, lastQC: { date: '2023-01-01', status: 'warning' }
    };
    render(<MonitorClient machines={[machine]} categories={[{ id: '1', name: 'Cat' }]} qcHistory={[]} />);
    
    fireEvent.click(screen.getByText('Test Machine'));
    expect(mockReplace).toHaveBeenCalledWith('?machineId=1', { scroll: false });
  });

  it('shows detailed machine view when machineId is in URL', () => {
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams('?machineId=1'));
    const machine = {
      id: 1, name: 'Test Machine', hospCode: 'H-02', sectionId: 1, currentStatus: 'RUNNING' as const, isActive: true, createdAt: '2023-01-01', updatedAt: '2023-01-01', testsToday: 5, lastQC: { date: '2023-01-01', status: 'warning' }
    };
    render(<MonitorClient machines={[machine]} categories={[{ id: '1', name: 'Cat' }]} qcHistory={[]} />);
    
    expect(screen.getByText('No QC history found for this machine.')).toBeInTheDocument();
    expect(screen.getByText('Tests Today')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('updates URL when Analytics tab is clicked', () => {
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams('?machineId=1'));
    const machine = {
      id: 1, name: 'Analytics Machine', hospCode: 'H-03', sectionId: 1, currentStatus: 'IDLE' as const, isActive: true, createdAt: '', updatedAt: ''
    };
    render(<MonitorClient machines={[machine]} categories={[{id: '1', name: 'Cat'}]} qcHistory={[]} />);
    
    fireEvent.click(screen.getByText('Analytics'));
    expect(mockReplace).toHaveBeenCalledWith('?machineId=1&tab=charts', { scroll: false });
  });

  it('renders Analytics tab when tab=charts is in URL', () => {
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams('?machineId=1&tab=charts'));
    const machine = {
      id: 1, name: 'Analytics Machine', hospCode: 'H-03', sectionId: 1, currentStatus: 'IDLE' as const, isActive: true, createdAt: '', updatedAt: ''
    };
    render(<MonitorClient machines={[machine]} categories={[{id: '1', name: 'Cat'}]} qcHistory={[]} />);
    
    expect(screen.getByTestId('machine-charts-mock')).toBeInTheDocument();
  });
});
