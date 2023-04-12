import * as path from 'path';

export default function determinePathTarget(
  pkg: LinkedPackage,
  path_src: string,
) {
  const { dir, name, base, ext } = path.parse(
    path_src.split(pkg.src.root ?? '')?.[1],
  );

  const file = `${dir}/${base}`;
  const path_target = pkg.target.root.resolved?.map((targetRoot: string) => {
    return (
      pkg?.target?.modifyTargetPath?.({
        name,
        ext,
        relativePath: file,
        src: path_src,
        targetRoot,
      }) ?? `${pkg?.target.root}${file}`
    );
  });

  return { file, path_target };
}
