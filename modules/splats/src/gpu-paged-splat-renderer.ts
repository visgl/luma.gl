// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  assert,
  Buffer,
  type Binding,
  type CommandEncoder,
  type Device,
  type ShaderLayout
} from '@luma.gl/core';
import {Computation, Model} from '@luma.gl/engine';
import {
  DrawCommandBuffer,
  GPUCommandGraph,
  GPUCommandGraphEncoding,
  GPUSort,
  type CompiledGPUCommandGraph,
  type GPUCommandGraphStats,
  type GraphBufferHandle,
  type GraphDataView
} from '@luma.gl/experimental';
import type {GPUSplatGraphRendererProps} from './gpu-splat-graph-renderer';
import {
  GPU_SPLAT_GRAPH_FEATURE_UNIFORM_BYTE_LENGTH,
  GPU_SPLAT_GRAPH_UNIFORM_BYTE_LENGTH,
  GPU_SPLAT_INVALID_DEPTH_KEY,
  GPU_SPLAT_PROJECTED_RECORD_BYTE_LENGTH
} from './gpu-splat-graph-shaders';
import {
  GPU_PAGED_SPLAT_FEATURE_SHADER,
  GPU_PAGED_SPLAT_FEATURE_SHADER_LAYOUT,
  GPU_PAGED_SPLAT_PROJECTION_SHADER,
  GPU_PAGED_SPLAT_PROJECTION_SHADER_LAYOUT,
  GPU_PAGED_SPLAT_RENDER_SHADER,
  GPU_PAGED_SPLAT_RENDER_SHADER_LAYOUT
} from './gpu-paged-splat-shaders';
import {GPUSplatData} from './splat-data';
import type {SplatSemanticFilter, SplatSemanticSelection} from './splat-filter';
import type {SplatResidencyBounds} from './splat-residency';
import type {SplatRendererStats} from './splat-renderer';
import {
  getSplatSphericalHarmonicCoefficientCount,
  type SplatSphericalHarmonicsDegree
} from './splat-spherical-harmonics';

const WORKGROUP_SIZE = 256;
const MINIMUM_SEMANTIC_SELECTION_CAPACITY = 64;

/** One intact caller-owned source page and its optional batch-local active-row frontier. */
export type GPUPagedSplatPage = {
  /** Stable page identity used to retain source topology and renderer-owned index buffers. */
  id: string;
  /** Original caller-owned prepared source allocation, never rewritten or destroyed here. */
  data: GPUSplatData;
  /** Optional compact, batch-local row selection; omitted pages render all original rows. */
  activeRows?: Uint32Array;
  /** Optional source bounds retained for hierarchy and application diagnostics. */
  bounds?: SplatResidencyBounds;
};

/** Shared camera/style controls plus independently projected page and output segment limits. */
export type GPUPagedSplatRendererProps = Omit<
  GPUSplatGraphRendererProps,
  'expectedSplatCount' | 'expectedBatchCount'
> & {
  /** Intact source pages and optional per-page sparse row selections. */
  pages?: readonly GPUPagedSplatPage[];
  /** Optional tighter projected-segment row bound; useful for bounded memory and regression tests. */
  maxProjectedSplatsPerSegment?: number;
};

/** Active-frontier, segmented working-set, and original borrowed-source memory diagnostics. */
export type GPUPagedSplatRendererStats = SplatRendererStats & {
  /** Number of independently retained caller-owned source pages. */
  pageCount: number;
  /** Number of bounded source projection segments. */
  sourceSegmentCount: number;
  /** Number of bounded globally ordered projected output segments. */
  segmentCount: number;
  /** Number of explicitly active source rows entering sparse GPU projection. */
  activeRowCount: number;
  /** Number of rows in the global four-byte GPU depth/index sorting domain. */
  globalSortCapacity: number;
  /** Maximum rows allowed in one 48-byte projected storage binding. */
  maxProjectedSplatsPerSegment: number;
};

type ResolvedPagedSplatProps = {
  modelViewProjectionMatrix: [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number
  ];
  viewportSize: [number, number];
  cameraPosition: [number, number, number];
  sphericalHarmonicsDegree: SplatSphericalHarmonicsDegree;
  semanticFilter?: SplatSemanticFilter;
  sortMode: 'global';
  alphaCutoff: number;
  screenSizeCutoffPixels: number;
  gaussianSupportRadius: number;
  kernel2DSize: number;
  maxScreenSpaceSplatSize: number;
  radiusScale: number;
  alphaScale: number;
  exposure: number;
  toneMapping: 'none' | 'reinhard';
};

type PlannedSourceSegment = {
  id: string;
  page: GPUPagedSplatPage;
  activeRows?: Uint32Array;
  activeRowCount: number;
  sourceRowOffset: number;
  sourceBindingRowOffset: number;
  sourceRowCount: number;
  usesSourceRanges: boolean;
  globalRowOffset: number;
};

type SourceSegment = PlannedSourceSegment & {
  activeRowBuffer: Buffer;
  projectedRecordBuffer: Buffer;
  uniformBuffer: Buffer;
  featureUniformBuffer: Buffer;
  graphUniforms: GraphBufferHandle;
  graphFeatureUniforms: GraphBufferHandle;
  graphActiveRows: GraphBufferHandle;
  graphProjectedRecords: GraphBufferHandle;
};

type OutputSegment = {
  index: number;
  globalRowOffset: number;
  rowCount: number;
  projectedRecordBuffer: Buffer;
  graphProjectedRecords: GraphBufferHandle;
};

const SOURCE_COLUMNS = [
  {name: 'positions', rowByteLength: 12},
  {name: 'scales', rowByteLength: 12},
  {name: 'rotations', rowByteLength: 16},
  {name: 'colors', rowByteLength: 4},
  {name: 'opacities', rowByteLength: 4}
] as const;

const INITIALIZE_LAYOUT = {
  attributes: [],
  bindings: [
    {name: 'values', type: 'storage', group: 0, location: 0},
    {name: 'depthKeys', type: 'storage', group: 0, location: 1},
    {name: 'drawCommands', type: 'storage', group: 0, location: 2}
  ]
} satisfies ShaderLayout;

const INVERSE_LAYOUT = {
  attributes: [],
  bindings: [
    {name: 'sortedIndices', type: 'read-only-storage', group: 0, location: 0},
    {name: 'inverseIndices', type: 'storage', group: 0, location: 1}
  ]
} satisfies ShaderLayout;

const SCATTER_LAYOUT = {
  attributes: [],
  bindings: [
    {name: 'sourceRecords', type: 'read-only-storage', group: 0, location: 0},
    {name: 'inverseIndices', type: 'read-only-storage', group: 0, location: 1},
    {name: 'outputRecords', type: 'storage', group: 0, location: 2},
    {name: 'graphUniforms', type: 'uniform', group: 0, location: 3}
  ]
} satisfies ShaderLayout;

const SEGMENT_DRAW_LAYOUT = {
  attributes: [],
  bindings: [{name: 'drawCommands', type: 'storage', group: 0, location: 0}]
} satisfies ShaderLayout;

/**
 * Globally ordered WebGPU Gaussian rendering across independently bounded projected segments.
 *
 * Original page buffers remain borrowed. Sparse hierarchy rows are projected directly from their
 * original source columns, all pages share one exact GPU radix depth ordering, and globally ordered
 * projected records are gathered into independently bound <= device-limit output segments.
 */
