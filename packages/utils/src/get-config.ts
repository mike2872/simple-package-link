import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import util from 'util';
import { getCWD } from './get-cwd';
import { mkdtempSync } from 'fs';
import { importModuleWithRequire } from './import-module-with-require';
import { makeDir } from './make-dir';
import resolveGlob from './resolve-glob';
import { logStep } from './log';

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

export const importConfig = () => {
  const cwd = getCWD();

  const config = importModuleWithRequire(`${cwd}/spl.config.ts`) as Omit<
    Config,
    'reinstallCommand' | 'tmpDir'
  >;

  if (!config) {
    throw new Error(`Couldn't find a spl.config.ts in root`);
  }

  return config;
};

export const getNPMClientSpecificConfig = async () => {
  const { npmClient } = importConfig();

  if (!supportedNpmClients.includes(npmClient)) {
    throw new Error(`Your NPM client isn't currently supported`);
  }

  return {
    lockfileId: lockfileIds[npmClient],
    reinstallCommand: reinstallCommands[npmClient],
  };
};

export let cachedConfig = null as Nullable<Config>;

export async function getConfig() {
  if (cachedConfig) return cachedConfig as Config;
  const cwd = process.cwd();
  const tmpDir = getTmpDir();
  const config = importConfig();
  const npmClientSpecificConfig = await getNPMClientSpecificConfig();

  logStep({ message: 'Generating configuration file...' });

  const _runtimeConfig = {
    ...config,
    tmpDir,
    ...npmClientSpecificConfig,
    packages: await Promise.all(
      config.packages.map(async pkg => {
        const srcRoot = `${cwd}/${pkg.src.root}`;
        const syncFiles = pkg.src.syncFiles.map(file => `${srcRoot}/${file}`);
        const strategy = pkg.strategy;
        const strategyOptions = strategy.options;
        const buildOptions = strategyOptions?.build;
        const buildOutDir = buildOptions?.outDir
          ? `${cwd}/${buildOptions?.outDir}`
          : '';
        const experimentalOptions = pkg.experimental;
        const syncDependencyChanges =
          experimentalOptions?.syncDependencyChanges;
        const listenLockFiles = syncDependencyChanges?.listenLockFiles?.map(
          path => path,
        );

        const targetRoot = pkg.target.root;
        const resolvedTargetRoot = targetRoot.glob
          ? await resolveGlob(
              targetRoot.glob.workspaceFolder,
              targetRoot.glob.exp,
            )
          : [`${cwd}/${targetRoot.path}`];

        if (resolvedTargetRoot.length < 1) {
          throw new Error(`${pkg.id}: Couldn't resolve target root`);
        }

        resolvedTargetRoot.forEach(target => {
          if (!fs.existsSync(`${target}/package.json`)) {
            throw new Error(
              `${pkg.id}: Target root must have a package.json file`,
            );
          }
        });

        return {
          ...pkg,
          src: {
            ...pkg.src,
            root: srcRoot,
            syncFiles,
          },
          target: {
            ...pkg.target,
            root: { resolved: resolvedTargetRoot },
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
    ),
  } as Config;

  const runtimeConfig = {
    ..._runtimeConfig,
    // Transforms relative paths to real paths
    packages: _runtimeConfig.packages.map(pkg => {
      if (pkg.strategy.type === 'build-before-copy') {
        makeDir(pkg.strategy.options?.build?.outDir ?? '');
      }

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

  if (config.debug) {
    console.log(
      util.inspect(runtimeConfig, {
        showHidden: false,
        depth: null,
        colors: true,
      }),
    );
  }

  cachedConfig = runtimeConfig;
  return cachedConfig;
}
