// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  Buffer,
  type BufferLayout,
  type CompareFunction,
  type CommandEncoder,
  type Device,
  type RenderPass
} from '@luma.gl/core';
import {ShaderInputs} from '@luma.gl/engine';
import {
  GPUData,
  GPURecordBatch,
  GPUTable,
  GPUTableModel,
  type GPUInputSchema
} from '@luma.gl/tables';
import {GPUSplatData} from './splat-data';
import {projectSplatCovarianceToScreen} from './splat-covariance';
import {acceptsSplatSemantic, type SplatSemanticFilter} from './splat-filter';
import {
  evaluateSplatSphericalHarmonics,
  type SplatSphericalHarmonicsDegree
} from './splat-spherical-harmonics';
import {
  sortSplatReferences,
  SPLAT_TILE_SIZE_PIXELS,
  type SplatSortMode,
  type SplatSortReference
} from './splat-sort';
import {
  SPLAT_ATTRIBUTE_SHADER_LAYOUT,
  SPLAT_ATTRIBUTE_WGSL_SHADER,
  SPLAT_FS_GLSL,
  SPLAT_STORAGE_SHADER_LAYOUT,
  SPLAT_STORAGE_WGSL_SHADER,
  SPLAT_VS_GLSL,
  splatUniforms,
  type SplatUniforms
} from './splat-shaders';

/** Camera, visibility, sorting, and styling controls for Gaussian splat rendering. */
export type SplatRendererProps = {
  /** Caller-owned prepared source batch or ordered source batch list. */
  data?: GPUSplatData | readonly GPUSplatData[];
  /** Column-major world-to-clip-space camera transform. */
  modelViewProjectionMatrix?: ArrayLike<number>;
  /** Drawing-buffer width and height in physical pixels. */
  viewportSize?: readonly [number, number];
  /** World-space camera location used for view-dependent spherical-harmonic radiance. */
  cameraPosition?: readonly [number, number, number];
  /** Highest spherical-harmonic degree evaluated for prepared source coefficients. */
  sphericalHarmonicsDegree?: SplatSphericalHarmonicsDegree;
  /** Optional semantic classes or application-owned predicate used to exclude source rows. */
  semanticFilter?: SplatSemanticFilter;
  /** Camera-dependent depth ordering strategy. Defaults to `global`. */
  sortMode?: SplatSortMode;
  /** Minimum fragment opacity retained after Gaussian attenuation. */
  alphaCutoff?: number;
  /** Alias for {@link alphaCutoff} when integrating opacity-threshold controls. */
  opacityThreshold?: number;
  /** Minimum projected one-sigma radius retained in pixels. */
  screenSizeCutoffPixels?: number;
  /** Number of Gaussian standard deviations covered by the rendered quad. */
  gaussianSupportRadius?: number;
  /** Isotropic screen-space kernel added to each Gaussian covariance. */
  kernel2DSize?: number;
  /** Maximum projected one-sigma axis length in pixels. */
  maxScreenSpaceSplatSize?: number;
  /** Additional multiplier applied to each Gaussian support radius. */
  radiusScale?: number;
  /** Alias for {@link radiusScale} when integrating point-size controls. */
  pointSize?: number;
  /** Additional multiplier applied to decoded opacity and source color alpha. */
  alphaScale?: number;
  /** Linear radiance multiplier applied before display tone mapping. Defaults to `1`. */
  exposure?: number;
  /** SDR highlight compression, automatically enabled for Float32 colors on SDR targets. */
  toneMapping?: 'none' | 'reinhard';
  /** Depth comparison against opaque meshes already recorded into the same render pass. */
  depthCompare?: CompareFunction;
  /** Whether transparent splats update the shared mesh depth buffer. Defaults to `false`. */
  depthWriteEnabled?: boolean;
};

/** Application-owned opaque or transparent mesh compatible with an existing render pass. */
export type SplatMeshRenderable = {
  draw(renderPass: RenderPass): boolean | void;
};

/** Ordered scene integration points surrounding depth-tested Gaussian splat rendering. */
export type SplatMixedRenderOptions = {
  /** Opaque meshes drawn first so their shared depth buffer occludes farther splats. */
  opaqueMeshes?: readonly SplatMeshRenderable[];
  /** Additional transparent meshes composited after the globally sorted splat runs. */
  transparentMeshes?: readonly SplatMeshRenderable[];
};

/** Renderer diagnostics aggregated across all caller-owned source batches. */
export type SplatRendererStats = {
  /** Total retained source splat rows, including currently culled rows. */
  splatCount: number;
  /** Alias for the total retained logical row count. */
  rowCount: number;
  /** Number of source rows passing current camera and opacity visibility tests. */
  visibleSplatCount: number;
  /** Number of caller-owned source batches retained without packing. */
  batchCount: number;
  /** Active ordering strategy. */
  sortMode: SplatSortMode;
  /** Aggregate caller-owned source GPU allocations. */
  sourceGpuByteLength: number;
  /** GPU allocations explicitly owned by this borrowing renderer. */
  rendererGpuByteLength: number;
  /** Sum of source and renderer GPU allocation estimates. */
  gpuByteLength: number;
  /** Number of retained globally sorted WebGPU draw runs. */
  drawCallCount: number;
};

type ResolvedSplatRendererProps = {
  modelViewProjectionMatrix: SplatUniforms['modelViewProjectionMatrix'];
  viewportSize: [number, number];
  cameraPosition: [number, number, number];
  sphericalHarmonicsDegree: SplatSphericalHarmonicsDegree;
  semanticFilter?: SplatSemanticFilter;
  sortMode: SplatSortMode;
  alphaCutoff: number;
  screenSizeCutoffPixels: number;
  gaussianSupportRadius: number;
  kernel2DSize: number;
  maxScreenSpaceSplatSize: number;
  radiusScale: number;
  alphaScale: number;
  exposure: number;
  toneMapping: 'none' | 'reinhard';
  depthCompare: CompareFunction;
  depthWriteEnabled: boolean;
};

