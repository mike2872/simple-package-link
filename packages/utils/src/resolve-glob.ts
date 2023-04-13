import { glob } from 'glob';

export default async function resolveGlob(
  workspaceFolder: string,
  globExp: string,
) {
  const paths = await glob(globExp, {
    cwd: workspaceFolder,
    root: workspaceFolder,
    absolute: true,
    dot: true,
  });

  return paths;
}
