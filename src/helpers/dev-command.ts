import { getConfig } from './get-config';
import getCWD from './get-cwd';
import { childProcess } from './child-process';
import { ChildProcess } from 'child_process';

export type DevProcess = {
  process: ChildProcess;
  pause: () => void;
  resume: () => void;
};

export default async function devCommand() {
  const cwd = getCWD();
  const { debug, devCommand } = await getConfig();

  const { process, pause, resume } = childProcess(devCommand.cmd, {
    args: devCommand.args,
    cwd,
    type: 'inherit',
  });

  return { process, pause: () => pause(!debug), resume: () => resume(!debug) };
}
