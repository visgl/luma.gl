// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device, RenderPass} from '@luma.gl/core';
import {
  indexColorPicking,
  indexPicking,
  PickingManager,
  resolvePickingMode,
  ShaderInputs,
  supportsIndexPicking,
  type PickInfo,
  type PickingMode,
  type PickingShouldPickOptions,
  type ResolvedPickingMode
} from '@luma.gl/engine';
import {GPUTableModel} from '@luma.gl/tables';
import type {GPUSplatData} from './splat-data';
import {SplatRenderer, type SplatDrawRun} from './splat-renderer';
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

/** Stable source identity and optional semantic class returned by a Gaussian picking pass. */
export type SplatPickingInfo = {
  /** Original streamed source batch identity, or `null` when nothing is picked. */
  batchIndex: number | null;
  /** Stable global source row identity, or `null` when nothing is picked. */
  rowIndex: number | null;
  /** Zero-based row within the original source batch, or `null` when unavailable. */
  batchRowIndex: number | null;
  /** Optional numeric semantic class belonging to the picked source row. */
  semanticId: number | null;
};

/** Backend selection and callbacks for an independently owned Gaussian splat picker. */
export type SplatPickingProps = {
  /** Prefer integer WebGPU picking, falling back to encoded colors on WebGL2. */
  mode?: PickingMode;
  /** Receives stable streamed source identity whenever the picked Gaussian changes. */
  onPick?: (info: SplatPickingInfo) => void;
  /** Optional tooltip content derived from the stable picked Gaussian source identity. */
  getTooltip?: (info: SplatPickingInfo) => string | null;
};

type SplatPickingShaderInputs = ShaderInputs<{
  splat: SplatUniforms;
  picking: typeof indexPicking.props;
}>;

type SplatColorPickingBatch = {
  batchIndex: number;
  rowOffset: number;
  rowCount: number;
};

type SplatColorPickingSlot = {
  batches: SplatColorPickingBatch[];
  rowCount: number;
};

type SplatColorPickingBatchLocation = {
  slotIndex: number;
  rowOffset: number;
};

const MAX_COLOR_PICKING_ROWS_PER_SLOT = 16_777_215;
const MAX_COLOR_PICKING_SLOTS = 255;

const EMPTY_SPLAT_PICKING_INFO: SplatPickingInfo = {
  batchIndex: null,
  rowIndex: null,
  batchRowIndex: null,
  semanticId: null
};

const SPLAT_INDEX_PICKING_WGSL_FRAGMENT = /* wgsl */ `\

struct SplatPickingFragmentOutputs {
  @location(0) color : vec4<f32>,
  @location(1) pickingColor : vec2<i32>,
};

@fragment
fn fragmentPicking(input : SplatFragmentInputs) -> SplatPickingFragmentOutputs {
  let gaussianWeight = exp(-0.5 * dot(input.gaussianCoordinate, input.gaussianCoordinate));
  let alpha = input.color.a * gaussianWeight;
  if (alpha <= 0.0 || alpha < splat.alphaCutoff) {
    discard;
  }

  var output : SplatPickingFragmentOutputs;
  output.color = vec4<f32>(0.0);
  output.pickingColor = picking_getPickingColor(input.sourceRowIndex);
  return output;
}
`;

const SPLAT_COLOR_PICKING_WGSL_FRAGMENT = /* wgsl */ `\

@fragment
fn fragmentColorPicking(input : SplatFragmentInputs) -> @location(0) vec4<f32> {
  let gaussianWeight = exp(-0.5 * dot(input.gaussianCoordinate, input.gaussianCoordinate));
  let alpha = input.color.a * gaussianWeight;
  if (alpha <= 0.0 || alpha < splat.alphaCutoff) {
    discard;
  }
  return picking_getPickingColor(input.sourceRowIndex);
}
`;

/** Storage-backed WebGPU Gaussian shader with an exact integer source-row picking attachment. */
export const SPLAT_PICKING_STORAGE_WGSL_SHADER = `${SPLAT_STORAGE_WGSL_SHADER}${SPLAT_INDEX_PICKING_WGSL_FRAGMENT}`;

