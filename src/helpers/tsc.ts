import ts from 'typescript';
import * as fs from 'fs';
import { getTsConfig } from './get-config';

export default function tsc(pkgRoot: string, src: string, target: string) {
  const tsconfig = getTsConfig(pkgRoot);
  const code = fs.readFileSync(src).toString();

  const result = ts.transpileModule(code, {
    ...tsconfig,
  });

  fs.writeFileSync(target, result.outputText);

  return target;
}
