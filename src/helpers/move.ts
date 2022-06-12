import { realpathSync } from 'fs';
import { childProcessSync } from './child-process';
import makeDir from './make-dir';

export default function move(src: string, target: string) {
  const execute = () => {
    childProcessSync('mv', {
      args: [realpathSync(src), realpathSync(target)],
    });
  };

  try {
    execute();
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      makeDir(target);
      execute();
    }
  }
}
