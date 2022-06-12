import chokidar from 'chokidar';
import * as path from 'path';
import getPackageJson from './helpers/get-package-json';
import updateDependencies from './helpers/update-dependency';
import { debounce, uniq } from 'lodash';
import linkFiles from './link-files';

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

export default async function watchFiles(
  pkg: LinkedPackage,
  callbacks: {
    onChange: (id: string, isDependency: boolean) => void;
    onLinked: (id: string) => void;
  },
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
    [pkg.src.root, ...(pkg.dependencyChanges?.listenLockFiles ?? [])],
    {
      ...pkg.src.watcherOptions,
      persistent: true,
      ignoreInitial: true,
    },
  );

  const getPkgJson = () => getPackageJson(`${pkg.src.root}/package.json`);
  const prevPkgJson = getPkgJson();

  (['add', 'change', 'unlink'] as const).forEach(eventType => {
    watcher.on(eventType, async changedFile => {
      const dependenciesUpdated = pkg.dependencyChanges?.listenLockFiles.some(
        lockfile => changedFile === lockfile,
      );

      if (dependenciesUpdated) {
        const newPkgJson = getPkgJson();

        updateDependencies({
          pkgId: pkg.id,
          targetRoot: pkg.target.root,
          prevPkgJson,
          newPkgJson,
          callbacks: {
            onChange: id => callbacks.onChange(id, true),
            onLinked: id => callbacks.onLinked(id),
          },
        });
      } else {
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
      }
    });
  });
}
