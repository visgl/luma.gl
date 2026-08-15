// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export {
  CompiledGPUCommandGraph,
  GPUCommandGraph,
  GPUCommandGraphEncoding,
  GraphBufferHandle,
  GraphDataView,
  GraphExternalTextureHandle,
  GraphTextureHandle,
  GraphTextureView,
  GraphVectorView
} from './gpu-command-graph';
export type {
  GPUCommandGraphCapabilities,
  GPUCommandGraphCompileContext,
  GPUCommandGraphComputeExecutable,
  GPUCommandGraphComputeNode,
  GPUCommandGraphCopyExecutable,
  GPUCommandGraphCopyNode,
  GPUCommandGraphEncodeContext,
  GPUCommandGraphEncodeOptions,
  GPUCommandGraphEncodingStats,
  GPUCommandGraphNode,
  GPUCommandGraphNodeEncodingStats,
  GPUCommandGraphNodeTiming,
  GPUCommandGraphNodeType,
  GPUCommandGraphNodePreflight,
  GPUCommandGraphNodeWorkloadEstimate,
  GPUCommandGraphPreflightReport,
  GPUCommandGraphRenderExecutable,
  GPUCommandGraphRenderNode,
  GPUCommandGraphStats,
  GPUCommandGraphTimingReport,
  GraphBufferDescriptor,
  GraphBufferUsage,
  GraphBufferUse,
  GraphExternalTextureBinding,
  GraphExternalTextureDescriptor,
  GraphExternalTextureUse,
  GraphFrameTextureBinding,
  GraphImportedBuffer,
  GraphImportedTexture,
  GraphRenderPassAttachments,
  GraphResourceUse,
  GraphTextureAspect,
  GraphTextureDescriptor,
  GraphTextureDimension,
  GraphTextureUsage,
  GraphTextureUse,
  GraphTextureViewProps
} from './gpu-command-graph';
export type {GPUCommandGraphContributor} from './gpu-command-graph';
export {GPUTextureHistory} from './gpu-texture-history';
export type {GPUTextureHistoryProps} from './gpu-texture-history';
export {GPUCommandGraphInspector} from './gpu-command-graph-inspector';
export type {
  GPUCommandGraphInspectorCounterSnapshot,
  GPUCommandGraphInspectorDurationSnapshot,
  GPUCommandGraphInspectorEncoding,
  GPUCommandGraphInspectorGraph,
  GPUCommandGraphInspectorGraphSnapshot,
  GPUCommandGraphInspectorNodeIdentity,
  GPUCommandGraphInspectorNodeSnapshot,
  GPUCommandGraphInspectorObservableGraph,
  GPUCommandGraphInspectorObservation,
  GPUCommandGraphInspectorProps,
  GPUCommandGraphInspectorSnapshot,
  GPUCommandGraphInspectorStatsSnapshot
} from './gpu-command-graph-inspector';
export {createTransientView, getViewBinding, getViewElementOffset} from './graph-data-view-utils';
export type {GraphDataViewBinding} from './graph-data-view-utils';

export {GPUScan} from './gpu-scan';
export type {GPUScanInput, GPUScanProps} from './gpu-scan';
export {
  runGPUWorkgroupScanBenchmark,
  summarizeGPUWorkgroupScanBenchmarkSamples
} from './gpu-workgroup-scan-benchmark';
export type {
  GPUWorkgroupScanBenchmarkDistribution,
  GPUWorkgroupScanBenchmarkPathReport,
  GPUWorkgroupScanBenchmarkProps,
  GPUWorkgroupScanBenchmarkReport,
  GPUWorkgroupScanBenchmarkStrategy
} from './gpu-workgroup-scan-benchmark';
export {runGPUWorkgroupReductionBenchmark} from './gpu-workgroup-reduction-benchmark';
export type {
  GPUWorkgroupReductionBenchmarkPathReport,
  GPUWorkgroupReductionBenchmarkProps,
  GPUWorkgroupReductionBenchmarkReport,
  GPUWorkgroupReductionBenchmarkStrategy
} from './gpu-workgroup-reduction-benchmark';
export {GPUSegmentedSort} from './gpu-segmented-sort';
export type {GPUSegmentedSortProps, GPUSortSegment} from './gpu-segmented-sort';
export {GPUCompaction} from './gpu-compaction';
export type {GPUCompactionInput, GPUCompactionProps} from './gpu-compaction';
export {
  GPUIndexedRangeCompaction,
  GPUPartitionedIndexedRangeCompaction
} from './gpu-indexed-range-compaction';
export type {
  GPUIndexedRangeCompactionProps,
  GPUIndexedRangeCompactionResult,
  GPUIndexedRangeFlagEncoding,
  GPUIndexedRangeLayout,
  GPUPartitionedIndexedRangeCompactionProps,
  GPUPartitionedIndexedRangeCompactionResult
} from './gpu-indexed-range-compaction';
export {GPUChunkedIndexedScatter} from './gpu-chunked-indexed-scatter';
export type {
  GPUChunkedIndexedScatterProps,
  GPUChunkedIndexedScatterResult,
  GPUChunkedIndexedScatterRouteLayout
} from './gpu-chunked-indexed-scatter';
export {GPUTextSelection} from './gpu-text-selection';
export type {GPUTextSelectionProps} from './gpu-text-selection';

