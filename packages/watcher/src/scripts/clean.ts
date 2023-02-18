#!/usr/bin/env node

import {
  cleanup,
  deleteFolder,
  getConfig,
  logStep,
  logSubStep,
} from '@mike2872/simple-package-link-utils';

async function clean() {
  const { packages } = await getConfig();

  logStep({
    n: 1,
    n_total: 3,
    message: 'Deleting linked packages',
  });

  packages.forEach((pkg, index) => {
    logSubStep({
      n: index + 1,
      n_total: packages.length,
      message: `Deleting ${pkg.id}`,
    });

    deleteFolder(pkg.target.root);
  });

  logStep({
    n: 2,
    n_total: 3,
    message: 'Running cleanup...',
  });

  await cleanup();
}

clean();
