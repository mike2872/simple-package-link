import { childProcessSync } from './child-process';

export default function deleteFolder(path: string) {
  childProcessSync('rm', {
    args: ['-rf', path],
  });
}
