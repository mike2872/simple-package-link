import nodemon from 'nodemon';
import uniq from 'lodash.uniq';
import linkFiles from './link-files';

export default function watchFiles() {
  const pkg = JSON.parse(
    decodeURIComponent(process.argv[process.argv.length - 1]),
  ) as LinkedPackage;

  if (!pkg) {
    throw new Error(`An unknown error occured while trying to the watcher`);
  }

  nodemon({
    cwd: pkg.src.root,
    script: `/dev/null`,
    ext: '*',
    watch: pkg.src.include,
    ignore: pkg.src.exclude,
    delay: 0.2,
  }).on('restart', updatedFiles => {
    linkFiles(uniq(updatedFiles));
  });

  nodemon.on('quit', () => {
    process.exit();
  });
}

watchFiles();