/** Borrowed batch-local draw run and optional WebGPU sorted-index allocation. */
export type SplatDrawRun = {
  batchIndex: number;
  rowIndices: Uint32Array;
  indexBuffer?: Buffer;
};

const IDENTITY_MATRIX: SplatUniforms['modelViewProjectionMatrix'] = [
  1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1
];

/** Bound globally interleaved draw calls to keep dense streamed scenes interactive. */
const MAX_EXACT_SPLAT_DRAW_RUNS = 64;

/** Logical storage bindings consumed by the WebGPU Gaussian render model. */
export const SPLAT_STORAGE_GPU_INPUT_SCHEMA = [
  {
    columnName: 'positions',
    storageBindingName: 'splatPositions',
    kind: 'positions',
    required: true,
    formats: ['float32x3']
  },
  {
    columnName: 'scales',
    storageBindingName: 'splatScales',
    kind: 'positions',
    required: true,
    formats: ['float32x3']
  },
  {
    columnName: 'rotations',
    storageBindingName: 'splatRotations',
    kind: 'positions',
    required: true,
    formats: ['float32x4']
  },
  {
    columnName: 'colors',
    storageBindingName: 'splatColors',
    kind: 'colors',
    required: true,
    formats: ['unorm8x4', 'float32x4']
  },
  {
    columnName: 'opacities',
    storageBindingName: 'splatOpacities',
    kind: 'scalars',
    required: true,
    formats: ['float32']
  },
  {
    columnName: 'rowIndices',
    storageBindingName: 'splatRowIndices',
    kind: 'scalars',
    required: true,
    formats: ['uint32'],
    internal: true
  }
] as const satisfies GPUInputSchema;

/** Framework-independent Gaussian renderer that borrows all prepared source data. */
export class SplatRenderer {
  /** Device used for render pipelines and renderer-owned ordering buffers. */
  readonly device: Device;
  /** Preserved caller-owned prepared batches, never repacked or destroyed by this renderer. */
  readonly batches: GPUSplatData[] = [];
  /** One GPU table containing borrowed views of every retained source batch. */
  table?: GPUTable;
  /** Shared WebGPU storage or WebGL2 attribute-backed render model. */
  model?: GPUTableModel;
  /** Current camera, visibility, sorting, and styling values after applying defaults. */
  props: ResolvedSplatRendererProps;
  /** Globally ordered visible source-row references across all preserved batches. */
  sortedReferences: SplatSortReference[] = [];

  private readonly shaderInputs = new ShaderInputs<{splat: SplatUniforms}>({splat: splatUniforms});
  private readonly cachedReferences: Array<Array<SplatSortReference | undefined>> = [];
  private readonly cachedBatchRevisions: number[] = [];
  private readonly evaluatedColorBuffers: Array<Buffer | undefined> = [];
  private readonly opacityMaskBuffers: Array<Buffer | undefined> = [];
  private drawRuns: SplatDrawRun[] = [];
  private placeholderIndexBuffer?: Buffer;
  private placeholderSphericalHarmonicsBuffer?: Buffer;
  private requiresUpdate = true;
  private requiresUniformUpdate = false;
  private requiresWebGLSourceUpdate = false;
  private hasExplicitToneMapping = false;
  private isDestroyed = false;

  /** Creates a renderer over optionally supplied caller-owned Gaussian source batches. */
  constructor(device: Device, props: SplatRendererProps = {}) {
    this.device = device;
    this.props = {
      modelViewProjectionMatrix: toSplatMatrix(props.modelViewProjectionMatrix),
      viewportSize: [...(props.viewportSize ?? [1, 1])],
      cameraPosition: [...(props.cameraPosition ?? [0, 0, 0])],
      sphericalHarmonicsDegree: props.sphericalHarmonicsDegree ?? 3,
      semanticFilter: props.semanticFilter,
      sortMode: props.sortMode ?? 'global',
      alphaCutoff: props.alphaCutoff ?? props.opacityThreshold ?? 1 / 255,
      screenSizeCutoffPixels: props.screenSizeCutoffPixels ?? 0,
      gaussianSupportRadius: props.gaussianSupportRadius ?? 3,
      kernel2DSize: props.kernel2DSize ?? 0.3,
      maxScreenSpaceSplatSize: props.maxScreenSpaceSplatSize ?? 1024,
      radiusScale: props.radiusScale ?? props.pointSize ?? 1,
      alphaScale: props.alphaScale ?? 1,
      exposure: props.exposure ?? 1,
      toneMapping: props.toneMapping ?? 'none',
      depthCompare: props.depthCompare ?? 'less-equal',
      depthWriteEnabled: props.depthWriteEnabled ?? false
    };
    this.hasExplicitToneMapping = props.toneMapping !== undefined;
    this.updateShaderInputs();
    for (const batch of normalizeSplatBatches(props.data)) {
      this.appendData(batch);
    }
    this.update();
  }

  /** Current source rows, visibility, batch identity, and GPU allocation diagnostics. */
  get stats(): SplatRendererStats {
    return this.getStats();
  }

  /** Whether this borrowing renderer has already released its own render resources. */
  get destroyed(): boolean {
    return this.isDestroyed;
  }

