import { debounce, uniq } from 'lodash';
import DevProcess from '../helpers/dev-process';
import md5Hash from '../helpers/md5-hash';

export default function trackChangingFiles(
  devProcess: InstanceType<typeof DevProcess>,
) {
  let restartQueued = false;
  let filesChanging = [] as string[];

  const onClearedFilesDebounced = debounce(
    async (filesChanging: string[]) => {
      if (filesChanging.length === 0) {
        if (restartQueued) {
          restartQueued = false;
          devProcess.restart();
        } else {
          devProcess.resume();
        }
      }
    },
    500,
    {
      trailing: true,
      leading: false,
    },
  );

  const onChange = (pkgId: string, file: string, isDependency: boolean) => {
    if (isDependency) {
      restartQueued = true;
    }

    const fileHash = md5Hash(`${pkgId}${file}`);
    filesChanging = uniq([...filesChanging, fileHash]);

    if (isDependency) {
      devProcess.terminate();
    } else {
      devProcess.pause();
    }
  };

  const onLinked = (pkgId: string, file: string) => {
    const fileHash = md5Hash(`${pkgId}${file}`);

    filesChanging = filesChanging.filter(
      fileChanging => fileChanging !== fileHash,
    );

    onClearedFilesDebounced(filesChanging);
  };

  return { filesChanging, onChange, onLinked };
}
