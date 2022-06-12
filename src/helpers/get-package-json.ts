import * as fs from 'fs';

export default function getPackageJson(path: string) {
  return JSON.parse(fs.readFileSync(path).toString()) as Record<string, any>;
}