  /** Appends one caller-owned source batch without changing existing source GPU allocations. */
  appendData(data: GPUSplatData): void {
    if (this.isDestroyed || data.destroyed || data.device !== this.device) {
      throw new Error('SplatRenderer requires live data prepared on its own device');
    }

    const borrowedBatch = createBorrowedSplatBatch(data, this.device.type === 'webgpu');
    this.batches.push(data);
    this.cachedReferences.push([]);
    this.cachedBatchRevisions.push(data.revision);
    this.evaluatedColorBuffers.push(undefined);
    this.opacityMaskBuffers.push(undefined);
    if (
      !this.hasExplicitToneMapping &&
      data.colors.format === 'float32x4' &&
      !isHighDynamicRangeSplatOutput(this.device)
    ) {
      this.setResolvedProp('toneMapping', 'reinhard');
    }
    if (this.table) {
      this.table.addBatch(borrowedBatch);
      this.model?.setProps({table: this.table});
    } else {
      this.table = new GPUTable({batches: [borrowedBatch]});
      this.model = this.createModel(this.table);
    }
    this.requiresUpdate = true;
    this.requiresWebGLSourceUpdate = this.device.type !== 'webgpu';
  }

  /** Updates camera, sorting, visibility, and styling controls in place. */
  setProps(props: Partial<SplatRendererProps>): void {
    if (props.data !== undefined) {
      const replacementBatches = normalizeSplatBatches(props.data);
      const matchesRetainedBatches =
        replacementBatches.length === this.batches.length &&
        replacementBatches.every((batch, batchIndex) => batch === this.batches[batchIndex]);
      if (!matchesRetainedBatches) {
        this.replaceData(replacementBatches);
      }
    }
    if (props.modelViewProjectionMatrix !== undefined) {
      if (
        !areSplatArrayValuesEqual(
          this.props.modelViewProjectionMatrix,
          props.modelViewProjectionMatrix
        )
      ) {
        this.setResolvedProp(
          'modelViewProjectionMatrix',
          toSplatMatrix(props.modelViewProjectionMatrix)
        );
      }
    }
    if (
      props.viewportSize !== undefined &&
      !areSplatArrayValuesEqual(this.props.viewportSize, props.viewportSize)
    ) {
      this.setResolvedProp('viewportSize', [...props.viewportSize]);
    }
    if (
      props.cameraPosition !== undefined &&
      !areSplatArrayValuesEqual(this.props.cameraPosition, props.cameraPosition)
    ) {
      this.setResolvedProp('cameraPosition', [...props.cameraPosition]);
    }
    if (props.sphericalHarmonicsDegree !== undefined) {
      this.setResolvedProp('sphericalHarmonicsDegree', props.sphericalHarmonicsDegree);
    }
    if ('semanticFilter' in props && !Object.is(this.props.semanticFilter, props.semanticFilter)) {
      this.props.semanticFilter = props.semanticFilter;
      this.requiresUpdate = true;
      this.requiresWebGLSourceUpdate = this.device.type !== 'webgpu';
    }
    if (props.sortMode !== undefined) {
      this.setResolvedProp('sortMode', props.sortMode);
    }
    if (props.alphaCutoff !== undefined || props.opacityThreshold !== undefined) {
      this.setResolvedProp(
        'alphaCutoff',
        props.alphaCutoff ?? props.opacityThreshold ?? this.props.alphaCutoff
      );
    }
    if (props.radiusScale !== undefined || props.pointSize !== undefined) {
      this.setResolvedProp(
        'radiusScale',
        props.radiusScale ?? props.pointSize ?? this.props.radiusScale
      );
    }
    if (props.screenSizeCutoffPixels !== undefined) {
      this.setResolvedProp('screenSizeCutoffPixels', props.screenSizeCutoffPixels);
    }
    if (props.gaussianSupportRadius !== undefined) {
      this.setResolvedProp('gaussianSupportRadius', props.gaussianSupportRadius);
    }
    if (props.kernel2DSize !== undefined) {
      this.setResolvedProp('kernel2DSize', props.kernel2DSize);
    }
    if (props.maxScreenSpaceSplatSize !== undefined) {
      this.setResolvedProp('maxScreenSpaceSplatSize', props.maxScreenSpaceSplatSize);
    }
    if (props.alphaScale !== undefined) {
      this.setResolvedProp('alphaScale', props.alphaScale);
    }
    if (props.exposure !== undefined) {
      this.setResolvedProp('exposure', props.exposure);
    }
    if (props.toneMapping !== undefined) {
      this.hasExplicitToneMapping = true;
      this.setResolvedProp('toneMapping', props.toneMapping);
    }
    if (
      (props.depthCompare !== undefined && props.depthCompare !== this.props.depthCompare) ||
      (props.depthWriteEnabled !== undefined &&
        props.depthWriteEnabled !== this.props.depthWriteEnabled)
    ) {
      this.props.depthCompare = props.depthCompare ?? this.props.depthCompare;
      this.props.depthWriteEnabled = props.depthWriteEnabled ?? this.props.depthWriteEnabled;
      this.model?.setParameters({
        ...this.model.parameters,
        depthCompare: this.props.depthCompare,
        depthWriteEnabled: this.props.depthWriteEnabled
      });
    }
  }

  /** Recomputes camera-dependent ordering and flushes managed uniforms before a render pass. */
  predraw(commandEncoder: CommandEncoder): void {
    this.update();
    this.model?.predraw(commandEncoder);
  }

  /** Draws all currently visible retained source batches into an existing render pass. */
  draw(renderPass: RenderPass): boolean {
    this.update();
    if (!this.model || !this.table || this.sortedReferences.length === 0) {
      return false;
    }
    return this.device.type === 'webgpu'
      ? this.drawWebGPUStorageRuns(renderPass)
      : this.drawWebGLAttributeBatches(renderPass);
  }

  /** Alias for drawing preserved source batches through their currently selected backend. */
  drawBatches(renderPass: RenderPass): boolean {
    return this.draw(renderPass);
  }

