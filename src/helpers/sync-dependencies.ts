import { WatchFilesCallbacks } from '../watch-files';
import getPackageJson from './get-package-json';
import updateDependencies from './update-dependency';

export default function syncDependencies(
  pkg: LinkedPackage,
  pkgJsonRoot: string,
  callbacks: WatchFilesCallbacks,
) {
  const getPkgJson = () => getPackageJson(`${pkgJsonRoot}/package.json`);
  let prevPkgJson = getPkgJson();

  const sync = () => {
    const newPkgJson = getPkgJson();
    updateDependencies({
      pkgId: pkg.id,
      targetRoot: pkg.target.root,
      prevPkgJson,
      newPkgJson,
      callbacks: {
        onChange: id => callbacks.onChange(id, true),
        onLinked: id => {
          prevPkgJson = newPkgJson;
          callbacks.onLinked(id);
        },
      },
    });
  };

  return sync;
}
