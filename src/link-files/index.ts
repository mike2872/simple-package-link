import { logStep as _logStep } from '../helpers/log';
import { NewChangeEvent } from '../helpers/track-change-events';
import updatePackageJson from '../helpers/update-package-json';
import { ChangedFileEvent } from '../create-watcher';
import strategies from './strategies';

export default async function linkFiles(
  pkg: LinkedPackage,
  silent: boolean,
  files: ChangedFileEvent[],
  newChangeEvent: NewChangeEvent,
) {
  const logStep = silent ? () => null : _logStep;
  const setLinkFilesFinished = newChangeEvent({ restartRequired: false });

  // Replace target files with changed src files
  logStep({ pkgId: pkg.id, n: 1, n_total: 3, message: `Linking files...` });

  if (pkg.target.strategy.type === 'direct-copy') {
    await strategies.directCopy(pkg, silent, files, newChangeEvent);
  }

  if (pkg.target.strategy.type === 'build-before-copy') {
    await strategies.buildBeforeCopy(pkg);
  }

  // Update package JSON with new version number
  logStep({
    pkgId: pkg.id,
    n: 2,
    n_total: 3,
    message: `Bumping package.json...`,
  });

  updatePackageJson(`${pkg.target.root}/package.json`, ({ version }) => ({
    version: `${version.split('+')[0]}+${new Date().getTime()}`,
  }));

  logStep({
    pkgId: pkg.id,
    n: 3,
    n_total: 3,
    message: 'All files were successfully relinked',
  });

  setLinkFilesFinished();
}