export class GPUPagedSplatRenderer {
  /** WebGPU device shared with all caller-owned source pages. */
  readonly device: Device;
  /** Resolved camera, Gaussian visibility, source-semantic, and HDR presentation controls. */
  readonly props: ResolvedPagedSplatProps;
  /** Intact caller-selected pages, retaining their independently owned source allocations. */
  readonly pages: GPUPagedSplatPage[] = [];
  /** Global visible instance count plus one indirect draw command per ordered output segment. */
  drawCommands: DrawCommandBuffer;
  /** Current reusable page-aware command graph, available after its first nonempty encoding. */
  compiledGraph?: CompiledGPUCommandGraph;
  /** Immediate CPU/node diagnostics from the latest globally ordered graph encoding. */
  lastEncoding?: GPUCommandGraphEncoding;

  private readonly clearColor: [number, number, number, number];
  private readonly requestedSegmentCapacity?: number;
  private readonly ownedBuffers: Buffer[] = [];
  private readonly sourceSegments: SourceSegment[] = [];
  private readonly outputSegments: OutputSegment[] = [];
  private readonly pageRevisions = new Map<string, number>();
  private plannedSegments: PlannedSourceSegment[] = [];
  private model?: Model;
  private sortedValuesBuffer?: Buffer;
  private semanticSelectionBuffer?: Buffer;
  private semanticSelectionValues = new Uint32Array(0);
  private semanticIncludeCount = 0;
  private semanticExcludeCount = 0;
  private semanticSelectionCapacity = 0;
  private globalSortCapacity = 0;
  private requiresGraphRebuild = true;
  private requiresEncoding = true;
  private hasPresentedContent = false;
  private hasExplicitToneMapping = false;
  private isDestroyed = false;

  /** Retains intact source pages lazily without projecting, sorting, or copying source rows. */
  constructor(device: Device, props: GPUPagedSplatRendererProps = {}) {
    if (device.type !== 'webgpu') {
      throw new Error('GPUPagedSplatRenderer requires a WebGPU device');
    }
    assert(
      props.maxProjectedSplatsPerSegment === undefined ||
        (Number.isSafeInteger(props.maxProjectedSplatsPerSegment) &&
          props.maxProjectedSplatsPerSegment > 0)
    );

    this.device = device;
    this.requestedSegmentCapacity = props.maxProjectedSplatsPerSegment;
    this.clearColor = [...(props.clearColor ?? [0, 0, 0, 0])];
    this.props = {
      modelViewProjectionMatrix: toPagedSplatMatrix(props.modelViewProjectionMatrix),
      viewportSize: [...(props.viewportSize ?? [1, 1])],
      cameraPosition: [...(props.cameraPosition ?? [0, 0, 0])],
      sphericalHarmonicsDegree: props.sphericalHarmonicsDegree ?? 3,
      ...(props.semanticFilter ? {semanticFilter: props.semanticFilter} : {}),
      sortMode: 'global',
      alphaCutoff: props.alphaCutoff ?? props.opacityThreshold ?? 1 / 255,
      screenSizeCutoffPixels: props.screenSizeCutoffPixels ?? 0,
      gaussianSupportRadius: props.gaussianSupportRadius ?? 3,
      kernel2DSize: props.kernel2DSize ?? 0.3,
      maxScreenSpaceSplatSize: props.maxScreenSpaceSplatSize ?? 1024,
      radiusScale: props.radiusScale ?? props.pointSize ?? 1,
      alphaScale: props.alphaScale ?? 1,
      exposure: props.exposure ?? 1,
      toneMapping: props.toneMapping ?? 'none'
    };
    this.hasExplicitToneMapping = props.toneMapping !== undefined;
    this.updateSemanticSelections(props.semanticFilter);
    this.drawCommands = this.createDrawCommands(1);

    if (props.pages) {
      this.setFrontier(props.pages);
    } else if (props.data) {
      const batches = props.data instanceof GPUSplatData ? [props.data] : props.data;
      this.setFrontier(
        batches.map(batch => ({
          id: `${batch.sourceBatchIndex}:${batch.rowIndexBase}`,
          data: batch
        }))
      );
    }
  }

  /** Independent caller-owned source batches in the same order as the selected page frontier. */
  get batches(): GPUSplatData[] {
    return this.pages.map(page => page.data);
  }

  /** Renderer-owned globally sorted sparse-row identities, available after graph compilation. */
  get sortedIndexBuffer(): Buffer | undefined {
    return this.sortedValuesBuffer;
  }

  /** Ordered projected segment allocations; no single segment exceeds a storage binding limit. */
  get projectedRecordBuffers(): readonly Buffer[] {
    return this.outputSegments.map(segment => segment.projectedRecordBuffer);
  }

  /** Shared presentation uniforms for integrations that draw ordered segments externally. */
  get uniformBuffer(): Buffer | undefined {
    return this.sourceSegments[0]?.uniformBuffer;
  }

  /** Compiled node order, hazard ordering, and physically allocated graph scratch diagnostics. */
  get graphStats(): GPUCommandGraphStats | undefined {
    return this.compiledGraph?.stats;
  }

  /** Loaded source, sparse active row, segmented output, and GPU-memory diagnostics. */
  get stats(): GPUPagedSplatRendererStats {
    return this.getStats();
  }

  /** Whether owned graph, working allocations, and indirect draw records have been released. */
  get destroyed(): boolean {
    return this.isDestroyed;
  }

  /** Replaces the active row frontier while retaining all caller-owned source allocations. */
  setFrontier(pages: readonly GPUPagedSplatPage[]): void {
    if (this.isDestroyed) {
      throw new Error('Cannot update a destroyed paged Gaussian splat renderer');
    }
    const pageIds = new Set<string>();
    for (const page of pages) {
      if (!page.id || pageIds.has(page.id)) {
        throw new Error('Paged Gaussian splats require unique nonempty page identifiers');
      }
      if (page.data.destroyed || page.data.device !== this.device) {
        throw new Error('Paged Gaussian splats require live data prepared on their own device');
      }
      pageIds.add(page.id);
    }

    const nextSegments = this.planSourceSegments(pages);
    const canReuseGraph =
      this.compiledGraph !== undefined &&
      nextSegments.length === this.sourceSegments.length &&
      nextSegments.every((segment, index) => {
        const previousSegment = this.sourceSegments[index];
        return (
          segment.id === previousSegment.id &&
          segment.page.data === previousSegment.page.data &&
          segment.activeRowCount === previousSegment.activeRowCount &&
          segment.sourceRowOffset === previousSegment.sourceRowOffset &&
          segment.sourceBindingRowOffset === previousSegment.sourceBindingRowOffset &&
          segment.sourceRowCount === previousSegment.sourceRowCount &&
          segment.usesSourceRanges === previousSegment.usesSourceRanges
        );
      });
    if (!canReuseGraph && nextSegments.length > 0) {
      this.releaseCompiledGraph();
    }
    this.pages.splice(0, this.pages.length, ...pages);
    this.plannedSegments = nextSegments;
    for (const page of pages) {
      this.pageRevisions.set(page.id, page.data.revision);
      if (
        !this.hasExplicitToneMapping &&
        page.data.colors.format === 'float32x4' &&
        !hasPagedHighDynamicRangePresentation(this.device)
      ) {
        this.props.toneMapping = 'reinhard';
      }
    }
    for (const pageId of this.pageRevisions.keys()) {
      if (!pageIds.has(pageId)) {
        this.pageRevisions.delete(pageId);
      }
    }
    if (canReuseGraph) {
      for (let segmentIndex = 0; segmentIndex < this.sourceSegments.length; segmentIndex++) {
        Object.assign(this.sourceSegments[segmentIndex], nextSegments[segmentIndex]);
      }
    } else if (nextSegments.length > 0) {
      this.requiresGraphRebuild = true;
    }
    this.requiresEncoding = true;
  }

  /** Alias for page-oriented callers that do not expose a hierarchy-specific frontier name. */
  setPages(pages: readonly GPUPagedSplatPage[]): void {
    this.setFrontier(pages);
  }

