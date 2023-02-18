import {
  Command as _Command,
  LinkedPackage as _LinkedPackage,
  Config as _Config,
} from '.';

declare global {
  type Optional<T> = T | undefined;
  type Nullable<T> = T | null;
  type ArrayElement<T> = T extends (infer E)[] ? E : T;
  type Unwrap<T> = T extends (infer U)[] ? U : T;
  type Diff<T, U> = T extends U ? never : T;
  type NonOptional<T> = Diff<T, undefined>;

  type PackageJSON = Record<string, any>;
  type Command = _Command;
  type LinkedPackage = _LinkedPackage;
  type Config = _Config;
}
