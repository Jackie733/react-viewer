export type SampleDataset = {
  name: string;
  filename: string;
  description: string;
  url: string;
  defaults?: {
    colorPreset?: string;
  };
};

export type Maybe<T> = T | null | undefined;

export type Awaitable<T> = Promise<T> | T;

export type FirstParam<T> = T extends (first: infer R, ...args: any[]) => any
  ? R
  : never;
