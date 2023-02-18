import {
  spawn,
  SpawnOptions,
  spawnSync,
  SpawnSyncOptionsWithStringEncoding,
} from 'child_process';
import { kill } from './kill';

export function childProcess(
  cmd: string,
  options?: {
    type?: 'silent' | 'return' | 'inherit';
    args?: string[];
    cwd?: string;
  },
) {
  const { type = 'inherit', args = [], cwd } = options ?? {};

  const opts = {
    silent: { stdio: 'ignore' },
    inherit: { stdio: 'inherit' },
    return: { stdio: 'pipe', encoding: 'utf-8' },
  }[type] as Partial<SpawnOptions>;

  const process = spawn(cmd, args ?? [], { cwd, ...opts });
  const pause = (silent = false) => kill('SIGSTOP', silent, process.pid);
  const resume = (silent = false) => kill('SIGCONT', silent, process.pid);
  const terminate = (silent = false) => kill('SIGKILL', silent, process.pid);

  return { process, pause, resume, terminate };
}

export function childProcessSync(
  cmd: string,
  options?: {
    type?: 'silent' | 'return' | 'inherit';
    args?: string[];
    cwd?: string;
  },
) {
  const { type = 'inherit', args = [], cwd } = options ?? {};

  const opts = {
    silent: { stdio: 'ignore' },
    inherit: { stdio: 'inherit' },
    return: { stdio: 'pipe', encoding: 'utf-8' },
  }[type] as Partial<SpawnSyncOptionsWithStringEncoding>;

  const process = spawnSync(cmd, args ?? [], { cwd, ...opts });

  if (type === 'return') {
    return process.stdout
      .toString()
      .split('\n')
      .map(out => out.trim())
      .filter(Boolean) as string[];
  }
}
