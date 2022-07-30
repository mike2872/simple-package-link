import { readdirSync, statSync } from 'fs';
import { join } from 'path';

export default function forEachFile(
  dir: string,
  callback: (path: string) => void,
) {
  const files = readdirSync(dir);

  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isFile()) {
      callback(filePath);
    }

    if (stat.isDirectory()) {
      forEachFile(filePath, callback);
    }
  });
}
