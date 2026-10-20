// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPURigidBody, GPURigidBodyCollider} from '@luma.gl/gpgpu/gpu-physics';

/** Raw glTF JSON, before loaders.gl replaces node indices with objects. */
export type GLTFPhysicsDocument = {
  scene?: number;
  scenes?: readonly {nodes?: readonly number[]}[];
  nodes?: readonly {
    name?: string;
    children?: readonly number[];
    matrix?: readonly number[];
    translation?: readonly number[];
    rotation?: readonly number[];
    scale?: readonly number[];
    extensions?: Record<string, unknown>;
  }[];
  extensions?: Record<string, unknown>;
  extensionsUsed?: readonly string[];
  extensionsRequired?: readonly string[];
  animations?: readonly {
    channels: readonly {
      target: {node?: number; path?: string; extensions?: Record<string, unknown>};
    }[];
  }[];
};
export type GLTFPhysicsIssue = {
  code: string;
  path: string;
  message: string;
};
export type GLTFPhysicsBody = {
  /** Identity is scoped to this description; instantiate separate worlds for separate assets. */
  id: string;
  nodeIndex: number;
  bodyIndex: number;
  colliderIndices: number[];
  /** Node-to-body center offset, expressed in the resolved body's rotation frame. */
  centerOfMass: readonly [number, number, number];
  /** World-space node transform at import time, unaffected by simulation. */
  worldMatrix: readonly number[];
  body: GPURigidBody;
};
export type GLTFPhysicsCollider = {
  id: string;
  nodeIndex: number;
  bodyIndex: number;
  colliderIndex: number;
  shapeIndex?: number;
  /** Present only for explicitly enabled legacy mesh geometry. */
  meshIndex?: number;
  materialIndex?: number;
  filterIndex?: number;
  collider: GPURigidBodyCollider;
};
export type GLTFPhysicsDescription = {
  draft: {
    rigidBodies: string;
    implicitShapes: string;
  };
  supported: boolean;
  issues: GLTFPhysicsIssue[];
  bodies: GLTFPhysicsBody[];
  colliders: GLTFPhysicsCollider[];
  /** Preserved independently for inspection/export; the source document is never mutated. */
  source: GLTFPhysicsDocument;
};
export type ParseGLTFPhysicsOptions = {
  scene?: number;
  /** Opt into legacy geometry.mesh; return decoded, referenced mesh vertices as flat XYZs.
   * Only convex hulls exactly equal to an axis-aligned box are currently supported.
   */
  resolveLegacyMeshPositions?: (meshIndex: number) => ArrayLike<number>;
  /** kg/m³ for additive uniform-density primitive mass calculation. Defaults to 1000. */
  density?: number;
};
