// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  AttributePathModel,
  prepareArrowPathGPUVectors,
  type PreparedArrowPathGPUVectors
} from '@luma.gl/arrow';
import type {CommandEncoder, Device, RenderPass} from '@luma.gl/core';
import {GPURenderable, type GPUVector} from '@luma.gl/tables';
import type {ShaderInputs} from '@luma.gl/engine';
import {
  createFloat64PrecisionShaderInputs,
  FS_GLSL,
  PRECISION_PATH_SHADER_LAYOUT,
  type PrecisionViewportUniforms,
  VS_GLSL,
  WGSL_SHADER
} from './arrow-float64-precision-shaders';
import type {ArrowFloat64PrecisionSourceData} from './arrow-float64-precision-data';

export type ArrowFloat64PrecisionViewState = {
  zoom: number;
  pan: [number, number];
};

export type ArrowFloat64PrecisionMetrics = {
  coordinateMagnitudeLabel: string;
  coordinateMagnitude: number;
  pathCount: number;
  segmentCount: number;
  float32SourceArrowByteLength: number;
  float64SourceArrowByteLength: number;
  styleArrowByteLength: number;
  float32PreparedGpuByteLength: number;
  float64PreparedGpuByteLength: number;
  float32PreparationTimeMs: number;
  float64PreparationTimeMs: number;
  maxFloat32LocalError: number;
};

type PreparedPathView = {
  prepared: PreparedArrowPathGPUVectors;
  model: AttributePathModel;
  shaderInputs: ShaderInputs<{precisionViewport: PrecisionViewportUniforms}>;
  preparationTimeMs: number;
};

const LEFT_PANE_OFFSET: [number, number] = [-0.52, 0];
const RIGHT_PANE_OFFSET: [number, number] = [0.52, 0];
const DEFAULT_RENDER_PARAMETERS = {
  depthWriteEnabled: false,
  blend: true,
  blendColorOperation: 'add',
  blendAlphaOperation: 'add',
  blendColorSrcFactor: 'src-alpha',
  blendColorDstFactor: 'one-minus-src-alpha',
  blendAlphaSrcFactor: 'one',
  blendAlphaDstFactor: 'one-minus-src-alpha'
} as const satisfies Record<string, unknown>;

export class ArrowFloat64PrecisionRenderer extends GPURenderable<[RenderPass]> {
  readonly device: Device;
  readonly sourceData: ArrowFloat64PrecisionSourceData;
  readonly float32View: PreparedPathView;
  readonly float64View: PreparedPathView;

  private constructor(
    device: Device,
    sourceData: ArrowFloat64PrecisionSourceData,
    float32View: PreparedPathView,
    float64View: PreparedPathView
  ) {
    super();
    this.device = device;
    this.sourceData = sourceData;
    this.float32View = float32View;
    this.float64View = float64View;
  }

  static async create(
    device: Device,
    sourceData: ArrowFloat64PrecisionSourceData
  ): Promise<ArrowFloat64PrecisionRenderer> {
    const float32View = await createPreparedPathView(device, sourceData, 'float32');
    const float64View = await createPreparedPathView(device, sourceData, 'float64');
    return new ArrowFloat64PrecisionRenderer(device, sourceData, float32View, float64View);
  }

  updateViewState({aspect, zoom, pan}: ArrowFloat64PrecisionViewState & {aspect: number}): void {
    const center: [number, number] = [
      this.sourceData.center[0] + pan[0],
      this.sourceData.center[1] + pan[1]
    ];
    const worldScale = getWorldScale(this.sourceData, aspect, zoom);

    this.float32View.shaderInputs.setProps({
      precisionViewport: {
        center: pan,
        worldScale,
        paneOffset: LEFT_PANE_OFFSET,
        usePreparedOrigins: 0,
        miterLimit: 4
      }
    });

    this.float64View.prepared.updateViewOrigins({
      modelViewMatrix: makeModelViewMatrix(center, worldScale, RIGHT_PANE_OFFSET)
    });
    this.float64View.shaderInputs.setProps({
      precisionViewport: {
        center,
        worldScale,
        paneOffset: RIGHT_PANE_OFFSET,
        usePreparedOrigins: 1,
        miterLimit: 4
      }
    });
  }

  override draw(renderPass: RenderPass): void {
    this.float32View.model.draw(renderPass);
    this.float64View.model.draw(renderPass);
  }

  override predraw(commandEncoder: CommandEncoder): void {
    this.float32View.model.predraw(commandEncoder);
    this.float64View.model.predraw(commandEncoder);
  }

