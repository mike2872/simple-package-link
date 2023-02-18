import { register } from 'ts-node';
import * as fs from 'fs';

export function tsNode(
  src: string,
  target: string,
  compilerOptions?: Record<string, any>,
) {
  const tsNodeInstance = register({
    typeCheck: false,
    compilerOptions: {
      ...compilerOptions,
      importHelpers: false,
      module: 'commonjs',
    },
  });

  const output = tsNodeInstance?.compile(
    fs.readFileSync(src).toString(),
    target,
  );

  if (output) {
    fs.writeFileSync(target, output);
    return target;
  }
}