/** Attribute-backed Gaussian shader with an exact integer source-row picking attachment. */
export const SPLAT_PICKING_ATTRIBUTE_WGSL_SHADER = `${SPLAT_ATTRIBUTE_WGSL_SHADER}${SPLAT_INDEX_PICKING_WGSL_FRAGMENT}`;

const SPLAT_PICKING_VS_GLSL = SPLAT_VS_GLSL.replace(
  'sourceRowIndex = int(rowIndices);',
  'sourceRowIndex = int(rowIndices);\n  picking_setObjectIndex(sourceRowIndex);'
);

const SPLAT_COLOR_PICKING_VS_GLSL = SPLAT_VS_GLSL.replace(
  'sourceRowIndex = int(rowIndices);',
  'sourceRowIndex = int(rowIndices);\n  picking_setObjectIndex(gl_InstanceID + int(splat.sortedOffset));'
);

const SPLAT_GLSL_DISPLAY_COLOR =
  /  vec3 linearColor =[\s\S]*?  fragmentColor = vec4\(mappedColor, alpha\);/;

/** WebGL2 fragment shader writing global source rows into a dedicated integer attachment. */
export const SPLAT_PICKING_FS_GLSL = SPLAT_FS_GLSL.replace(
  'out vec4 fragmentColor;',
  'layout(location = 0) out vec4 fragmentColor;\nlayout(location = 1) out ivec4 pickingColor;'
).replace(
  SPLAT_GLSL_DISPLAY_COLOR,
  '  fragmentColor = vec4(0.0);\n  pickingColor = picking_getPickingColor();'
);

/** Portable WebGL2 fragment shader encoding stable Gaussian source rows into RGBA bytes. */
export const SPLAT_COLOR_PICKING_FS_GLSL = SPLAT_FS_GLSL.replace(
  SPLAT_GLSL_DISPLAY_COLOR,
  '  fragmentColor = picking_getPickingColor();'
);

/** Resolves an engine picking payload into stable streamed Gaussian source-row identity. */
export function resolveSplatPickInfo(
  pickInfo: PickInfo | null | undefined,
  batches: readonly GPUSplatData[]
): SplatPickingInfo {
  if (pickInfo?.batchIndex === null || pickInfo?.objectIndex === null || !pickInfo) {
    return {...EMPTY_SPLAT_PICKING_INFO};
  }

  const batch = batches[pickInfo.batchIndex];
  if (!batch || batch.destroyed || !Number.isInteger(pickInfo.objectIndex)) {
    return {...EMPTY_SPLAT_PICKING_INFO};
  }

  const batchRowIndex = pickInfo.objectIndex - batch.rowIndexBase;
  if (batchRowIndex < 0 || batchRowIndex >= batch.rowCount) {
    return {...EMPTY_SPLAT_PICKING_INFO};
  }

  return {
    batchIndex: batch.sourceBatchIndex,
    rowIndex: pickInfo.objectIndex,
    batchRowIndex,
    semanticId: batch.source.semanticIds?.[batchRowIndex] ?? null
  };
}

/**
 * Dedicated GPU Gaussian picker that borrows renderer batches and sorted-index allocations.
 *
 * WebGPU and capable WebGL devices use exact integer attachments. Other WebGL devices use the
 * engine's compatible RGBA picking path without changing or taking ownership of source buffers.
 */
export class SplatPicker {
  /** Device shared with the borrowing Gaussian renderer. */
  readonly device: Device;
  /** Renderer supplying preserved batches, semantic visibility masks, and sorted GPU runs. */
  readonly renderer: SplatRenderer;
  /** Engine-owned picking framebuffer, pointer tracking, and asynchronous GPU readback. */
  readonly manager: PickingManager;
  /** Shader inputs owned by this dedicated picking pipeline. */
  readonly shaderInputs: SplatPickingShaderInputs;
  /** Dedicated integer/color picking model; source buffers remain owned by their original batches. */
  model?: GPUTableModel;
  /** Application-owned picking callback and tooltip configuration. */
  props: SplatPickingProps;
  /** Latest stable streamed source identity resolved from a GPU picking pass. */
  pickInfo: SplatPickingInfo = {...EMPTY_SPLAT_PICKING_INFO};

