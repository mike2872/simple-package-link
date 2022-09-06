import { build } from 'tsup';
import { register, Service } from 'ts-node';
import fs from 'fs';
import forEachFile from './for-each-file';
import { getConfig } from './get-config';
import deleteFolder from './delete-folder';

let tsNodeInstance: Nullable<Service> = null;
function registerTsNodeInstance() {
  if (!tsNodeInstance) {
    tsNodeInstance = register({
      typeCheck: false,
      compilerOptions: {
        module: 'commonjs',
      },
    });
  }
}

const getTsUpConfig = (tsupConfigPath: string) => {
  /** ts-node needs to be in scope */
  registerTsNodeInstance();
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require(tsupConfigPath).default;
};

export default async function tsup(pkg: LinkedPackage, tsupConfigPath: string) {
  const { tmpDir } = await getConfig();
  const tsupConfig = getTsUpConfig(tsupConfigPath);
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
