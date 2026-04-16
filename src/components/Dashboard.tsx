'use client';

import { useEffect, useState, useCallback } from 'react';
import SystemOverview from './SystemOverview';
import ProcessSection from './ProcessSection';
import ProjectSection from './ProjectSection';
import DatabaseSizesCard from './DatabaseSizesCard';
import CronLogsCard from './CronLogsCard';
import BackupDownloadCard from './BackupDownloadCard';
import type { SystemMetrics, ProcessesResponse, DbSizesResponse } from '@/types';

const REFRESH_INTERVAL_MS = 10_000;

export default function Dashboard() {
  const [systemData, setSystemData] = useState<SystemMetrics | null>(null);
  const [systemError, setSystemError] = useState<string | null>(null);
  const [systemLoading, setSystemLoading] = useState(true);

  const [processData, setProcessData] = useState<ProcessesResponse | null>(null);
  const [processError, setProcessError] = useState<string | null>(null);
  const [processLoading, setProcessLoading] = useState(true);

  const [dbSizesData, setDbSizesData] = useState<DbSizesResponse | null>(null);
  const [dbSizesError, setDbSizesError] = useState<string | null>(null);
  const [dbSizesLoading, setDbSizesLoading] = useState(true);

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchSystem = useCallback(async () => {
    try {
      const res = await fetch('/api/system');
      const json = await res.json();
      if (!res.ok) {
        setSystemError(json.error ?? 'Failed to load system metrics');
      } else {
        setSystemData(json);
        setSystemError(null);
        setLastUpdated(new Date());
      }
    } catch {
      setSystemError('Network error — cannot reach server');
    } finally {
      setSystemLoading(false);
    }
  }, []);

  const fetchProcesses = useCallback(async () => {
    try {
      const res = await fetch('/api/processes');
      const json = await res.json();
      if (!res.ok) {
        setProcessError(json.error ?? 'Failed to load process info');
      } else {
        setProcessData(json);
        setProcessError(null);
      }
    } catch {
      setProcessError('Network error — cannot reach server');
    } finally {
      setProcessLoading(false);
    }
  }, []);

  const fetchDbSizes = useCallback(async () => {
    try {
      const res = await fetch('/api/monitor/db-sizes');
      const json = await res.json();
      if (!res.ok) {
        setDbSizesError(json.error ?? 'Failed to load database sizes');
      } else {
        setDbSizesData(json);
        setDbSizesError(null);
      }
    } catch {
      setDbSizesError('Network error — cannot reach server');
    } finally {
      setDbSizesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSystem();
    fetchProcesses();
    fetchDbSizes();

    const interval = setInterval(() => {
      fetchSystem();
      fetchProcesses();
      fetchDbSizes();
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [fetchSystem, fetchProcesses, fetchDbSizes]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">VPS Monitor</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Auto-refreshes every {REFRESH_INTERVAL_MS / 1000}s
            {lastUpdated && ` · last updated ${lastUpdated.toLocaleTimeString()}`}
          </p>
        </div>
        <button
          onClick={() => { fetchSystem(); fetchProcesses(); fetchDbSizes(); }}
          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
        >
          Refresh now
        </button>
      </header>

      <SystemOverview
        data={systemData}
        loading={systemLoading}
        error={systemError}
      />

      <ProcessSection
        data={processData}
        loading={processLoading}
        error={processError}
      />

      <ProjectSection />

      <DatabaseSizesCard
        data={dbSizesData}
        loading={dbSizesLoading}
        error={dbSizesError}
      />

      <CronLogsCard />

      <BackupDownloadCard />
    </div>
  );
}
