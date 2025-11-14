export type { RouteType } from "../index";
export type { NoteType, ProjectType } from "../utils/normalizers";

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type DeepPrettify<T> = T extends object
  ? { [K in keyof T]: DeepPrettify<T[K]> } & {}
  : T;