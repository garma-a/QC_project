import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MonitorClient } from '../components/MonitorClient';

const mockPush = vi.fn();
let mockSearchParams = new URLSearchParams('');

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
  useSearchParams: () => mockSearchParams,
}));

// Mock machine charts component since we only want to test MonitorClient data handling
vi.mock('@/features/machines/components/MachineCharts', () => ({
  MachineCharts: () => <div data-testid="machine-charts-mock">Charts Mock</div>
}));

describe('MonitorClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams('');
  });

  it('renders empty state gracefully when machines list is empty (fetch failed/no data)', () => {
    render(<MonitorClient machines={[]} categories={[]} qcHistory={[]} />);
    const heading = screen.queryByText(/Monitor/i);
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

  it('shows detailed machine view and handles missing qcHistory safely', () => {
    const machine = {
      id: 1,
      name: 'Test Machine',
      hospCode: 'H-02',
      sectionId: 1,
      currentStatus: 'RUNNING' as const,
      isActive: true,
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
      testsToday: 5,
      lastQC: { date: '2023-01-01', status: 'warning' }
    };

    // Pre-set the search param to simulate the machine being selected
    mockSearchParams = new URLSearchParams('?machineId=1');

    render(<MonitorClient machines={[machine]} categories={[{ id: '1', name: 'Cat' }]} qcHistory={[]} />);
    
    // It should render the detailed view directly
    expect(screen.getByText('No QC history found for this machine.')).toBeInTheDocument();
    expect(screen.getByText('Tests Today')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders Analytics tab and delegates to MachineCharts', () => {
    const machine = {
      id: 1, name: 'Analytics Machine', hospCode: 'H-03', sectionId: 1, currentStatus: 'IDLE' as const, isActive: true, createdAt: '', updatedAt: ''
    };

    // Pre-set the search params to simulate being on the charts tab
    mockSearchParams = new URLSearchParams('?machineId=1&tab=charts');

    render(<MonitorClient machines={[machine]} categories={[{id: '1', name: 'Cat'}]} qcHistory={[]} />);
    
    // The mock component should render
    expect(screen.getByTestId('machine-charts-mock')).toBeInTheDocument();
  });
});
