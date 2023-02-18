import * as fs from 'fs';

export function deleteFile(path_target: string) {
  if (fs.existsSync(path_target)) {
    fs.unlinkSync(path_target);
  }
}
