'use client';

import { useState } from 'react';
import type { CronLogsResponse } from '@/types';

type LogState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'done'; data: CronLogsResponse };

type ParsedEntry =
  | { type: 'header'; timestamp: string; label: string }
  | { type: 'json'; pretty: string; skipped: boolean }
  | { type: 'text'; content: string };

const CURL_NOISE = [/--:--:--/, /% Total/, /Dload/, /^\s*\d+\s+\d+\s+\d+\s+\d+\s+\d+\s+\d+/];

function isCurlNoise(line: string): boolean {
  return CURL_NOISE.some((re) => re.test(line));
}

function parseCronLines(lines: string[]): ParsedEntry[] {
  const entries: ParsedEntry[] = [];

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (!line.trim() || isCurlNoise(line)) continue;

    const headerMatch = line.match(/^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]\s+(.+)$/);
    if (headerMatch) {
      entries.push({ type: 'header', timestamp: headerMatch[1], label: headerMatch[2] });
      continue;
    }

    if (line.trimStart().startsWith('{')) {
      try {
        const parsed = JSON.parse(line.trim());
        const { skipped, reason, nowIso, ...rest } = parsed;
        const summary = { skipped, reason, nowIso, ...rest };
        entries.push({ type: 'json', pretty: JSON.stringify(summary, null, 2), skipped: !!skipped });
      } catch {
        entries.push({ type: 'text', content: line });
      }
      continue;
    }

    entries.push({ type: 'text', content: line });
  }

  return entries;
}

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

        {logState.status === 'done' && (() => {
          const entries = parseCronLines(logState.data.lines);
          return (
            <div>
              <p className="text-xs text-gray-400 mb-2 font-mono">
                {logState.data.source} · last {logState.data.lines.length} lines
              </p>
              <div className="max-h-96 overflow-y-auto rounded-lg bg-gray-950 p-3 flex flex-col gap-1">
                {entries.length === 0 && (
                  <span className="text-xs text-gray-500 font-mono">(empty)</span>
                )}
                {entries.map((entry, i) => {
                  if (entry.type === 'header') {
                    return (
                      <div key={i} className="flex items-center gap-2 mt-2 first:mt-0">
                        <span className="text-xs text-gray-500 font-mono shrink-0">{entry.timestamp}</span>
                        <span className="text-xs font-semibold text-yellow-400 uppercase tracking-wide">{entry.label}</span>
                      </div>
                    );
                  }
                  if (entry.type === 'json') {
                    return (
                      <pre key={i} className={`text-xs font-mono whitespace-pre-wrap break-all pl-2 border-l-2 ${entry.skipped ? 'border-gray-600 text-gray-400' : 'border-green-600 text-green-300'}`}>
                        {entry.pretty}
                      </pre>
                    );
                  }
                  return (
                    <span key={i} className="text-xs font-mono text-gray-400">{entry.content}</span>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>
    </section>
  );
}
