#!/usr/bin/env node

import { childProcessSync } from '../helpers/child-process';
import DevProcess from '../helpers/dev-process';
import { getConfig } from '../helpers/get-config';
import getCWD from '../helpers/get-cwd';
import listenKillSignal from '../helpers/listen-kill-signal';
import { logStep, logSubStep } from '../helpers/log';

async function unlinked() {
  const { packages, reinstallCommand } = await getConfig();

  logStep({
    n: 1,
    n_total: 3,
    message: 'Deleting linked packages',
  });

  packages.forEach((pkg, index) => {
    logSubStep({
      n: index + 1,
      n_total: packages.length,
      message: `Deleting ${pkg.id}`,
    });

    childProcessSync('rm', {
      args: ['-rf', pkg.target.root],
    });
  });

  logStep({
    n: 2,
    n_total: 3,
    message: 'Reinstalling packages',
  });

  childProcessSync(reinstallCommand.cmd, {
    args: reinstallCommand.args,
    cwd: getCWD(),
  });

  logStep({
    n: 3,
    n_total: 3,
    message: 'Running dev command',
  });

  const devProcess = new DevProcess();
  await devProcess.start();
  listenKillSignal(devProcess);
}

unlinked();