  /** Updates borrowed pages, camera matrices, sparse semantic selections, or display uniforms. */
  setProps(props: Partial<GPUPagedSplatRendererProps>): void {
    if (props.pages) {
      this.setFrontier(props.pages);
    } else if (props.data !== undefined) {
      const batches = props.data instanceof GPUSplatData ? [props.data] : props.data;
      this.setFrontier(
        batches.map(batch => ({id: `${batch.sourceBatchIndex}:${batch.rowIndexBase}`, data: batch}))
      );
    }
    if (
      props.modelViewProjectionMatrix &&
      !arePagedSplatValuesEqual(
        this.props.modelViewProjectionMatrix,
        props.modelViewProjectionMatrix
      )
    ) {
      this.props.modelViewProjectionMatrix = toPagedSplatMatrix(props.modelViewProjectionMatrix);
      this.requiresEncoding = true;
    }
    if (
      props.viewportSize &&
      !arePagedSplatValuesEqual(this.props.viewportSize, props.viewportSize)
    ) {
      this.props.viewportSize = [...props.viewportSize];
      this.requiresEncoding = true;
    }
    if (
      props.cameraPosition &&
      !arePagedSplatValuesEqual(this.props.cameraPosition, props.cameraPosition)
    ) {
      this.props.cameraPosition = [...props.cameraPosition];
      this.requiresEncoding = true;
    }
    if (
      props.sphericalHarmonicsDegree !== undefined &&
      this.props.sphericalHarmonicsDegree !== props.sphericalHarmonicsDegree
    ) {
      this.props.sphericalHarmonicsDegree = props.sphericalHarmonicsDegree;
      this.requiresEncoding = true;
    }
    if ('semanticFilter' in props && !Object.is(this.props.semanticFilter, props.semanticFilter)) {
      this.updateSemanticSelections(props.semanticFilter);
      this.props.semanticFilter = props.semanticFilter;
      this.requiresEncoding = true;
    }

    const updates: Partial<ResolvedPagedSplatProps> = {
      ...(props.alphaCutoff !== undefined || props.opacityThreshold !== undefined
        ? {alphaCutoff: props.alphaCutoff ?? props.opacityThreshold}
        : {}),
      ...(props.radiusScale !== undefined || props.pointSize !== undefined
        ? {radiusScale: props.radiusScale ?? props.pointSize}
        : {}),
      ...(props.screenSizeCutoffPixels !== undefined
        ? {screenSizeCutoffPixels: props.screenSizeCutoffPixels}
        : {}),
      ...(props.gaussianSupportRadius !== undefined
        ? {gaussianSupportRadius: props.gaussianSupportRadius}
        : {}),
      ...(props.kernel2DSize !== undefined ? {kernel2DSize: props.kernel2DSize} : {}),
      ...(props.maxScreenSpaceSplatSize !== undefined
        ? {maxScreenSpaceSplatSize: props.maxScreenSpaceSplatSize}
        : {}),
      ...(props.alphaScale !== undefined ? {alphaScale: props.alphaScale} : {}),
      ...(props.exposure !== undefined ? {exposure: props.exposure} : {}),
      ...(props.toneMapping !== undefined ? {toneMapping: props.toneMapping} : {})
    };
    if (props.toneMapping !== undefined) {
      this.hasExplicitToneMapping = true;
    }
    for (const [propertyName, value] of Object.entries(updates)) {
      if (this.props[propertyName as keyof ResolvedPagedSplatProps] !== value) {
        Object.assign(this.props, {[propertyName]: value});
        this.requiresEncoding = true;
      }
    }
  }

  /** Encodes sparse projection, exact cross-page ordering, segmented gather, and one render pass. */
  encode(commandEncoder: CommandEncoder): GPUCommandGraphEncoding | undefined {
    if (this.isDestroyed) {
      return undefined;
    }
    if (this.plannedSegments.length === 0) {
      if (!this.requiresEncoding || !this.hasPresentedContent) {
        return undefined;
      }
      this.drawCommands.buffer.write(
        new Uint32Array([0]),
        this.drawCommands.getInstanceCountByteOffset(0)
      );
      const renderPass = commandEncoder.beginRenderPass({
        id: 'paged-gaussian-splat-clear-pass',
        clearColor: this.clearColor,
        clearDepth: 1,
        clearStencil: false
      });
      renderPass.end();
      this.lastEncoding = new GPUCommandGraphEncoding(
        [
          {
            stats: {
              id: 'paged-gaussian-splat-clear',
              type: 'render',
              cpuEncodeTimeMilliseconds: 0,
              hasGPUTimestamps: false
            }
          }
        ],
        0
      );
      this.hasPresentedContent = false;
      this.requiresEncoding = false;
      return this.lastEncoding;
    }
    for (const page of this.pages) {
      if (page.data.revision !== this.pageRevisions.get(page.id)) {
        this.pageRevisions.set(page.id, page.data.revision);
        this.requiresEncoding = true;
      }
    }
    if (!this.requiresEncoding) {
      return undefined;
    }
    if (this.requiresGraphRebuild) {
      this.rebuildGraph();
    }
    if (!this.compiledGraph) {
      return undefined;
    }
    this.writeSourceUniforms();
    this.lastEncoding = this.compiledGraph.encode(commandEncoder, {parameters: undefined});
    this.hasPresentedContent = true;
    this.requiresEncoding = false;
    return this.lastEncoding;
  }

  /** Counts unique caller-owned pages separately from renderer-owned bounded working storage. */
  getStats(): GPUPagedSplatRendererStats {
    const uniqueSourceBatches = new Set(this.pages.map(page => page.data));
    const sourceGpuByteLength = Array.from(uniqueSourceBatches).reduce(
      (totalByteLength, batch) => totalByteLength + batch.byteLength,
      0
    );
    const rendererGpuByteLength =
      this.drawCommands.buffer.byteLength +
      this.ownedBuffers.reduce(
        (totalByteLength, buffer) => totalByteLength + buffer.byteLength,
        0
      ) +
      (this.compiledGraph?.stats.physicalTransientBytes ?? 0);
    const activeRowCount = this.plannedSegments.reduce(
      (totalRowCount, segment) => totalRowCount + segment.activeRowCount,
      0
    );
    const loadedRowCount = this.pages.reduce(
      (totalRowCount, page) => totalRowCount + page.data.length,
      0
    );
    return {
      splatCount: activeRowCount,
      rowCount: loadedRowCount,
      visibleSplatCount: activeRowCount,
      batchCount: this.pages.length,
      pageCount: this.pages.length,
      sourceSegmentCount: this.plannedSegments.length,
      segmentCount: this.outputSegments.length,
      activeRowCount,
      globalSortCapacity: this.globalSortCapacity,
      maxProjectedSplatsPerSegment: this.getMaximumProjectedSegmentRows(),
      sortMode: 'global',
      sourceGpuByteLength,
      rendererGpuByteLength,
      gpuByteLength: sourceGpuByteLength + rendererGpuByteLength,
      drawCallCount: this.outputSegments.length
    };
  }

  /** Releases graph-owned scratch and renderer-owned allocations without touching source pages. */
  destroy(): void {
    if (this.isDestroyed) {
      return;
    }
    this.releaseCompiledGraph();
    this.drawCommands.destroy();
    this.pages.length = 0;
    this.plannedSegments.length = 0;
    this.pageRevisions.clear();
    this.isDestroyed = true;
  }

