import * as fs from 'fs';
import { logStep, logSubStep } from './helpers/log';
import updateVersionNumber from './helpers/update-version-number';

export default async function linkFiles(
  pkg: LinkedPackage,
  changedFiles: string[],
) {
  const files = changedFiles.map(file => {
    const filename = file.split(pkg?.src.root ?? '')?.[1];
    const file_client = fs.realpathSync(
      pkg?.target?.oncopy?.(filename, file) ??
        `${pkg?.target.root}/${filename}`,
    );

    if (!pkg || !fs.existsSync(file_client)) {
      throw new Error(
        `Couldn't find the corresponding file in your project (${file})`,
      );
    }

    return {
      filename,
      path_src: file,
      path_target: file_client,
    };
  });

  // Replace target files with changed src files
  logStep({ pkgId: pkg.id, n: 1, n_total: 3, message: `Linking files...` });
  files.forEach(({ filename, path_src, path_target }, index, array) => {
    fs.unlinkSync(path_target);
    fs.copyFileSync(path_src, path_target);

    logSubStep({
      pkgId: pkg.id,
      n: index + 1,
      n_total: array.length,
      message: `Linked ${filename}`,
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
