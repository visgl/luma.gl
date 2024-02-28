// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Helper for type downcasts, e.g. Buffer -> WebGPUBuffer */
export function cast<T>(value: any) {
  return value as T;
}