  /** Draws opaque meshes, depth-tested splats, and transparent overlays into one shared pass. */
  drawMixed(renderPass: RenderPass, options: SplatMixedRenderOptions = {}): boolean {
    this.update();
    let drawSuccess = true;
    let recordedDraw = false;
    for (const mesh of options.opaqueMeshes ?? []) {
      drawSuccess = mesh.draw(renderPass) !== false && drawSuccess;
      recordedDraw = true;
    }
    if (this.sortedReferences.length > 0) {
      drawSuccess = this.draw(renderPass) && drawSuccess;
      recordedDraw = true;
    }
    for (const mesh of options.transparentMeshes ?? []) {
      drawSuccess = mesh.draw(renderPass) !== false && drawSuccess;
      recordedDraw = true;
    }
    return recordedDraw && drawSuccess;
  }

  /** Returns renderer-owned sorted runs borrowed by application-owned auxiliary render passes. */
  getDrawRuns(): readonly SplatDrawRun[] {
    this.update();
    return this.drawRuns;
  }

  /** Returns the source opacity buffer or the renderer-owned WebGL semantic visibility mask. */
  getBatchOpacityBuffer(batchIndex: number): Buffer {
    this.update();
    const batch = this.batches[batchIndex];
    if (!batch) {
      throw new Error('Unknown Gaussian splat source batch');
    }
    const buffer =
      this.props.semanticFilter && this.device.type !== 'webgpu'
        ? (this.opacityMaskBuffers[batchIndex] ?? batch.opacities.data[0].buffer)
        : batch.opacities.data[0].buffer;
    if (!(buffer instanceof Buffer)) {
      throw new Error('Gaussian splat opacity requires a prepared GPU buffer');
    }
    return buffer;
  }

  /** Returns borrowed higher-order coefficients or the renderer-owned zero storage fallback. */
  getBatchSphericalHarmonicsBuffer(batchIndex: number): Buffer {
    this.update();
    const batch = this.batches[batchIndex];
    if (!batch) {
      throw new Error('Unknown Gaussian splat source batch');
    }
    const buffer =
      batch.sphericalHarmonics?.data[0]?.buffer ?? this.placeholderSphericalHarmonicsBuffer;
    if (!(buffer instanceof Buffer)) {
      throw new Error('Spherical-harmonic storage requires a WebGPU source batch');
    }
    return buffer;
  }

  /** Returns current renderer diagnostics after refreshing camera-dependent source ordering. */
  getStats(): SplatRendererStats {
    this.update();
    const splatCount = this.batches.reduce((totalRows, batch) => totalRows + batch.length, 0);
    const sourceGpuByteLength = this.batches.reduce(
      (totalBytes, batch) => totalBytes + batch.byteLength,
      0
    );
    const rendererGpuByteLength =
      (this.placeholderIndexBuffer?.byteLength ?? 0) +
      (this.placeholderSphericalHarmonicsBuffer?.byteLength ?? 0) +
      (this.model?.tableBindingByteLength ?? 0) +
      this.evaluatedColorBuffers.reduce((total, buffer) => total + (buffer?.byteLength ?? 0), 0) +
      this.opacityMaskBuffers.reduce((total, buffer) => total + (buffer?.byteLength ?? 0), 0) +
      this.drawRuns.reduce((totalBytes, run) => totalBytes + (run.indexBuffer?.byteLength ?? 0), 0);
    return {
      splatCount,
      rowCount: splatCount,
      visibleSplatCount: this.sortedReferences.length,
      batchCount: this.batches.length,
      sortMode: this.props.sortMode,
      sourceGpuByteLength,
      rendererGpuByteLength,
      gpuByteLength: sourceGpuByteLength + rendererGpuByteLength,
      drawCallCount: this.drawRuns.length
    };
  }

  /** Returns stable globally sorted source-row indices without changing source GPU buffers. */
  getSortedIndices(): Uint32Array {
    this.update();
    return Uint32Array.from(this.sortedReferences, reference => reference.rowIndex);
  }

  /** Releases renderer-owned models and ordering buffers while preserving caller-owned data. */
  destroy(): void {
    if (this.isDestroyed) {
      return;
    }
    this.destroyDrawRuns();
    this.model?.destroy();
    this.model = undefined;
    this.table?.destroy();
    this.table = undefined;
    this.cachedReferences.length = 0;
    this.cachedBatchRevisions.length = 0;
    this.destroyWebGLSourceBuffers();
    this.placeholderIndexBuffer?.destroy();
    this.placeholderIndexBuffer = undefined;
    this.placeholderSphericalHarmonicsBuffer?.destroy();
    this.placeholderSphericalHarmonicsBuffer = undefined;
    this.shaderInputs.destroy();
    this.isDestroyed = true;
  }