  private colorPickingSlots: SplatColorPickingSlot[] = [];
  private readonly colorPickingBatchLocations = new Map<number, SplatColorPickingBatchLocation>();
  private isDestroyed = false;

  /** Creates a dedicated Gaussian picking pipeline while borrowing the supplied renderer. */
  constructor(renderer: SplatRenderer, props: SplatPickingProps = {}) {
    if (renderer.destroyed) {
      throw new Error('SplatPicker requires a live Gaussian splat renderer');
    }

    this.renderer = renderer;
    this.device = renderer.device;
    this.props = props;
    const mode = resolvePickingMode(
      this.device.type,
      props.mode ?? 'auto',
      supportsIndexPicking(this.device)
    );
    const pickingModule = mode === 'index' ? indexPicking : indexColorPicking;
    this.shaderInputs = new ShaderInputs<{
      splat: SplatUniforms;
      picking: typeof indexPicking.props;
    }>({splat: splatUniforms, picking: pickingModule});
    this.shaderInputs.setProps({picking: {indexMode: 'attribute', batchIndex: 0}});
    this.manager = new PickingManager(this.device, {
      mode,
      shaderInputs: this.shaderInputs,
      onObjectPicked: this.handleObjectPicked,
      getTooltip: info => this.props.getTooltip?.(this.resolvePickingResult(info)) ?? null
    });
  }

  /** Resolved integer or portable RGBA picking backend. */
  get mode(): ResolvedPickingMode {
    return this.manager.mode;
  }

  /** Whether dedicated picking resources have already been released. */
  get destroyed(): boolean {
    return this.isDestroyed;
  }

  /**
   * Renders a semantic-aware Gaussian picking pass and asynchronously resolves stable source rows.
   *
   * A `null` pointer clears the current selection. Repeat positions reuse the latest result unless
   * `options.force` requests a fresh render/readback for animated or newly streamed source data.
   */
  async pick(
    mousePosition: readonly [number, number] | number[] | null | undefined,
    options: PickingShouldPickOptions = {}
  ): Promise<SplatPickingInfo | null> {
    if (this.isDestroyed || this.renderer.destroyed) {
      return null;
    }
    if (!mousePosition) {
      this.clear();
      return this.pickInfo;
    }

    const position: [number, number] = [mousePosition[0], mousePosition[1]];
    if (!this.manager.shouldPick(position, options)) {
      return this.pickInfo;
    }

    const drawRuns = this.renderer.getDrawRuns();
    if (!this.renderer.table || drawRuns.length === 0) {
      this.clear();
      return this.pickInfo;
    }

    if (this.usesPackedColorPicking) {
      this.updateColorPickingSlots(drawRuns);
    }
    this.updateShaderInputs();
    const model = this.getPickingModel();
    if (!model) {
      this.clear();
      return this.pickInfo;
    }

    const firstColorLocation = this.colorPickingBatchLocations.get(drawRuns[0].batchIndex);
    this.shaderInputs.setProps({
      picking: {
        isActive: true,
        batchIndex: this.usesPackedColorPicking
          ? (firstColorLocation?.slotIndex ?? 0)
          : drawRuns[0].batchIndex
      },
      ...(this.usesPackedColorPicking
        ? {splat: {sortedOffset: firstColorLocation?.rowOffset ?? 0}}
        : {})
    });
    model.predraw(this.device.commandEncoder);
    const pickingPass = this.manager.beginRenderPass();
    let didDraw = false;
    try {
      didDraw = this.drawRuns(pickingPass);
    } finally {
      pickingPass.end();
      this.shaderInputs.setProps({picking: {isActive: false}});
    }

    if (!didDraw) {
      this.clear();
      return this.pickInfo;
    }

    if (this.device.type === 'webgpu') {
      this.device.submit();
    }
    const pickInfo = await this.manager.updatePickInfo(position);
    if (!pickInfo) {
      return null;
    }
    return this.updatePickingResult(pickInfo);
  }

