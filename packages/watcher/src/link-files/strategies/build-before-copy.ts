import {
  childProcessSync,
  copyFile,
  forEachFile,
  getConfig,
  logSubStep,
} from 'simple-package-link-utils';
import determinePathTarget from '../determine-path-target';

export default async function buildBeforeCopy(pkg: LinkedPackage) {
  const config = await getConfig();
  const buildOptions = pkg.strategy.options?.build;
  if (!buildOptions) throw new Error('No build options specified');

  childProcessSync(buildOptions.cmd, {
    args: buildOptions.args,
    cwd: pkg.src.root,
    type: config.debug ? 'inherit' : 'silent',
  });

  forEachFile(buildOptions.outDir, file => {
    const path_src = file.replace(buildOptions.outDir, pkg.src.root);
    const { path_target } = determinePathTarget(pkg, path_src);

    if (config.debug) {
      logSubStep({
        message: `**Relinking ${file} to:**`,
      });
    }

    path_target?.forEach(target => {
      if (config.debug) {
        logSubStep({ message: target });
      }

      copyFile(file, target);
    });
  });
}
