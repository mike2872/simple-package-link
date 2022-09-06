import { ChangedFileEvent } from '../../create-watcher';
import copyFile from '../../helpers/copy-file';
import deleteFile from '../../helpers/delete-file';
import { logSubStep as _logSubStep } from '../../helpers/log';
import { NewChangeEvent } from '../../helpers/track-change-events';
import determinePathTarget from '../determine-path-target';

export default async function directCopy(
  pkg: LinkedPackage,
  silent: boolean,
  files: ChangedFileEvent[],
  newChangeEvent: NewChangeEvent,
) {
  const logSubStep = silent ? () => null : _logSubStep;

  for (let index = 0; index < files.length; index++) {
    const { eventType, path_src } = files[index];
    const { file, path_target } = determinePathTarget(pkg, path_src);
    const setLinkFileFinished = newChangeEvent({ restartRequired: false });

    if (eventType === 'add' || eventType === 'change') {
      deleteFile(path_target);
      copyFile(path_src, path_target);
    }

    if (eventType === 'unlink') {
      deleteFile(path_target);
    }

    if (!silent) {
      logSubStep({
        pkgId: pkg.id,
        n: index + 1,
        n_total: files.length,
        message: `${eventType === 'unlink' ? 'Unlinked' : 'Linked'} ${file}`,
      });
    }

    setLinkFileFinished();
  }
}
