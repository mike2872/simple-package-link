import * as os from 'os';
import * as path from 'path';
import { mkdtempSync } from 'fs';
import { childProcessSync } from './child-process';
import { differenceWith, fromPairs, toPairs, isEqual } from 'lodash';
import { logStep } from './log';
import md5Hash from './md5-hash';
import move from './move';
import updateVersionNumber from './update-version-number';
import { ChangedLockFileEvent } from '../watch-files';

function updateDependency(
  pkgId: string,
  targetRoot: string,
  dependency: string,
  version: string,
) {
  logStep({
    pkgId,
    message: `Installing ${dependency}@${version}...`,
  });

  const tmpDir = mkdtempSync(
    path.join(os.tmpdir(), `spl-${md5Hash(`${dependency}${version}`)}`),
  );

  childProcessSync('npm', {
    args: ['init', '--force', '--yes'],
    cwd: tmpDir,
    type: 'silent',
  });

  childProcessSync('npm', {
    args: ['install', `${dependency}@${version}`],
    cwd: tmpDir,
  });

  move(`${tmpDir}/node_modules/${dependency}`, `${tmpDir}`);
  move(`${tmpDir}/node_modules`, `${tmpDir}/${dependency}`);
  move(`${tmpDir}/${dependency}`, `${targetRoot}/node_modules`);
}

export default function updateDependencies({
  pkgId,
  targetRoot,
  prevPkgJson,
  newPkgJson,
  callbacks,
}: ChangedLockFileEvent) {
  const changes = Object.entries(
    fromPairs(
      differenceWith(
        toPairs(newPkgJson.dependencies),
        toPairs(prevPkgJson.dependencies),
        isEqual,
      ),
    ),
  );

  changes.forEach(([dependency, version]) => {
    const dependencyCallbackId = `${dependency}${version}`;
    callbacks.onChange(dependencyCallbackId);

    updateDependency(pkgId, targetRoot, dependency, version as string);
    updateVersionNumber(
      `${targetRoot}/package.json`,
      version => `${version.split('+')[0]}+${new Date().getTime()}`,
    );

    callbacks.onLinked(dependencyCallbackId);
  });
}
