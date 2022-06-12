import R from 'ramda';
import * as fs from 'fs';
import getPackageJson from './get-package-json';

export default function updateVersionNumber(
  packageJsonPath: string,
  computeVersionNumber: (version: string) => string,
) {
  const updateVersionNumber = R.pipe(
    json => ({
      ...json,
      version: computeVersionNumber(json.version),
    }),
    newJson => {
      fs.writeFileSync(packageJsonPath, JSON.stringify(newJson));
      return newJson.version;
    },
  );

  return updateVersionNumber(getPackageJson(packageJsonPath));
}
