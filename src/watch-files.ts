import nodemon from 'nodemon';
import uniq from 'lodash.uniq';
import debounce from 'lodash.debounce';
import linkFiles from './link-files';
import { getConfig } from './helpers/get-config';

export default async function watchFiles() {
  const pkg = (await getConfig()).packages.find(
    ({ id }) => id === process.argv[process.argv.length - 1],
  );

  if (!pkg) {
    throw new Error(`An unknown error occured while trying to the watcher`);
  }

  let queue = [] as string[];

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

  nodemon({
    cwd: pkg.src.root,
    script: `/dev/null`,
    ext: '*',
    watch: pkg.src.include,
    ignore: pkg.src.exclude,
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
