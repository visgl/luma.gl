// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ResolvedScenegraphJoint, ScenegraphNode} from '@luma.gl/engine';
import type {GPURigidBodyJoint} from './rigid-body-joints';

/** Compile shared scene attachments into backend rows; no glTF dependency or parsing. */
export function makeRigidBodyJointsFromScenegraph(
  resolved: ResolvedScenegraphJoint,
  bodyIndices: ReadonlyMap<ScenegraphNode, number>,
  fixedWorldBody?: number
): GPURigidBodyJoint[] {
  const bodyIndex = (body: ScenegraphNode | null) => {
    const index = body ? bodyIndices.get(body) : fixedWorldBody;
    if (index === undefined) throw new Error('Missing physics body for joint attachment');
    return index;
  };
  const base = {
    type: 'general' as const,
    first: bodyIndex(resolved.first.body),
    second: bodyIndex(resolved.second.body),
    firstFrame: {position: resolved.first.position, orientation: resolved.first.orientation},
    secondFrame: {position: resolved.second.position, orientation: resolved.second.orientation},
    enabled: resolved.joint.enabled,
    collideConnected: resolved.joint.collideConnected
  };
  const constraints: GPURigidBodyJoint[] = (resolved.joint.limits ?? []).map(limit => ({
    ...base,
    ...limit
  }));
  for (const {axis, angular, ...drive} of resolved.joint.drives ?? []) {
    constraints.push({...base, axes: [axis], angular, drive});
  }
  // A joint without rows still governs connected collision filtering.
  return constraints.length ? constraints : [{...base, axes: [0]}];
}
