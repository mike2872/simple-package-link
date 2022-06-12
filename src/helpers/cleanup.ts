import { childProcessSync } from './child-process';
import { getConfig } from './get-config';
import getCWD from './get-cwd';

export default async function cleanup() {
  const { reinstallCommand } = await getConfig();

  childProcessSync(reinstallCommand.cmd, {
    args: reinstallCommand.args,
    cwd: getCWD(),
  });
}
