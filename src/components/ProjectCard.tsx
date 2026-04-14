'use client';

import { useState } from 'react';
import type { DiskTarget, DiskUsageTotal, DiskUsageDetails } from '@/types';

interface ProjectCardProps {
  target: DiskTarget;
  label: string;
  path: string;
}

type DiskState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'done'; data: DiskUsageTotal | DiskUsageDetails; mode: 'total' | 'breakdown' };

function friendlyError(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes('permission denied')) return 'Cannot read folder: permission denied';
  if (lower.includes('timed out') || lower.includes('killed')) return 'Command timed out (>5s)';
  if (lower.includes('not found')) return 'Folder not found on disk';
  return raw;
}

function isDetails(data: DiskUsageTotal | DiskUsageDetails): data is DiskUsageDetails {
  return 'subfolders' in data;
}

export default function ProjectCard({ target, label, path }: ProjectCardProps) {
  const [diskState, setDiskState] = useState<DiskState>({ status: 'idle' });

  async function fetchDisk(details: boolean) {
    setDiskState({ status: 'loading' });
    try {
      const res = await fetch(`/api/disk-usage?target=${target}&details=${details}`);
      const json = await res.json();
      if (!res.ok) {
        setDiskState({ status: 'error', message: friendlyError(json.error ?? 'Unknown error') });
        return;
      }
      setDiskState({ status: 'done', data: json, mode: details ? 'breakdown' : 'total' });
    } catch {
      setDiskState({ status: 'error', message: 'Network error — could not reach server' });
    }
  }

  const isLoading = diskState.status === 'loading';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col gap-3">
      <div>
        <h3 className="font-semibold text-gray-800">{label}</h3>
        <p className="text-xs text-gray-400 font-mono mt-0.5 break-all">{path}</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => fetchDisk(false)}
          disabled={isLoading}
          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading && diskState.status === 'loading' ? 'Loading…' : 'Check folder size'}
        </button>
        <button
          onClick={() => fetchDisk(true)}
          disabled={isLoading}
          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Show breakdown
        </button>
      </div>

      {diskState.status === 'loading' && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg className="animate-spin h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Running du…
        </div>
      )}

      {diskState.status === 'error' && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{diskState.message}</p>
      )}

      {diskState.status === 'done' && diskState.mode === 'total' && !isDetails(diskState.data) && (
        <div className="text-sm bg-gray-50 rounded-lg px-3 py-2">
          <span className="text-gray-500">Total: </span>
          <span className="font-semibold text-gray-800">{diskState.data.totalSize}</span>
        </div>
      )}

      {diskState.status === 'done' && diskState.mode === 'breakdown' && isDetails(diskState.data) && (
        <div className="text-sm">
          {diskState.data.subfolders.length === 0 ? (
            <p className="text-gray-400 italic">No subfolders found.</p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-1 font-semibold text-gray-500 text-xs">Folder</th>
                  <th className="pb-1 font-semibold text-gray-500 text-xs text-right">Size</th>
                </tr>
              </thead>
              <tbody>
                {diskState.data.subfolders.map((sf) => (
                  <tr key={sf.path} className="border-b border-gray-50 last:border-0">
                    <td className="py-1 font-mono text-gray-700 truncate max-w-[160px]">{sf.name}</td>
                    <td className="py-1 text-right font-medium text-gray-800 tabular-nums">{sf.size}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
