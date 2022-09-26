import * as chokidar from 'chokidar';

export type Command = {
  cmd: string;
  args: string[];
};

/** All paths should be relative to root. Absolute paths not supported */
export interface LinkedPackage {
  id: string;
  strategy: {
    type: 'direct-copy' | 'build-before-copy';
    options?: {
      /** A command from package.json scripts used for building before copying */
      build?: {
        cmd: string;
        args: string[];
        outDir: string;
      };
    };
  };
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
    watcherOptions?: chokidar.WatchOptions;
  };
  target: {
    /** Must include a package.json file */
    root: string;
    /** Allows overriding the destination of an updated file.
     * E.g. if file is updated in src/* but needs to be placed in dist/src on target. */
    modifyTargetPath?: (params: {
      name: string;
      ext: string;
      relativePath: string;
      src: string;
      targetRoot: string;
    }) => string;
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

export interface Config {
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

export type SPLConfig = Omit<Config, 'reinstallCommand' | 'tmpDir'>;
