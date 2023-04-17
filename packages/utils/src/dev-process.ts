import { getConfig } from './get-config';
import { getCWD } from './get-cwd';
import { childProcess } from './child-process';
import { logStep } from './log';

type Instance = Nullable<ReturnType<typeof childProcess>>;

export class DevProcess {
  private instance: Instance;

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
    logStep({ message: 'Spawning dev process...' });
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
    await this.terminate();
    await this.start();
  }
}
