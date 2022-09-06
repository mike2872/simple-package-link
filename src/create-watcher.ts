import chokidar from 'chokidar';
import * as path from 'path';
import { debounce, uniq } from 'lodash';
import linkFiles from './link-files';
import { SyncDependencies } from './helpers/track-dependency-changes';
import { NewChangeEvent } from './helpers/track-change-events';

export interface ChangedFileEvent {
  eventType: 'add' | 'change' | 'unlink';
  path_src: string;
}

interface WatchFilesOptions {
  persistent: boolean;
}

export default function createWatcher(
  pkg: LinkedPackage,
  syncDependencies: SyncDependencies,
  newChangeEvent: NewChangeEvent,
  { persistent }: WatchFilesOptions,
) {
  return new Promise<void>(resolve => {
    let queue = [] as ChangedFileEvent[];

    const changedFilesEventDebounced = debounce(
      async (_changedFilesEvents: ChangedFileEvent[]) => {
        const silent = !persistent;
        const changedFilesEvents = uniq(_changedFilesEvents);

        await linkFiles(pkg, silent, changedFilesEvents, newChangeEvent);
        queue = [];
      },
      500,
      {
        trailing: true,
        leading: false,
      },
    );

    const watcherCwd = pkg.src.root;
    const experimentalSyncDeps = pkg.experimental?.syncDependencyChanges;
    const listenLockfiles = experimentalSyncDeps?.enabled
      ? experimentalSyncDeps.listenLockFiles
      : [];

    const watchFiles = [
      ...(pkg.src.syncFiles ?? [pkg.src.root]),
      ...listenLockfiles,
    ];

    const watcher = chokidar.watch(watchFiles, {
      ...pkg.src.watcherOptions,
      persistent: true,
      cwd: pkg.src.root,
      ignoreInitial: persistent ? true : false,
    });

    (['add', 'change', 'unlink'] as const).forEach(eventType => {
      watcher.on(eventType, async _changedFile => {
        const changedFile = `${watcherCwd}/${_changedFile}`;

        const dependenciesUpdated = experimentalSyncDeps?.listenLockFiles?.some(
          lockfile => changedFile === lockfile,
        );

        if (dependenciesUpdated) {
          syncDependencies(pkg);
        } else {
          const ignore =
            changedFile.includes('node_modules') ||
            path.parse(changedFile).base === 'package.json';

          if (!ignore) {
            queue.push({
              eventType,
              path_src: changedFile,
            });

            changedFilesEventDebounced(queue);
          }
        }
      });
    });

    watcher.on('ready', () => {
      resolve();
    });
  });
}
