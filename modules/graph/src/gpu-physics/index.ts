// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export {
  GPUSphereWorld,
  getSphereTriggerBodies,
  type GPUSphereBodyState,
  decodeGPUSphereWorldDiagnostics,
  type GPUSphereWorldDiagnostics,
  type GPUSphereWorldParameters,
  type GPUSpherePlane,
  type GPUSphereWorldProps
} from './gpu-sphere-world';

export {
  decodeSphereEvents,
  type GPUSphereEvent,
  type GPUSphereEventBatch,
  type GPUSphereTrigger
} from './sphere-events';
export {makeSphereBoxPlanes, getBodyInertia, type GPUSphereBox} from './sphere-shapes';
export {
  makeConvexHullGeometry,
  makeTriangleMeshGeometry,
  type RigidBodyMeshGeometry
} from './rigid-body-mesh';
export {getRigidBodyShapeProperties} from './rigid-body-shape-properties';
export {
  getSphereClothReference,
  getSphereCushionRestitution,
  type SphereClothReference
} from './sphere-calibration';
export {
  fitSphereCalibration,
  type SphereCalibrationDataset,
  type SphereCalibrationResult
} from './sphere-calibration';

export {
  GPURigidBodyWorld,
  type GPURigidBody,
  type GPURigidBodyCollider,
  type GPURigidBodyMaterial,
  type GPURigidBodyShape,
  type GPURigidBodyState,
  type GPURigidBodyWorldProps
} from './gpu-rigid-body-world';

export {
  decodeRigidBodySimulationDiagnostics,
  type GPURigidBodySimulationDiagnostics
} from './rigid-body-diagnostics';
export type {GPURigidBodyCapacityInfo} from './rigid-body-capacity';

export {
  decodeRigidBodyContactEvents,
  type GPURigidBodyContactEvent,
  type GPURigidBodyContactBatch
} from './rigid-body-events';
export type {
  GPURigidBodyRayQuery,
  GPURigidBodySphereCastQuery,
  GPURigidBodyOverlapQuery,
  GPURigidBodyQueryFilter,
  GPURigidBodyQueryHit,
  GPURigidBodyQueryResult
} from './rigid-body-queries';

export type {GPURigidBodyContinuousOptions} from './rigid-body-continuous';

export type {
  GPURigidBodyTrigger,
  GPURigidBodyTriggerEvent,
  GPURigidBodyTriggerBatch
} from './rigid-body-triggers';
export {decodeRigidBodyTriggerEvents} from './rigid-body-triggers';

export type {GPURigidBodyJoint, GPURigidBodyJointFrame} from './rigid-body-joints';

export type {
  GPURigidBodyCapture,
  GPURigidBodyGPUCheckpoint,
  GPURigidBodyParameters
} from './gpu-rigid-body-world';

export type {GPURigidBodyBounds} from './rigid-body-publication';
export {
  PhysicsGeometryNode,
  makePhysicsScenegraph,
  type PhysicsGeometryNodeProps,
  type PhysicsScenegraphSnapshot
} from './physics-scenegraph';
export {
  GPURigidBodyCommandJournal,
  applyRigidBodyCommand,
  replayRigidBodyCommands,
  type GPURigidBodyCommand,
  type GPURigidBodyReplay
} from './rigid-body-journal';

export {
  GPURigidBodyRecoveryRunner,
  growRigidBodyBudgets,
  type GPURigidBodyRecoveryOptions,
  type GPURigidBodyRecoveryResult
} from './rigid-body-recovery';
export {makeRigidBodyJointsFromScenegraph} from './scenegraph-joints';
export {ScenegraphPhysicsBehaviors} from './scenegraph-behaviors';
export type {ScenegraphPhysicsBehaviorProps} from './scenegraph-behaviors';
export {ScenegraphPhysicsMotion} from './scenegraph-motion';

export {ScenegraphPhysicsProperties, type PhysicsPropertyTarget} from './scenegraph-properties';
export {ScenegraphPhysicsInstance, type ScenegraphPhysicsDefinition} from './scenegraph-instance';
