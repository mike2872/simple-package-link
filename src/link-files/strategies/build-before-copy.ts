import { childProcessSync } from '../../helpers/child-process';
import copyFile from '../../helpers/copy-file';
import forEachFile from '../../helpers/for-each-file';
import { getConfig } from '../../helpers/get-config';
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
    copyFile(file, path_target);
  });
}
