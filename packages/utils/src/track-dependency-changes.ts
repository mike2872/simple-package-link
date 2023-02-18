import * as os from 'os';
import * as path from 'path';
import { mkdtempSync } from 'fs';
import { childProcessSync } from './child-process';
import { differenceWith, fromPairs, toPairs, isEqual } from 'lodash';
import { logStep, logSubStep } from './log';
import { md5Hash } from './md5-hash';
import { move } from './move';
import { deleteFolder } from './delete-folder';
import { NewChangeEvent } from './track-change-events';
import { getPackageJson } from './get-package-json';
import { updatePackageJson } from './update-package-json';

function syncDependency(
  pkg: LinkedPackage,
  dependency: { name: string; version: string },
) {
  logSubStep({
    pkgId: pkg.id,
    message: `Installing ${dependency.name}@${dependency.version}`,
  });

  const tmpDir = mkdtempSync(
    path.join(
      os.tmpdir(),
      md5Hash(
        `${dependency.name}${dependency.version}${new Date().toISOString()}`,
      ),
    ),
  );

  childProcessSync('npm', {
    args: ['init', '--force', '--yes'],
    cwd: tmpDir,
    type: 'silent',
  });

  childProcessSync('npm', {
    args: ['install', `${dependency}@${dependency.version}`],
    cwd: tmpDir,
    type: 'silent',
  });

  move(`${tmpDir}/node_modules/${dependency}`, `${tmpDir}`);
  move(`${tmpDir}/node_modules`, `${tmpDir}/${dependency}`);
  deleteFolder(`${pkg.target.root}/node_modules/${dependency}`);
  move(`${tmpDir}/${dependency}`, `${pkg.target.root}/node_modules`);

  updatePackageJson(
    `${pkg.target.root}/package.json`,
    ({ version, dependencies }) => ({
      dependencies: {
        ...dependencies,
        [dependency.name]: dependency.version,
      },
      version: `${version.split('+')[0]}+${new Date().getTime()}`,
    }),
  );
}

export function trackDependencyChanges(newChangeEvent: NewChangeEvent) {
  const getPkgJson = (pkg: LinkedPackage) => {
    return [pkg.src.root, pkg.target.root].map(root =>
      getPackageJson(`${root}/package.json`),
    );
  };

  return (pkg: LinkedPackage) => {
    const experimentalSyncDeps = pkg.experimental?.syncDependencyChanges;
    if (!experimentalSyncDeps?.enabled) return;

    const [newPkgJson, currentPkgJson] = getPkgJson(pkg);

    const changes = Object.entries(
      fromPairs(
        differenceWith(
          toPairs(newPkgJson.dependencies),
          toPairs(currentPkgJson.dependencies),
          isEqual,
        ),
      ),
    );

    if (changes) {
      logStep({
        pkgId: pkg.id,
        message: `Installing dependencies...`,
      });

      const syncDependenciesDone = newChangeEvent({
        restartRequired: true,
      });

      changes.forEach(([name, version]) => {
        syncDependency(pkg, { name, version: version as string });
      });

      syncDependenciesDone();
    }
  };
}

export type SyncDependencies = ReturnType<typeof trackDependencyChanges>;