  private rebuildGraph(): void {
    this.releaseCompiledGraph();
    const activeRowCount = this.plannedSegments.reduce(
      (totalRowCount, segment) => totalRowCount + segment.activeRowCount,
      0
    );
    if (activeRowCount === 0) {
      this.requiresGraphRebuild = false;
      return;
    }
    const maximumStorageByteLength = this.device.limits.maxStorageBufferBindingSize;
    if (
      maximumStorageByteLength > 0 &&
      activeRowCount * Uint32Array.BYTES_PER_ELEMENT > maximumStorageByteLength
    ) {
      throw new Error('Paged Gaussian global sorting exceeds the device storage binding limit');
    }
    this.globalSortCapacity = activeRowCount;
    const graph = new GPUCommandGraph(this.device, {id: 'paged-gaussian-splat-render-graph'});
    const outputSegmentCount = Math.ceil(activeRowCount / this.getMaximumProjectedSegmentRows());
    if (this.drawCommands.capacity < outputSegmentCount + 1) {
      this.drawCommands.destroy();
      this.drawCommands = this.createDrawCommands(outputSegmentCount + 1);
    }

    const depthKeys = this.importUint32Buffer(
      graph,
      this.createOwnedBuffer('paged-gaussian-depth-keys', activeRowCount * 4),
      activeRowCount
    );
    const sourceIndices = this.importUint32Buffer(
      graph,
      this.createOwnedBuffer('paged-gaussian-source-indices', activeRowCount * 4),
      activeRowCount
    );
    const sortedKeys = this.importUint32Buffer(
      graph,
      this.createOwnedBuffer('paged-gaussian-sorted-depths', activeRowCount * 4),
      activeRowCount
    );
    this.sortedValuesBuffer = this.createOwnedBuffer(
      'paged-gaussian-sorted-indices',
      activeRowCount * 4
    );
    const sortedIndices = this.importUint32Buffer(graph, this.sortedValuesBuffer, activeRowCount);
    const inverseIndices = this.importUint32Buffer(
      graph,
      this.createOwnedBuffer('paged-gaussian-inverse-indices', activeRowCount * 4),
      activeRowCount
    );
    this.semanticSelectionCapacity = Math.max(
      MINIMUM_SEMANTIC_SELECTION_CAPACITY,
      this.semanticSelectionValues.length
    );
    this.semanticSelectionBuffer = this.createOwnedBuffer(
      'paged-gaussian-semantic-selections',
      this.semanticSelectionCapacity * 4
    );
    const semanticSelections = this.importOwnedBuffer(graph, this.semanticSelectionBuffer);
    const drawCommandViews = this.drawCommands.importToGraph(graph, 'paged-gaussian-draw-commands');

    this.addInitializationPass(graph, sourceIndices, depthKeys, drawCommandViews.buffer);
    for (const plannedSegment of this.plannedSegments) {
      const segment = this.createSourceSegment(graph, plannedSegment);
      this.sourceSegments.push(segment);
      this.addProjectionPass(graph, segment, depthKeys);
      this.addFeaturePass(graph, segment, depthKeys, drawCommandViews.buffer, semanticSelections);
    }

    new GPUSort({
      id: 'paged-gaussian-global-depth-sort',
      keys: depthKeys,
      values: sourceIndices,
      outputKeys: sortedKeys,
      outputValues: sortedIndices,
      algorithm: 'radix',
      direction: 'ascending',
      keyBits: 16
    }).addToGraph(graph);
    this.addInversePermutationPass(graph, sortedIndices, inverseIndices);

    for (let segmentIndex = 0; segmentIndex < outputSegmentCount; segmentIndex++) {
      const globalRowOffset = segmentIndex * this.getMaximumProjectedSegmentRows();
      const rowCount = Math.min(
        activeRowCount - globalRowOffset,
        this.getMaximumProjectedSegmentRows()
      );
      const projectedRecordBuffer = this.createOwnedBuffer(
        `paged-gaussian-sorted-records-${segmentIndex}`,
        rowCount * GPU_SPLAT_PROJECTED_RECORD_BYTE_LENGTH
      );
      const outputSegment: OutputSegment = {
        index: segmentIndex,
        globalRowOffset,
        rowCount,
        projectedRecordBuffer,
        graphProjectedRecords: this.importOwnedBuffer(graph, projectedRecordBuffer)
      };
      this.outputSegments.push(outputSegment);
      for (const sourceSegment of this.sourceSegments) {
        this.addScatterPass(graph, sourceSegment, outputSegment, inverseIndices);
      }
      this.addSegmentDrawCountPass(graph, outputSegment, drawCommandViews.buffer);
    }
    this.addRenderPass(graph, drawCommandViews.buffer);
    this.compiledGraph = graph.compile();
    this.requiresGraphRebuild = false;
  }

  private createSourceSegment(
    graph: GPUCommandGraph,
    planned: PlannedSourceSegment
  ): SourceSegment {
    const activeRowBuffer = this.createOwnedBuffer(
      `paged-gaussian-active-rows-${planned.id}`,
      Math.max(planned.activeRows?.byteLength ?? 0, 4)
    );
    const projectedRecordBuffer = this.createOwnedBuffer(
      `paged-gaussian-projected-${planned.id}`,
      planned.activeRowCount * GPU_SPLAT_PROJECTED_RECORD_BYTE_LENGTH
    );
    const uniformBuffer = this.createUniformBuffer(
      `paged-gaussian-uniforms-${planned.id}`,
      GPU_SPLAT_GRAPH_UNIFORM_BYTE_LENGTH
    );
    const featureUniformBuffer = this.createUniformBuffer(
      `paged-gaussian-features-${planned.id}`,
      GPU_SPLAT_GRAPH_FEATURE_UNIFORM_BYTE_LENGTH
    );
    return {
      ...planned,
      activeRowBuffer,
      projectedRecordBuffer,
      uniformBuffer,
      featureUniformBuffer,
      graphUniforms: this.importOwnedBuffer(graph, uniformBuffer),
      graphFeatureUniforms: this.importOwnedBuffer(graph, featureUniformBuffer),
      graphActiveRows: this.importOwnedBuffer(graph, activeRowBuffer),
      graphProjectedRecords: this.importOwnedBuffer(graph, projectedRecordBuffer)
    };
  }

