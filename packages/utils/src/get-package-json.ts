import * as fs from 'fs';

export function getPackageJson(path: string) {
  return JSON.parse(fs.readFileSync(path).toString()) as Record<string, any>;
}