export {GPUVisibilityWorkflow} from './gpu-visibility-workflow';
export type {
  GPUVisibilityPredicate,
  GPUVisibilityPredicateKind,
  GPUVisibilityWorkflowProps
} from './gpu-visibility-workflow';

export {
  GPUVirtualGeometrySelection,
  GPU_VIRTUAL_GEOMETRY_FRUSTUM_PLANE_COUNT,
  makeGPUVirtualGeometrySelectionPlan
} from './gpu-virtual-geometry-selection';
export type {
  GPUVirtualGeometryHierarchy,
  GPUVirtualGeometrySelectionPlan,
  GPUVirtualGeometrySelectionProps,
  GPUVirtualGeometryView
} from './gpu-virtual-geometry-selection';

export {GPUMask} from './gpu-mask';
export type {GPUMaskInput, GPUMaskOperation, GPUMaskProps} from './gpu-mask';

export {GPUHierarchyLayout} from './gpu-hierarchy-layout';
export type {GPUHierarchyLayoutData, GPUHierarchyLayoutProps} from './gpu-hierarchy-layout';

export {GPUGraphTraversal} from './gpu-graph-traversal';
export type {
  GPUGraphTraversalData,
  GPUGraphTraversalDirection,
  GPUGraphTraversalProps
} from './gpu-graph-traversal';

export {GPUAncestorProjection} from './gpu-ancestor-projection';
export type {GPUAncestorProjectionProps} from './gpu-ancestor-projection';

export {GPUSort} from './gpu-sort';
export type {GPUSortAlgorithm, GPUSortDirection, GPUSortProps} from './gpu-sort';
export {GPUBatchSort} from './gpu-batch-sort';
export type {GPUBatchSortProps} from './gpu-batch-sort';

export {GPUReduction} from './gpu-reduction';
export type {
  GPUReductionInput,
  GPUReductionMask,
  GPUReductionOperation,
  GPUReductionProps
} from './gpu-reduction';

export {
  getGPUFFT2DSupport,
  GPUFFT2D,
  GPU_FFT2D_MAX_DIMENSION,
  GPU_FFT2D_MIN_DIMENSION,
  makeGPUFFT2DStats
} from './gpu-fft2d';
export type {
  GPUFFT2DDirection,
  GPUFFT2DEncodeOptions,
  GPUFFT2DProps,
  GPUFFT2DStats,
  GPUFFT2DSupport
} from './gpu-fft2d';

export {
  GPUTranspose,
  GPU_TRANSPOSE_TILE_SIZE,
  makeGPUTransposeStats
} from './gpu-transpose';
export type {
  GPUTransposeFormat,
  GPUTransposeProps,
  GPUTransposeStats
} from './gpu-transpose';
export {runGPUTransposeBenchmark} from './gpu-transpose-benchmark';
export type {
  GPUTransposeBenchmarkPathReport,
  GPUTransposeBenchmarkProps,
  GPUTransposeBenchmarkReport,
  GPUTransposeBenchmarkStrategy
} from './gpu-transpose-benchmark';

