import { runCommand } from './run-command';
import type { CronLogsResponse } from '@/types';

const LOG_PATH = '/var/log/myteam-cron.log';
const TAIL_LINES = 100;

export async function getCronLogs(): Promise<CronLogsResponse> {
  const output = await runCommand(`tail -n ${TAIL_LINES} ${LOG_PATH}`);
  const lines = output.split('\n');
  return { lines, source: LOG_PATH };
}
