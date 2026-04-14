import { exec } from 'child_process';
import { promisify } from 'util';
import type { ProcessInfo, ProcessStatus, ProcessFailReason } from '@/types';

const execAsync = promisify(exec);
const TIMEOUT_MS = 5000;

const TARGETS = ['my-team', 'checkin'] as const;
type TargetName = (typeof TARGETS)[number];

// ── PM2 ───────────────────────────────────────────────────────────────────────

interface Pm2Process {
  name: string;
  pid: number;
  pm2_env: { status: string };
  monit: { cpu: number; memory: number };
}

function pm2StatusToProcessStatus(s: string): ProcessStatus {
  if (s === 'online') return 'online';
  if (s === 'stopped') return 'stopped';
  if (s === 'errored') return 'errored';
  return 'unknown';
}

async function getPm2Info(): Promise<Pm2Process[] | { failReason: ProcessFailReason }> {
  try {
    const { stdout } = await execAsync('pm2 jlist', {
      timeout: TIMEOUT_MS,
      killSignal: 'SIGKILL',
    });
    const list: Pm2Process[] = JSON.parse(stdout.trim());
    return list;
  } catch (err: unknown) {
    const error = err as NodeJS.ErrnoException & { code?: number | string; killed?: boolean; stderr?: string };

    if (error.killed) return { failReason: 'timeout' };

    // pm2 not in PATH
    if (
      error.code === 'ENOENT' ||
      (typeof error.code === 'number' && error.code === 127) ||
      (typeof error.message === 'string' && error.message.includes('not found'))
    ) {
      return { failReason: 'pm2_not_found' };
    }

    // Permission denied
    const stderr = error.stderr ?? '';
    if (
      typeof stderr === 'string' &&
      stderr.toLowerCase().includes('permission denied')
    ) {
      return { failReason: 'permission_denied' };
    }

    return { failReason: 'error' };
  }
}

// ── PS fallback ───────────────────────────────────────────────────────────────

interface PsEntry {
  pid: number;
  cpuPercent: number;
  memPercent: number;
  args: string;
}

async function getPsInfo(): Promise<PsEntry[] | null> {
  try {
    const { stdout } = await execAsync('ps -eo pid,pcpu,pmem,args', {
      timeout: TIMEOUT_MS,
      killSignal: 'SIGKILL',
    });
    // Filter in Node — no grep in pipeline, avoids self-match
    const lines = stdout
      .split('\n')
      .filter((l) => l.includes('my-team') || l.includes('checkin'));

    return lines
      .map((line): PsEntry | null => {
        const parts = line.trim().split(/\s+/);
        if (parts.length < 4) return null;
        return {
          pid: parseInt(parts[0], 10),
          cpuPercent: parseFloat(parts[1]),
          memPercent: parseFloat(parts[2]),
          args: parts.slice(3).join(' '),
        };
      })
      .filter((e): e is PsEntry => e !== null);
  } catch {
    return null;
  }
}

function findPsEntry(entries: PsEntry[], targetName: TargetName): PsEntry | null {
  return entries.find((e) => e.args.includes(targetName)) ?? null;
}

// ── Aggregate ─────────────────────────────────────────────────────────────────

function notDetected(name: string, reason: ProcessFailReason): ProcessInfo {
  return {
    name,
    detected: false,
    reason,
    pid: null,
    cpuPercent: 0,
    memMb: null,
    memPercent: null,
    status: 'unknown',
    source: null,
  };
}

export async function getProcesses(): Promise<{ processes: ProcessInfo[] }> {
  const pm2Result = await getPm2Info();

  if (!('failReason' in pm2Result)) {
    // PM2 succeeded — build one entry per target
    const processes: ProcessInfo[] = TARGETS.map((targetName) => {
      const proc = pm2Result.find((p) => p.name === targetName);
      if (!proc) {
        return notDetected(targetName, 'not_running');
      }
      return {
        name: targetName,
        detected: true,
        pid: proc.pid,
        cpuPercent: proc.monit.cpu,
        memMb: Math.round(proc.monit.memory / 1024 / 1024),
        memPercent: null,
        status: pm2StatusToProcessStatus(proc.pm2_env.status),
        source: 'pm2',
      };
    });
    return { processes };
  }

  // PM2 failed — try ps fallback
  const pm2FailReason = pm2Result.failReason;
  const psEntries = await getPsInfo();

  const processes: ProcessInfo[] = TARGETS.map((targetName) => {
    if (!psEntries) {
      return notDetected(targetName, pm2FailReason);
    }
    const entry = findPsEntry(psEntries, targetName);
    if (!entry) {
      return notDetected(targetName, 'not_running');
    }
    return {
      name: targetName,
      detected: true,
      pid: entry.pid,
      cpuPercent: entry.cpuPercent,
      memMb: null,
      memPercent: entry.memPercent,
      status: 'online',
      source: 'ps',
    };
  });

  return { processes };
}