  private addInitializationPass(
    graph: GPUCommandGraph,
    values: GraphDataView<'uint32'>,
    depthKeys: GraphDataView<'uint32'>,
    drawCommands: GraphBufferHandle
  ): void {
    const dispatch = getPagedDispatch(this.globalSortCapacity, this.device);
    const shader = /* wgsl */ `
const ROW_COUNT: u32 = ${this.globalSortCapacity}u;
const WORKGROUPS_X: u32 = ${dispatch.x}u;
const INVALID_DEPTH_KEY: u32 = ${GPU_SPLAT_INVALID_DEPTH_KEY}u;
@group(0) @binding(0) var<storage, read_write> values: array<u32>;
@group(0) @binding(1) var<storage, read_write> depthKeys: array<u32>;
@group(0) @binding(2) var<storage, read_write> drawCommands: array<atomic<u32>>;
@compute @workgroup_size(${WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let rowIndex = invocation.x + invocation.y * WORKGROUPS_X * ${WORKGROUP_SIZE}u;
  if (rowIndex < ROW_COUNT) {
    values[rowIndex] = rowIndex;
    depthKeys[rowIndex] = INVALID_DEPTH_KEY;
  }
  if (rowIndex == 0u) {
    atomicStore(&drawCommands[1u], 0u);
  }
}`;
    graph.addComputePass({
      id: 'paged-gaussian-initialize',
      resources: [
        {buffer: values, usage: 'storage-write'},
        {buffer: depthKeys, usage: 'storage-write'},
        {buffer: drawCommands, usage: 'storage-write'}
      ],
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: 'paged-gaussian-initialize',
          source: shader,
          shaderLayout: INITIALIZE_LAYOUT
        });
        return {
          encode: ({computePass, getBuffer}) => {
            computation.setBindings({
              values: getBuffer(values),
              depthKeys: getBuffer(depthKeys),
              drawCommands: getBuffer(drawCommands)
            });
            computation.dispatch(computePass, dispatch.x, dispatch.y);
          },
          destroy: () => computation.destroy()
        };
      }
    });
  }

  private addProjectionPass(
    graph: GPUCommandGraph,
    segment: SourceSegment,
    depthKeys: GraphDataView<'uint32'>
  ): void {
    const sourceHandles = this.importSourceBuffers(graph, segment);
    graph.addComputePass({
      id: `paged-gaussian-project-${segment.id}`,
      resources: [
        ...SOURCE_COLUMNS.map(({name}) => ({
          buffer: sourceHandles[name],
          usage: 'storage-read' as const
        })),
        {buffer: segment.graphProjectedRecords, usage: 'storage-write'},
        {buffer: depthKeys, usage: 'storage-write'},
        {buffer: segment.graphActiveRows, usage: 'storage-read'},
        {buffer: segment.graphUniforms, usage: 'uniform'}
      ],
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: `paged-gaussian-project-${segment.id}`,
          source: GPU_PAGED_SPLAT_PROJECTION_SHADER,
          shaderLayout: GPU_PAGED_SPLAT_PROJECTION_SHADER_LAYOUT
        });
        return {
          encode: ({computePass, getBuffer}) => {
            computation.setBindings({
              positions: this.getSourceBinding(
                segment,
                'positions',
                getBuffer(sourceHandles.positions)
              ),
              scales: this.getSourceBinding(segment, 'scales', getBuffer(sourceHandles.scales)),
              rotations: this.getSourceBinding(
                segment,
                'rotations',
                getBuffer(sourceHandles.rotations)
              ),
              colors: this.getSourceBinding(segment, 'colors', getBuffer(sourceHandles.colors)),
              opacities: this.getSourceBinding(
                segment,
                'opacities',
                getBuffer(sourceHandles.opacities)
              ),
              projectedRecords: getBuffer(segment.graphProjectedRecords),
              depthKeys: getBuffer(depthKeys),
              activeRows: getBuffer(segment.graphActiveRows),
              graphUniforms: getBuffer(segment.graphUniforms)
            });
            computation.dispatch(computePass, Math.ceil(segment.activeRowCount / WORKGROUP_SIZE));
          },
          destroy: () => computation.destroy()
        };
      }
    });
  }

  private addFeaturePass(
    graph: GPUCommandGraph,
    segment: SourceSegment,
    depthKeys: GraphDataView<'uint32'>,
    drawCommands: GraphBufferHandle,
    semanticSelections: GraphBufferHandle
  ): void {
    const sourceHandles = this.importFeatureBuffers(graph, segment);
    graph.addComputePass({
      id: `paged-gaussian-features-${segment.id}`,
      resources: [
        {buffer: sourceHandles.positions, usage: 'storage-read'},
        {buffer: sourceHandles.sphericalHarmonics, usage: 'storage-read'},
        {buffer: sourceHandles.semanticIds, usage: 'storage-read'},
        {buffer: semanticSelections, usage: 'storage-read'},
        {buffer: segment.graphProjectedRecords, usage: 'storage-read-write'},
        {buffer: depthKeys, usage: 'storage-read-write'},
        {buffer: drawCommands, usage: 'storage-read-write'},
        {buffer: segment.graphActiveRows, usage: 'storage-read'},
        {buffer: segment.graphUniforms, usage: 'uniform'},
        {buffer: segment.graphFeatureUniforms, usage: 'uniform'}
      ],
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: `paged-gaussian-features-${segment.id}`,
          source: GPU_PAGED_SPLAT_FEATURE_SHADER,
          shaderLayout: GPU_PAGED_SPLAT_FEATURE_SHADER_LAYOUT
        });
        return {
          encode: ({computePass, getBuffer}) => {
            computation.setBindings({
              positions: this.getSourceBinding(
                segment,
                'positions',
                getBuffer(sourceHandles.positions)
              ),
              sphericalHarmonics: this.getSourceBinding(
                segment,
                'sphericalHarmonics',
                getBuffer(sourceHandles.sphericalHarmonics)
              ),
              semanticIds: this.getSourceBinding(
                segment,
                'semanticIds',
                getBuffer(sourceHandles.semanticIds)
              ),
              semanticSelections: getBuffer(semanticSelections),
              projectedRecords: getBuffer(segment.graphProjectedRecords),
              depthKeys: getBuffer(depthKeys),
              drawCommands: getBuffer(drawCommands),
              activeRows: getBuffer(segment.graphActiveRows),
              graphUniforms: getBuffer(segment.graphUniforms),
              featureUniforms: getBuffer(segment.graphFeatureUniforms)
            });
            computation.dispatch(computePass, Math.ceil(segment.activeRowCount / WORKGROUP_SIZE));
          },
          destroy: () => computation.destroy()
        };
      }
    });
  }

  private addInversePermutationPass(
    graph: GPUCommandGraph,
    sortedIndices: GraphDataView<'uint32'>,
    inverseIndices: GraphDataView<'uint32'>
  ): void {
    const dispatch = getPagedDispatch(this.globalSortCapacity, this.device);
    const shader = /* wgsl */ `
const ROW_COUNT: u32 = ${this.globalSortCapacity}u;
const WORKGROUPS_X: u32 = ${dispatch.x}u;
@group(0) @binding(0) var<storage, read> sortedIndices: array<u32>;
@group(0) @binding(1) var<storage, read_write> inverseIndices: array<u32>;
@compute @workgroup_size(${WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let sortedRow = invocation.x + invocation.y * WORKGROUPS_X * ${WORKGROUP_SIZE}u;
  if (sortedRow < ROW_COUNT) {
    inverseIndices[sortedIndices[sortedRow]] = sortedRow;
  }
}`;
    graph.addComputePass({
      id: 'paged-gaussian-inverse-permutation',
      resources: [
        {buffer: sortedIndices, usage: 'storage-read'},
        {buffer: inverseIndices, usage: 'storage-write'}
      ],
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: 'paged-gaussian-inverse-permutation',
          source: shader,
          shaderLayout: INVERSE_LAYOUT
        });
        return {
          encode: ({computePass, getBuffer}) => {
            computation.setBindings({
              sortedIndices: getBuffer(sortedIndices),
              inverseIndices: getBuffer(inverseIndices)
            });
            computation.dispatch(computePass, dispatch.x, dispatch.y);
          },
          destroy: () => computation.destroy()
        };
      }
    });
  }

  private addScatterPass(
    graph: GPUCommandGraph,
    sourceSegment: SourceSegment,
    outputSegment: OutputSegment,
    inverseIndices: GraphDataView<'uint32'>
  ): void {
    const shader = /* wgsl */ `
struct ProjectedSplat {
  clipCenter: vec4<f32>,
  axis0: vec2<f32>,
  axis1: vec2<f32>,
  color: vec4<f32>,
};
struct GraphSplatUniforms {
  modelViewProjectionMatrix: mat4x4<f32>,
  viewportSize: vec2<f32>,
  radiusScale: f32,
  alphaScale: f32,
  alphaCutoff: f32,
  screenSizeCutoffPixels: f32,
  gaussianSupportRadius: f32,
  kernel2DSize: f32,
  maxScreenSpaceSplatSize: f32,
  exposure: f32,
  toneMapping: u32,
  batchOffset: u32,
  rowCount: u32,
  isFloatColor: u32,
  hasActiveRows: u32,
  sourceRowOffset: u32,
};
const DESTINATION_OFFSET: u32 = ${outputSegment.globalRowOffset}u;
const DESTINATION_LENGTH: u32 = ${outputSegment.rowCount}u;
@group(0) @binding(0) var<storage, read> sourceRecords: array<ProjectedSplat>;
@group(0) @binding(1) var<storage, read> inverseIndices: array<u32>;
@group(0) @binding(2) var<storage, read_write> outputRecords: array<ProjectedSplat>;
@group(0) @binding(3) var<uniform> graphUniforms: GraphSplatUniforms;
@compute @workgroup_size(${WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let sourceRow = invocation.x;
  if (sourceRow >= graphUniforms.rowCount) {
    return;
  }
  let sortedRow = inverseIndices[graphUniforms.batchOffset + sourceRow];
  if (sortedRow >= DESTINATION_OFFSET && sortedRow < DESTINATION_OFFSET + DESTINATION_LENGTH) {
    outputRecords[sortedRow - DESTINATION_OFFSET] = sourceRecords[sourceRow];
  }
}`;
    const passId = `paged-gaussian-gather-${sourceSegment.id}-into-${outputSegment.index}`;
    graph.addComputePass({
      id: passId,
      resources: [
        {buffer: sourceSegment.graphProjectedRecords, usage: 'storage-read'},
        {buffer: inverseIndices, usage: 'storage-read'},
        {buffer: outputSegment.graphProjectedRecords, usage: 'storage-write'},
        {buffer: sourceSegment.graphUniforms, usage: 'uniform'}
      ],
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: passId,
          source: shader,
          shaderLayout: SCATTER_LAYOUT
        });
        return {
          encode: ({computePass, getBuffer}) => {
            computation.setBindings({
              sourceRecords: getBuffer(sourceSegment.graphProjectedRecords),
              inverseIndices: getBuffer(inverseIndices),
              outputRecords: getBuffer(outputSegment.graphProjectedRecords),
              graphUniforms: getBuffer(sourceSegment.graphUniforms)
            });
            computation.dispatch(
              computePass,
              Math.ceil(sourceSegment.activeRowCount / WORKGROUP_SIZE)
            );
          },
          destroy: () => computation.destroy()
        };
      }
    });
  }

  private addSegmentDrawCountPass(
    graph: GPUCommandGraph,
    segment: OutputSegment,
    drawCommands: GraphBufferHandle
  ): void {
    const shader = /* wgsl */ `
const SEGMENT_OFFSET: u32 = ${segment.globalRowOffset}u;
const SEGMENT_LENGTH: u32 = ${segment.rowCount}u;
const COMMAND_OFFSET: u32 = ${(segment.index + 1) * 4}u;
@group(0) @binding(0) var<storage, read_write> drawCommands: array<u32>;
@compute @workgroup_size(1)
fn main() {
  let visibleCount = drawCommands[1u];
  drawCommands[COMMAND_OFFSET] = 4u;
  drawCommands[COMMAND_OFFSET + 1u] = select(
    0u,
    min(visibleCount - SEGMENT_OFFSET, SEGMENT_LENGTH),
    visibleCount > SEGMENT_OFFSET
  );
  drawCommands[COMMAND_OFFSET + 2u] = 0u;
  drawCommands[COMMAND_OFFSET + 3u] = 0u;
}`;
    const passId = `paged-gaussian-indirect-count-${segment.index}`;
    graph.addComputePass({
      id: passId,
      resources: [{buffer: drawCommands, usage: 'storage-read-write'}],
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: passId,
          source: shader,
          shaderLayout: SEGMENT_DRAW_LAYOUT
        });
        return {
          encode: ({computePass, getBuffer}) => {
            computation.setBindings({drawCommands: getBuffer(drawCommands)});
            computation.dispatch(computePass, 1);
          },
          destroy: () => computation.destroy()
        };
      }
    });
  }

  private addRenderPass(graph: GPUCommandGraph, drawCommands: GraphBufferHandle): void {
    const firstUniform = this.sourceSegments[0].graphUniforms;
    const firstUniformBuffer = this.sourceSegments[0].uniformBuffer;
    const firstOutput = this.outputSegments[0];
    this.model = new Model(this.device, {
      id: 'paged-gaussian-render-model',
      source: GPU_PAGED_SPLAT_RENDER_SHADER,
      shaderLayout: GPU_PAGED_SPLAT_RENDER_SHADER_LAYOUT,
      isInstanced: true,
      instanceCount: this.getMaximumProjectedSegmentRows(),
      vertexCount: 4,
      topology: 'triangle-strip',
      bindings: {
        graphUniforms: firstUniformBuffer,
        projectedRecords: firstOutput.projectedRecordBuffer
      },
      parameters: {
        depthWriteEnabled: false,
        depthCompare: 'less-equal',
        blend: true,
        blendColorOperation: 'add',
        blendAlphaOperation: 'add',
        blendColorSrcFactor: 'src-alpha',
        blendColorDstFactor: 'one-minus-src-alpha',
        blendAlphaSrcFactor: 'one',
        blendAlphaDstFactor: 'one-minus-src-alpha'
      }
    });
    graph.addRenderPass({
      id: 'paged-gaussian-segmented-render',
      resources: [
        ...this.outputSegments.map(segment => ({
          buffer: segment.graphProjectedRecords,
          usage: 'storage-read' as const
        })),
        {buffer: firstUniform, usage: 'uniform'},
        {buffer: drawCommands, usage: 'indirect'}
      ],
      compile: () => ({
        getRenderPassProps: () => ({
          id: 'paged-gaussian-render-pass',
          clearColor: this.clearColor,
          clearDepth: 1,
          clearStencil: false
        }),
        encode: ({renderPass, getBuffer}) => {
          if (!this.model) {
            return;
          }
          renderPass.setPipeline(this.model.pipeline);
          renderPass.setVertexArray(this.model.vertexArray);
          for (const segment of this.outputSegments) {
            renderPass.setBindings({
              graphUniforms: getBuffer(firstUniform),
              projectedRecords: getBuffer(segment.graphProjectedRecords)
            });
            this.drawCommands.draw(renderPass, segment.index + 1);
          }
        }
      })
    });
  }

  private importSourceBuffers(
    graph: GPUCommandGraph,
    segment: SourceSegment
  ): Record<(typeof SOURCE_COLUMNS)[number]['name'], GraphBufferHandle> {
    const handles = {} as Record<(typeof SOURCE_COLUMNS)[number]['name'], GraphBufferHandle>;
    for (const {name, rowByteLength} of SOURCE_COLUMNS) {
      const buffer = segment.page.data[name].data[0].buffer;
      handles[name] = graph.importBuffer(
        {
          id: `paged-gaussian-source-${segment.id}-${name}`,
          byteLength: Math.min(rowByteLength, buffer.byteLength),
          usage: Buffer.STORAGE
        },
        buffer
      );
    }
    return handles;
  }

  private importFeatureBuffers(
    graph: GPUCommandGraph,
    segment: SourceSegment
  ): {
    positions: GraphBufferHandle;
    sphericalHarmonics: GraphBufferHandle;
    semanticIds: GraphBufferHandle;
  } {
    const positions = graph.importBuffer(
      {
        id: `paged-gaussian-feature-${segment.id}-positions`,
        byteLength: 12,
        usage: Buffer.STORAGE
      },
      segment.page.data.positions.data[0].buffer
    );
    const sphericalHarmonicsBuffer =
      segment.page.data.sphericalHarmonics?.data[0].buffer ?? segment.activeRowBuffer;
    const semanticIdsBuffer =
      segment.page.data.semanticIds?.data[0].buffer ?? segment.activeRowBuffer;
    const sphericalHarmonics = graph.importBuffer(
      {
        id: `paged-gaussian-feature-${segment.id}-harmonics`,
        byteLength: 4,
        usage: Buffer.STORAGE
      },
      sphericalHarmonicsBuffer
    );
    const semanticIds = graph.importBuffer(
      {
        id: `paged-gaussian-feature-${segment.id}-semantics`,
        byteLength: 4,
        usage: Buffer.STORAGE
      },
      semanticIdsBuffer
    );
    return {positions, sphericalHarmonics, semanticIds};
  }

  private getSourceBinding(
    segment: SourceSegment,
    name: (typeof SOURCE_COLUMNS)[number]['name'] | 'sphericalHarmonics' | 'semanticIds',
    buffer: Buffer
  ): Binding {
    if (!segment.usesSourceRanges || !segment.page.data[name]) {
      return buffer;
    }
    const rowByteLength = getPagedSourceRowByteLength(segment.page.data, name);
    const byteOffset = segment.sourceBindingRowOffset * rowByteLength;
    const byteLength = Math.min(
      segment.sourceRowCount * rowByteLength,
      buffer.byteLength - byteOffset
    );
    return {buffer, offset: byteOffset, size: byteLength};
  }

  private writeSourceUniforms(): void {
    if (this.semanticSelectionValues.length > 0) {
      this.semanticSelectionBuffer?.write(this.semanticSelectionValues);
    }
    for (const segment of this.sourceSegments) {
      if (segment.activeRows) {
        segment.activeRowBuffer.write(segment.activeRows);
      }
      const uniformData = new ArrayBuffer(GPU_SPLAT_GRAPH_UNIFORM_BYTE_LENGTH);
      const floatValues = new Float32Array(uniformData);
      const integerValues = new Uint32Array(uniformData);
      floatValues.set(this.props.modelViewProjectionMatrix, 0);
      floatValues.set(this.props.viewportSize, 16);
      floatValues[18] = this.props.radiusScale;
      floatValues[19] = this.props.alphaScale;
      floatValues[20] = this.props.alphaCutoff;
      floatValues[21] = this.props.screenSizeCutoffPixels;
      floatValues[22] = this.props.gaussianSupportRadius;
      floatValues[23] = this.props.kernel2DSize;
      floatValues[24] = this.props.maxScreenSpaceSplatSize;
      floatValues[25] = this.props.exposure;
      integerValues[26] = this.props.toneMapping === 'reinhard' ? 1 : 0;
      integerValues[27] = segment.globalRowOffset;
      integerValues[28] = segment.activeRowCount;
      integerValues[29] = segment.page.data.colors.format === 'float32x4' ? 1 : 0;
      integerValues[30] = segment.activeRows ? 1 : 0;
      integerValues[31] = segment.sourceRowOffset - segment.sourceBindingRowOffset;
      segment.uniformBuffer.write(new Uint8Array(uniformData));

      const featureData = new ArrayBuffer(GPU_SPLAT_GRAPH_FEATURE_UNIFORM_BYTE_LENGTH);
      const featureFloatValues = new Float32Array(featureData);
      const featureIntegerValues = new Uint32Array(featureData);
      const batch = segment.page.data;
      const degree =
        batch.sphericalHarmonics && this.props.sphericalHarmonicsDegree > 0
          ? Math.min(batch.sphericalHarmonicsDegree, this.props.sphericalHarmonicsDegree)
          : 0;
      featureFloatValues.set(this.props.cameraPosition, 0);
      featureIntegerValues[3] = degree;
      featureIntegerValues[4] = getSplatSphericalHarmonicCoefficientCount(
        batch.sphericalHarmonicsDegree
      );
      featureIntegerValues[5] = batch.semanticIds ? 1 : 0;
      featureIntegerValues[6] = this.semanticIncludeCount;
      featureIntegerValues[7] = this.semanticExcludeCount;
      featureIntegerValues[8] = this.props.semanticFilter?.include ? 1 : 0;
      featureIntegerValues[9] =
        (this.props.semanticFilter?.includeUnlabeled ?? !this.props.semanticFilter?.include)
          ? 1
          : 0;
      featureIntegerValues[10] = this.props.semanticFilter ? 1 : 0;
      segment.featureUniformBuffer.write(new Uint8Array(featureData));
    }
  }

  private planSourceSegments(pages: readonly GPUPagedSplatPage[]): PlannedSourceSegment[] {
    const plannedSegments: PlannedSourceSegment[] = [];
    let globalRowOffset = 0;
    for (const page of pages) {
      if (page.activeRows?.length === 0 || page.data.length === 0) {
        continue;
      }
      const maximumStorageByteLength = this.device.limits.maxStorageBufferBindingSize;
      const maximumSourceRowByteLength = Math.max(
        ...SOURCE_COLUMNS.map(({name}) => getPagedSourceRowByteLength(page.data, name)),
        page.data.sphericalHarmonics
          ? getPagedSourceRowByteLength(page.data, 'sphericalHarmonics')
          : 0,
        page.data.semanticIds ? Uint32Array.BYTES_PER_ELEMENT : 0
      );
      const usesSourceRanges =
        maximumStorageByteLength > 0 &&
        [
          ...SOURCE_COLUMNS.map(({name}) => page.data[name].data[0].buffer),
          page.data.sphericalHarmonics?.data[0].buffer,
          page.data.semanticIds?.data[0].buffer
        ].some(buffer => buffer !== undefined && buffer.byteLength > maximumStorageByteLength);
      const alignmentRows = getPagedSourceAlignmentRows(this.device, page.data);
      const rawSourceRowCapacity =
        maximumStorageByteLength > 0
          ? Math.floor(maximumStorageByteLength / maximumSourceRowByteLength)
          : Number.MAX_SAFE_INTEGER;
      const sourceWindowCapacity = usesSourceRanges
        ? Math.floor(rawSourceRowCapacity / alignmentRows) * alignmentRows
        : page.data.length;
      if (sourceWindowCapacity <= 0) {
        throw new Error('Paged Gaussian source columns exceed device storage range alignment');
      }
      let pageSegmentIndex = 0;
      if (page.activeRows) {
        let activeRows: number[] = [];
        let sourceWindowStart = -1;
        const appendSparseSegment = (): void => {
          if (activeRows.length === 0) {
            return;
          }
          const offset = usesSourceRanges ? sourceWindowStart : 0;
          const selectedRows = Uint32Array.from(activeRows, rowIndex => rowIndex - offset);
          const sourceRowCount = usesSourceRanges
            ? Math.min(sourceWindowCapacity, page.data.length - sourceWindowStart)
            : page.data.length;
          plannedSegments.push({
            id: `${page.id}-${pageSegmentIndex++}`,
            page,
            activeRows: selectedRows,
            activeRowCount: selectedRows.length,
            sourceRowOffset: offset,
            sourceBindingRowOffset: offset,
            sourceRowCount,
            usesSourceRanges,
            globalRowOffset
          });
          globalRowOffset += selectedRows.length;
          activeRows = [];
        };
        for (const rowIndex of page.activeRows) {
          if (rowIndex >= page.data.length) {
            throw new RangeError('Paged Gaussian active rows must be source-page-local indices');
          }
          const nextWindowStart = usesSourceRanges
            ? Math.floor(rowIndex / sourceWindowCapacity) * sourceWindowCapacity
            : 0;
          if (
            activeRows.length > 0 &&
            (nextWindowStart !== sourceWindowStart ||
              activeRows.length >= this.getMaximumProjectedSegmentRows())
          ) {
            appendSparseSegment();
          }
          sourceWindowStart = nextWindowStart;
          activeRows.push(rowIndex);
        }
        appendSparseSegment();
        continue;
      }

      for (let sourceRowOffset = 0; sourceRowOffset < page.data.length; ) {
        const sourceWindowStart = usesSourceRanges
          ? Math.floor(sourceRowOffset / sourceWindowCapacity) * sourceWindowCapacity
          : sourceRowOffset;
        const sourceWindowEnd = usesSourceRanges
          ? Math.min(sourceWindowStart + sourceWindowCapacity, page.data.length)
          : page.data.length;
        const activeRowCount = Math.min(
          sourceWindowEnd - sourceRowOffset,
          this.getMaximumProjectedSegmentRows()
        );
        plannedSegments.push({
          id: `${page.id}-${pageSegmentIndex++}`,
          page,
          activeRowCount,
          sourceRowOffset,
          sourceBindingRowOffset: usesSourceRanges ? sourceWindowStart : 0,
          sourceRowCount: usesSourceRanges ? sourceWindowEnd - sourceWindowStart : activeRowCount,
          usesSourceRanges,
          globalRowOffset
        });
        sourceRowOffset += activeRowCount;
        globalRowOffset += activeRowCount;
      }
    }
    return plannedSegments;
  }

  private updateSemanticSelections(filter: SplatSemanticFilter | undefined): void {
    if (filter?.predicate) {
      throw new Error('Paged GPU Gaussian semantic filters cannot evaluate JavaScript predicates');
    }
    const includedIds = getPagedSemanticValues(filter?.include);
    const excludedIds = getPagedSemanticValues(filter?.exclude);
    this.semanticIncludeCount = includedIds.length;
    this.semanticExcludeCount = excludedIds.length;
    this.semanticSelectionValues = Uint32Array.from([...includedIds, ...excludedIds]);
    if (
      this.compiledGraph &&
      this.semanticSelectionValues.length > this.semanticSelectionCapacity
    ) {
      this.requiresGraphRebuild = true;
    }
  }

  private getMaximumProjectedSegmentRows(): number {
    const maximumStorageByteLength = this.device.limits.maxStorageBufferBindingSize;
    const deviceRows =
      maximumStorageByteLength > 0
        ? Math.floor(maximumStorageByteLength / GPU_SPLAT_PROJECTED_RECORD_BYTE_LENGTH)
        : Number.MAX_SAFE_INTEGER;
    if (deviceRows < 1) {
      throw new Error('Paged Gaussian projected records exceed the device storage binding limit');
    }
    return Math.min(deviceRows, this.requestedSegmentCapacity ?? Number.MAX_SAFE_INTEGER);
  }

  private createDrawCommands(capacity: number): DrawCommandBuffer {
    return new DrawCommandBuffer(this.device, {
      id: 'paged-gaussian-indirect-draws',
      type: 'draw',
      capacity,
      commands: Array.from({length: capacity}, () => ({vertexCount: 4, instanceCount: 0}))
    });
  }

  private createOwnedBuffer(id: string, byteLength: number): Buffer {
    const buffer = this.device.createBuffer({
      id,
      byteLength,
      usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
    });
    this.ownedBuffers.push(buffer);
    return buffer;
  }

  private createUniformBuffer(id: string, byteLength: number): Buffer {
    const buffer = this.device.createBuffer({
      id,
      byteLength,
      usage: Buffer.UNIFORM | Buffer.COPY_DST
    });
    this.ownedBuffers.push(buffer);
    return buffer;
  }

  private importOwnedBuffer(graph: GPUCommandGraph, buffer: Buffer): GraphBufferHandle {
    return graph.importBuffer(
      {id: buffer.id, byteLength: buffer.byteLength, usage: buffer.usage},
      buffer
    );
  }

  private importUint32Buffer(
    graph: GPUCommandGraph,
    buffer: Buffer,
    length: number
  ): GraphDataView<'uint32'> {
    return graph.createDataView(this.importOwnedBuffer(graph, buffer), {format: 'uint32', length});
  }

  private releaseCompiledGraph(): void {
    this.compiledGraph?.destroy();
    this.compiledGraph = undefined;
    this.lastEncoding = undefined;
    this.model?.destroy();
    this.model = undefined;
    for (const buffer of this.ownedBuffers) {
      buffer.destroy();
    }
    this.ownedBuffers.length = 0;
    this.sourceSegments.length = 0;
    this.outputSegments.length = 0;
    this.sortedValuesBuffer = undefined;
    this.semanticSelectionBuffer = undefined;
    this.semanticSelectionCapacity = 0;
    this.globalSortCapacity = 0;
    this.requiresGraphRebuild = true;
  }
}

