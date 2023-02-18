import { DevProcess } from './dev-process';
import { logStep } from './log';

export function listenKillSignal(devProcess: InstanceType<typeof DevProcess>) {
  const terminateAllProcesses = async (err?: any) => {
    if (err) {
      console.error(err);
    }

    logStep({ message: 'Terminating gracefully...' });
    await devProcess.terminate();
    process.exit(0);
  };

  ['SIGINT', 'SIGTERM'].forEach(signal =>
    process.on(signal, () => terminateAllProcesses()),
  );

  process.on('uncaughtException', err => terminateAllProcesses(err));
}