  private createModel(table: GPUTable): GPUTableModel {
    const isWebGPU = this.device.type === 'webgpu';
    if (isWebGPU && !this.placeholderIndexBuffer) {
      this.placeholderIndexBuffer = this.device.createBuffer({
        id: 'splat-empty-sorted-indices',
        data: new Uint32Array(1),
        usage: Buffer.STORAGE | Buffer.COPY_DST
      });
    }
    if (isWebGPU && !this.placeholderSphericalHarmonicsBuffer) {
      this.placeholderSphericalHarmonicsBuffer = this.device.createBuffer({
        id: 'splat-empty-spherical-harmonics',
        data: new Float32Array(1),
        usage: Buffer.STORAGE | Buffer.COPY_DST
      });
    }
    return new GPUTableModel(this.device, {
      id: 'gaussian-splat-renderer',
      source: isWebGPU ? SPLAT_STORAGE_WGSL_SHADER : SPLAT_ATTRIBUTE_WGSL_SHADER,
      vs: SPLAT_VS_GLSL,
      fs: SPLAT_FS_GLSL,
      shaderLayout: isWebGPU ? SPLAT_STORAGE_SHADER_LAYOUT : SPLAT_ATTRIBUTE_SHADER_LAYOUT,
      modules: [splatUniforms],
      shaderInputs: this.shaderInputs,
      table,
      tableCount: 'none',
      ...(isWebGPU
        ? {
            bindings: {
              splatPositions: table.batches[0].gpuData['positions'].buffer,
              splatScales: table.batches[0].gpuData['scales'].buffer,
              splatRotations: table.batches[0].gpuData['rotations'].buffer,
              splatColors: table.batches[0].gpuData['colors'].buffer,
              splatOpacities: table.batches[0].gpuData['opacities'].buffer,
              splatRowIndices: table.batches[0].gpuData['rowIndices'].buffer,
              splatSortedIndices: this.placeholderIndexBuffer!,
              splatSphericalHarmonics:
                this.batches[0]?.sphericalHarmonics?.data[0]?.buffer ??
                this.placeholderSphericalHarmonicsBuffer!
            }
          }
        : {}),
      isInstanced: true,
      instanceCount: table.numRows,
      vertexCount: 4,
      topology: 'triangle-strip',
      parameters: {
        depthWriteEnabled: this.props.depthWriteEnabled,
        depthCompare: this.props.depthCompare,
        blend: true,
        blendColorOperation: 'add',
        blendAlphaOperation: 'add',
        blendColorSrcFactor: 'src-alpha',
        blendColorDstFactor: 'one-minus-src-alpha',
        blendAlphaSrcFactor: 'one',
        blendAlphaDstFactor: 'one-minus-src-alpha'
      }
    });
  }

  private update(): void {
    if (this.isDestroyed) {
      return;
    }
    for (let batchIndex = 0; batchIndex < this.batches.length; batchIndex++) {
      const revision = this.batches[batchIndex].revision;
      if (revision !== this.cachedBatchRevisions[batchIndex]) {
        this.cachedBatchRevisions[batchIndex] = revision;
        this.requiresUpdate = true;
        this.requiresWebGLSourceUpdate = this.device.type !== 'webgpu';
      }
    }
    if (this.requiresUniformUpdate) {
      this.updateShaderInputs();
      this.requiresUniformUpdate = false;
    }
    if (this.requiresWebGLSourceUpdate) {
      this.updateWebGLSourceBuffers();
      this.requiresWebGLSourceUpdate = false;
    }
    if (!this.requiresUpdate) {
      return;
    }
    this.sortedReferences = this.getVisibleSplatReferences();
    sortSplatReferences(this.sortedReferences, this.props.sortMode);
    this.rebuildDrawRuns();
    this.requiresUpdate = false;
  }

  private setResolvedProp<PropertyName extends keyof ResolvedSplatRendererProps>(
    propertyName: PropertyName,
    value: ResolvedSplatRendererProps[PropertyName]
  ): void {
    const previousValue = this.props[propertyName];
    if (Object.is(previousValue, value)) {
      return;
    }
    this.props[propertyName] = value;
    this.requiresUniformUpdate = true;
    if (propertyName === 'cameraPosition' || propertyName === 'sphericalHarmonicsDegree') {
      this.requiresWebGLSourceUpdate = this.device.type !== 'webgpu';
      return;
    }
    if (
      propertyName === 'gaussianSupportRadius' ||
      propertyName === 'exposure' ||
      propertyName === 'toneMapping' ||
      (propertyName === 'radiusScale' &&
        this.props.screenSizeCutoffPixels <= 0 &&
        typeof previousValue === 'number' &&
        previousValue >= 0 &&
        typeof value === 'number' &&
        value >= 0) ||
      ((propertyName === 'kernel2DSize' || propertyName === 'maxScreenSpaceSplatSize') &&
        this.props.screenSizeCutoffPixels <= 0) ||
      (propertyName === 'viewportSize' &&
        this.props.sortMode !== 'tile' &&
        this.props.screenSizeCutoffPixels <= 0)
    ) {
      return;
    }
    this.requiresUpdate = true;
  }

  private updateShaderInputs(): void {
    this.shaderInputs.setProps({
      splat: {
        modelViewProjectionMatrix: this.props.modelViewProjectionMatrix,
        viewportSize: this.props.viewportSize,
        radiusScale: this.props.radiusScale,
        alphaScale: this.props.alphaScale,
        alphaCutoff: this.props.alphaCutoff,
        screenSizeCutoffPixels: this.props.screenSizeCutoffPixels,
        gaussianSupportRadius: this.props.gaussianSupportRadius,
        kernel2DSize: this.props.kernel2DSize,
        maxScreenSpaceSplatSize: this.props.maxScreenSpaceSplatSize,
        sortedOffset: 0,
        exposure: this.props.exposure,
        toneMapping: this.props.toneMapping === 'reinhard' ? 1 : 0,
        cameraPosition: this.props.cameraPosition,
        sphericalHarmonicsDegree: this.props.sphericalHarmonicsDegree
      }
    });
  }

