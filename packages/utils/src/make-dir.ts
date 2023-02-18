import { mkdirSync } from 'fs';

export function makeDir(path: string) {
  mkdirSync(path, {
    recursive: true,
  });
}