  /** Clears the current source selection and emits a null pick after an earlier successful hit. */
  clear(): void {
    const hadSelection = this.pickInfo.rowIndex !== null;
    this.manager.clearPickState();
    this.manager.pickInfo = {batchIndex: null, objectIndex: null};
    this.pickInfo = {...EMPTY_SPLAT_PICKING_INFO};
    if (hadSelection) {
      this.props.onPick?.(this.pickInfo);
    }
  }

  /** Releases the picking model/framebuffer without destroying borrowed renderer/source buffers. */
  destroy(): void {
    if (this.isDestroyed) {
      return;
    }
    this.model?.destroy();
    this.model = undefined;
    this.manager.destroy();
    this.shaderInputs.destroy();
    this.isDestroyed = true;
  }

  private readonly handleObjectPicked = (pickInfo: PickInfo): void => {
    this.updatePickingResult(pickInfo);
  };

  private updatePickingResult(pickInfo: PickInfo): SplatPickingInfo {
    const resolved = this.resolvePickingResult(pickInfo);
    if (
      resolved.batchIndex !== this.pickInfo.batchIndex ||
      resolved.rowIndex !== this.pickInfo.rowIndex ||
      resolved.batchRowIndex !== this.pickInfo.batchRowIndex ||
      resolved.semanticId !== this.pickInfo.semanticId
    ) {
      this.pickInfo = resolved;
      this.props.onPick?.(resolved);
    }
    return this.pickInfo;
  }

  private resolvePickingResult(pickInfo: PickInfo): SplatPickingInfo {
    if (this.usesPackedColorPicking) {
      return this.resolveColorPickingResult(pickInfo);
    }

    const resolved = resolveSplatPickInfo(pickInfo, this.renderer.batches);
    if (resolved.rowIndex !== null || pickInfo.objectIndex === null) {
      return resolved;
    }

    // Multiple WebGPU draws share one uniform allocation while their render pass is open. Stable
    // globally unique source rows still identify their original batch if a queued batch uniform
    // cannot change between recorded draws.
    let matchingBatchIndex = -1;
    for (const [batchIndex, batch] of this.renderer.batches.entries()) {
      if (
        pickInfo.objectIndex >= batch.rowIndexBase &&
        pickInfo.objectIndex < batch.rowIndexBase + batch.rowCount
      ) {
        if (matchingBatchIndex !== -1) {
          return resolved;
        }
        matchingBatchIndex = batchIndex;
      }
    }

    return matchingBatchIndex === -1
      ? resolved
      : resolveSplatPickInfo(
          {batchIndex: matchingBatchIndex, objectIndex: pickInfo.objectIndex},
          this.renderer.batches
        );
  }

  private get usesPackedColorPicking(): boolean {
    return this.mode === 'color' && this.device.type !== 'webgpu';
  }

  private updateColorPickingSlots(drawRuns: readonly SplatDrawRun[]): void {
    this.colorPickingSlots = [];
    this.colorPickingBatchLocations.clear();

    for (const drawRun of drawRuns) {
      if (this.colorPickingBatchLocations.has(drawRun.batchIndex)) {
        continue;
      }

      const batch = this.renderer.batches[drawRun.batchIndex];
      if (!batch || batch.rowCount > MAX_COLOR_PICKING_ROWS_PER_SLOT) {
        continue;
      }

      let slotIndex = this.colorPickingSlots.findIndex(
        slot => slot.rowCount + batch.rowCount <= MAX_COLOR_PICKING_ROWS_PER_SLOT
      );
      if (slotIndex === -1) {
        if (this.colorPickingSlots.length >= MAX_COLOR_PICKING_SLOTS) {
          continue;
        }
        slotIndex = this.colorPickingSlots.length;
        this.colorPickingSlots.push({batches: [], rowCount: 0});
      }

      const slot = this.colorPickingSlots[slotIndex];
      const rowOffset = slot.rowCount;
      slot.batches.push({batchIndex: drawRun.batchIndex, rowOffset, rowCount: batch.rowCount});
      slot.rowCount += batch.rowCount;
      this.colorPickingBatchLocations.set(drawRun.batchIndex, {slotIndex, rowOffset});
    }
  }