  private getVisibleSplatReferences(): SplatSortReference[] {
    const references: SplatSortReference[] = [];
    const requiresScreenSizeProjection =
      this.props.screenSizeCutoffPixels > 0 || this.props.radiusScale < 0;
    const requiresTileProjection = this.props.sortMode === 'tile';
    const tileColumns = Math.max(Math.ceil(this.props.viewportSize[0] / SPLAT_TILE_SIZE_PIXELS), 1);
    const matrix = this.props.modelViewProjectionMatrix;

    for (const [batchIndex, batch] of this.batches.entries()) {
      const {positions, scales, rotations, colors, opacities} = batch.source;
      const colorAlphaScale = colors instanceof Float32Array ? 1 : 1 / 255;
      const cachedBatchReferences = this.cachedReferences[batchIndex];
      for (let batchRowIndex = 0; batchRowIndex < batch.length; batchRowIndex++) {
        if (!acceptsSplatSemantic(this.props.semanticFilter, batch, batchRowIndex)) {
          continue;
        }
        const opacity =
          opacities[batchRowIndex] *
          colors[batchRowIndex * 4 + 3] *
          colorAlphaScale *
          this.props.alphaScale;
        if (!Number.isFinite(opacity) || opacity < this.props.alphaCutoff) {
          continue;
        }
        const positionOffset = batchRowIndex * 3;
        const positionX = positions[positionOffset];
        const positionY = positions[positionOffset + 1];
        const positionZ = positions[positionOffset + 2];
        const clipPositionZ =
          matrix[2] * positionX + matrix[6] * positionY + matrix[10] * positionZ + matrix[14];
        const clipPositionW =
          matrix[3] * positionX + matrix[7] * positionY + matrix[11] * positionZ + matrix[15];
        if (!Number.isFinite(clipPositionZ) || !Number.isFinite(clipPositionW)) {
          continue;
        }
        if (requiresScreenSizeProjection) {
          const position: [number, number, number] = [positionX, positionY, positionZ];
          const scale: [number, number, number] = [
            scales[batchRowIndex * 3],
            scales[batchRowIndex * 3 + 1],
            scales[batchRowIndex * 3 + 2]
          ];
          const rotation: [number, number, number, number] = [
            rotations[batchRowIndex * 4],
            rotations[batchRowIndex * 4 + 1],
            rotations[batchRowIndex * 4 + 2],
            rotations[batchRowIndex * 4 + 3]
          ];
          const projected = projectSplatCovarianceToScreen({
            position,
            scale,
            rotation,
            modelViewProjectionMatrix: this.props.modelViewProjectionMatrix,
            viewportSize: this.props.viewportSize,
            kernel2DSize: this.props.kernel2DSize,
            maxScreenSpaceSplatSize: this.props.maxScreenSpaceSplatSize
          });
          if (
            projected.maxAxisPixels * this.props.radiusScale <
            this.props.screenSizeCutoffPixels
          ) {
            continue;
          }
        }
        let tileIndex = 0;
        if (requiresTileProjection) {
          const clipPositionX =
            matrix[0] * positionX + matrix[4] * positionY + matrix[8] * positionZ + matrix[12];
          const clipPositionY =
            matrix[1] * positionX + matrix[5] * positionY + matrix[9] * positionZ + matrix[13];
          const inverseClipPositionW = clipPositionW !== 0 ? 1 / clipPositionW : 0;
          const screenPositionX =
            (clipPositionX * inverseClipPositionW * 0.5 + 0.5) * this.props.viewportSize[0];
          const screenPositionY =
            (0.5 - clipPositionY * inverseClipPositionW * 0.5) * this.props.viewportSize[1];
          const tileColumn = Math.max(
            0,
            Math.min(tileColumns - 1, Math.floor(screenPositionX / SPLAT_TILE_SIZE_PIXELS))
          );
          const tileRow = Math.max(0, Math.floor(screenPositionY / SPLAT_TILE_SIZE_PIXELS));
          tileIndex = tileRow * tileColumns + tileColumn;
        }
        const depth = clipPositionW !== 0 ? clipPositionZ / clipPositionW : clipPositionZ;
        let reference = cachedBatchReferences[batchRowIndex];
        if (reference) {
          reference.depth = depth;
          reference.tileIndex = tileIndex;
        } else {
          reference = {
            batchIndex,
            batchRowIndex,
            rowIndex: batch.rowIndexBase + batchRowIndex,
            depth,
            tileIndex
          };
          cachedBatchReferences[batchRowIndex] = reference;
        }
        references.push(reference);
      }
    }

    return references;
  }

