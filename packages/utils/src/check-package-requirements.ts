import { existsSync, realpathSync } from 'fs';

export function checkPackageRequirements(pkg: LinkedPackage) {
  [pkg.src.root, ...(pkg.target.root.resolved ?? [])].map(root => {
    try {
      existsSync(realpathSync(`${root}/package.json`));
    } catch (error) {
      throw new Error(
        `${root}/package.json couldn't be found. Both 'src.root' and 'target.root' must include a package.json file`,
      );
    }
  });
}
