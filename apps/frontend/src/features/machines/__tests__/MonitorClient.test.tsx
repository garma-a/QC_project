import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MonitorClient } from '../components/MonitorClient';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock router
const mockPush = vi.fn();
const mockReplace = vi.fn();
let currentSearchParams = new URLSearchParams('');

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => currentSearchParams,
  usePathname: () => '/dashboard',
}));

// Mock machine charts component since we only want to test MonitorClient data handling
vi.mock('@/features/machines/components/MachineCharts', () => ({
  MachineCharts: () => <div data-testid="machine-charts-mock">Charts Mock</div>
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

describe('MonitorClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    currentSearchParams = new URLSearchParams('');
  });

  it('renders empty state gracefully when machines list is empty (fetch failed/no data)', () => {
    renderWithProviders(<MonitorClient machines={[]} categories={[]} qcHistory={[]} />);
    // Should not crash, just won't render any machines
    const heading = screen.queryByText(/Monitor/i);
    // As it renders categories based on map, it should render nothing if categories is empty
    expect(screen.queryByText('Last QC:')).not.toBeInTheDocument();
  });

  it('handles missing or partial data fields without crashing', () => {
    const malformedMachines = [{
      id: 1,
      name: 'Partial Machine',
      hospitalCode: 'H-01',
      sectionId: 1,
      currentStatus: 'IDLE' as const,
      isActive: true,
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01'
      // Missing tests, testsToday, lastQC
    }];
    const categories = [{ id: '1', name: 'Category 1' }];

    renderWithProviders(<MonitorClient machines={malformedMachines} categories={categories} qcHistory={[]} />);
    
    // Machine is rendered
    expect(screen.getByText('Partial Machine')).toBeInTheDocument();
    expect(screen.getByText('Category 1')).toBeInTheDocument();
    
    // Should render "Unknown" or fallback for missing lastQC
    expect(screen.getByText('Last QC: Unknown')).toBeInTheDocument();
  });

  it('shows detailed machine view and handles missing qcHistory safely', () => {
    // Mock URL params to simulate machine selected
    currentSearchParams = new URLSearchParams('?machineId=1');
    
    const machine = {
      id: 1,
      name: 'Test Machine',
      hospitalCode: 'H-02',
      sectionId: 1,
      currentStatus: 'RUNNING' as const,
      isActive: true,
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
      testsToday: 5,
      lastQC: { date: '2023-01-01', status: 'warning' }
    };

    renderWithProviders(<MonitorClient machines={[machine]} categories={[{ id: '1', name: 'Cat' }]} qcHistory={[]} />);
    
    // It should render the detailed view directly
    expect(screen.getByText('No QC history found for this machine.')).toBeInTheDocument();
    expect(screen.getByText('Tests Today')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders Analytics tab and delegates to MachineCharts', () => {
    // Mock URL params to simulate machine and tab selected
    currentSearchParams = new URLSearchParams('?machineId=1&tab=charts');
    
    const machine = {
      id: 1, name: 'Analytics Machine', hospitalCode: 'H-03', sectionId: 1, currentStatus: 'IDLE' as const, isActive: true, createdAt: '', updatedAt: ''
    };
    renderWithProviders(<MonitorClient machines={[machine]} categories={[{id: '1', name: 'Cat'}]} qcHistory={[]} />);
    
    // The mock component should render
    expect(screen.getByTestId('machine-charts-mock')).toBeInTheDocument();
  });
});