function getPagedDispatch(rowCount: number, device: Device): {x: number; y: number} {
  const workgroups = Math.ceil(rowCount / WORKGROUP_SIZE);
  const maximumDimension = device.limits.maxComputeWorkgroupsPerDimension || 65535;
  const x = Math.min(workgroups, maximumDimension);
  return {x, y: Math.ceil(workgroups / x)};
}

function getPagedSourceRowByteLength(
  batch: GPUSplatData,
  name: (typeof SOURCE_COLUMNS)[number]['name'] | 'sphericalHarmonics' | 'semanticIds'
): number {
  if (name === 'sphericalHarmonics') {
    return getSplatSphericalHarmonicCoefficientCount(batch.sphericalHarmonicsDegree) * 4;
  }
  if (name === 'colors') {
    return batch.colors.format === 'float32x4' ? 16 : 4;
  }
  if (name === 'semanticIds') {
    return 4;
  }
  return SOURCE_COLUMNS.find(column => column.name === name)?.rowByteLength ?? 4;
}

function getPagedSourceAlignmentRows(device: Device, batch: GPUSplatData): number {
  const alignment = Math.max(device.limits.minStorageBufferOffsetAlignment || 1, 1);
  let rows = 1;
  for (const name of [
    ...SOURCE_COLUMNS.map(column => column.name),
    ...(batch.sphericalHarmonics ? (['sphericalHarmonics'] as const) : []),
    ...(batch.semanticIds ? (['semanticIds'] as const) : [])
  ]) {
    const stride = getPagedSourceRowByteLength(batch, name);
    const requiredRows = alignment / getPagedGreatestCommonDivisor(alignment, stride);
    rows = (rows * requiredRows) / getPagedGreatestCommonDivisor(rows, requiredRows);
  }
  return rows;
}

