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
  const tmpDir = mkdtempSync(path.join(os.tmpdir(), 'spl-'));
  const config = await importConfig();
  const npmClientSpecificConfig = await getNPMClientSpecificConfig();

  return {
    ...config,
    tmpDir,
    ...npmClientSpecificConfig,
    packages: config.packages.map(pkg => {
      return {
        ...pkg,
        src: {
          ...pkg.src,
          root: fs.realpathSync(pkg.src.root),
        },
        target: {
          ...pkg.target,
          root: fs.realpathSync(pkg.target.root),
        },
        experimental: {
          ...pkg.experimental,
          syncDependencyChanges: {
            ...pkg.experimental?.syncDependencyChanges,
            listenLockFiles: (
              pkg.experimental?.syncDependencyChanges?.listenLockFiles ?? []
            ).map(path => fs.realpathSync(path)),
          },
        },
      };
    }),
  } as Config;
}

export function getTsConfig(tsconfigPath: string) {
  try {
    return JSON.parse(fs.readFileSync(tsconfigPath).toString());
  } catch (error) {
    throw new Error(`There was a problem fetching tsconfig.json in src.root`);
  }
}
