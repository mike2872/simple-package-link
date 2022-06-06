#!/usr/bin/env node

import childProcess from '../helpers/child-process';
import getConfig from '../helpers/get-config';
import getCWD from '../helpers/get-cwd';
import { logStep, logSubStep } from '../helpers/log';

async function unlinked() {
  const { packages, devCommand, reinstallCommand } = await getConfig();

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

    childProcess('rm', {
      args: ['-rf', pkg.target],
    });
  });

  logStep({
    n: 2,
    n_total: 3,
    message: 'Reinstalling packages',
  });

  childProcess(reinstallCommand.cmd, {
    args: reinstallCommand.args,
    cwd: getCWD(),
  });

  logStep({
    n: 3,
    n_total: 3,
    message: 'Running dev command',
  });

  childProcess(devCommand.cmd, {
    args: devCommand.args,
    cwd: getCWD(),
  });
}

unlinked();