  getMetrics(): ArrowFloat64PrecisionMetrics {
    return {
      coordinateMagnitudeLabel: this.sourceData.coordinateMagnitudeLabel,
      coordinateMagnitude: this.sourceData.coordinateMagnitude,
      pathCount: this.sourceData.pathCount,
      segmentCount: this.sourceData.segmentCount,
      float32SourceArrowByteLength: this.sourceData.sourceArrowByteLength.float32Paths,
      float64SourceArrowByteLength: this.sourceData.sourceArrowByteLength.float64Paths,
      styleArrowByteLength: this.sourceData.sourceArrowByteLength.style,
      float32PreparedGpuByteLength: getPreparedPathGpuByteLength(
        this.float32View.prepared,
        this.float32View.model
      ),
      float64PreparedGpuByteLength: getPreparedPathGpuByteLength(
        this.float64View.prepared,
        this.float64View.model
      ),
      float32PreparationTimeMs: this.float32View.preparationTimeMs,
      float64PreparationTimeMs: this.float64View.preparationTimeMs,
      maxFloat32LocalError: this.sourceData.maxFloat32LocalError
    };
  }

  destroy(): void {
    this.float32View.model.destroy();
    this.float64View.model.destroy();
    this.float32View.prepared.destroy();
    this.float64View.prepared.destroy();
  }
}

async function createPreparedPathView(
  device: Device,
  sourceData: ArrowFloat64PrecisionSourceData,
  kind: 'float32' | 'float64'
): Promise<PreparedPathView> {
  const shaderInputs = createFloat64PrecisionShaderInputs();
  const preparationStartTime = getNow();
  const prepared = await prepareArrowPathGPUVectors(
    device,
    {
      paths: kind === 'float64' ? sourceData.pathsFloat64 : sourceData.pathsFloat32Local,
      colors: sourceData.colors,
      widths: sourceData.widths
    },
    {id: `arrow-float64-precision-${kind}`}
  );
  const model = new AttributePathModel(device, {
    ...prepared.pathProps,
    id: `arrow-float64-precision-${kind}`,
    source: WGSL_SHADER,
    vs: VS_GLSL,
    fs: FS_GLSL,
    shaderLayout: PRECISION_PATH_SHADER_LAYOUT,
    shaderInputs,
    topology: 'triangle-list',
    vertexCount: 12,
    parameters: DEFAULT_RENDER_PARAMETERS
  });

  return {
    prepared,
    model,
    shaderInputs,
    preparationTimeMs: getNow() - preparationStartTime
  };
}

function getWorldScale(
  sourceData: ArrowFloat64PrecisionSourceData,
  aspect: number,
  zoom: number
): [number, number] {
  const safeAspect = Math.max(aspect, 0.2);
  const scale = Math.min(
    (0.82 * safeAspect) / sourceData.localBounds.width,
    1.58 / sourceData.localBounds.height
  );
  return [(scale / safeAspect) * zoom, scale * zoom];
}

function makeModelViewMatrix(
  center: [number, number],
  worldScale: [number, number],
  paneOffset: [number, number]
): number[] {
  const [scaleX, scaleY] = worldScale;
  return [
    scaleX,
    0,
    0,
    0,
    0,
    scaleY,
    0,
    0,
    0,
    0,
    1,
    0,
    paneOffset[0] - center[0] * scaleX,
    paneOffset[1] - center[1] * scaleY,
    0,
    1
  ];
}

function getPreparedPathGpuByteLength(
  prepared: PreparedArrowPathGPUVectors,
  model: AttributePathModel
): number {
  return (
    getGpuVectorByteLength(prepared.paths) +
    (prepared.colors ? getGpuVectorByteLength(prepared.colors) : 0) +
    (prepared.widths ? getGpuVectorByteLength(prepared.widths) : 0) +
    (prepared.viewOrigins ? getGpuVectorByteLength(prepared.viewOrigins) : 0) +
    model.renderBatches.reduce(
      (byteLength, renderBatch) =>
        byteLength +
        renderBatch.expandedPathVertexData.byteLength +
        renderBatch.pathViewOriginData.byteLength,
      0
    )
  );
}

function getGpuVectorByteLength(vector: GPUVector<any>): number {
  return vector.data.reduce((byteLength, data) => {
    const variableLengthByteLength = data.readbackMetadata?.valueByteLength;
    return (
      byteLength +
      (variableLengthByteLength !== undefined
        ? variableLengthByteLength
        : data.length * data.byteStride)
    );
  }, 0);
}

function getNow(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}
