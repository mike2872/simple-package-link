#!/usr/bin/env node

import linkPackage from '../link-package';
import { getConfig } from '../helpers/get-config';
import { logStep, logSubStep } from '../helpers/log';
import watchFiles, { WatchFilesCallbacks } from '../watch-files';
import DevProcess from '../helpers/dev-process';
import listenKillSignal from '../helpers/listen-kill-signal';
import trackChangingFiles from '../helpers/track-changing-files';
import syncDependencies from '../helpers/sync-dependencies';
import cleanup from '../helpers/cleanup';

async function linked() {
  const { packages } = await getConfig();
  const devProcess = new DevProcess();
  await devProcess.start();

  await devProcess.pause();

  const constructWatchFilesCallbacks = (pkg: LinkedPackage) => {
    const { onChange, onLinked } = trackChangingFiles(devProcess);

    return {
      onChange: (file, isDependency) => onChange(pkg.id, file, isDependency),
      onLinked: file => onLinked(pkg.id, file),
    } as WatchFilesCallbacks;
  };

  logStep({
    n: 1,
    n_total: 1,
    message: 'Running cleanup...',
  });

  await cleanup();

  logStep({
    n: 1,
    n_total: 3,
    message: 'Linking packages...',
  });

  for (let i = 0; i < packages.length; i++) {
    const pkg = packages[i];
    logSubStep({
      n: i + 1,
      n_total: packages.length,
      message: `Copying ${pkg.id} from src to target`,
    });

    const syncDeps = syncDependencies(
      pkg,
      pkg.target.root,
      constructWatchFilesCallbacks(pkg),
    );

    await linkPackage(pkg);
    syncDeps();
  }

  logStep({
    n: 2,
    n_total: 3,
    message: 'Starting listeners...',
  });

  for (let i = 0; i < packages.length; i++) {
    const pkg = packages[i];

    logSubStep({
      n: i + 1,
      n_total: packages.length,
      message: `Starting listener for ${pkg.id}`,
    });

    watchFiles(pkg, constructWatchFilesCallbacks(pkg));
  }

  logStep({
    n: 3,
    n_total: 3,
    message: 'Running dev command...',
  });

  await devProcess.resume();
  listenKillSignal(devProcess);
}

linked();
