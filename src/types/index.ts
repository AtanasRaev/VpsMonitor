// ── System overview ──────────────────────────────────────────────────────────

export interface CpuStats {
  usagePercent: number;
}

export interface RamStats {
  totalMb: number;
  usedMb: number;
  freeMb: number;
  usagePercent: number;
}

export interface DiskStats {
  totalGb: number;
  usedGb: number;
  availableGb: number;
  usagePercent: number;
}

export interface SystemMetrics {
  cpu: CpuStats;
  ram: RamStats;
  disk: DiskStats;
  loadAverage: [number, number, number];
  uptimeSeconds: number;
}

// ── Disk usage ───────────────────────────────────────────────────────────────

export type DiskTarget = 'myteam' | 'checkin_app' | 'checkin_media';

export interface DiskUsageTotal {
  target: DiskTarget;
  path: string;
  totalSize: string; // e.g. "2.4G"
}

export interface DiskSubfolder {
  path: string;
  name: string; // basename only
  size: string; // e.g. "512M"
}

export interface DiskUsageDetails {
  target: DiskTarget;
  path: string;
  subfolders: DiskSubfolder[];
}

// ── Processes ────────────────────────────────────────────────────────────────

export type ProcessStatus = 'online' | 'stopped' | 'errored' | 'unknown';

export type ProcessSource = 'pm2' | 'ps' | null;

export type ProcessFailReason =
  | 'not_running'
  | 'pm2_not_found'
  | 'permission_denied'
  | 'timeout'
  | 'error';

export interface ProcessInfo {
  name: string;
  detected: boolean;
  reason?: ProcessFailReason;
  pid: number | null;
  cpuPercent: number;
  memMb: number | null;      // from pm2 (bytes → MB)
  memPercent: number | null; // from ps (%MEM column)
  status: ProcessStatus;
  source: ProcessSource;
}

export interface ProcessesResponse {
  processes: ProcessInfo[]; // always exactly 2 entries
}

// ── API error ────────────────────────────────────────────────────────────────

export interface ApiError {
  error: string;
}

// ── Database sizes ────────────────────────────────────────────────────────────

export interface DbSizeInfo {
  datname: string;
  sizeBytes: number;
  sizePretty: string;
}

export interface DbSizesResponse {
  databases: DbSizeInfo[];
}

// ── Cron logs ─────────────────────────────────────────────────────────────────

export interface CronLogsResponse {
  lines: string[];
  source: string;
}

// ── Backup info ───────────────────────────────────────────────────────────────

export interface BackupInfo {
  filename: string;
  sizeBytes: number;
  sizePretty: string;
  lastModified: string; // ISO date string
}
