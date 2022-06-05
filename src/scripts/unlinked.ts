#!/usr/bin/env node

import childProcess from '../helpers/child-process';
import getConfig from '../helpers/get-config';
import getCWD from '../helpers/get-cwd';
import { logStep, logSubStep } from '../helpers/log';

export default async function unlinked() {
  const { packages, commands } = await getConfig();

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
    message: 'Running reinstall command',
  });

  childProcess(commands.reinstall.cmd, {
    args: commands.reinstall.args,
    cwd: getCWD(),
  });

  logStep({
    n: 3,
    n_total: 3,
    message: 'Running dev command',
  });

  childProcess(commands.dev.cmd, {
    args: commands.dev.args,
    cwd: getCWD(),
  });
}

unlinked();
