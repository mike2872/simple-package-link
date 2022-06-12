import chokidar from 'chokidar';
import { uniq } from 'lodash';
import * as fs from 'fs';
import { getConfig } from './get-config';
import md5Hash from './md5-hash';
import { DevProcess } from './dev-command';

export default async function suspendOnRelink(devProcess: DevProcess) {
  const { tmpDir } = await getConfig();

  const file = `${tmpDir}/files-relinking.txt`;
  const read = () => fs.readFileSync(file).toString();
  const readArr = () => uniq(read().split('\n').filter(Boolean));
  const write = (content = '') => fs.writeFileSync(file, content);

  write();

  const watcher = chokidar.watch(file, {
    persistent: true,
    ignoreInitial: true,
  });

  watcher.on('change', () => {
    if (readArr().length === 0) {
      devProcess.resume();
    }
  });

  const setIsRelinking = (path: string) => {
    devProcess.pause();

    const hash = md5Hash(`${path}${new Date()}`);
    write(`${read()}\n${hash}`);

    return () => {
      const newContent = readArr()
        .filter(_hash => _hash !== hash)
        .join('\n');

      write(newContent);
    };
  };

  return { setIsRelinking };
}