  private rebuildDrawRuns(): void {
    const previousRuns = this.drawRuns;
    this.drawRuns = [];
    const nextRuns: Array<{batchIndex: number; rows: number[]}> = [];
    let exactRunCount = 0;
    let previousBatchIndex = -1;
    for (const reference of this.sortedReferences) {
      if (reference.batchIndex !== previousBatchIndex) {
        exactRunCount++;
        previousBatchIndex = reference.batchIndex;
        if (exactRunCount > MAX_EXACT_SPLAT_DRAW_RUNS) {
          break;
        }
      }
    }

    // Thousands of interleaved source batches would otherwise need one draw per splat. Partition
    // their exact global order into bounded depth slabs, then draw batches in stable source order
    // within each slab so one distant outlier cannot flip an entire transparent source batch.
    if (exactRunCount > MAX_EXACT_SPLAT_DRAW_RUNS) {
      const visibleBatches = new Uint8Array(this.batches.length);
      let visibleBatchCount = 0;
      for (const reference of this.sortedReferences) {
        if (!visibleBatches[reference.batchIndex]) {
          visibleBatches[reference.batchIndex] = 1;
          visibleBatchCount++;
        }
      }

      const depthSlabCount = Math.max(1, Math.floor(MAX_EXACT_SPLAT_DRAW_RUNS / visibleBatchCount));
      for (let slabIndex = 0; slabIndex < depthSlabCount; slabIndex++) {
        const slabStart = Math.floor((slabIndex * this.sortedReferences.length) / depthSlabCount);
        const slabEnd = Math.floor(
          ((slabIndex + 1) * this.sortedReferences.length) / depthSlabCount
        );
        const rowsByBatch: Array<number[] | undefined> = new Array(this.batches.length);
        for (let referenceIndex = slabStart; referenceIndex < slabEnd; referenceIndex++) {
          const reference = this.sortedReferences[referenceIndex];
          const rows = rowsByBatch[reference.batchIndex];
          if (rows) {
            rows.push(reference.batchRowIndex);
          } else {
            rowsByBatch[reference.batchIndex] = [reference.batchRowIndex];
          }
        }
        for (let batchIndex = 0; batchIndex < rowsByBatch.length; batchIndex++) {
          const rows = rowsByBatch[batchIndex];
          if (rows) {
            nextRuns.push({batchIndex, rows});
          }
        }
      }
    } else {
      let currentRun: {batchIndex: number; rows: number[]} | undefined;
      for (const reference of this.sortedReferences) {
        if (!currentRun || currentRun.batchIndex !== reference.batchIndex) {
          currentRun = {batchIndex: reference.batchIndex, rows: []};
          nextRuns.push(currentRun);
        }
        currentRun.rows.push(reference.batchRowIndex);
      }
    }

    for (const nextRun of nextRuns) {
      const rowIndices = Uint32Array.from(nextRun.rows);
      const reusableRunIndex = previousRuns.findIndex(
        previousRun =>
          previousRun.batchIndex === nextRun.batchIndex &&
          (this.device.type !== 'webgpu' ||
            (previousRun.indexBuffer &&
              previousRun.indexBuffer.byteLength >= rowIndices.byteLength))
      );
      const reusableRun =
        reusableRunIndex >= 0 ? previousRuns.splice(reusableRunIndex, 1)[0] : undefined;
      let indexBuffer = reusableRun?.indexBuffer;
      if (this.device.type === 'webgpu') {
        if (indexBuffer) {
          indexBuffer.write(rowIndices);
        } else {
          indexBuffer = this.device.createBuffer({
            id: `splat-sorted-indices-${nextRun.batchIndex}`,
            data: rowIndices,
            usage: Buffer.STORAGE | Buffer.COPY_DST
          });
        }
      }
      this.drawRuns.push({batchIndex: nextRun.batchIndex, rowIndices, indexBuffer});
    }

    for (const previousRun of previousRuns) {
      previousRun.indexBuffer?.destroy();
    }
  }

  private drawWebGPUStorageRuns(renderPass: RenderPass): boolean {
    if (!this.model || !this.table) {
      return false;
    }
    let drawSuccess = true;
    for (const run of this.drawRuns) {
      const batch = this.table.batches[run.batchIndex];
      if (!batch || !run.indexBuffer) {
        continue;
      }
      this.model.setBindings({
        splatPositions: batch.gpuData['positions'].buffer,
        splatScales: batch.gpuData['scales'].buffer,
        splatRotations: batch.gpuData['rotations'].buffer,
        splatColors: batch.gpuData['colors'].buffer,
        splatOpacities: batch.gpuData['opacities'].buffer,
        splatRowIndices: batch.gpuData['rowIndices'].buffer,
        splatSortedIndices: run.indexBuffer,
        splatSphericalHarmonics:
          this.batches[run.batchIndex].sphericalHarmonics?.data[0]?.buffer ??
          this.placeholderSphericalHarmonicsBuffer!
      });
      this.model.setInstanceCount(run.rowIndices.length);
      drawSuccess = this.model.draw(renderPass) && drawSuccess;
    }
    return drawSuccess;
  }

  private drawWebGLAttributeBatches(renderPass: RenderPass): boolean {
    if (!this.model || !this.table) {
      return false;
    }
    let drawSuccess = true;
    const drawnBatches = new Set<number>();
    for (const run of this.drawRuns) {
      if (drawnBatches.has(run.batchIndex)) {
        continue;
      }
      const batch = this.table.batches[run.batchIndex];
      if (!batch) {
        continue;
      }
      const evaluatedColorBuffer = this.evaluatedColorBuffers[run.batchIndex];
      this.model.setAttributes(
        Object.fromEntries(
          Object.entries(batch.gpuData).map(([name, data]) => [
            name,
            name === 'colors' && this.props.sphericalHarmonicsDegree > 0 && evaluatedColorBuffer
              ? evaluatedColorBuffer
              : name === 'opacities'
                ? this.getBatchOpacityBuffer(run.batchIndex)
                : data.buffer
          ])
        )
      );
      this.model.setInstanceCount(batch.numRows);
      drawSuccess = this.model.draw(renderPass) && drawSuccess;
      drawnBatches.add(run.batchIndex);
    }
    return drawSuccess;
  }

  private replaceData(batches: readonly GPUSplatData[]): void {
    this.destroyDrawRuns();
    this.model?.destroy();
    this.model = undefined;
    this.table?.destroy();
    this.table = undefined;
    this.batches.length = 0;
    this.cachedReferences.length = 0;
    this.cachedBatchRevisions.length = 0;
    this.destroyWebGLSourceBuffers();
    for (const batch of batches) {
      this.appendData(batch);
    }
    this.requiresUpdate = true;
  }

  private destroyDrawRuns(): void {
    for (const run of this.drawRuns) {
      run.indexBuffer?.destroy();
    }
    this.drawRuns = [];
  }

