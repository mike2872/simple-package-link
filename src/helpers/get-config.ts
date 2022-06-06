import * as fs from 'fs';
import getCWD from './get-cwd';

export default async function getConfig() {
  const cwd = getCWD();
  const config = (await import(`${cwd}/spl.config.js`)) as Config;

  if (!config) {
    throw new Error(`Couldn't find a spl.config.js in root`);
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
