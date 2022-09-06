import { build } from 'tsup';
import fs from 'fs';
import forEachFile from './for-each-file';
import { getConfig } from './get-config';
import deleteFolder from './delete-folder';
import importModuleWithRequire from './import-module-with-require';

export default async function tsup(pkg: LinkedPackage, tsupConfigPath: string) {
  const { tmpDir } = await getConfig();
  const tsupConfig = importModuleWithRequire(tsupConfigPath);
  const outDir = `${tmpDir}/tsup/${pkg.id}`;

  const getEntryAbsPath = (entry: string | string[]) => {
    const toAbs = (path: string) => {
      try {
        return fs.realpathSync(path);
      } catch {
        return fs.realpathSync(`${pkg.src.root}/${path}`);
      }
    };

    return Array.isArray(entry) ? entry.map(toAbs) : toAbs(entry);
  };

  deleteFolder(outDir);

  await build({
    ...tsupConfig,
    entry: getEntryAbsPath(tsupConfig.entry),
    outDir,
    silent: true,
    tsconfig: `${pkg.src.root}/tsconfig.json`,
  });

  const bundledFiles = [] as string[];
  forEachFile(outDir, file => bundledFiles.push(file));
  return { files: bundledFiles, root: outDir };
}
