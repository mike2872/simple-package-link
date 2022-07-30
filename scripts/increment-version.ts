import updatePackageJson from '../src/helpers/update-package-json';
import getCWD from '../src/helpers/get-cwd';
import { childProcessSync } from '../src/helpers/child-process';

const stages = ['patch', 'minor', 'major'] as const;

function incrementVersion() {
  const cwd = getCWD();
  const stage = process.argv[2] as typeof stages[number];

  if (!stages.includes(stage)) {
    throw new Error('Missing or unsupported stage');
  }

  const createNewVersionNumber = (currentVersion: string) => {
    const [first, middle, last] = currentVersion.split('.').map(Number);

    switch (stage) {
      case 'patch':
        return `${first}.${middle}.${last + 1}`;
      case 'minor':
        return `${first}.${middle + 1}.${last}`;
      case 'major':
        return `${first + 1}.${middle}.${last}`;
    }
  };

  const newVersion = updatePackageJson(`${cwd}/package.json`, ({ version }) => {
    return { version: createNewVersionNumber(version) };
  });

  childProcessSync('prettier', { args: ['--write', 'package.json'], cwd });
  childProcessSync('git', { args: ['add', 'package.json'], cwd });
  childProcessSync('git', {
    args: ['commit', '-m', `publish ${newVersion}`],
    cwd,
  });
  childProcessSync('git', { args: ['push'], cwd });
}

incrementVersion();
