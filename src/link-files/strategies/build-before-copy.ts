import { childProcessSync } from '../../helpers/child-process';
import copyFile from '../../helpers/copy-file';
import forEachFile from '../../helpers/for-each-file';
import determinePathTarget from '../determine-path-target';

export default async function buildBeforeCopy(pkg: LinkedPackage) {
  const buildOptions = pkg.target.strategy.options?.build;
  if (!buildOptions) throw new Error('No build options specified');

  childProcessSync(buildOptions.cmd, {
    args: buildOptions.args,
    cwd: pkg.src.root,
    type: 'silent',
  });

  forEachFile(buildOptions.outDir, file => {
    const path_src = file.replace(buildOptions.outDir, pkg.src.root);
    const { path_target } = determinePathTarget(pkg, path_src);
    copyFile(file, path_target);
  });
}
