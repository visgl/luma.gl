// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GroupNode, ScenegraphJoint} from '@luma.gl/engine';
import type {
  GPURigidBody,
  GPURigidBodyCollider,
  GPURigidBodyJoint,
  GPURigidBodyTrigger
} from '@luma.gl/graph/gpu-physics';

/** Raw glTF JSON, before loaders.gl replaces node indices with objects. */
export type GLTFPhysicsDocument = {
  scene?: number;
  scenes?: readonly {nodes?: readonly number[]}[];
  nodes?: readonly {
    name?: string;
    mesh?: number;
    skin?: number;
    weights?: readonly number[];
    children?: readonly number[];
    matrix?: readonly number[];
    translation?: readonly number[];
    rotation?: readonly number[];
    scale?: readonly number[];
    extensions?: Record<string, unknown>;
  }[];
  skins?: readonly {joints: readonly number[]}[];
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
  /** Cooked collider frame relative to the source node, before node scale. */
  localMatrix: readonly number[];
  /** Original scale used when cooking this collider, independent of live scene animation. */
  cookedScale: readonly number[];
  shapeIndex?: number;
  /** Present only for explicitly enabled legacy mesh geometry. */
  meshIndex?: number;
  /** Draft geometry.node reference, distinct from the collider node and legacy mesh index. */
  geometryNodeIndex?: number;
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
  triggers: {nodeIndex: number; trigger: GPURigidBodyTrigger}[];
  animatedBodyIndices: number[];
  animatedColliderIndices: number[];
  querySelections: number[][];
  sceneJoints: ScenegraphJoint[];
  sceneNodes: Map<number, GroupNode>;
  sceneRoots: GroupNode[];
  joints: {
    nodeIndex: number;
    connectedNodeIndex: number;
    jointIndex: number;
    joint: GPURigidBodyJoint;
  }[];
  /** Preserved independently for inspection/export; the source document is never mutated. */
  source: GLTFPhysicsDocument;
};
export type ParseGLTFPhysicsOptions = {
  /** Host will bind authored motion, material and joint property pointers before playback. */
  propertyBindings?: boolean;
  /** Bind rigid node translation/rotation channels through ScenegraphPhysicsMotion. */
  animationOwnership?: 'scenegraph';
  scene?: number;
  /** Decode one node's own mesh at its initial pose in that node's local space.
   * Include initial skinning and morph weights; the adapter combines child transforms.
   * Called for off-scene references too. Never return an undeformed mesh for a skinned node.
   */
  resolveNodeMeshGeometry?: (nodeIndex: number) =>
    | {
        positions: ArrayLike<number>;
        indices: ArrayLike<number>;
      }
    | undefined;
  /** Opt into legacy geometry.mesh; return decoded, referenced mesh vertices as flat XYZs.
   * Only convex hulls exactly equal to an axis-aligned box are currently supported.
   */
  resolveLegacyMeshPositions?: (meshIndex: number) => ArrayLike<number>;
  /** Explicit sample-era mesh profile; indices describe triangles, positions are flat XYZs. */
  resolveLegacyMeshGeometry?: (meshIndex: number) => {
    positions: ArrayLike<number>;
    indices: ArrayLike<number>;
  };
  /** kg/m³ for additive uniform-density primitive mass calculation. Defaults to 1000. */
  density?: number;
};
