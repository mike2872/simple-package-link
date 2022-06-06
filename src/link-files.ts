import * as fs from 'fs';
import * as path from 'path';
import { logStep, logSubStep } from './helpers/log';
import tsc from './helpers/tsc';
import updateVersionNumber from './helpers/update-version-number';

export default async function linkFiles(
  pkg: LinkedPackage,
  changedFiles: string[],
) {
  // Replace target files with changed src files
  logStep({ pkgId: pkg.id, n: 1, n_total: 3, message: `Linking files...` });

  changedFiles.map((path_src, index) => {
    const _file = path_src.split(pkg?.src.root ?? '')?.[1];
    const file = pkg.tsc
      ? `${path.parse(_file).name}.js`
      : path.parse(_file).base;

    const path_target = fs.realpathSync(
      pkg?.target?.oncopy?.({
        file,
        src: path_src,
        targetRoot: pkg?.target.root,
      }) ?? `${pkg?.target.root}/${file}`,
    );

    if (pkg.tsc) {
      tsc(pkg.target.root, path_src, path_target);
    }

    if (!pkg || !fs.existsSync(path_target)) {
      throw new Error(
        `Couldn't find the corresponding file in your project (${path_src})`,
      );
    }

    if (!pkg.tsc) {
      fs.unlinkSync(path_target);
      fs.copyFileSync(path_src, path_target);
    }

    logSubStep({
      pkgId: pkg.id,
      n: index + 1,
      n_total: changedFiles.length,
      message: `Linked ${file}`,
    });
  });

  // Update package JSON with new version number
  logStep({
    pkgId: pkg.id,
    n: 2,
    n_total: 3,
    message: `Bumping package.json...`,
  });

  updateVersionNumber(
    `${pkg.target.root}/package.json`,
    version => `${version.split('+')[0]}+${new Date().getTime()}`,
  );

  logStep({
    pkgId: pkg.id,
    n: 3,
    n_total: 3,
    message: 'All files were successfully relinked',
  });
}
