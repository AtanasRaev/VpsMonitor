'use client';

import { useState } from 'react';
import type { CronLogsResponse } from '@/types';

type LogState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'done'; data: CronLogsResponse };

export default function CronLogsCard() {
  const [logState, setLogState] = useState<LogState>({ status: 'idle' });

  async function fetchLogs() {
    setLogState({ status: 'loading' });
    try {
      const res = await fetch('/api/monitor/cron-logs');
      const json = await res.json();
      if (!res.ok) {
        setLogState({ status: 'error', message: json.error ?? 'Failed to load logs' });
      } else {
        setLogState({ status: 'done', data: json });
      }
    } catch {
      setLogState({ status: 'error', message: 'Network error — cannot reach server' });
    }
  }

  const isLoading = logState.status === 'loading';

  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Cron Logs
      </h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col gap-3">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={fetchLogs}
            disabled={isLoading}
            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Loading…' : 'Load logs'}
          </button>
          {logState.status === 'done' && (
            <button
              onClick={fetchLogs}
              disabled={isLoading}
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Refresh
            </button>
          )}
        </div>

        {logState.status === 'loading' && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg className="animate-spin h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Reading log file…
          </div>
        )}

        {logState.status === 'error' && (
          <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{logState.message}</p>
        )}

        {logState.status === 'done' && (
          <div>
            <p className="text-xs text-gray-400 mb-2 font-mono">{logState.data.source} · last {logState.data.lines.length} lines</p>
            <pre className="max-h-64 overflow-y-auto font-mono text-xs bg-gray-950 text-green-400 rounded-lg p-3 whitespace-pre-wrap break-all">
              {logState.data.lines.join('\n') || '(empty)'}
            </pre>
          </div>
        )}
      </div>
    </section>
  );
}
