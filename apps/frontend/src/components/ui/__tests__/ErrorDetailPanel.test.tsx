import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ErrorDetailPanel } from '../ErrorDetailPanel';
import React from 'react';

const mockError = {
  id: '1',
  machineId: 'M-123',
  machineName: 'Test Machine',
  machineCategory: 'chemistry',
  errorCode: 'ERR-001',
  errorType: 'Calibration Error',
  severity: 'critical' as const,
  description: 'Machine failed calibration',
  timestamp: new Date('2023-01-01T12:00:00Z').toISOString(),
  status: 'active' as const,
  relatedErrorCount: 2,
  possibleCauses: ['Low fluid', 'Sensor dirty'],
  suggestedSolutions: ['Refill fluid', 'Clean sensor'],
  lowRange: 10,
  highRange: 20,
  units: 'mg/dL',
  recentValues: [12, 14, 25],
  errorPattern: 'systematic' as const,
  westgardRule: '1-3s',
  patternExplanation: 'Shift detected',
  aiInsight: 'Likely sensor drift'
};

describe('ErrorDetailPanel component', () => {
  it('returns null if no error provided', () => {
    const { container } = render(<ErrorDetailPanel error={null} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders error details correctly', () => {
    render(<ErrorDetailPanel error={mockError} onClose={vi.fn()} />);
    
    expect(screen.getByText('Calibration Error')).toBeInTheDocument();
    expect(screen.getByText('Machine failed calibration')).toBeInTheDocument();
    expect(screen.getByText('ERR-001')).toBeInTheDocument();
    
    expect(screen.getByText('Test Machine')).toBeInTheDocument();
    expect(screen.getByText('M-123')).toBeInTheDocument();
    
    expect(screen.getByText('critical')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
    
    expect(screen.getByText('Low fluid')).toBeInTheDocument();
    expect(screen.getByText('Refill fluid')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onCloseMock = vi.fn();
    render(<ErrorDetailPanel error={mockError} onClose={onCloseMock} />);
    
    // There are multiple buttons that can close, one is the X icon, one is the 'Close' text button
    const closeTextButton = screen.getByText('Close');
    fireEvent.click(closeTextButton);
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});
