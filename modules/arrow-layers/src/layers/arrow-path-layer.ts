// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  Layer,
  picking,
  project32,
  type LayerContext,
  type LayerProps,
  type PickingInfo,
  type UpdateParameters
} from '@deck.gl/core';
import {
  ArrowPathRenderer,
  getArrowRecordBatchAsyncIterator,
  resolveArrowPathSourceVectors,
  type ArrowPathSourceVectorSelectors,
  type ArrowRecordBatchSource,
  type PreparedArrowPathRendererGPUVectors
} from '@luma.gl/arrow';
import {
  Buffer,
  type BufferLayout,
  type Device,
  type ShaderLayout,
  type TypedArray
} from '@luma.gl/core';
import type {Model} from '@luma.gl/engine';
import {PathAttributeModel} from '@luma.gl/tables';
import type {RecordBatch} from 'apache-arrow';
import {DECK_ARROW_ALPHA_BLEND_PARAMETERS, type ArrowLayerPickingInfo} from './arrow-layer-types';

type ArrowPathColor = [number, number, number, number];

const DEFAULT_PATH_COLOR: ArrowPathColor = [199, 219, 245, 255];
const DEFAULT_PATH_WIDTH = 0.0035;

const CONSTANT_PATH_COLOR_BUFFER = 'constantPathColor';
const CONSTANT_PATH_WIDTH_BUFFER = 'constantPathWidth';

const DECK_PATH_FS = `#version 300 es
precision highp float;

in vec4 vColor;
out vec4 fragColor;

void main() {
  fragColor = vColor;
  DECKGL_FILTER_COLOR(fragColor, geometry);
}
`;

const DECK_PATH_SHADER_LAYOUT: ShaderLayout = {
  attributes: [
    {name: 'segmentStartPositions', location: 0, type: 'vec4<f32>', stepMode: 'instance'},
    {name: 'segmentEndPositions', location: 1, type: 'vec4<f32>', stepMode: 'instance'},
    {name: 'rowIndices', location: 2, type: 'u32', stepMode: 'instance'},
    {name: 'segmentStartColors', location: 3, type: 'u32', stepMode: 'instance'},
    {name: 'segmentEndColors', location: 4, type: 'u32', stepMode: 'instance'},
    {name: 'widths', location: 5, type: 'f32', stepMode: 'instance'},
    {name: 'pathViewOrigins', location: 6, type: 'vec4<f32>', stepMode: 'instance'}
  ],
  bindings: []
};

const DECK_PATH_VS = `#version 300 es
precision highp float;
precision highp int;

in vec4 segmentStartPositions;
in vec4 segmentEndPositions;
in uint rowIndices;
in uint segmentStartColors;
in uint segmentEndColors;
in float widths;
in vec4 pathViewOrigins;

out vec4 vColor;

vec3 encodeDeckPickingColor(int objectIndex) {
  int colorIndex = objectIndex + 1;
  return vec3(
    float(colorIndex % 256),
    float((colorIndex / 256) % 256),
    float((colorIndex / 65536) % 256)
  );
}

vec4 unpackPathColor(uint colorWord) {
  return vec4(
    float(colorWord & 255u),
    float((colorWord >> 8u) & 255u),
    float((colorWord >> 16u) & 255u),
    float((colorWord >> 24u) & 255u)
  ) / 255.0;
}

vec2 getTriangleCorner(int vertexIndex) {
  if (vertexIndex == 0) return vec2(0.0, -1.0);
  if (vertexIndex == 1) return vec2(1.0, -1.0);
  if (vertexIndex == 2) return vec2(1.0, 1.0);
  if (vertexIndex == 3) return vec2(0.0, -1.0);
  if (vertexIndex == 4) return vec2(1.0, 1.0);
  return vec2(0.0, 1.0);
}

void main() {
  vec2 corner = getTriangleCorner(gl_VertexID % 6);
  vec4 startPosition = pathViewOrigins + segmentStartPositions;
  vec4 endPosition = pathViewOrigins + segmentEndPositions;
  vec2 direction = normalize(endPosition.xy - startPosition.xy);
  if (any(isnan(direction))) direction = vec2(1.0, 0.0);
  vec2 normal = vec2(-direction.y, direction.x);
  vec4 pathPosition = mix(startPosition, endPosition, corner.x);
  pathPosition.xy += normal * corner.y * widths;
  gl_Position = project_position_to_clipspace(pathPosition.xyz, vec3(0.0), vec3(0.0));
  geometry.position = gl_Position;
  geometry.pickingColor = encodeDeckPickingColor(int(rowIndices));
  DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
  vColor = mix(
    unpackPathColor(segmentStartColors),
    unpackPathColor(segmentEndColors),
    corner.x
  );
  DECKGL_FILTER_COLOR(vColor, geometry);
}
`;

