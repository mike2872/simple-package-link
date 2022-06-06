import ts from 'typescript';
import * as fs from 'fs';
import { getTsConfig } from './get-config';

export default function tsc(targetRoot: string, src: string, target: string) {
  const tsconfig = getTsConfig(targetRoot);
  const code = fs.readFileSync(src).toString();

  const result = ts.transpileModule(code, {
    ...tsconfig,
  });

  fs.writeFileSync(target, result.outputText);

  return target;
}
