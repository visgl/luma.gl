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
