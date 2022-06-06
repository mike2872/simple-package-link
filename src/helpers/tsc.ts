import ts from 'typescript';
import * as fs from 'fs';
import { getTsConfig } from './get-config';

export default function tsc(src: string, target: string) {
  const tsconfig = getTsConfig();
  const code = fs.readFileSync(src).toString();

  const result = ts.transpileModule(code, {
    ...tsconfig,
  });

  fs.writeFile(target, result.outputText, function (err) {
    if (err) throw err;
  });

  return target;
}