type ArrowPathLayerBatch = {
  model: Model;
  prepared: PreparedArrowPathRendererGPUVectors;
  constantBuffers: Buffer[];
  batchIndex: number;
  rowIndexOffset: number;
  rowCount: number;
};

/** Deck-facing props for an Arrow-backed path layer. */
export type ArrowPathLayerProps = Omit<LayerProps, 'data'> &
  ArrowPathSourceVectorSelectors & {
    /** Arrow table or preserved record-batch source. */
    data?: ArrowRecordBatchSource | null;
    /** Deck projection currently requires the attribute-backed path model. */
    model?: 'attribute' | 'auto';
    /** Constant RGBA fallback used when `colors` is null or absent. */
    color?: ArrowPathColor;
    /** Constant path width fallback used when `widths` is null or absent. */
    width?: number;
    /** Called after one streamed record batch has been prepared and appended. */
    onDataBatch?: (update: {
      loadedBatchCount: number;
      isFirstBatch: boolean;
      batchIndex: number;
      rowIndexOffset: number;
      rowCount: number;
    }) => void;
    /** Called when layer-owned Arrow loading or preparation fails. */
    onDataError?: (error: unknown) => void;
  };

type ArrowPathLayerState = {
  batches: ArrowPathLayerBatch[];
  loadVersion: number;
};

/** deck.gl layer that converts and appends Arrow path batches without materializing the stream. */
export class ArrowPathLayer extends Layer<ArrowPathLayerProps> {
  static override layerName = 'ArrowPathLayer';
  static override defaultProps = {parameters: DECK_ARROW_ALPHA_BLEND_PARAMETERS};

  override getAttributeManager() {
    return null;
  }

  override initializeState(): void {
    this.setState({batches: [], loadVersion: 0} satisfies ArrowPathLayerState);
  }

  override updateState({props, oldProps, changeFlags}: UpdateParameters<this>): void {
    if (
      changeFlags.dataChanged ||
      props.paths !== oldProps.paths ||
      props.colors !== oldProps.colors ||
      props.widths !== oldProps.widths ||
      props.timestamps !== oldProps.timestamps ||
      props.model !== oldProps.model ||
      props.color !== oldProps.color ||
      props.width !== oldProps.width
    ) {
      void this.loadSource(props);
    }
  }

  override getModels(): Model[] {
    return (this.state as ArrowPathLayerState | undefined)?.batches.map(batch => batch.model) ?? [];
  }

  override draw({renderPass, context}: Parameters<Layer<ArrowPathLayerProps>['draw']>[0]): void {
    for (const {model} of this.getLayerState().batches) {
      model.predraw(context.device.commandEncoder);
      model.draw(renderPass);
    }
  }

  override getPickingInfo({info}: {info: PickingInfo}): ArrowLayerPickingInfo {
    const pickingInfo = info as ArrowLayerPickingInfo;
    const rowIndex = pickingInfo.index;
    const batch = this.getLayerState().batches.find(
      candidate =>
        rowIndex >= candidate.rowIndexOffset &&
        rowIndex < candidate.rowIndexOffset + candidate.rowCount
    );
    if (batch) {
      pickingInfo.arrow = {
        rowIndex,
        batchIndex: batch.batchIndex,
        batchRowIndex: rowIndex - batch.rowIndexOffset
      };
    }
    return pickingInfo;
  }

