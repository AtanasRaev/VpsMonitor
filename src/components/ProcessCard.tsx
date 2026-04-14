import type { ProcessInfo, ProcessFailReason } from '@/types';

interface ProcessCardProps {
  process: ProcessInfo;
}

const STATUS_COLORS = {
  online: 'bg-green-100 text-green-800',
  stopped: 'bg-yellow-100 text-yellow-800',
  errored: 'bg-red-100 text-red-800',
  unknown: 'bg-gray-100 text-gray-600',
};

const REASON_LABELS: Record<ProcessFailReason, string> = {
  not_running: 'Process not running',
  pm2_not_found: 'PM2 not found in PATH',
  permission_denied: 'Permission denied',
  timeout: 'Command timed out',
  error: 'Detection failed',
};

export default function ProcessCard({ process: proc }: ProcessCardProps) {
  const statusColor = STATUS_COLORS[proc.status];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-gray-800">{proc.name}</span>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor}`}>
            {proc.status}
          </span>
          {proc.source && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
              {proc.source}
            </span>
          )}
        </div>
      </div>

      {!proc.detected && proc.reason ? (
        <p className="text-sm text-red-500">{REASON_LABELS[proc.reason]}</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">PID</span>
            <span className="font-mono font-medium">{proc.pid ?? '—'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">CPU</span>
            <span className="font-medium">{proc.cpuPercent.toFixed(1)}%</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">Memory</span>
            <span className="font-medium">
              {proc.memMb !== null
                ? `${proc.memMb} MB`
                : proc.memPercent !== null
                ? `${proc.memPercent.toFixed(1)}%`
                : '—'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
