import * as chokidar from 'chokidar';

declare global {
  type Optional<T> = T | undefined;
  type Nullable<T> = T | null;
  type ArrayElement<T> = T extends (infer E)[] ? E : T;
  type Unwrap<T> = T extends (infer U)[] ? U : T;
  type Diff<T, U> = T extends U ? never : T;
  type NonOptional<T> = Diff<T, undefined>;

  type Command = {
    cmd: string;
    args: string[];
  };

  interface LinkedPackage {
    id: string;
    src: {
      /** Only absolute paths are supported. Must include a package.json file */
      root: string;
      /** See options at https://github.com/paulmillr/chokidar -
       * 'persistent' and 'ignoreInitial' is set to true and can't be changed.
       */
      watcherOptions: chokidar.WatchOptions;
    };
    target: {
      /** Only absolute paths are supported. Must include a package.json file */
      root: string;
      /** Allows overriding the destination of an updated file.
       * E.g. if file is updated in src/* but needs to be placed in dist/src on target
       * Only absolute paths are supported */
      oncopy?: (params: {
        name: string;
        ext: string;
        relativePath: string;
        src: string;
        targetRoot: string;
      }) => string;
    };
    /** Will be executed before running 'yarn pack' during initial linking */
    prepack?: Command;
    /** Experimental features. Not stable. */
    experimental?: {
      syncDependencyChanges?: {
        /** The strategy is to listen for changes to the lockfile and then diff the dependencies in package.json
         * This specifies the lockfiles to listen for. Useful when dependencies are hoisted and a top level lockfile is updated.
         */
        listenLockFiles: string[];
      };
    };
    /** Transpile file using tsc before copying
     * Use tsconfig.json from src.root.
     * Returns the target destination.
     */
    tsc?: boolean;
  }

  interface Config {
    /** Increases the log level */
    debug?: boolean;
    /** Supported: 'yarn' */
    npmClient: 'yarn';
    /** Command to run after linking / unlinked */
    devCommand: Command;
    /** Packages to watch */
    packages: LinkedPackage[];
    /** Added during runtime */
    reinstallCommand: Command;
    tmpDir: string;
  }
}
