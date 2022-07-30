import * as path from 'path';
import copyFile from './helpers/copy-file';
import deleteFile from './helpers/delete-file';
import { getTsConfig } from './helpers/get-config';
import { logStep as _logStep, logSubStep as _logSubStep } from './helpers/log';
import { NewChangeEvent } from './helpers/track-change-events';
import tsc from './helpers/tsc';
import updatePackageJson from './helpers/update-package-json';
import { ChangedFileEvent } from './create-watcher';

export default async function linkFiles(
  pkg: LinkedPackage,
  silent: boolean,
  files: ChangedFileEvent[],
  newChangeEvent: NewChangeEvent,
) {
  const linkFilesDone = newChangeEvent({ restartRequired: false });

  const logStep = silent ? () => null : _logStep;
  const logSubStep = silent ? () => null : _logSubStep;

  const tsconfig = pkg.tsc
    ? getTsConfig(`${pkg.src.root}/tsconfig.json`)
    : null;

  // Replace target files with changed src files
  logStep({ pkgId: pkg.id, n: 1, n_total: 3, message: `Linking files...` });

  files.map(({ eventType, path_src }, index) => {
    const linkFileDone = newChangeEvent({ restartRequired: false });

    const {
      dir,
      name,
      base,
      ext: _ext,
    } = path.parse(path_src.split(pkg?.src.root ?? '')?.[1]);

    const ext = pkg.tsc
      ? tsconfig?.compilerOptions?.jsx === 'preserve'
        ? '.jsx'
        : '.js'
      : _ext;

    const file = pkg.tsc ? `${dir}/${name}${ext}` : `${dir}/${base}`;

    const path_target =
      pkg?.target?.oncopy?.({
        name,
        ext,
        relativePath: file,
        src: path_src,
        targetRoot: pkg?.target.root,
      }) ?? `${pkg?.target.root}${file}`;

    if (eventType === 'add' || eventType === 'change') {
      if (pkg.tsc) {
        tsc(`${pkg.src.root}/tsconfig.json`, path_src, path_target);
      } else {
        deleteFile(path_target);
        copyFile(path_src, path_target);
      }
    }

    if (eventType === 'unlink') {
      deleteFile(path_target);
    }

    if (!silent) {
      logSubStep({
        pkgId: pkg.id,
        n: index + 1,
        n_total: files.length,
        message: `${eventType === 'unlink' ? 'Unlinked' : 'Linked'} ${file}`,
      });
    }

    linkFileDone();
  });

  // Update package JSON with new version number
  logStep({
    pkgId: pkg.id,
    n: 2,
    n_total: 3,
    message: `Bumping package.json...`,
  });

  updatePackageJson(`${pkg.target.root}/package.json`, ({ version }) => ({
    version: `${version.split('+')[0]}+${new Date().getTime()}`,
  }));

  logStep({
    pkgId: pkg.id,
    n: 3,
    n_total: 3,
    message: 'All files were successfully relinked',
  });

  linkFilesDone();
}