  override finalizeState(context: LayerContext): void {
    const state = this.getLayerState();
    state.loadVersion++;
    destroyPathBatches(state.batches);
    this.setState({batches: [], loadVersion: state.loadVersion} satisfies ArrowPathLayerState);
    super.finalizeState(context);
  }

  private async loadSource(props: ArrowPathLayerProps): Promise<void> {
    const state = this.getLayerState();
    const loadVersion = state.loadVersion + 1;
    state.loadVersion = loadVersion;
    const previousBatches = state.batches;
    this.setState({batches: [], loadVersion} satisfies ArrowPathLayerState);
    destroyPathBatches(previousBatches);
    this.setNeedsRedraw();

    try {
      if (props.data) {
        await this.loadRecordBatchSource(props, props.data, loadVersion);
      } else if (props.paths && typeof props.paths !== 'string') {
        await this.appendSourceBatch(props, undefined, 0, 0, loadVersion);
      }
    } catch (error) {
      if (this.isActiveLoad(loadVersion)) {
        props.onDataError?.(error);
      }
    }
  }

  private async loadRecordBatchSource(
    props: ArrowPathLayerProps,
    data: ArrowRecordBatchSource,
    loadVersion: number
  ): Promise<void> {
    const iterator = getArrowRecordBatchAsyncIterator(data);
    let batchIndex = 0;
    let rowIndexOffset = 0;
    for (let result = await iterator.next(); !result.done; result = await iterator.next()) {
      if (!this.isActiveLoad(loadVersion)) {
        return;
      }
      await this.appendSourceBatch(props, result.value, batchIndex, rowIndexOffset, loadVersion);
      rowIndexOffset += result.value.numRows;
      batchIndex++;
    }
  }

  private async appendSourceBatch(
    props: ArrowPathLayerProps,
    recordBatch: RecordBatch | undefined,
    batchIndex: number,
    rowIndexOffset: number,
    loadVersion: number
  ): Promise<void> {
    const sourceVectors = resolveArrowPathSourceVectors(PathAttributeModel, {
      data: recordBatch,
      selectors: {
        paths: props.paths,
        colors: props.colors,
        widths: props.widths,
        timestamps: props.timestamps
      }
    });
    const prepared = await ArrowPathRenderer.convertToGPUVectors(
      this.context.device,
      sourceVectors,
      {
        model: 'attribute',
        id: `${props.id}-batch-${batchIndex}`,
        rowIndexBase: rowIndexOffset
      }
    );
    if (!this.isActiveLoad(loadVersion)) {
      prepared.destroy();
      return;
    }

    const constantStyle = createDeckPathConstantStyle(this.context.device, {
      id: `${props.id}-batch-${batchIndex}`,
      hasColors: Boolean(sourceVectors.colors),
      hasWidths: Boolean(sourceVectors.widths),
      color: props.color ?? DEFAULT_PATH_COLOR,
      width: props.width ?? DEFAULT_PATH_WIDTH
    });
    let model: Model;
    try {
      model = ArrowPathRenderer.createModel(this.context.device, {
        ...prepared,
        model: 'attribute',
        id: `${props.id}-batch-${batchIndex}`,
        ...this.getShaders({
          modules: [project32, picking],
          vs: DECK_PATH_VS,
          fs: DECK_PATH_FS
        }),
        shaderLayout: DECK_PATH_SHADER_LAYOUT,
        bufferLayout: constantStyle.bufferLayout,
        attributes: constantStyle.attributes,
        constantAttributes: constantStyle.constantAttributes,
        topology: 'triangle-list',
        vertexCount: 6
      } as never);
    } catch (error) {
      destroyBuffers(constantStyle.buffers);
      prepared.destroy();
      throw error;
    }
    if (!this.isActiveLoad(loadVersion)) {
      model.destroy();
      destroyBuffers(constantStyle.buffers);
      prepared.destroy();
      return;
    }

    const rowCount = sourceVectors.paths.length;
    const batch: ArrowPathLayerBatch = {
      model,
      prepared,
      constantBuffers: constantStyle.buffers,
      batchIndex,
      rowIndexOffset,
      rowCount
    };
    const batches = [...this.getLayerState().batches, batch];
    this.setState({batches, loadVersion} satisfies ArrowPathLayerState);
    this.setNeedsRedraw();
    props.onDataBatch?.({
      loadedBatchCount: batches.length,
      isFirstBatch: batchIndex === 0,
      batchIndex,
      rowIndexOffset,
      rowCount
    });
  }

