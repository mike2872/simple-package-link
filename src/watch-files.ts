import chokidar from 'chokidar';
import * as path from 'path';
import { debounce, uniq } from 'lodash';
import linkFiles from './link-files';
import syncDependencies from './helpers/sync-dependencies';

type EventType = 'add' | 'change' | 'unlink';

export type FileEventCallbacks = {
  onChange: (file: string) => void;
  onLinked: (file: string) => void;
};

export interface ChangedFileEvent {
  eventType: EventType;
  path_src: string;
}

export interface ChangedLockFileEvent {
  pkgId: string;
  targetRoot: string;
  prevPkgJson: Record<string, any>;
  newPkgJson: Record<string, any>;
  callbacks: FileEventCallbacks;
}

export interface WatchFilesCallbacks {
  onChange: (id: string, isDependency: boolean) => void;
  onLinked: (id: string) => void;
}

export default async function watchFiles(
  pkg: LinkedPackage,
  callbacks: WatchFilesCallbacks,
) {
  let queue = [] as ChangedFileEvent[];

  const linkFilesDebounced = debounce(
    async (updatedFiles, callbacks: FileEventCallbacks) => {
      await linkFiles(pkg, uniq(updatedFiles), callbacks);
      queue = [];
    },
    500,
    {
      trailing: true,
      leading: false,
    },
  );

  const watcher = chokidar.watch(
    [
      pkg.src.root,
      ...(pkg.experimental?.syncDependencyChanges?.listenLockFiles ?? []),
    ],
    {
      ...pkg.src.watcherOptions,
      persistent: true,
      ignoreInitial: true,
    },
  );

  const syncDeps = syncDependencies(pkg, pkg.target.root, callbacks);

  (['add', 'change', 'unlink'] as const).forEach(eventType => {
    watcher.on(eventType, async changedFile => {
      const syncDependencyChanges = pkg.experimental?.syncDependencyChanges;
      const dependenciesUpdated = syncDependencyChanges?.listenLockFiles.some(
        lockfile => changedFile === lockfile,
      );

      if ((syncDependencyChanges?.enabled, dependenciesUpdated)) {
        syncDeps();
        return;
      }

      const ignore =
        changedFile.includes('node_modules') ||
        path.parse(changedFile).base === 'package.json';

      if (!ignore) {
        queue.push({
          eventType,
          path_src: changedFile,
        });
        linkFilesDebounced(queue, {
          onChange: id => callbacks.onChange(id, false),
          onLinked: id => callbacks.onLinked(id),
        });
      }
    });
  });
}
