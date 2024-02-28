// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

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

/** Returns true if given object is empty, false otherwise. */
export function isObjectEmpty(obj: object): boolean {
  let isEmpty = true;
  // @ts-ignore key is unused
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for (const key in obj) {
    isEmpty = false;
    break;
  }
  return isEmpty;
}
