#!/usr/bin/env node

import linkPackage from '../link-package';
import { getConfig } from '../helpers/get-config';
import { logStep, logSubStep } from '../helpers/log';
import watchFiles from '../watch-files';
import DevProcess from '../helpers/dev-process';
import listenKillSignal from '../helpers/listen-kill-signal';
import trackChangingFiles from '../helpers/track-changing-files';

async function linked() {
  const { packages } = await getConfig();
  const devProcess = new DevProcess();
  await devProcess.start();

  await devProcess.pause();

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

  const { onChange, onLinked } = trackChangingFiles(devProcess);

  for (let i = 0; i < packages.length; i++) {
    const pkg = packages[i];

    logSubStep({
      n: i + 1,
      n_total: packages.length,
      message: `Starting listener for ${pkg.id}`,
    });

    watchFiles(pkg, {
      onChange: (file, isDependency) => onChange(pkg.id, file, isDependency),
      onLinked: file => onLinked(pkg.id, file),
    });
  }

  logStep({
    n: 3,
    n_total: 3,
    message: 'Running dev command',
  });

  await devProcess.resume();
  listenKillSignal(devProcess);
}

linked();
