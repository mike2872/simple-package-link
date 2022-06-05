import * as fs from 'fs';
import getCWD from './get-cwd';

type Command = {
  cmd: string;
  args: string[];
};

export interface LinkedPackage {
  id: string;
  /** Only absolute paths are supported */
  src: string;
  /** Only absolute paths are supported */
  target: string;
  ignore?: string[];
  hooks?: {
    /** Will be executed before running 'yarn pack' */
    prepack?: Command;
    /** Allows overriding the target of a file when relinking.
     * Only absolute paths are supported
     */
    relinkfile?: (filename: string, src: string, target: string) => string;
  };
}

interface Config {
  debug?: boolean;
  npmClient: 'yarn';
  commands: {
    dev: Command;
    reinstall: Command;
  };
  packages: LinkedPackage[];
}

export default async function getConfig() {
  const cwd = getCWD();
  const config = (await import(`${cwd}/spl-config.js`)) as Config;

  if (!config) {
    throw new Error(`Couldn't find a spl-config.js in root`);
  }

  return {
    ...config,
    packages: config.packages.map(pkg => ({
      ...pkg,
      src: fs.realpathSync(pkg.src),
      target: fs.realpathSync(pkg.target),
    })),
  };
}
