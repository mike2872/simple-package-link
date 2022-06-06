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
  /** Only absolute paths are supported */
  src: string;
  /** Only absolute paths are supported */
  target: string;
  ignore?: string[];
  hooks?: {
    /** Will be executed before running 'yarn pack' */
    prepack?: Command;
    /** Allows overriding the target of a file when relinking.
     * Only absolute paths are supported
     */
    relinkfile?: (filename: string, src: string, target: string) => string;
  };
}

interface Config {
  debug?: boolean;
  npmClient: 'yarn';
  devCommand: Command;
  packages: LinkedPackage[];
  /** Added during runtime */
  reinstallCommand: Command;
}
