import R from 'ramda';
import * as fs from 'fs';
import { getPackageJson } from './get-package-json';

export function updatePackageJson(
  packageJsonPath: string,
  changes: (current: PackageJSON) => PackageJSON,
) {
  const update = R.pipe(
    currentJson => ({
      ...currentJson,
      ...changes(currentJson),
    }),
    newJson => {
      fs.writeFileSync(packageJsonPath, JSON.stringify(newJson));
      return newJson;
    },
  );

  return update(getPackageJson(packageJsonPath));
}
