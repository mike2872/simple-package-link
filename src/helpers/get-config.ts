import * as fs from 'fs';
import getCWD from './get-cwd';

const supportedNpmClients = ['yarn'];
const reinstallCommands = {
  yarn: {
    cmd: 'yarn',
    args: ['--check-files'],
  },
};

export default async function getConfig() {
  const cwd = getCWD();
  const config = (await import(`${cwd}/spl.config.js`)) as Omit<
    Config,
    'reinstallCommand'
  >;

  if (!config) {
    throw new Error(`Couldn't find a spl.config.js in root`);
  }

  if (!supportedNpmClients.includes(config.npmClient)) {
    throw new Error(`Your NPM client isn't currently supported`);
  }

  return {
    ...config,
    reinstallCommand: reinstallCommands[config.npmClient],
    packages: config.packages.map(pkg => {
      if (!fs.existsSync(fs.realpathSync(`${pkg.target.root}/package.json`))) {
        throw new Error(
          `A package.json file couldn't be found in the root specified for ${pkg.id}`,
        );
      }

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
