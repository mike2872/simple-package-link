import { mkdirSync } from 'fs';

export default function makeDir(path: string) {
  mkdirSync(path, {
    recursive: true,
  });
}
