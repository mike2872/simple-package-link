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

export async function getConfig() {
  const tmpDir = mkdtempSync(path.join(os.tmpdir(), 'spl-'));
  const cwd = getCWD();
  const config = (await import(`${cwd}/spl.config.js`)) as Omit<
    Config,
    'reinstallCommand' | 'tmpDir'
  >;

  if (!config) {
    throw new Error(`Couldn't find a spl.config.js in root`);
  }

  if (!supportedNpmClients.includes(config.npmClient)) {
    throw new Error(`Your NPM client isn't currently supported`);
  }

  return {
    ...config,
    tmpDir,
    lockfileId: lockfileIds[config.npmClient],
    reinstallCommand: reinstallCommands[config.npmClient],
    packages: config.packages.map(pkg => {
      [pkg.src.root, pkg.target.root].map(root => {
        try {
          fs.existsSync(fs.realpathSync(`${root}/package.json`));
        } catch (error) {
          throw new Error(
            `${root}/package.json couldn't be found. Both 'src.root' and 'target.root' must include a package.json file`,
          );
        }
      });

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
