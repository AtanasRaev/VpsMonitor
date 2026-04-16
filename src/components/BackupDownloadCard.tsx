'use client';

import { useState } from 'react';
import type { BackupInfo } from '@/types';

type BackupState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; info: BackupInfo };

interface BackupEntryProps {
  db: 'myteam' | 'checkin';
  label: string;
}

function BackupEntry({ db, label }: BackupEntryProps) {
  const [state, setState] = useState<BackupState>({ status: 'idle' });

  async function loadAndDownload() {
    setState({ status: 'loading' });
    try {
      const res = await fetch(`/api/monitor/backups/${db}/latest?info=true`);
      const json = await res.json();
      if (!res.ok) {
        setState({ status: 'error', message: json.error ?? 'Failed to load backup info' });
        return;
      }
      setState({ status: 'ready', info: json });
    } catch {
      setState({ status: 'error', message: 'Network error — cannot reach server' });
    }
  }

  function triggerDownload() {
    window.location.href = `/api/monitor/backups/${db}/latest`;
  }

  const isLoading = state.status === 'loading';

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 flex-wrap items-center">
        <button
          onClick={state.status === 'ready' ? triggerDownload : loadAndDownload}
          disabled={isLoading}
          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Loading…' : state.status === 'ready' ? `Download ${label}` : `Check ${label} backup`}
        </button>
        {state.status === 'ready' && (
          <button
            onClick={loadAndDownload}
            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Refresh info
          </button>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg className="animate-spin h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Looking up latest backup…
        </div>
      )}

      {state.status === 'error' && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{state.message}</p>
      )}

      {state.status === 'ready' && (
        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 font-mono">
          <span className="text-gray-700 font-semibold">{state.info.filename}</span>
          <span className="mx-2">·</span>
          {state.info.sizePretty}
          <span className="mx-2">·</span>
          {new Date(state.info.lastModified).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}

export default function BackupDownloadCard() {
  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Database Backups
      </h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col gap-4">
        <BackupEntry db="myteam" label="MyTeam" />
        <div className="border-t border-gray-100" />
        <BackupEntry db="checkin" label="CheckIn" />
      </div>
    </section>
  );
}
