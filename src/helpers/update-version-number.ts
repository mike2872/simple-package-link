import R from 'ramda';
import * as fs from 'fs';

export default function updateVersionNumber(
  packageJsonPath: string,
  computeVersionNumber: (version: string) => string,
) {
  const updateVersionNumber = R.pipe(
    path => fs.readFileSync(path).toString(),
    jsonString => JSON.parse(jsonString) as Record<string, any>,
    json => ({
      ...json,
      version: computeVersionNumber(json.version),
    }),
    newJson => {
      fs.writeFileSync(packageJsonPath, JSON.stringify(newJson));
      return newJson.version;
    },
  );

  return updateVersionNumber(packageJsonPath);
}
