import { childProcessSync } from './helpers/child-process';
import { getConfig } from './helpers/get-config';
import updateVersionNumber from './helpers/update-version-number';

export default async function linkPackage(pkg: LinkedPackage) {
  const config = await getConfig();
  const childProcessType = config.debug ? 'inherit' : 'silent';

  const paths = {
    src: pkg.src.root,
    target: pkg.target.root,
    packed: `${config.tmpDir}/${pkg.id}.tgz`,
    unpacked: `${config.tmpDir}/package`,
  };

  // Run prepack hook
  if (pkg.prepack) {
    childProcessSync(pkg.prepack.cmd, {
      args: pkg.prepack.args,
      cwd: paths.src,
      type: childProcessType,
    });
  }

  // Pack src package
  childProcessSync('yarn', {
    args: ['pack', '--filename', paths.packed],
    cwd: paths.src,
    type: childProcessType,
  });

  // Unpack src package
  childProcessSync('tar', {
    args: ['-xzf', paths.packed, '--directory', config.tmpDir],
    type: childProcessType,
  });

  // Delete old node_modules package
  childProcessSync('rm', {
    args: ['-rf', paths.target],
    type: childProcessType,
  });

  // Copy unpackaged folder to target
  childProcessSync('cp', {
    args: ['-R', paths.unpacked, paths.target],
    type: childProcessType,
  });

  // Update package JSON with new version number
  updateVersionNumber(
    `${paths.target}/package.json`,
    version => `${version}+${new Date().getTime()}`,
  );
}