export {
  getGPUFFT1DSupport,
  getGPUFFT1DStrategy,
  GPUFFT1D,
  GPU_FFT1D_MAX_LENGTH,
  GPU_FFT1D_MIN_LENGTH,
  GPU_FFT1D_WORKGROUP_SIZE,
  makeGPUFFT1DStats
} from './gpu-fft1d';
export type {
  GPUFFT1DDirection,
  GPUFFT1DProps,
  GPUFFT1DStats,
  GPUFFT1DStrategy,
  GPUFFT1DSupport
} from './gpu-fft1d';
export {runGPUFFT1DBenchmark} from './gpu-fft1d-benchmark';
export type {
  GPUFFT1DBenchmarkPathReport,
  GPUFFT1DBenchmarkProps,
  GPUFFT1DBenchmarkReport,
  GPUFFT1DBenchmarkStrategy
} from './gpu-fft1d-benchmark';

export {
  getGPUConvolutionSupport,
  GPUConvolution,
  GPU_CONVOLUTION_AUTO_DIRECT_KERNEL_AREA,
  GPU_CONVOLUTION_WORKGROUP_SIZE,
  makeGPUConvolutionStats
} from './gpu-convolution';
export type {
  GPUConvolutionBoundary,
  GPUConvolutionPlanProps,
  GPUConvolutionProps,
  GPUConvolutionStats,
  GPUConvolutionStrategy,
  GPUConvolutionSupport
} from './gpu-convolution';
export {runGPUConvolutionBenchmark} from './gpu-convolution-benchmark';
export type {
  GPUConvolutionBenchmarkCase,
  GPUConvolutionBenchmarkCaseReport,
  GPUConvolutionBenchmarkPathReport,
  GPUConvolutionBenchmarkProps,
  GPUConvolutionBenchmarkReport,
  GPUConvolutionBenchmarkStrategy
} from './gpu-convolution-benchmark';

export {GPUHistogram} from './gpu-histogram';
export type {
  GPUHistogramDomain,
  GPUHistogramEdges,
  GPUHistogramInput,
  GPUHistogramMask,
  GPUHistogramProps
} from './gpu-histogram';

export {GPUGridBinning} from './gpu-grid-binning';
export type {
  GPUGridBinningBounds,
  GPUGridBinningPositions,
  GPUGridBinningProps
} from './gpu-grid-binning';

export {GPUGridIndex} from './gpu-grid-index';
export type {
  GPUGridIndexBounds,
  GPUGridIndexPositions,
  GPUGridIndexProps,
  GPUGridIndexSize,
  GPUGridIndexSourceIds
} from './gpu-grid-index';

export {GPUGridIndexQuery} from './gpu-grid-index-query';
export type {
  GPUGridIndexQueryKind,
  GPUGridIndexQueryProps,
  GPUGridIndexView
} from './gpu-grid-index-query';

export {GPUPointSpatialFilter} from './gpu-point-spatial-filter';
export type {
  GPUPointSpatialFilterCandidates,
  GPUPointSpatialFilterKind,
  GPUPointSpatialFilterProps
} from './gpu-point-spatial-filter';

export {GPUBVH} from './gpu-bvh';
export type {GPUBVHBoundsView, GPUBVHProps, GPUBVHStorageStats, GPUBVHStrategy} from './gpu-bvh';
export {GPUSegmentedBVH} from './gpu-segmented-bvh';
export type {GPUBVHSegment, GPUSegmentedBVHProps} from './gpu-segmented-bvh';

export {GPUBVHQuery} from './gpu-bvh-query';
export type {GPUBVHQueryKind, GPUBVHQueryProps, GPUBVHView} from './gpu-bvh-query';

export {
  GPUScene,
  GPU_SCENE_ACTIVE_FLAG,
  GPU_SCENE_INVALID_REFERENCE,
  GPU_SCENE_RECORD_BYTE_LENGTH,
  GPU_SCENE_STATE_BYTE_LENGTH
} from './gpu-scene';
export type {
  GPUSceneBufferOwnership,
  GPUSceneBounds,
  GPUSceneBuffers,
  GPUSceneMove,
  GPUSceneMutation,
  GPUSceneMutationResult,
  GPUScenePosition,
  GPUSceneProps,
  GPUSceneRecord,
  GPUSceneRecordPatch,
  GPUSceneStats,
  GPUSceneView
} from './gpu-scene';

