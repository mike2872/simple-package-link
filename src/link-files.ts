import * as fs from 'fs';
import * as path from 'path';
import { getTsConfig } from './helpers/get-config';
import { logStep, logSubStep } from './helpers/log';
import tsc from './helpers/tsc';
import updateVersionNumber from './helpers/update-version-number';

export default async function linkFiles(
  pkg: LinkedPackage,
  changedFiles: string[],
) {
  const tsconfig = getTsConfig(`${pkg.src.root}/tsconfig.json`);

  // Replace target files with changed src files
  logStep({ pkgId: pkg.id, n: 1, n_total: 3, message: `Linking files...` });

  changedFiles.map((path_src, index) => {
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

    if (pkg.tsc) {
      tsc(`${pkg.src.root}/tsconfig.json`, path_src, path_target);
    }

    if (!pkg.tsc) {
      if (fs.existsSync(path_target)) {
        fs.unlinkSync(path_target);
      }

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
