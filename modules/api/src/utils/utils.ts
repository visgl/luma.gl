// luma.gl, MIT license

const uidCounters: Record<string, number> = {};

/**
 * Returns a UID.
 * @param id= - Identifier base name
 * @return uid
 **/
export function uid(id: string = 'id'): string {
  uidCounters[id] = uidCounters[id] || 1;
  const count = uidCounters[id]++;
  return `${id}-${count}`;
}

/**
 * Verifies if a given number is power of two or not.
 * @param n - The number to check.
 * @return  Returns true if the given number is power of 2, false otherwise.
 **/
export function isPowerOfTwo(n: number): boolean {
  return (n > 0) && (n & (n - 1)) === 0;
}

/** Returns true if given object is empty, false otherwise. */
export function isObjectEmpty(obj: object): boolean {
  let isEmpty = true;
  // @ts-ignore key is unused
  // eslint-disable-next-line no-unused-vars
  for (const key in obj) {
    isEmpty = false;
    break;
  }
  return isEmpty;
}
