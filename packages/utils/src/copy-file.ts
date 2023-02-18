import * as fs from 'fs';
import * as path from 'path';

export function copyFile(src: string, target: string) {
  try {
    fs.copyFileSync(src, target);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      const { dir } = path.parse(target);
      fs.mkdirSync(dir, { recursive: true });
      fs.copyFileSync(src, target);
    }
  }
}
