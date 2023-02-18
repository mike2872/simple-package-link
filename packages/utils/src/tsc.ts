import ts from 'typescript';
import * as fs from 'fs';

export function getTsConfig(tsConfigPath: string) {
  try {
    return JSON.parse(fs.readFileSync(tsConfigPath).toString()) as Record<
      string,
      any
    >;
  } catch (error) {
    throw new Error(`There was a problem fetching tsconfig.json in src.root`);
  }
}

export function tsc(tsConfigPath: string, src: string, target: string) {
  const tsConfig = getTsConfig(tsConfigPath);
  const code = fs.readFileSync(src).toString();

  const result = ts.transpileModule(code, {
    ...tsConfig,
  });

  fs.writeFileSync(target, result.outputText);
  // Remember to move declaration file
}
