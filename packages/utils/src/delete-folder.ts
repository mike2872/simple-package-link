import { childProcessSync } from './child-process';

export function deleteFolder(path: string) {
  childProcessSync('rm', {
    args: ['-rf', path],
  });
}
