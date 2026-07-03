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
  ArrowPolygonRenderer,
  type ArrowPolygonRendererDataBatchUpdate,
  type ArrowPolygonRendererProps
} from '@luma.gl/arrow';
import type {Model} from '@luma.gl/engine';
import {
  deckArrowViewport,
  DECK_ARROW_ALPHA_BLEND_PARAMETERS,
  DECK_ARROW_WGSL_COLOR_UTILS,
  getViewportAspect,
  setDeckArrowViewport,
  watchDeckArrowModelPipeline
} from './arrow-layer-types';
import type {ArrowLayerPickingInfo} from './arrow-layer-types';
import {POLYGON_STORAGE_SHADER_LAYOUT, type GPURecordBatchSourceInfo} from '@luma.gl/tables';

const DECK_POLYGON_VS = `#version 300 es
precision highp float;
precision highp int;

in vec4 positions;
in vec4 colors;
in uint rowIndices;

uniform polygonViewportUniforms {
  vec2 center;
  float scale;
  float aspect;
} polygonViewport;

out vec4 vColor;

vec3 encodeDeckPickingColor(int objectIndex) {
  int colorIndex = objectIndex + 1;
  return vec3(
    float(colorIndex % 256),
    float((colorIndex / 256) % 256),
    float((colorIndex / 65536) % 256)
  );
}

void main(void) {
  gl_Position = project_position_to_clipspace(positions.xyz, vec3(0.0), vec3(0.0));
  geometry.position = gl_Position;
  geometry.pickingColor = encodeDeckPickingColor(int(rowIndices));
  DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
  vColor = colors;
  DECKGL_FILTER_COLOR(vColor, geometry);
}
`;

const DECK_POLYGON_FS = `#version 300 es
precision highp float;

in vec4 vColor;
out vec4 fragColor;

void main(void) {
  fragColor = vColor;
  DECKGL_FILTER_COLOR(fragColor, geometry);
}
`;

const DECK_POLYGON_WGSL = /* wgsl */ `
${DECK_ARROW_WGSL_COLOR_UTILS}

struct PolygonVertexInputs {
  @location(0) positions: vec4<f32>,
  @location(1) colors: vec4<f32>,
  @location(2) rowIndices: u32,
};

struct PolygonVertexOutputs {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
  @location(1) @interpolate(flat) pickingColor: vec3<f32>,
};

@vertex
fn vertexMain(inputs: PolygonVertexInputs) -> PolygonVertexOutputs {
  var outputs: PolygonVertexOutputs;
  outputs.position = deck_projectPosition(inputs.positions.xyz);
  outputs.color = inputs.colors;
  outputs.pickingColor = deck_encodePickingColor(inputs.rowIndices);
  return outputs;
}

@fragment
fn fragmentMain(inputs: PolygonVertexOutputs) -> @location(0) vec4<f32> {
  return deck_filterColor(inputs.color, inputs.pickingColor);
}
`;

const DECK_POLYGON_STORAGE_WGSL = /* wgsl */ `
${DECK_ARROW_WGSL_COLOR_UTILS}

@group(0) @binding(auto) var<storage, read> polygonPositions: array<vec4<f32>>;
@group(0) @binding(auto) var<storage, read> polygonColors: array<u32>;
@group(0) @binding(auto) var<storage, read> polygonRowIndices: array<u32>;

struct PolygonStorageVertexOutputs {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
  @location(1) @interpolate(flat) pickingColor: vec3<f32>,
};

fn unpackStoragePolygonColor(colorWord: u32) -> vec4<f32> {
  return vec4<f32>(
    f32(colorWord & 255u),
    f32((colorWord >> 8u) & 255u),
    f32((colorWord >> 16u) & 255u),
    f32((colorWord >> 24u) & 255u)
  ) / 255.0;
}

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> PolygonStorageVertexOutputs {
  var outputs: PolygonStorageVertexOutputs;
  outputs.position = deck_projectPosition(polygonPositions[vertexIndex].xyz);
  outputs.color = unpackStoragePolygonColor(polygonColors[vertexIndex]);
  outputs.pickingColor = deck_encodePickingColor(polygonRowIndices[vertexIndex]);
  return outputs;
}

@fragment
fn fragmentMain(inputs: PolygonStorageVertexOutputs) -> @location(0) vec4<f32> {
  return deck_filterColor(inputs.color, inputs.pickingColor);
}
`;

