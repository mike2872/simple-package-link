import updateVersionNumber from '../src/helpers/update-version-number';
import getCWD from '../src/helpers/get-cwd';
import childProcess from '../src/helpers/child-process';

const stages = ['patch', 'minor', 'major'] as const;

function incrementVersion() {
  const cwd = getCWD();
  const stage = process.argv[2] as typeof stages[number];

  if (!stages.includes(stage)) {
    throw new Error('Missing or unsupported stage');
  }

  updateVersionNumber(`${cwd}/package.json`, version => {
    const [first, middle, last] = version.split('.').map(Number);

    switch (stage) {
      case 'patch':
        return `${first}.${middle}.${last + 1}`;
      case 'minor':
        return `${first}.${middle + 1}.${last}`;
      case 'major':
        return `${first + 1}.${middle}.${last}`;
    }
  });

  childProcess('prettier', { args: ['--write', 'package.json'], cwd });
}

incrementVersion();
