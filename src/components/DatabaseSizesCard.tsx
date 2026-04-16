import type { DbSizesResponse } from '@/types';

interface DatabaseSizesCardProps {
  data: DbSizesResponse | null;
  loading: boolean;
  error: string | null;
}

export default function DatabaseSizesCard({ data, loading, error }: DatabaseSizesCardProps) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Database Sizes
      </h2>

      {loading && !data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 h-20 animate-pulse">
              <div className="h-3 w-24 bg-gray-200 rounded mb-3" />
              <div className="h-6 w-16 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      )}

      {error && !data && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg p-3">{error}</p>
      )}

      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {data.databases.map((db) => (
            <div key={db.datname} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {db.datname}
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-gray-800 tabular-nums">{db.sizePretty}</span>
              </div>
              <span className="text-xs text-gray-400">{db.sizeBytes.toLocaleString()} bytes</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
