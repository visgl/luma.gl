// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export function arraysEqual<T>(arr1: ArrayLike<T>, arr2: ArrayLike<T>): boolean {
  if (arr1.length !== arr2.length) {
    return false;
  }

  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }

  return true;
}
