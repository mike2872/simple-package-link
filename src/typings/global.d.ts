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

  type;

  /** All paths should be relative to root. Absolute paths not supported */
  interface LinkedPackage {
    id: string;
    src: {
      /** Must include a package.json file */
      root: string;
      /** Array of files, dirs or globs relative to root.
       * Defaults to root
       */
      syncFiles: string[];
      /** See options at https://github.com/paulmillr/chokidar -
       * 'persistent' and 'ignoreInitial' is set to true and can't be changed.
       */
      watcherOptions: chokidar.WatchOptions;
    };
    target: {
      /** Must include a package.json file */
      root: string;
      strategy: {
        type: 'direct-copy' | 'build-before-copy';
        options?: {
          /** Allows overriding the destination of an updated file.
           * E.g. if file is updated in src/* but needs to be placed in dist/src on target.
           * Only used is type is set to 'direct-copy' */
          modifyTargetPath?: (params: {
            name: string;
            ext: string;
            relativePath: string;
            src: string;
            targetRoot: string;
          }) => string;
          /** A command from package.json scripts used for building before copying */
          build?: {
            cmd: string;
            args: string[];
            outDir: string;
          };
        };
      };
    };
    /** Experimental features. Not stable. */
    experimental?: {
      syncDependencyChanges?: {
        enabled: boolean;
        /** The strategy is to listen for changes to the lockfile and then diff the dependencies in package.json
         * This specifies the lockfiles to listen for. Useful when dependencies are hoisted and a top level lockfile is updated.
         */
        listenLockFiles: string[];
      };
    };
  }

  interface Config {
    /** Increases the log level */
    debug?: boolean;
    /** Supported: 'yarn' */
    npmClient: 'yarn';
    /** Command to run after linking */
    devCommand: Command;
    /** Packages to watch */
    packages: LinkedPackage[];
    /** Added during runtime */
    reinstallCommand: Command;
    tmpDir: string;
  }

  type PackageJSON = Record<string, any>;
}