  private isActiveLoad(loadVersion: number): boolean {
    return this.getLayerState().loadVersion === loadVersion;
  }

  private getLayerState(): ArrowPathLayerState {
    return this.state as ArrowPathLayerState;
  }
}

function createDeckPathConstantStyle(
  device: Device,
  {
    id,
    hasColors,
    hasWidths,
    color,
    width
  }: {
    id: string;
    hasColors: boolean;
    hasWidths: boolean;
    color: ArrowPathColor;
    width: number;
  }
): {
  bufferLayout: BufferLayout[];
  attributes: Record<string, Buffer>;
  constantAttributes: Record<string, TypedArray>;
  buffers: Buffer[];
} {
  const bufferLayout: BufferLayout[] = [];
  const attributes: Record<string, Buffer> = {};
  const constantAttributes: Record<string, TypedArray> = {};
  const buffers: Buffer[] = [];

  if (!hasColors) {
    // WebGL sets integer constant attributes through vertexAttribI4uiv, so retain four lanes.
    // WebGPU consumes the first lane through the zero-stride uint32 layout.
    const value = new Uint32Array([packPathColor(color), 0, 0, 0]);
    bufferLayout.push({
      name: CONSTANT_PATH_COLOR_BUFFER,
      byteStride: 0,
      stepMode: 'instance',
      attributes: [
        {attribute: 'segmentStartColors', format: 'uint32', byteOffset: 0},
        {attribute: 'segmentEndColors', format: 'uint32', byteOffset: 0}
      ]
    });
    if (device.type === 'webgl') {
      constantAttributes['segmentStartColors'] = value;
      constantAttributes['segmentEndColors'] = value;
    } else {
      const buffer = device.createBuffer({id: `${id}-constant-color`, data: value});
      attributes[CONSTANT_PATH_COLOR_BUFFER] = buffer;
      buffers.push(buffer);
    }
  }

  if (!hasWidths) {
    const value = new Float32Array([width]);
    bufferLayout.push({
      name: CONSTANT_PATH_WIDTH_BUFFER,
      byteStride: 0,
      stepMode: 'instance',
      attributes: [{attribute: 'widths', format: 'float32', byteOffset: 0}]
    });
    if (device.type === 'webgl') {
      constantAttributes['widths'] = value;
    } else {
      const buffer = device.createBuffer({id: `${id}-constant-width`, data: value});
      attributes[CONSTANT_PATH_WIDTH_BUFFER] = buffer;
      buffers.push(buffer);
    }
  }

  return {bufferLayout, attributes, constantAttributes, buffers};
}

function packPathColor(color: ArrowPathColor): number {
  const [red, green, blue, alpha] = color.map(component =>
    Math.max(0, Math.min(255, Math.round(component)))
  );
  return (red | (green << 8) | (blue << 16) | (alpha << 24)) >>> 0;
}

function destroyBuffers(buffers: Buffer[]): void {
  for (const buffer of buffers) {
    buffer.destroy();
  }
}

function destroyPathBatches(batches: ArrowPathLayerBatch[]): void {
  for (const batch of batches) {
    batch.model.destroy();
    destroyBuffers(batch.constantBuffers);
    batch.prepared.destroy();
  }
}
