// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

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
