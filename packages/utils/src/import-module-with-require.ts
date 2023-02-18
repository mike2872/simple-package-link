import { register, Service } from 'ts-node';

let tsNodeInstance: Nullable<Service> = null;
function registerTsNodeInstance() {
  if (!tsNodeInstance) {
    tsNodeInstance = register({
      typeCheck: false,
      compilerOptions: {
        module: 'commonjs',
      },
    });
  }
}

export function importModuleWithRequire(modulePath: string) {
  /** ts-node needs to be in scope */
  registerTsNodeInstance();
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require(modulePath).default;
}
