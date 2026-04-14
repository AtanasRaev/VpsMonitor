import ProcessCard from './ProcessCard';
import type { ProcessesResponse } from '@/types';

interface ProcessSectionProps {
  data: ProcessesResponse | null;
  loading: boolean;
  error: string | null;
}

export default function ProcessSection({ data, loading, error }: ProcessSectionProps) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Processes
      </h2>

      {loading && !data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 h-28 animate-pulse">
              <div className="h-4 w-24 bg-gray-200 rounded mb-3" />
              <div className="h-3 w-full bg-gray-100 rounded mb-2" />
              <div className="h-3 w-3/4 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      )}

      {error && !data && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg p-3">{error}</p>
      )}

      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {data.processes.map((proc) => (
            <ProcessCard key={proc.name} process={proc} />
          ))}
        </div>
      )}
    </section>
  );
}
