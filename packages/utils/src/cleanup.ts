import { childProcessSync } from './child-process';
import { getNPMClientSpecificConfig } from './get-config';
import { getCWD } from './get-cwd';

export async function cleanup(debug = true) {
  const { reinstallCommand } = await getNPMClientSpecificConfig();

  childProcessSync(reinstallCommand.cmd, {
    args: reinstallCommand.args,
    cwd: getCWD(),
    type: debug ? 'inherit' : 'silent',
  });
}
