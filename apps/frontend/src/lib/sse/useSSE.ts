'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { sseClient } from './sseClient';

const ENTITY_TO_QUERY_KEYS: Record<string, string[][]> = {
  machines: [['machines'], ['dashboard-data']],
  'control-lots': [['control-lots'], ['dashboard-data'], ['qc-context-data']],
  'qc-tests': [['qc-tests'], ['dashboard-data'], ['qc-context-data']],
  'qc-results': [['qc-results'], ['qc-results-infinite'], ['dashboard-data']],
  alerts: [['alerts']],
};

export function useSSE() {
  const token = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const queryClientRef = useRef(queryClient);
  queryClientRef.current = queryClient;

  useEffect(() => {
    if (!token) {
      sseClient.disconnect();
      return;
    }

    sseClient.connect(token, (event) => {
      const keys = ENTITY_TO_QUERY_KEYS[event.entity];
      if (!keys) return;

      for (const queryKey of keys) {
        queryClientRef.current.invalidateQueries({ queryKey });
      }
    });

    return () => {
      sseClient.disconnect();
    };
  }, [token]);
}
