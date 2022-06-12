import {
  spawn,
  SpawnOptions,
  spawnSync,
  SpawnSyncOptionsWithStringEncoding,
} from 'child_process';
import { logStep } from './log';

function getProcessTree(pid: string | number) {
  const helper = (pids = [pid]) => {
    return [
      pids,
      ...pids.map(childPid =>
        childProcessSync('pgrep', {
          args: ['-P', String(childPid)],
          type: 'return',
        }),
      ),
    ];
  };

  const tree = helper();
  return tree.flat(Infinity).map(String);
}

const kill = (
  type: 'SIGSTOP' | 'SIGCONT',
  silent: boolean,
  pid?: string | number,
) => {
  if (!pid) return;
  const processTree = getProcessTree(String(pid));

  if (!silent) {
    logStep({
      message: `${type === 'SIGSTOP' ? 'Pausing' : 'Resuming'} process ${pid}`,
    });
  }

  processTree.forEach(pid =>
    childProcessSync('kill', {
      args: [`-${type.toUpperCase()}`, pid],
      type: 'return',
    }),
  );
};

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

  return { process, pause, resume };
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
