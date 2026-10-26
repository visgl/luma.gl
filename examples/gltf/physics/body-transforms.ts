// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Matrix4} from '@math.gl/core';
import type {GLTFPhysicsBody} from '@luma.gl/gltf/physics';
import type {GPURigidBodyState} from '@luma.gl/graph/gpu-physics';

/** Convert a center-of-mass pose to a delta applied to the authored mesh world matrix. */
export function makePhysicsBodyDelta(body: GLTFPhysicsBody, state: GPURigidBodyState): Matrix4 {
  const initialFrame = new Matrix4()
    .translate(body.body.position || [0, 0, 0])
    .multiplyRight(new Matrix4().fromQuaternion(body.body.orientation || [0, 0, 0, 1]));
  return new Matrix4()
    .translate(state.position)
    .multiplyRight(new Matrix4().fromQuaternion(state.orientation))
    .translate(body.centerOfMass.map(value => -value))
    .multiplyRight(initialFrame.invert());
}