export {
  makeGPUSceneFromCPUScene,
  makeGPUScenePartitionsFromGPUTable
} from './gpu-scene-adapters';

export {GPUSceneDrawGeneration} from './gpu-scene-draw-generation';
export type {
  GPUSceneDrawGenerationProps,
  GPUSceneDrawGenerationStats,
  GPUSceneDrawSource
} from './gpu-scene-draw-generation';

export {GPUSceneResourceGroups} from './gpu-scene-resource-groups';
export type {
  GPUSceneResourceGroup,
  GPUSceneResourceGroupSource,
  GPUSceneResourceGroupsProps,
  GPUSceneResourceGroupsStats
} from './gpu-scene-resource-groups';

export type {
  GPUSceneCPUAdapterContext,
  GPUSceneCPUAdapterProps,
  GPUSceneTableAdapterProps,
  GPUSceneTableAdapterResult,
  GPUSceneTableAdapterStats,
  GPUSceneTableColumnNames,
  GPUSceneTablePartition
} from './gpu-scene-adapters';

export {
  runGPUSpatialQueryBenchmark,
  summarizeGPUSpatialBenchmarkSamples
} from './gpu-spatial-query-benchmark';
export type {
  GPUSpatialBenchmarkAmortizedCost,
  GPUSpatialBenchmarkDistribution,
  GPUSpatialBenchmarkPath,
  GPUSpatialBenchmarkPathReport,
  GPUSpatialBenchmarkPhase,
  GPUSpatialBenchmarkResult,
  GPUSpatialBenchmarkStrategy,
  GPUSpatialQueryBenchmarkProps,
  GPUSpatialQueryBenchmarkReport
} from './gpu-spatial-query-benchmark';

export {GPUGridAggregation} from './gpu-grid-aggregation';
export type {
  GPUGridAggregationOperation,
  GPUGridAggregationPositions,
  GPUGridAggregationProps,
  GPUGridAggregationWeights
} from './gpu-grid-aggregation';

export {GPUGroupAggregation} from './gpu-group-aggregation';
export type {
  GPUGroupAggregationKeys,
  GPUGroupAggregationMask,
  GPUGroupAggregationOperation,
  GPUGroupAggregationProps,
  GPUGroupAggregationValues
} from './gpu-group-aggregation';

export {
  GPUHashIndex,
  GPUHashIndexQuery,
  GPU_HASH_INDEX_EMPTY_KEY,
  GPU_HASH_INDEX_STATISTICS_LENGTH,
  GPU_HASH_QUERY_STATISTICS_LENGTH
} from './gpu-hash-index';
export type {
  GPUHashIndexProps,
  GPUHashIndexQueryProps,
  GPUHashIndexStats,
  GPUHashIndexView
} from './gpu-hash-index';

export {GPUBatchHashIndex} from './gpu-batch-hash-index';
export type {GPUBatchHashIndexProps, GPUBatchHashIndexStats} from './gpu-batch-hash-index';

export {GPUHashJoin} from './gpu-hash-join';
export type {GPUHashJoinProps, GPUHashJoinStats} from './gpu-hash-join';
export {GPUBatchHashJoin} from './gpu-batch-hash-join';
export type {GPUBatchHashJoinProps, GPUBatchHashJoinStats} from './gpu-batch-hash-join';

export {
  decodeGPUIndexPickInfo,
  decodeGPUIndexPickRegion,
  GPUIndexPickingTarget,
  INDEX_PICKING_READBACK_BYTE_LENGTH
} from './gpu-index-picking-target';
export type {
  GPUIndexPickingRegionProps,
  GPUIndexPickingRegionResult,
  GPUIndexPickingReadbackProps,
  GPUIndexPickingTargetProps
} from './gpu-index-picking-target';

export {GPUReadbackRing, GPUReadbackTicket} from './gpu-readback-ring';
export type {GPUReadbackRingProps} from './gpu-readback-ring';

export {DrawCommandBuffer} from './draw-command-buffer';
export type {
  DrawCommand,
  DrawCommandBufferProps,
  DrawCommandBufferView,
  DrawIndexedCommand
} from './draw-command-buffer';

export {DispatchCommandBuffer} from './dispatch-command-buffer';
export type {
  DispatchCommand,
  DispatchCommandBufferProps
} from './dispatch-command-buffer';