function getPagedGreatestCommonDivisor(first: number, second: number): number {
  while (second !== 0) {
    [first, second] = [second, first % second];
  }
  return first;
}

function getPagedSemanticValues(selection: SplatSemanticSelection | undefined): number[] {
  if (!selection) {
    return [];
  }
  const values = Array.from(selection);
  for (const value of values) {
    if (!Number.isSafeInteger(value) || value < 0 || value > 0xffff_ffff) {
      throw new RangeError('Paged Gaussian semantic IDs must fit unsigned 32-bit integers');
    }
  }
  return values;
}

function hasPagedHighDynamicRangePresentation(device: Device): boolean {
  return (
    device.preferredColorFormat === 'rgba16float' &&
    device.canvasContext?.props.toneMapping === 'extended'
  );
}

function arePagedSplatValuesEqual(left: ArrayLike<number>, right: ArrayLike<number>): boolean {
  if (left.length !== right.length) {
    return false;
  }
  for (let index = 0; index < left.length; index++) {
    if (!Object.is(left[index], right[index])) {
      return false;
    }
  }
  return true;
}

function toPagedSplatMatrix(
  matrix: ArrayLike<number> | undefined
): ResolvedPagedSplatProps['modelViewProjectionMatrix'] {
  if (!matrix) {
    return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  }
  if (matrix.length !== 16) {
    throw new Error('GPUPagedSplatRenderer requires a 16-element camera matrix');
  }
  return [
    matrix[0],
    matrix[1],
    matrix[2],
    matrix[3],
    matrix[4],
    matrix[5],
    matrix[6],
    matrix[7],
    matrix[8],
    matrix[9],
    matrix[10],
    matrix[11],
    matrix[12],
    matrix[13],
    matrix[14],
    matrix[15]
  ];
}
