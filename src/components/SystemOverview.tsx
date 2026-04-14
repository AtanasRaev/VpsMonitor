import MetricCard from './MetricCard';
import type { SystemMetrics } from '@/types';

interface SystemOverviewProps {
  data: SystemMetrics | null;
  loading: boolean;
  error: string | null;
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function SystemOverview({ data, loading, error }: SystemOverviewProps) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
        VPS Overview
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <MetricCard
          label="CPU"
          value={data ? data.cpu.usagePercent : undefined}
          unit="%"
          loading={loading}
          error={error ?? undefined}
          subvalue={data ? `${data.loadAverage[0].toFixed(2)} load` : undefined}
        />
        <MetricCard
          label="RAM"
          value={data ? `${data.ram.usedMb} / ${data.ram.totalMb}` : undefined}
          unit="MB"
          loading={loading}
          error={error ?? undefined}
          subvalue={data ? `${data.ram.usagePercent}% used` : undefined}
        />
        <MetricCard
          label="Disk"
          value={data ? `${data.disk.usedGb} / ${data.disk.totalGb}` : undefined}
          unit="GB"
          loading={loading}
          error={error ?? undefined}
          subvalue={data ? `${data.disk.usagePercent}% used` : undefined}
        />
        <MetricCard
          label="Load"
          value={data ? `${data.loadAverage[0].toFixed(2)}` : undefined}
          loading={loading}
          error={error ?? undefined}
          subvalue={
            data
              ? `5m: ${data.loadAverage[1].toFixed(2)} · 15m: ${data.loadAverage[2].toFixed(2)}`
              : undefined
          }
        />
        <MetricCard
          label="Uptime"
          value={data ? formatUptime(data.uptimeSeconds) : undefined}
          loading={loading}
          error={error ?? undefined}
        />
      </div>
    </section>
  );
}