  private resolveColorPickingResult(pickInfo: PickInfo): SplatPickingInfo {
    if (pickInfo.batchIndex === null || pickInfo.objectIndex === null) {
      return {...EMPTY_SPLAT_PICKING_INFO};
    }

    const slot = this.colorPickingSlots[pickInfo.batchIndex];
    const matchingBatch = slot?.batches.find(
      batch =>
        pickInfo.objectIndex! >= batch.rowOffset &&
        pickInfo.objectIndex! < batch.rowOffset + batch.rowCount
    );
    if (!matchingBatch) {
      return {...EMPTY_SPLAT_PICKING_INFO};
    }

    const batch = this.renderer.batches[matchingBatch.batchIndex];
    if (!batch) {
      return {...EMPTY_SPLAT_PICKING_INFO};
    }

    return resolveSplatPickInfo(
      {
        batchIndex: matchingBatch.batchIndex,
        objectIndex: batch.rowIndexBase + pickInfo.objectIndex - matchingBatch.rowOffset
      },
      this.renderer.batches
    );
  }

  private updateShaderInputs(): void {
    const props = this.renderer.props;
    this.shaderInputs.setProps({
      splat: {
        modelViewProjectionMatrix: props.modelViewProjectionMatrix,
        viewportSize: props.viewportSize,
        radiusScale: props.radiusScale,
        alphaScale: props.alphaScale,
        alphaCutoff: props.alphaCutoff,
        screenSizeCutoffPixels: props.screenSizeCutoffPixels,
        gaussianSupportRadius: props.gaussianSupportRadius,
        kernel2DSize: props.kernel2DSize,
        maxScreenSpaceSplatSize: props.maxScreenSpaceSplatSize,
        sortedOffset: 0,
        exposure: props.exposure,
        toneMapping: props.toneMapping === 'reinhard' ? 1 : 0,
        cameraPosition: props.cameraPosition,
        sphericalHarmonicsDegree: props.sphericalHarmonicsDegree
      }
    });
  }

