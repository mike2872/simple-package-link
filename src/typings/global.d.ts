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
    /**
     * Watch directory or file. One entry per watched value. Wildcards are allowed.
     */
    include?: string[];
    /**
     * Ignore specific files or directories. One entry per ignored value. Wildcards are allowed.
     */
    ignore?: string[];
  };
  target: {
    /** Only absolute paths are supported */
    root: string;
    /** Allows overriding the destination of an updated file.
     * E.g. if file is updated in src/* but needs to be placed in dist/src on target
     * Only absolute paths are supported */
    oncopy?: (filename: string, src: string) => string;
  };
  options?: {
    /** Will be executed before running 'yarn pack' during initial linking */
    prepack?: Command;
  };
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
}
