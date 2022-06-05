#!/usr/bin/env node

import linkPackage from '../link-package';
import getConfig from '../helpers/get-config';
import getCWD from '../helpers/get-cwd';
import concurrently from 'concurrently';
import { logStep, logSubStep } from '../helpers/log';

export default async function linked() {
  const { packages, commands } = await getConfig();

  const linkPackages = async () => {
    logStep({
      n: 1,
      n_total: 3,
      message: 'Linking packages',
    });

    for (let i = 0; i < packages.length; i++) {
      const pkg = packages[i];
      logSubStep({
        n: i + 1,
        n_total: packages.length,
        message: `Copying ${pkg.id} from src to target`,
      });

      await linkPackage(pkg);
    }
  };

  const createListeners = () => {
    logStep({
      n: 2,
      n_total: 3,
      message: 'Starting listeners',
    });

    return packages.map((pkg, index) => {
      logSubStep({
        n: index + 1,
        n_total: packages.length,
        message: `Starting listener for ${pkg.id}`,
      });

      return `node ${__dirname}/../watch-files.js --json ${encodeURIComponent(
        JSON.stringify(pkg),
      )}`;
    });
  };

  const constructCommand = () => {
    logStep({
      n: 3,
      n_total: 3,
      message: 'Running command',
    });

    return `${commands.dev.cmd} ${commands.dev.args?.join(' ')}`.trim();
  };

  await linkPackages();

  concurrently([...createListeners(), constructCommand()], {
    cwd: getCWD(),
    killOthers: ['failure', 'success'],
    restartTries: 3,
    raw: true,
  });
}

linked();
