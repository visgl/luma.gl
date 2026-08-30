// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export {
  GPUSplatData,
  makeGPUSplatData,
  type SplatDataUpdate,
  type GPUSplatTypeMap,
  type GPUSplatVectors,
  type SplatSource
} from './splat-data';
export {
  isGLTFSplatPrimitive,
  loadGPUSplatDataFromGLTF,
  makeGPUSplatDataFromGLTF,
  makeSplatSourceFromGLTF,
  type GLTFSplatAttribute,
  type GLTFSplatAttributeValues,
  type GLTFSplatCompressionDecoder,
  type GLTFSplatPrimitive,
  type LoadGPUSplatDataFromGLTFOptions,
  type MakeGPUSplatDataFromGLTFOptions
} from './splat-gltf';
export {
  evaluateSplatSphericalHarmonics,
  getSplatSphericalHarmonicCoefficientCount,
  getSplatSphericalHarmonicsDegree,
  type SplatSphericalHarmonicsDegree
} from './splat-spherical-harmonics';
export {
  acceptsSplatSemantic,
  type SplatSemanticFilter,
  type SplatSemanticSelection
} from './splat-filter';
export {
  SplatPicker,
  resolveSplatPickInfo,
  SPLAT_COLOR_PICKING_FS_GLSL,
  SPLAT_PICKING_ATTRIBUTE_WGSL_SHADER,
  SPLAT_PICKING_FS_GLSL,
  SPLAT_PICKING_STORAGE_WGSL_SHADER,
  type SplatPickingInfo,
  type SplatPickingProps
} from './splat-picking';
export {
  SplatResidencyManager,
  type SplatResidencyBounds,
  type SplatResidencyBudget,
  type SplatResidencyCallbacks,
  type SplatResidencyChunk,
  type SplatResidencyChunkOptions,
  type SplatResidencyEvictionReason,
  type SplatResidencyManagerProps,
  type SplatResidencyStats
} from './splat-residency';
export {
  SplatHierarchyManager,
  getSplatHierarchyFoveatedPriority,
  getSplatHierarchyScreenSpaceError,
  isSplatHierarchyNodeVisible,
  type SplatHierarchyFoveation,
  type SplatHierarchyFrontierEntry,
  type SplatHierarchyLoadContext,
  type SplatHierarchyManagerProps,
  type SplatHierarchyNode,
  type SplatHierarchyPageLoader,
  type SplatHierarchyRefinement,
  type SplatHierarchyStats,
  type SplatHierarchyView
} from './splat-hierarchy';
export {
  SplatRADHierarchyManager,
  getSplatRADPageBounds,
  type SplatRADHierarchyFrontierEntry,
  type SplatRADHierarchyManagerProps,
  type SplatRADHierarchyPage,
  type SplatRADHierarchyRequest,
  type SplatRADHierarchyStats
} from './splat-rad-hierarchy';
export {
  getCovarianceEllipseAxes,
  getQuaternionScaledAxes,
  projectSplatCovarianceToScreen,
  projectWorldPositionToScreen,
  transformSplatPosition,
  type ProjectedSplatCovariance,
  type SplatCovarianceProjectionProps
} from './splat-covariance';
export {
  getSortedSplatIndicesByDepth,
  packSplatDepthKey,
  sortSplatReferences,
  SPLAT_DEPTH_KEY_BITS,
  SPLAT_TILE_SIZE_PIXELS,
  type SplatSortMode,
  type SplatSortReference
} from './splat-sort';
export {
  SplatRenderer,
  SPLAT_STORAGE_GPU_INPUT_SCHEMA,
  type SplatDrawRun,
  type SplatMeshRenderable,
  type SplatMixedRenderOptions,
  type SplatRendererProps,
  type SplatRendererStats
} from './splat-renderer';
export {
  GPUSplatGraphRenderer,
  type GPUSplatGraphRendererProps
} from './gpu-splat-graph-renderer';
export {
  GPUPagedSplatRenderer,
  type GPUPagedSplatPage,
  type GPUPagedSplatRendererProps,
  type GPUPagedSplatRendererStats
} from './gpu-paged-splat-renderer';
export {
  GPUSplatGraphMixedRenderer,
  GPUSplatGraphPicker,
  resolveGPUSplatGraphPickInfo,
  GPU_SPLAT_GRAPH_PICKING_SHADER,
  type GPUSplatGraphMixedRendererProps
} from './gpu-splat-graph-interaction';
export {
  SPLAT_ATTRIBUTE_SHADER_LAYOUT,
  SPLAT_ATTRIBUTE_WGSL_SHADER,
  SPLAT_FS_GLSL,
  SPLAT_STORAGE_SHADER_LAYOUT,
  SPLAT_STORAGE_WGSL_SHADER,
  SPLAT_VS_GLSL,
  splatUniforms,
  type SplatUniforms
} from './splat-shaders';
