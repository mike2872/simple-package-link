import { glob } from 'glob';

export default function resolveGlob(workspaceFolder: string, globExp: string) {
  return glob(globExp, {
    cwd: workspaceFolder,
    root: workspaceFolder,
    absolute: true,
    dot: true,
  });
}
