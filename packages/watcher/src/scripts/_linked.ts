#!/usr/bin/env node
import { statSync } from 'fs';
import util from 'util';
import createWatcher, { ChangedFileEvent } from '../create-watcher';
import linkFiles from '../link-files';
import {
  getConfig,
  logStep,
  logSubStep,
  DevProcess,
  trackChangeEvents,
  cleanup,
  trackDependencyChanges,
  checkPackageRequirements,
  forEachFile,
  deleteFile,
  childProcessSync,
} from 'simple-package-link-utils';

async function linked() {
  const config = await getConfig();
  const { debug, packages } = config;
  const devProcess = new DevProcess();
  await devProcess.start();
  await devProcess.pause();
  const newChangeEvent = trackChangeEvents(devProcess);
  const syncDependencies = trackDependencyChanges(newChangeEvent);

  if (debug) {
    console.log(
      util.inspect(config, {
        showHidden: false,
        depth: null,
        colors: true,
      }),
    );
  }

  logStep({
    n: 1,
    n_total: 5,
    message: 'Running cleanup...',
  });

  await cleanup(debug);

  const watchers = packages.reduce((acc, pkg) => {
    const install = async () => {
      const install = pkg.install;
      if (install) {
        childProcessSync(install.cmd, {
          args: install.args,
          cwd: install.cwd,
          type: debug ? 'inherit' : 'silent',
        });
      }
    };

    const build = async () => {
      const buildOptions = pkg.strategy.options?.build;
      if (buildOptions) {
        childProcessSync(buildOptions.cmd, {
          args: buildOptions.args,
          cwd: buildOptions.cwd,
          type: debug ? 'inherit' : 'silent',
        });
      }
    };

    const initialCopy = async () => {
      pkg.target.root.resolved?.forEach((target: string) => {
        forEachFile(target, path => {
          if (path.includes('node_modules')) return;
          deleteFile(path);
        });
      });

      const initialCopy = [] as ChangedFileEvent[];

      pkg.src.syncFiles.map(path => {
        const initialCopyPush = (path_src: string) =>
          initialCopy.push({
            eventType: 'add',
            path_src,
          });

        try {
          const stat = statSync(path);

          if (stat.isFile()) {
            initialCopyPush(path);
          }

          if (stat.isDirectory()) {
            forEachFile(path, initialCopyPush);
          }
        } catch (e) {
          if (debug) {
            console.error(e);
          }
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

    return { ...acc, [pkg.id]: { install, build, initialCopy, watchFiles } };
  }, {} as Record<LinkedPackage['id'], Record<'install' | 'build' | 'initialCopy' | 'watchFiles', () => Promise<void>>>);

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
      pkgId: `(${i + 1} of ${packages.length}) ${pkg.id}`,
      message: '',
    });

    if (pkg.install) {
      logSubStep({
        message: `Running install command...`,
      });

      await watchers[pkg.id].install();
    }

    if (pkg.strategy.type === 'build-before-copy') {
      logSubStep({
        message: `Running build command...`,
      });

      await watchers[pkg.id].build();
    }

    logSubStep({
      message: `Initial copy from src to target...`,
    });

    await watchers[pkg.id].initialCopy();

    logSubStep({
      message: `Starting listener...`,
    });

    await watchers[pkg.id].watchFiles();
  }

  logStep({
    n: 4,
    n_total: 4,
    message: 'Running dev command...',
  });

  await devProcess.resume();
}

linked();