/** Deck-facing props for an Arrow-backed filled polygon layer. */
export type ArrowPolygonLayerProps = Omit<LayerProps, 'data'> &
  ArrowPolygonRendererProps & {
    /** Deck-managed opacity multiplier. */
    opacity?: number;
  };

type ArrowPolygonLayerState = {
  renderer: ArrowPolygonRenderer | null;
  sourceInitialized: boolean;
  sourceInfos: GPURecordBatchSourceInfo[];
};

/** deck.gl layer that keeps polygon columns in Arrow-owned GPU vectors. */
export class ArrowPolygonLayer extends Layer<ArrowPolygonLayerProps> {
  static override layerName = 'ArrowPolygonLayer';
  static override defaultProps = {
    data: {type: 'object', value: null, optional: true},
    parameters: DECK_ARROW_ALPHA_BLEND_PARAMETERS
  };

  override getAttributeManager() {
    return null;
  }

  override setShaderModuleProps(props: Parameters<Model['shaderInputs']['setProps']>[0]): void {
    super.setShaderModuleProps(
      this.context.device.type === 'webgpu'
        ? {layer: props['layer'], picking: props['picking']}
        : {layer: props['layer'], project: props['project'], picking: props['picking']}
    );
  }

  override initializeState({device}: LayerContext): void {
    const rendererProps = this.getRendererProps(this.props);
    const renderer = new ArrowPolygonRenderer(device, {
      ...rendererProps,
      data: null,
      polygons: undefined,
      colors: undefined
    });
    this.setState({
      renderer,
      sourceInitialized: false,
      sourceInfos: []
    } satisfies ArrowPolygonLayerState);
    this.watchRendererPipeline(renderer);
  }

  override updateState(params: UpdateParameters<this>): void {
    const renderer = this.getRenderer();
    const state = this.getLayerState();
    const {props, oldProps, changeFlags} = params;
    const sourceChanged =
      !state.sourceInitialized ||
      changeFlags.dataChanged ||
      props.polygons !== oldProps.polygons ||
      props.colors !== oldProps.colors ||
      props.tessellated !== oldProps.tessellated ||
      props.color !== oldProps.color;
    const modelChanged = props.model !== oldProps.model;

    if (sourceChanged) {
      state.sourceInitialized = true;
      state.sourceInfos = [];
    }

    renderer.setProps(
      sourceChanged
        ? this.getRendererProps(props)
        : modelChanged
          ? {...this.getRendererModelProps(props), center: props.center, scale: props.scale}
          : {
              model: props.model,
              center: props.center,
              scale: props.scale
            }
    );
    this.watchRendererPipeline(renderer);
  }

  override getModels(): Model[] {
    const model = this.getRendererOrNull()?.model;
    return model ? [model] : [];
  }

  override draw({renderPass, context}: Parameters<Layer<ArrowPolygonLayerProps>['draw']>[0]): void {
    const renderer = this.getRenderer();
    const model = renderer.model;
    if (model?.device.type === 'webgpu') {
      setDeckArrowViewport(model, context.viewport);
    }
    renderer.draw(renderPass, {aspect: getViewportAspect(context.viewport)});
  }

  override getPickingInfo({info}: {info: PickingInfo}): ArrowLayerPickingInfo {
    return addArrowPickingInfo(info, this.getLayerState().sourceInfos);
  }

  override finalizeState(context: LayerContext): void {
    this.getRendererOrNull()?.destroy();
    this.setState({
      renderer: null,
      sourceInitialized: true,
      sourceInfos: []
    } satisfies ArrowPolygonLayerState);
    super.finalizeState(context);
  }

