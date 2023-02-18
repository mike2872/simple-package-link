import { getConfig } from './get-config';
import { getCWD } from './get-cwd';
import { childProcess } from './child-process';
import { logStep } from './log';

export class DevProcess {
  private instance: Nullable<ReturnType<typeof childProcess>>;

  constructor() {
    this.instance = null;
  }

  private async spawn() {
    const cwd = getCWD();
    const { debug, devCommand } = await getConfig();

    const createProcess = () =>
      childProcess(devCommand.cmd, {
        args: devCommand.args,
        cwd,
        type: 'inherit',
      });

    const devProcess = createProcess();

    this.instance = {
      process: devProcess.process,
      pause: () => devProcess.pause(!debug),
      resume: () => devProcess.resume(!debug),
      terminate: () => devProcess.terminate(!debug),
    };
  }

  public async start() {
    await this.spawn();
  }

  public async pause() {
    this.instance?.pause();
  }

  public async resume() {
    this.instance?.resume();
  }

  public async terminate() {
    this.instance?.terminate();
    this.instance = null;
  }

  public async restart() {
    logStep({ message: 'Restarting dev process...' });
    await this.terminate();
    await this.start();
  }
}
