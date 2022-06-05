import { spawnSync, SpawnSyncOptionsWithStringEncoding } from 'child_process';

export default function childProcess(
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
