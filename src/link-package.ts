import os from 'os';
import * as path from 'path';
import childProcess from './helpers/child-process';
import getConfig, { LinkedPackage } from './helpers/get-config';
import updateVersionNumber from './helpers/update-version-number';
import { mkdtempSync } from 'fs';

export default async function linkPackage(pkg: LinkedPackage) {
  const config = await getConfig();
  const childProcessType = config.debug ? 'inherit' : 'silent';
  const tmpDir = mkdtempSync(path.join(os.tmpdir(), 'spl-'));

  const paths = {
    src: pkg.src,
    target: pkg.target,
    packed: `${tmpDir}/${pkg.id}.tgz`,
    unpacked: `${tmpDir}/package`,
  };

  // Run before hook
  if (pkg.hooks?.prepack) {
    childProcess(pkg.hooks.prepack.cmd, {
      args: pkg.hooks.prepack.args,
      cwd: paths.src,
      type: childProcessType,
    });
  }

  // Pack src package
  childProcess('yarn', {
    args: ['pack', '--filename', paths.packed],
    cwd: paths.src,
    type: childProcessType,
  });

  // Unpack src package
  childProcess('tar', {
    args: ['-xzf', paths.packed, '--directory', tmpDir],
    type: childProcessType,
  });

  // Delete old node_modules package
  childProcess('rm', { args: ['-rf', paths.target], type: childProcessType });

  // Copy unpackaged folder to target
  childProcess('cp', {
    args: ['-R', paths.unpacked, paths.target],
    type: childProcessType,
  });

  // Update package JSON with new version number
  updateVersionNumber(
    `${paths.target}/package.json`,
    version => `${version}+${new Date().getTime()}`,
  );
}
