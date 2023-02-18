import { childProcessSync } from './child-process';
import { getProcessTree } from './get-process-tree';
import { logStep } from './log';

export function kill(type: string, silent: boolean, pid?: string | number) {
  if (!pid) return;
  const processTree = getProcessTree(String(pid));

  if (!silent) {
    logStep({
      message: `${
        type === 'SIGSTOP' ? 'Pausing' : type === 'SIGCONT' ? 'Resuming' : type
      } process ${pid}...`,
    });
  }

  processTree.forEach(pid =>
    childProcessSync('kill', {
      args: [`-${type.toUpperCase()}`, pid],
      type: 'return',
    }),
  );
}
