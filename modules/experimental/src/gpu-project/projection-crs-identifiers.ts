// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuProj.

type Identifier = {readonly authority: string; readonly code: string | number};
/** An EPSG identifier is authoritative, but known names and multiple identifiers must agree. */
export function resolveCRSIdentifier(
  object: {readonly name: string; readonly id?: Identifier; readonly ids?: readonly Identifier[]},
  names: ReadonlyMap<string, number>
): number | undefined {
  const identifiers = [...(object.id ? [object.id] : []), ...(object.ids ?? [])].filter(
    identifier => identifier.authority === 'EPSG'
  );
  const named = names.get(object.name);
  if (!identifiers.length) return named;
  const code = Number(identifiers[0].code);
  return Number.isSafeInteger(code) &&
    identifiers.every(identifier => Number(identifier.code) === code) &&
    (named === undefined || named === code)
    ? code
    : undefined;
}