  private getPickingModel(): GPUTableModel | undefined {
    const table = this.renderer.table;
    const firstDrawRun = this.renderer.getDrawRuns()[0];
    if (!table || !firstDrawRun) {
      return undefined;
    }
    if (this.model?.table === table) {
      return this.model;
    }

    this.model?.destroy();
    const isWebGPU = this.device.type === 'webgpu';
    const isIndexPicking = this.mode === 'index';
    const firstBatch = table.batches[firstDrawRun.batchIndex];
    const source = isWebGPU
      ? isIndexPicking
        ? SPLAT_PICKING_STORAGE_WGSL_SHADER
        : `${SPLAT_STORAGE_WGSL_SHADER}${SPLAT_COLOR_PICKING_WGSL_FRAGMENT}`
      : isIndexPicking
        ? SPLAT_PICKING_ATTRIBUTE_WGSL_SHADER
        : `${SPLAT_ATTRIBUTE_WGSL_SHADER}${SPLAT_COLOR_PICKING_WGSL_FRAGMENT}`;

    this.model = new GPUTableModel(this.device, {
      id: 'gaussian-splat-picking',
      source,
      vs: this.usesPackedColorPicking ? SPLAT_COLOR_PICKING_VS_GLSL : SPLAT_PICKING_VS_GLSL,
      fs: isIndexPicking ? SPLAT_PICKING_FS_GLSL : SPLAT_COLOR_PICKING_FS_GLSL,
      fragmentEntryPoint: isIndexPicking ? 'fragmentPicking' : 'fragmentColorPicking',
      shaderLayout: isWebGPU ? SPLAT_STORAGE_SHADER_LAYOUT : SPLAT_ATTRIBUTE_SHADER_LAYOUT,
      modules: this.shaderInputs.getModules(),
      shaderInputs: this.shaderInputs,
      table,
      tableCount: 'none',
      ...(isWebGPU
        ? {
            bindings: {
              splatPositions: firstBatch.gpuData['positions'].buffer,
              splatScales: firstBatch.gpuData['scales'].buffer,
              splatRotations: firstBatch.gpuData['rotations'].buffer,
              splatColors: firstBatch.gpuData['colors'].buffer,
              splatOpacities: this.renderer.getBatchOpacityBuffer(firstDrawRun.batchIndex),
              splatRowIndices: firstBatch.gpuData['rowIndices'].buffer,
              splatSortedIndices: firstDrawRun.indexBuffer!,
              splatSphericalHarmonics: this.renderer.getBatchSphericalHarmonicsBuffer(
                firstDrawRun.batchIndex
              )
            }
          }
        : {}),
      colorAttachmentFormats: isIndexPicking ? ['rgba8unorm', 'rg32sint'] : ['rgba8unorm'],
      depthStencilAttachmentFormat: 'depth24plus',
      isInstanced: true,
      instanceCount: firstDrawRun.rowIndices.length,
      vertexCount: 4,
      topology: 'triangle-strip',
      parameters: {
        depthWriteEnabled: true,
        depthCompare: 'less-equal',
        blend: false
      }
    });

    return this.model;
  }

  private drawRuns(renderPass: RenderPass): boolean {
    const model = this.model;
    const table = this.renderer.table;
    if (!model || !table) {
      return false;
    }

    let didDraw = false;
    let drawSuccess = true;
    const drawnAttributeBatches = new Set<number>();
    for (const drawRun of this.renderer.getDrawRuns()) {
      const batch = table.batches[drawRun.batchIndex];
      if (
        !batch ||
        (this.device.type !== 'webgpu' && drawnAttributeBatches.has(drawRun.batchIndex))
      ) {
        continue;
      }

      const colorLocation = this.colorPickingBatchLocations.get(drawRun.batchIndex);
      if (this.usesPackedColorPicking && !colorLocation) {
        continue;
      }
      this.shaderInputs.setProps({
        picking: {
          batchIndex: this.usesPackedColorPicking ? colorLocation!.slotIndex : drawRun.batchIndex
        },
        ...(this.usesPackedColorPicking ? {splat: {sortedOffset: colorLocation!.rowOffset}} : {})
      });
      if (this.device.type === 'webgpu') {
        if (!drawRun.indexBuffer) {
          continue;
        }
        model.setBindings({
          splatPositions: batch.gpuData['positions'].buffer,
          splatScales: batch.gpuData['scales'].buffer,
          splatRotations: batch.gpuData['rotations'].buffer,
          splatColors: batch.gpuData['colors'].buffer,
          splatOpacities: this.renderer.getBatchOpacityBuffer(drawRun.batchIndex),
          splatRowIndices: batch.gpuData['rowIndices'].buffer,
          splatSortedIndices: drawRun.indexBuffer,
          splatSphericalHarmonics: this.renderer.getBatchSphericalHarmonicsBuffer(
            drawRun.batchIndex
          )
        });
        model.setInstanceCount(drawRun.rowIndices.length);
      } else {
        model.setAttributes(
          Object.fromEntries(
            Object.entries(batch.gpuData).map(([name, data]) => [
              name,
              name === 'opacities'
                ? this.renderer.getBatchOpacityBuffer(drawRun.batchIndex)
                : data.buffer
            ])
          )
        );
        model.setInstanceCount(batch.numRows);
        drawnAttributeBatches.add(drawRun.batchIndex);
      }

      didDraw = true;
      drawSuccess = model.draw(renderPass) && drawSuccess;
    }

    return didDraw && drawSuccess;
  }
}
