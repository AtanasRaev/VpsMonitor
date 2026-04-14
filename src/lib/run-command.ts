import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const TIMEOUT_MS = 5000;

/**
 * Run a shell command with a 5-second hard timeout.
 * Only call with hardcoded command strings — never with user-supplied input.
 */
export async function runCommand(cmd: string): Promise<string> {
  const { stdout } = await execAsync(cmd, {
    timeout: TIMEOUT_MS,
    killSignal: 'SIGKILL',
  });
  return stdout.trim();
}
