import nodemon from 'nodemon';
import lodash from 'lodash';
import linkFiles from './link-files';
import { LinkedPackage } from './helpers/get-config';

export default function watchFiles() {
  const pkg = JSON.parse(
    decodeURIComponent(process.argv[process.argv.length - 1]),
  ) as LinkedPackage;

  if (!pkg) {
    throw new Error(`An unknown error occured while trying to the watcher`);
  }

  let queue = [] as string[];

  const debouncedLinking = lodash.debounce(
    async updatedFiles => {
      await linkFiles(lodash.uniq(updatedFiles));
      queue = [];
    },
    200,
    {
      trailing: true,
      leading: false,
    },
  );

  nodemon({
    cwd: pkg.src,
    script: `/dev/null`,
    ext: '*',
    ignore: pkg.ignore,
  }).on('restart', updatedFiles => {
    updatedFiles?.forEach(updatedFile => {
      queue.push(updatedFile);
      debouncedLinking(queue);
    });
  });

  nodemon.on('quit', () => {
    process.exit();
  });
}

watchFiles();
