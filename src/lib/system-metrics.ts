import { readFile } from 'fs/promises';
import { runCommand } from './run-command';
import type { SystemMetrics, CpuStats, RamStats, DiskStats } from '@/types';

// ── CPU ──────────────────────────────────────────────────────────────────────

interface CpuSnapshot {
  total: number;
  idle: number;
}

function parseCpuLine(line: string): CpuSnapshot {
  // Format: "cpu  user nice system idle iowait irq softirq steal ..."
  const parts = line.trim().split(/\s+/).slice(1).map(Number);
  const idle = parts[3] + (parts[4] ?? 0); // idle + iowait
  const total = parts.reduce((a, b) => a + b, 0);
  return { total, idle };
}

async function readCpuSnapshot(): Promise<CpuSnapshot> {
  const raw = await readFile('/proc/stat', 'utf-8');
  const cpuLine = raw.split('\n').find((l) => l.startsWith('cpu '));
  if (!cpuLine) throw new Error('Cannot parse /proc/stat');
  return parseCpuLine(cpuLine);
}

async function measureCpuUsage(): Promise<CpuStats> {
  const snap1 = await readCpuSnapshot();
  await new Promise((resolve) => setTimeout(resolve, 400));
  const snap2 = await readCpuSnapshot();

  const deltaTotal = snap2.total - snap1.total;
  const deltaIdle = snap2.idle - snap1.idle;

  if (deltaTotal === 0) return { usagePercent: 0 };
  const usagePercent = Math.round(((deltaTotal - deltaIdle) / deltaTotal) * 1000) / 10;
  return { usagePercent };
}

// ── RAM ──────────────────────────────────────────────────────────────────────

function parseRam(raw: string): RamStats {
  const get = (key: string): number => {
    const match = raw.match(new RegExp(`^${key}:\\s+(\\d+)`, 'm'));
    return match ? parseInt(match[1], 10) : 0;
  };

  const totalKb = get('MemTotal');
  const availableKb = get('MemAvailable');
  const freeKb = get('MemFree');

  const usedKb = totalKb - availableKb;
  const totalMb = Math.round(totalKb / 1024);
  const usedMb = Math.round(usedKb / 1024);
  const freeMb = Math.round(freeKb / 1024);
  const usagePercent = totalKb > 0 ? Math.round((usedKb / totalKb) * 100) : 0;

  return { totalMb, usedMb, freeMb, usagePercent };
}

// ── Disk ─────────────────────────────────────────────────────────────────────

function parseDisk(raw: string): DiskStats {
  // df -BG --output=size,used,avail,pcent /
  // Header line, then one data line
  const lines = raw.trim().split('\n').filter((l) => l.trim());
  const dataLine = lines[lines.length - 1];
  const parts = dataLine.trim().split(/\s+/);

  const stripG = (s: string) => parseInt(s.replace('G', ''), 10);
  const stripPct = (s: string) => parseInt(s.replace('%', ''), 10);

  return {
    totalGb: stripG(parts[0]),
    usedGb: stripG(parts[1]),
    availableGb: stripG(parts[2]),
    usagePercent: stripPct(parts[3]),
  };
}

// ── Load average ─────────────────────────────────────────────────────────────

function parseLoad(raw: string): [number, number, number] {
  const parts = raw.trim().split(/\s+/);
  return [parseFloat(parts[0]), parseFloat(parts[1]), parseFloat(parts[2])];
}

// ── Uptime ───────────────────────────────────────────────────────────────────

function parseUptime(raw: string): number {
  return Math.floor(parseFloat(raw.trim().split(/\s+/)[0]));
}

// ── Aggregate ────────────────────────────────────────────────────────────────

export async function getSystemMetrics(): Promise<SystemMetrics> {
  const [ramRaw, diskRaw, loadRaw, uptimeRaw, cpu] = await Promise.all([
    readFile('/proc/meminfo', 'utf-8'),
    runCommand('df -BG --output=size,used,avail,pcent /'),
    readFile('/proc/loadavg', 'utf-8'),
    readFile('/proc/uptime', 'utf-8'),
    measureCpuUsage(),
  ]);

  return {
    cpu,
    ram: parseRam(ramRaw),
    disk: parseDisk(diskRaw),
    loadAverage: parseLoad(loadRaw),
    uptimeSeconds: parseUptime(uptimeRaw),
  };
}
