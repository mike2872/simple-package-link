#!/usr/bin/env node

import linkPackage from '../link-package';
import { getConfig } from '../helpers/get-config';
import { logStep, logSubStep } from '../helpers/log';
import watchFiles from '../watch-files';
import devCommand from '../helpers/dev-command';
import suspendOnRelink from '../helpers/suspend-on-relink';

async function linked() {
  const { packages } = await getConfig();
  const devProcess = await devCommand();
  const { setIsRelinking } = await suspendOnRelink(devProcess);

  devProcess.pause();

  logStep({
    n: 1,
    n_total: 3,
    message: 'Linking packages',
  });

  for (let i = 0; i < packages.length; i++) {
    const pkg = packages[i];
    logSubStep({
      n: i + 1,
      n_total: packages.length,
      message: `Copying ${pkg.id} from src to target`,
    });

    await linkPackage(pkg);
  }

  logStep({
    n: 2,
    n_total: 3,
    message: 'Starting listeners',
  });

  for (let i = 0; i < packages.length; i++) {
    const pkg = packages[i];
    logSubStep({
      n: i + 1,
      n_total: packages.length,
      message: `Starting listener for ${pkg.id}`,
    });

    await watchFiles(pkg, setIsRelinking);
  }

  logStep({
    n: 3,
    n_total: 3,
    message: 'Running dev command',
  });

  devProcess.resume();
}

linked();
