import { ChangedFileEvent } from '../../create-watcher';
import {
  copyFile,
  deleteFile,
  logSubStep,
  NewChangeEvent,
  getConfig,
} from 'simple-package-link-utils';
import determinePathTarget from '../determine-path-target';
import { LinkedPackage } from '../../../../../typings';

export default async function directCopy(
  pkg: LinkedPackage,
  files: ChangedFileEvent[],
  newChangeEvent: NewChangeEvent,
) {
  const config = await getConfig();

  for (let index = 0; index < files.length; index++) {
    const { eventType, path_src } = files[index];
    const { file, path_target } = determinePathTarget(pkg, path_src);
    const setLinkFileFinished = newChangeEvent({ restartRequired: false });

    if (config.debug) {
      logSubStep({
        pkgId: pkg.id,
        n: index + 1,
        n_total: files.length,
        message:
          eventType === 'unlink'
            ? `Unlinked ${file} from:`
            : `Linked ${file} to:`,
      });
    }

    path_target?.forEach((target: string) => {
      if (eventType === 'add' || eventType === 'change') {
        if (config.debug) {
          logSubStep({ message: target });
        }

        deleteFile(target);
        copyFile(path_src, target);
      }

      if (eventType === 'unlink') {
        if (config.debug) {
          logSubStep({ message: target });
        }

        deleteFile(target);
      }
    });

    setLinkFileFinished();
  }
}
