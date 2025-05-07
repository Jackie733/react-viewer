export type Maybe<T> = T | null | undefined;

export type Awaitable<T> = Promise<T> | T;

export type FirstParam<T> = T extends (first: infer R, ...args: any[]) => any
  ? R
  : never;
