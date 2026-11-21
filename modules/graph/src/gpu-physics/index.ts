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
  makeStaticTriangleMeshGeometry,
  type RigidBodyMeshGeometry
} from './rigid-body-mesh';
export {
  makeRigidBodyHeightField,
  type GPURigidBodyHeightField,
  type GPURigidBodyHeightFieldSource
} from './rigid-body-height-field';
export {
  stitchRigidBodyTerrainTiles,
  type GPURigidBodyTerrainEdge,
  type GPURigidBodyTerrainSeam,
  type GPURigidBodyTerrainTile
} from './rigid-body-terrain-stitch';
export {
  GPURigidBodyTerrainStream,
  makeRigidBodyTerrainFetchProvider,
  type GPURigidBodyTerrainFetchProps,
  type GPURigidBodyTerrainProvider,
  type GPURigidBodyTerrainSlot,
  type GPURigidBodyTerrainStreamProps,
  type GPURigidBodyTerrainWindow
} from './rigid-body-terrain-stream';
export {
  GPURigidBodyTerrainSelector,
  getRigidBodyTerrainTileBounds,
  type GPURigidBodyTerrainAddress,
  type GPURigidBodyTerrainBounds,
  type GPURigidBodySelectedTerrainTile,
  type GPURigidBodyTerrainFocus,
  type GPURigidBodyTerrainSelection,
  type GPURigidBodyTerrainSelectorProps
} from './rigid-body-terrain-lod';
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
  GPURigidBodyHeightFieldEdit,
  GPURigidBodyParameters
} from './gpu-rigid-body-world';

export type {GPURigidBodyBounds} from './rigid-body-publication';

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

export {scaleRigidBodyShape} from './scale-shape';

export {GPUPhysicsBatch} from './gpu-physics-batch';
export type {
  GPUPhysicsBatchProps,
  GPUPhysicsWorldHandle,
  GPUPhysicsStreamedWorld
} from './gpu-physics-batch';

export {GPUPhysicsEnsemble, type GPUPhysicsEnsembleProps} from './gpu-physics-ensemble';
export {GPUPhysicsEnsembleTerrain} from './gpu-physics-ensemble-terrain';

export type {GPURigidBodyJointLimit, GPURigidBodyJointDrive} from './joint-types';

export {rotateRigidBodyVector, normalizeRigidBodyRotation} from './rigid-body-properties';
export type {GPURigidBodyGeneralConstraint} from './rigid-body-general-joints';
export type {GPURigidBodyVehicle} from './rigid-body-vehicle';
