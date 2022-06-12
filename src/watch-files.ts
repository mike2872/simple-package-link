import chokidar from 'chokidar';
import { debounce, uniq } from 'lodash';
import linkFiles from './link-files';

export type FileEvent = {
  type: 'deleted' | 'added' | 'changed';
  path_src: string;
  setRelinkingDone: () => void;
};

export default async function watchFiles(
  pkg: LinkedPackage,
  setIsRelinking: (path: string) => () => void,
) {
  if (!pkg) {
    throw new Error(`An unknown error occured while trying to the watcher`);
  }

  let queue = [] as FileEvent[];

  const debouncedLinking = debounce(
    async updatedFiles => {
      await linkFiles(pkg, uniq(updatedFiles));
      queue = [];
    },
    500,
    {
      trailing: true,
      leading: false,
    },
  );

  const watcher = chokidar.watch(pkg.src.root, {
    ...pkg.src.watcherOptions,
    persistent: true,
    ignoreInitial: true,
  });

  const link = (type: 'added' | 'changed' | 'deleted', path_src: string) => {
    const ignore = ['node_modules', 'package.json'].some(excluded =>
      path_src.includes(excluded),
    );
    if (ignore) return;

    const setRelinkingDone = setIsRelinking(path_src);

    queue.push({ type, path_src, setRelinkingDone });
    debouncedLinking(queue);
  };

  watcher
    .on('add', path => {
      link('added', path);
    })
    .on('change', path => {
      link('changed', path);
    })
    .on('unlink', path => {
      link('deleted', path);
    });
}