  private getRendererProps(props: ArrowPolygonLayerProps): ArrowPolygonRendererProps {
    return {
      ...this.getRendererModelProps(props),
      data: props.data,
      polygons: props.polygons,
      colors: props.colors,
      tessellated: props.tessellated,
      color: props.color,
      center: props.center,
      scale: props.scale,
      onPick: props.onPick,
      onDataBatch: update => this.handleDataBatch(update, props.onDataBatch),
      onDataError: error => {
        if (props.onDataError) {
          props.onDataError(error);
        } else {
          this.raiseError(toError(error), `loading Arrow data in ${this}`);
        }
      }
    };
  }

  private getRendererModelProps(
    props: ArrowPolygonLayerProps
  ): Pick<ArrowPolygonRendererProps, 'model' | 'modelProps'> {
    if (props.model === 'storage' && this.context.device.type !== 'webgpu') {
      throw new Error('ArrowPolygonLayer storage rendering requires WebGPU');
    }
    const useStorageModel = props.model === 'storage';
    return {
      model: useStorageModel ? 'storage' : 'attribute',
      modelProps: this.getShaders(
        this.context.device.type === 'webgpu'
          ? useStorageModel
            ? {
                modules: [deckArrowViewport, picking],
                source: DECK_POLYGON_STORAGE_WGSL,
                shaderLayout: POLYGON_STORAGE_SHADER_LAYOUT
              }
            : {
                modules: [deckArrowViewport, picking],
                source: DECK_POLYGON_WGSL,
                vs: DECK_POLYGON_VS
              }
          : {modules: [project32, picking], vs: DECK_POLYGON_VS, fs: DECK_POLYGON_FS}
      )
    };
  }

  private handleDataBatch(
    update: ArrowPolygonRendererDataBatchUpdate,
    onDataBatch: ArrowPolygonRendererProps['onDataBatch']
  ): void {
    const sourceInfo = update.preparedBatch.sourceInfo;
    this.getLayerState().sourceInfos[sourceInfo.sourceBatchIndex] = sourceInfo;
    this.setNeedsRedraw();
    onDataBatch?.(update);
  }

  private watchRendererPipeline(renderer: ArrowPolygonRenderer): void {
    const model = renderer.model;
    if (!model) return;
    watchDeckArrowModelPipeline(
      model,
      () => {
        if (this.getRendererOrNull() === renderer && renderer.model === model) {
          this.setNeedsRedraw();
        }
      },
      error => {
        if (this.getRendererOrNull() === renderer && renderer.model === model) {
          if (this.props.onDataError) this.props.onDataError(error);
          else this.raiseError(error, `linking Arrow shaders in ${this}`);
        }
      }
    );
  }

  private getRenderer(): ArrowPolygonRenderer {
    const renderer = this.getRendererOrNull();
    if (!renderer) {
      throw new Error('ArrowPolygonLayer renderer is not initialized');
    }
    return renderer;
  }

  private getRendererOrNull(): ArrowPolygonRenderer | null {
    return (this.state as ArrowPolygonLayerState | undefined)?.renderer ?? null;
  }

  private getLayerState(): ArrowPolygonLayerState {
    return this.state as ArrowPolygonLayerState;
  }
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function addArrowPickingInfo(
  info: PickingInfo,
  sourceInfos: readonly GPURecordBatchSourceInfo[]
): ArrowLayerPickingInfo {
  const pickingInfo = info as ArrowLayerPickingInfo;
  const rowIndex = pickingInfo.index;
  const sourceInfo = sourceInfos.find(
    candidate =>
      rowIndex >= candidate.sourceRowIndexOffset &&
      rowIndex < candidate.sourceRowIndexOffset + candidate.sourceRowCount
  );
  if (sourceInfo) {
    pickingInfo.arrow = {
      rowIndex,
      batchIndex: sourceInfo.sourceBatchIndex,
      batchRowIndex: rowIndex - sourceInfo.sourceRowIndexOffset
    };
  }
  return pickingInfo;
}
