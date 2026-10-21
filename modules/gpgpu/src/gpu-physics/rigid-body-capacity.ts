// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export type GPURigidBodyCapacityInfo = {
  bodyCount: number;
  colliderCount: number;
  maximumPairs: number;
  /** World-owned buffers only; excludes graph scratch, pipelines and driver allocation overhead. */
  ownedBufferBytes: number;
  buffers: {name: string; byteLength: number; uniform: boolean}[];
  pairWorkgroups: number;
};

/** Shared allocation arithmetic for preflight and actual buffer creation. */
export function getRigidBodyStorageLayout(
  bodyCount: number,
  colliderCount: number,
  maximumPairs: number,
  geometryWords: number,
  sparse: boolean,
  extended: boolean,
  parallel: boolean
) {
  const geometryOffset = Math.ceil((bodyCount * 12 + colliderCount * 26) / 4) * 4;
  const pairOffset = Math.ceil((geometryOffset + geometryWords) / 64) * 64;
  const diagnosticOffset = Math.ceil((pairOffset + maximumPairs * 2) / 64) * 64;
  const metadataLength = sparse
    ? diagnosticOffset + 8
    : geometryOffset + Math.max(4, geometryWords);
  const parallelByteLength =
    Math.ceil((4 + bodyCount * 5 + maximumPairs * 2) / 4) * 16 + maximumPairs * 64;
  const buffers = [
    ...['positions', 'orientations', 'velocities', 'angular-velocities', 'sleep'].map(name => ({
      name,
      byteLength: bodyCount * 16,
      uniform: false
    })),
    {
      name: 'targets',
      byteLength: Math.ceil((bodyCount * 32 + (sparse ? 32 + maximumPairs * 8 : 16)) / 16) * 16,
      uniform: false
    },
    {name: 'manifolds', byteLength: maximumPairs * 288, uniform: false},
    {name: 'bodies', byteLength: metadataLength * 4, uniform: false},
    {name: 'settings', byteLength: 64, uniform: true},
    {name: 'control-settings', byteLength: 64, uniform: true},
    {name: 'simulation-statistics', byteLength: 64, uniform: false},
    ...(extended ? [{name: 'mesh-tasks', byteLength: 16 + 65536 * 48, uniform: false}] : []),
    ...(parallel ? [{name: 'parallel-state', byteLength: parallelByteLength, uniform: false}] : []),
    ...(sparse
      ? [
          {name: 'minima', byteLength: colliderCount * 12, uniform: false},
          {name: 'maxima', byteLength: colliderCount * 12, uniform: false},
          {name: 'object-attributes', byteLength: colliderCount * 4, uniform: false}
        ]
      : [])
  ];
  return {
    geometryOffset,
    pairOffset,
    diagnosticOffset,
    metadataLength,
    parallelByteLength,
    buffers
  };
}
