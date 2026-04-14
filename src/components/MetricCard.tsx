interface MetricCardProps {
  label: string;
  value?: string | number;
  unit?: string;
  loading?: boolean;
  error?: string;
  subvalue?: string;
}

export default function MetricCard({ label, value, unit, loading, error, subvalue }: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col gap-1 min-w-0">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>

      {loading && !value && (
        <div className="h-7 w-24 bg-gray-200 rounded animate-pulse mt-1" />
      )}

      {error && (
        <span className="text-sm text-red-500 font-medium mt-1">{error}</span>
      )}

      {!loading && !error && value !== undefined && (
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-2xl font-bold text-gray-800 tabular-nums truncate">{value}</span>
          {unit && <span className="text-sm text-gray-500">{unit}</span>}
        </div>
      )}

      {subvalue && (
        <span className="text-xs text-gray-400 truncate">{subvalue}</span>
      )}
    </div>
  );
}
