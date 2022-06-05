import * as fs from 'fs';
import getConfig from './helpers/get-config';
import { logStep, logSubStep } from './helpers/log';
import updateVersionNumber from './helpers/update-version-number';

export default async function linkFiles(changedFiles: string[]) {
  const config = await getConfig();

  const files = changedFiles.map(file => {
    const pkg = config.packages.find(({ src }) => file.includes(src));
    const filename = file.split(pkg?.src ?? '')?.[1];
    const file_client =
      pkg?.hooks?.relinkfile?.(filename, file, pkg.target) ??
      `${pkg?.target}/${filename}`;

    if (!pkg || !fs.existsSync(file_client)) {
      throw new Error(
        `Couldn't find the corresponding file in your project (${file})`,
      );
    }

    return {
      pkg,
      filename,
      path_src: file,
      path_target: file_client,
    };
  });

  // Replace target files with changed src files
  logStep({ n: 1, n_total: 3, message: `Linking files...` });
  files.forEach(({ filename, path_src, path_target }, index, array) => {
    fs.unlinkSync(path_target);
    fs.copyFileSync(path_src, path_target);

    logSubStep({
      n: index + 1,
      n_total: array.length,
      message: `Linked ${filename}`,
    });
  });

  // Update package JSON with new version number
  logStep({ n: 2, n_total: 3, message: `Bumping packages...` });
  files.forEach(({ pkg }, index, array) => {
    setTimeout(() => {
      updateVersionNumber(
        `${pkg.target}/package.json`,
        version => `${version.split('+')[0]}+${new Date().getTime()}`,
      );

      logSubStep({
        n: index + 1,
        n_total: array.length,
        message: `Bumped ${pkg.id}`,
      });

      if (index === array.length - 1) {
        logStep({
          n: 3,
          n_total: 3,
          message: 'All files were successfully relinked',
        });
      }
    }, 1000 * (index + 1));
  });
}
