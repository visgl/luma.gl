export const roundUpToMultipleOf = (v: number, multiple: number) => (((v + multiple - 1) / multiple) | 0) * multiple;

export function keysOf<T extends string>(obj: { [k in T]: unknown }): readonly T[] {
  return (Object.keys(obj) as unknown[]) as T[];
}

export function range<T>(count: number, fn: (i: number) => T) {
    return new Array(count).fill(0).map((_, i) => fn(i));
}
