import { runCommand } from './run-command';
import type { DbSizesResponse } from '@/types';

const QUERY = `
SELECT datname, pg_database_size(datname), pg_size_pretty(pg_database_size(datname))
FROM pg_database
WHERE datname IN ('checkin_db', 'myteam_db');
`.trim();

export async function getDbSizes(): Promise<DbSizesResponse> {
  const output = await runCommand(
    `psql -U postgres -t -A -F'|' -c "${QUERY}"`
  );

  const databases = output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [datname, rawBytes, sizePretty] = line.split('|');
      return {
        datname: datname.trim(),
        sizeBytes: parseInt(rawBytes.trim(), 10),
        sizePretty: sizePretty.trim(),
      };
    });

  return { databases };
}