  private updateWebGLSourceBuffers(): void {
    if (this.device.type === 'webgpu') {
      return;
    }
    for (const [batchIndex, batch] of this.batches.entries()) {
      const coefficients = batch.source.sphericalHarmonics;
      if (coefficients && this.props.sphericalHarmonicsDegree > 0) {
        this.updateWebGLSphericalHarmonicColors(batchIndex, batch, coefficients);
      }
      if (this.props.semanticFilter) {
        const opacities = new Float32Array(batch.source.opacities);
        for (let rowIndex = 0; rowIndex < batch.length; rowIndex++) {
          if (!acceptsSplatSemantic(this.props.semanticFilter, batch, rowIndex)) {
            opacities[rowIndex] = 0;
          }
        }
        const existingBuffer = this.opacityMaskBuffers[batchIndex];
        if (existingBuffer) {
          existingBuffer.write(opacities);
        } else {
          this.opacityMaskBuffers[batchIndex] = this.device.createBuffer({
            id: `splat-filtered-opacities-${batch.sourceBatchIndex}`,
            ...(opacities.byteLength > 0
              ? {data: opacities}
              : {byteLength: Float32Array.BYTES_PER_ELEMENT}),
            usage: Buffer.VERTEX | Buffer.COPY_DST
          });
        }
      }
    }
  }

  private updateWebGLSphericalHarmonicColors(
    batchIndex: number,
    batch: GPUSplatData,
    coefficients: Float32Array
  ): void {
    const sourceColors = batch.source.colors;
    const colors =
      sourceColors instanceof Float32Array
        ? new Float32Array(sourceColors)
        : new Uint8Array(sourceColors);
    const coefficientCount = batch.length > 0 ? coefficients.length / batch.length : 0;
    const degree =
      this.props.sphericalHarmonicsDegree < batch.sphericalHarmonicsDegree
        ? this.props.sphericalHarmonicsDegree
        : batch.sphericalHarmonicsDegree;
    for (let rowIndex = 0; rowIndex < batch.length; rowIndex++) {
      const colorOffset = rowIndex * 4;
      const positionOffset = rowIndex * 3;
      const sourceColorScale = sourceColors instanceof Float32Array ? 1 : 1 / 255;
      const color = evaluateSplatSphericalHarmonics(
        [
          sourceColors[colorOffset] * sourceColorScale,
          sourceColors[colorOffset + 1] * sourceColorScale,
          sourceColors[colorOffset + 2] * sourceColorScale
        ],
        coefficients.subarray(rowIndex * coefficientCount, (rowIndex + 1) * coefficientCount),
        [
          batch.source.positions[positionOffset] - this.props.cameraPosition[0],
          batch.source.positions[positionOffset + 1] - this.props.cameraPosition[1],
          batch.source.positions[positionOffset + 2] - this.props.cameraPosition[2]
        ],
        degree
      );
      for (let colorComponentIndex = 0; colorComponentIndex < 3; colorComponentIndex++) {
        colors[colorOffset + colorComponentIndex] =
          colors instanceof Float32Array
            ? color[colorComponentIndex]
            : Math.round(Math.min(Math.max(color[colorComponentIndex], 0), 1) * 255);
      }
    }
    const existingBuffer = this.evaluatedColorBuffers[batchIndex];
    if (existingBuffer) {
      existingBuffer.write(colors);
    } else {
      this.evaluatedColorBuffers[batchIndex] = this.device.createBuffer({
        id: `splat-evaluated-colors-${batch.sourceBatchIndex}`,
        ...(colors.byteLength > 0 ? {data: colors} : {byteLength: Float32Array.BYTES_PER_ELEMENT}),
        usage: Buffer.VERTEX | Buffer.COPY_DST
      });
    }
  }

  private destroyWebGLSourceBuffers(): void {
    for (const buffer of this.evaluatedColorBuffers) {
      buffer?.destroy();
    }
    for (const buffer of this.opacityMaskBuffers) {
      buffer?.destroy();
    }
    this.evaluatedColorBuffers.length = 0;
    this.opacityMaskBuffers.length = 0;
  }
}

function createBorrowedSplatBatch(prepared: GPUSplatData, storage: boolean): GPURecordBatch {
  const sourceBatch = prepared.table.batches[0];
  const gpuData = Object.fromEntries(
    Object.entries(sourceBatch.gpuData).map(([name, data]) => [
      name,
      new GPUData({
        buffer: data.buffer,
        format: data.format,
        length: data.length,
        byteOffset: data.byteOffset,
        byteStride: data.byteStride,
        rowByteLength: data.rowByteLength,
        ownsBuffer: false
      })
    ])
  );
  const bufferLayout: BufferLayout[] = storage
    ? []
    : sourceBatch.bufferLayout.map(layout => ({...layout, stepMode: 'instance'}));
  return new GPURecordBatch({
    gpuData,
    bufferLayout,
    fields: sourceBatch.schema.fields,
    sourceInfo: prepared.sourceInfo
  });
}

function normalizeSplatBatches(
  data: GPUSplatData | readonly GPUSplatData[] | undefined
): readonly GPUSplatData[] {
  if (!data) {
    return [];
  }
  return data instanceof GPUSplatData ? [data] : data;
}

function isHighDynamicRangeSplatOutput(device: Device): boolean {
  return (
    device.type === 'webgpu' &&
    device.preferredColorFormat === 'rgba16float' &&
    device.canvasContext?.props.toneMapping === 'extended'
  );
}

function areSplatArrayValuesEqual(left: ArrayLike<number>, right: ArrayLike<number>): boolean {
  if (left.length !== right.length) {
    return false;
  }
  for (let valueIndex = 0; valueIndex < left.length; valueIndex++) {
    if (!Object.is(left[valueIndex], right[valueIndex])) {
      return false;
    }
  }
  return true;
}

function toSplatMatrix(
  matrix: ArrayLike<number> | undefined
): SplatUniforms['modelViewProjectionMatrix'] {
  if (!matrix) {
    return [...IDENTITY_MATRIX];
  }
  if (matrix.length !== 16) {
    throw new Error('SplatRenderer requires a 16-element model-view-projection matrix');
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
