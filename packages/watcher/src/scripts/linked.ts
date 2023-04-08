#!/usr/bin/env node
import { statSync } from 'fs';
import createWatcher, { ChangedFileEvent } from '../create-watcher';
import linkFiles from '../link-files';
import {
  getConfig,
  logStep,
  logSubStep,
  DevProcess,
  listenKillSignal,
  trackChangeEvents,
  cleanup,
  trackDependencyChanges,
  checkPackageRequirements,
  forEachFile,
  deleteFile,
} from '@spl/utils';

async function linked() {
  const { packages } = await getConfig();
  const devProcess = new DevProcess();
  await devProcess.start();
  await devProcess.pause();
  const newChangeEvent = trackChangeEvents(devProcess);
  const syncDependencies = trackDependencyChanges(newChangeEvent);

  const watchers = packages.reduce((acc, pkg) => {
    const initialCopy = async () => {
      forEachFile(pkg.target.root, path => {
        if (path.includes('node_modules')) return;
        deleteFile(path);
      });

      const initialCopy = [] as ChangedFileEvent[];

      pkg.src.syncFiles.map(path => {
        const initialCopyPush = (path_src: string) =>
          initialCopy.push({
            eventType: 'add',
            path_src,
          });

        const stat = statSync(path);

        if (stat.isFile()) {
          initialCopyPush(path);
        }

        if (stat.isDirectory()) {
          forEachFile(path, initialCopyPush);
        }
      });

      await linkFiles(pkg, true, initialCopy, () => () => null);

      syncDependencies(pkg);
    };

    const watchFiles = async () => {
      await createWatcher(pkg, syncDependencies, newChangeEvent, {
        persistent: true,
      });
    };

    return { ...acc, [pkg.id]: { initialCopy, watchFiles } };
  }, {} as Record<LinkedPackage['id'], Record<'initialCopy' | 'watchFiles', () => Promise<void>>>);

  logStep({
    n: 1,
    n_total: 5,
    message: 'Running cleanup...',
  });

  logStep({
    message: 'This can take several minutes',
  });

  await cleanup();

  logStep({
    n: 2,
    n_total: 5,
    message: 'Checking requirements is met...',
  });

  packages.forEach(checkPackageRequirements);

  logStep({
    n: 3,
    n_total: 5,
    message: 'Linking packages...',
  });

  for (let i = 0; i < packages.length; i++) {
    const pkg = packages[i];

    logSubStep({
      n: i + 1,
      n_total: packages.length,
      message: `Copying ${pkg.id} from src to target`,
    });

    await watchers[pkg.id].initialCopy();
  }

  logStep({
    n: 4,
    n_total: 5,
    message: 'Starting listeners...',
  });

  for (let i = 0; i < packages.length; i++) {
    const pkg = packages[i];

    logSubStep({
      n: i + 1,
      n_total: packages.length,
      message: `Starting listener for ${pkg.id}`,
    });

    await watchers[pkg.id].watchFiles();
  }

  logStep({
    n: 5,
    n_total: 5,
    message: 'Running dev command...',
  });

  await devProcess.resume();
  listenKillSignal(devProcess);
}

linked();
