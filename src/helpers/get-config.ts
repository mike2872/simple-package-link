import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import getCWD from './get-cwd';
import { mkdtempSync } from 'fs';

const supportedNpmClients = ['yarn'];

const reinstallCommands = {
  yarn: {
    cmd: 'yarn',
    args: ['--check-files'],
  },
};

const lockfileIds = {
  yarn: 'yarn.lock',
};

let tmpDir = null as Nullable<string>;
const getTmpDir = () => {
  if (!tmpDir) {
    tmpDir = mkdtempSync(path.join(os.tmpdir(), 'spl-'));
  }

  return tmpDir;
};

const importConfig = async () => {
  const cwd = getCWD();

  const config = (await import(`${cwd}/spl.config.js`)) as Omit<
    Config,
    'reinstallCommand' | 'tmpDir'
  >;

  if (!config) {
    throw new Error(`Couldn't find a spl.config.js in root`);
  }

  return config;
};

export const getNPMClientSpecificConfig = async () => {
  const { npmClient } = await importConfig();

  if (!supportedNpmClients.includes(npmClient)) {
    throw new Error(`Your NPM client isn't currently supported`);
  }

  return {
    lockfileId: lockfileIds[npmClient],
    reinstallCommand: reinstallCommands[npmClient],
  };
};

export async function getConfig() {
  const cwd = process.cwd();
  const tmpDir = getTmpDir();
  const config = await importConfig();
  const npmClientSpecificConfig = await getNPMClientSpecificConfig();

  const runtimeConfig = {
    ...config,
    tmpDir,
    ...npmClientSpecificConfig,
    packages: config.packages.map(pkg => {
      const srcRoot = `${cwd}/${pkg.src.root}`;
      const syncFiles = pkg.src.syncFiles.map(file => `${srcRoot}/${file}`);
      const targetRoot = `${cwd}/${pkg.target.root}`;
      const strategy = pkg.target.strategy;
      const strategyOptions = strategy.options;
      const buildOptions = strategyOptions?.build;
      const buildOutDir = buildOptions?.outDir
        ? `${cwd}/${buildOptions?.outDir}`
        : '';
      const experimentalOptions = pkg.experimental;
      const syncDependencyChanges = experimentalOptions?.syncDependencyChanges;
      const listenLockFiles = syncDependencyChanges?.listenLockFiles?.map(
        path => path,
      );

      return {
        ...pkg,
        src: {
          ...pkg.src,
          root: srcRoot,
          syncFiles,
        },
        target: {
          ...pkg.target,
          root: targetRoot,
          strategy: {
            ...strategy,
            options: {
              ...strategyOptions,
              bundler: {
                ...buildOptions,
                outDir: buildOutDir,
              },
            },
          },
        },
        experimental: {
          ...experimentalOptions,
          syncDependencyChanges: {
            ...syncDependencyChanges,
            listenLockFiles: listenLockFiles,
          },
        },
      };
    }),
  } as Config;

  return {
    ...runtimeConfig,
    // Transforms relative paths to real paths
    packages: runtimeConfig.packages.map(pkg => {
      const traverseObj = (obj: Record<string, any>): any => {
        return Object.entries(obj).reduce((acc, [key, value]) => {
          const isObject =
            typeof value === 'object' &&
            !Array.isArray(value) &&
            value !== null;

          const relativeToRealPath = (path: string) => {
            if (!path || typeof path !== 'string') return path;
            return path.includes(cwd) ? fs.realpathSync(path) : path;
          };

          if (isObject) {
            return { ...acc, [key]: traverseObj(value) };
          }

          return {
            ...acc,
            [key]: Array.isArray(value)
              ? value.map(relativeToRealPath)
              : relativeToRealPath(value),
          };
        }, {} as typeof obj);
      };

      return traverseObj(pkg) as typeof pkg;
    }),
  };
}
