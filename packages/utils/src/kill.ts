import { ChildProcess } from 'child_process';
import { logStep } from './log';

export function kill(
  type: 'SIGSTOP' | 'SIGCONT' | 'SIGKILL',
  silent: boolean,
  _process: ChildProcess,
) {
  if (!silent) {
    logStep({
      message: `${
        type === 'SIGSTOP' ? 'Pausing' : type === 'SIGCONT' ? 'Resuming' : type
      } process ${process.pid}...`,
    });
  }

  _process.kill(type);
}
