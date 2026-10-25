import {RIGID_BODY_JOINT_STATE_BYTES} from './rigid-body-joints';
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
  parallel: boolean,
  eventCapacity = 0,
  enableQueries = false,
  rollback = false,
  continuous = false,
  jointCount = 0,
  ensembleInstances = 0
) {
  const geometryOffset = Math.ceil((bodyCount * 12 + colliderCount * 26) / 4) * 4;
  const pairOffset = Math.ceil((geometryOffset + geometryWords) / 64) * 64;
  const diagnosticOffset = Math.ceil((pairOffset + maximumPairs * 2) / 64) * 64;
  const metadataLength = sparse
    ? diagnosticOffset + 8
    : geometryOffset + Math.max(4, geometryWords);
  const parallelByteLength =
    Math.ceil((4 + bodyCount * 5 + maximumPairs * 2) / 4) * 16 +
    maximumPairs * 64 +
    Math.ceil((maximumPairs * 2 + bodyCount) / 4) * 16;
  const buffers = [
    ...['positions', 'orientations', 'velocities', 'angular-velocities', 'sleep'].map(name => ({
      name,
      byteLength: bodyCount * 16,
      uniform: false
    })),
    {
      name: 'targets',
      byteLength:
        Math.ceil((bodyCount * 32 + (sparse ? 32 + maximumPairs * 8 : 16)) / 16) * 16 +
        jointCount * RIGID_BODY_JOINT_STATE_BYTES +
        (ensembleInstances
          ? Math.ceil((ensembleInstances * 4 + maximumPairs * 6 + 8) / 4) * 16
          : 0),
      uniform: false
    },
    {
      name: 'manifolds',
      byteLength: maximumPairs * 416 * (ensembleInstances ? 2 : 1),
      uniform: false
    },
    {name: 'bodies', byteLength: metadataLength * 4, uniform: false},
    {name: 'settings', byteLength: 64, uniform: true},
    {name: 'control-settings', byteLength: 64, uniform: true},
    {name: 'simulation-statistics', byteLength: 64, uniform: false},
    ...(eventCapacity
      ? [
          {name: 'contact-events', byteLength: 16 + eventCapacity * 64, uniform: false},
          {name: 'contact-history', byteLength: maximumPairs * 16, uniform: false}
        ]
      : []),
    ...(enableQueries
      ? [
          {name: 'query-settings', byteLength: 48, uniform: true},
          {name: 'query-selection', byteLength: Math.max(4, colliderCount * 4), uniform: false},
          {name: 'query-output', byteLength: 16 + Math.max(1, colliderCount) * 48, uniform: false}
        ]
      : []),
    ...(extended ? [{name: 'mesh-tasks', byteLength: 16 + 65536 * 48, uniform: false}] : []),
    ...(parallel
      ? [
          {name: 'parallel-state', byteLength: parallelByteLength, uniform: false},
          {name: 'parallel-dispatch', byteLength: 48, uniform: false}
        ]
      : []),
    ...(sparse
      ? [
          {name: 'minima', byteLength: colliderCount * 12, uniform: false},
          {name: 'maxima', byteLength: colliderCount * 12, uniform: false},
          {name: 'object-attributes', byteLength: colliderCount * 4, uniform: false}
        ]
      : [])
  ];
  if (continuous)
    buffers.push(
      {name: 'continuous-previous', byteLength: bodyCount * 16, uniform: false},
      {name: 'continuous-selection', byteLength: bodyCount * 4, uniform: false},
      {name: 'continuous-status', byteLength: bodyCount * 16, uniform: false}
    );
  if (rollback) {
    buffers.push({name: 'state-validity', byteLength: bodyCount * 4, uniform: false});
    const names = [
      'positions',
      'orientations',
      'velocities',
      'angular-velocities',
      'sleep',
      ...(ensembleInstances ? [] : ['targets', 'manifolds'])
    ];
    const checkpointBuffers = names.map((name, index) => ({
      name: `checkpoint-${index}`,
      byteLength: buffers.find(buffer => buffer.name === name)!.byteLength,
      uniform: false
    }));
    buffers.push(...checkpointBuffers);
  }
  return {
    geometryOffset,
    pairOffset,
    diagnosticOffset,
    metadataLength,
    parallelByteLength,
    buffers
  };
}
