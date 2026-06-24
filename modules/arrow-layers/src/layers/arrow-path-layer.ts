// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  Layer,
  picking,
  project32,
  type LayerContext,
  type LayerProps,
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
import type {ShaderLayout} from '@luma.gl/core';
import type {Model} from '@luma.gl/engine';
import {PathAttributeModel} from '@luma.gl/tables';
import {Table, type RecordBatch} from 'apache-arrow';
import {getDeckProjectProps} from './arrow-layer-types';

const DECK_PATH_VS = `#version 300 es
precision highp float;
precision highp int;

in vec4 segmentStartPositions;
in vec4 segmentEndPositions;
in vec4 pathViewOrigins;
in uint rowIndices;

vec3 encodeDeckPickingColor(int objectIndex) {
  int colorIndex = objectIndex + 1;
  return vec3(
    float(colorIndex % 256),
    float((colorIndex / 256) % 256),
    float((colorIndex / 65536) % 256)
  );
}

void main() {
  vec4 pathDelta = gl_VertexID % 2 == 0 ? segmentStartPositions : segmentEndPositions;
  vec3 pathPosition = (pathViewOrigins + pathDelta).xyz;
  gl_Position = project_position_to_clipspace(pathPosition, vec3(0.0), vec3(0.0));
  geometry.position = gl_Position;
  geometry.pickingColor = encodeDeckPickingColor(int(rowIndices));
  DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
  vec4 pathColor = vec4(0.78, 0.86, 0.96, 1.0);
  DECKGL_FILTER_COLOR(pathColor, geometry);
}
`;

const DECK_PATH_FS = `#version 300 es
precision highp float;

out vec4 fragColor;

void main() {
  fragColor = vec4(0.78, 0.86, 0.96, 1.0);
  DECKGL_FILTER_COLOR(fragColor, geometry);
}
`;

const DECK_PATH_SHADER_LAYOUT: ShaderLayout = {
  attributes: [
    {name: 'segmentStartPositions', location: 0, type: 'vec4<f32>', stepMode: 'instance'},
    {name: 'segmentEndPositions', location: 1, type: 'vec4<f32>', stepMode: 'instance'},
    {name: 'pathViewOrigins', location: 2, type: 'vec4<f32>', stepMode: 'instance'},
    {name: 'rowIndices', location: 3, type: 'u32', stepMode: 'instance'}
  ],
  bindings: []
};

/** Deck-facing props for an Arrow-backed path layer. */
export type ArrowPathLayerProps = Omit<LayerProps, 'data'> &
  ArrowPathSourceVectorSelectors & {
    /** Arrow table or preserved record-batch source. */
    data?: ArrowRecordBatchSource | null;
    /** Deck projection currently requires the attribute-backed path model. */
    model?: 'attribute' | 'auto';
    /** Called after a streamed record batch has been incorporated. */
    onDataBatch?: (update: {loadedBatchCount: number; isFirstBatch: boolean}) => void;
    /** Called when layer-owned Arrow loading or preparation fails. */
    onDataError?: (error: unknown) => void;
  };

type ArrowPathLayerState = {
  model: Model | null;
  prepared: PreparedArrowPathRendererGPUVectors | null;
  loadVersion: number;
};

/** deck.gl layer that converts Arrow path vectors directly into luma GPU vectors. */
export class ArrowPathLayer extends Layer<ArrowPathLayerProps> {
  static override layerName = 'ArrowPathLayer';

  override getAttributeManager() {
    return null;
  }

  override initializeState(): void {
    this.setState({model: null, prepared: null, loadVersion: 0} satisfies ArrowPathLayerState);
    void this.loadSource(this.props);
  }

  override updateState({props, oldProps, changeFlags}: UpdateParameters<this>): void {
    if (
      changeFlags.dataChanged ||
      props.paths !== oldProps.paths ||
      props.colors !== oldProps.colors ||
      props.widths !== oldProps.widths ||
      props.timestamps !== oldProps.timestamps ||
      props.model !== oldProps.model
    ) {
      void this.loadSource(props);
    }
  }

  override getModels(): Model[] {
    // Arrow renderers own their models and bind GPUVector inputs immediately
    // before drawing. Exposing them here makes Deck inject its shader modules
    // and rewrite model parameters as if they were Deck-managed models.
    return [];
  }

  override draw({
    renderPass,
    context,
    shaderModuleProps
  }: Parameters<Layer<ArrowPathLayerProps>['draw']>[0]): void {
    const model = this.getLayerState().model;
    if (!model) {
      return;
    }
    model.shaderInputs.setProps({
      project: getDeckProjectProps(this, context),
      picking: shaderModuleProps.picking
    });
    model.predraw(context.device.commandEncoder);
    model.draw(renderPass);
  }

  override finalizeState(context: LayerContext): void {
    const state = this.getLayerState();
    state.loadVersion++;
    this.destroyPreparedState(state);
    this.setState({
      model: null,
      prepared: null,
      loadVersion: state.loadVersion
    } satisfies ArrowPathLayerState);
    super.finalizeState(context);
  }

  private async loadSource(props: ArrowPathLayerProps): Promise<void> {
    const state = this.getLayerState();
    const loadVersion = state.loadVersion + 1;
    state.loadVersion = loadVersion;
    try {
      const recordBatches = await this.getRecordBatches(props);
      if (!this.isActiveLoad(loadVersion)) {
        return;
      }
      const table = recordBatches ? new Table(recordBatches) : undefined;
      const modelKind = this.resolveModel();
      const sourceVectors = resolveArrowPathSourceVectors(PathAttributeModel, {
        data: table,
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
          model: modelKind,
          id: props.id
        }
      );
      if (!this.isActiveLoad(loadVersion)) {
        prepared.destroy();
        return;
      }
      const model = ArrowPathRenderer.createModel(this.context.device, {
        ...prepared,
        model: modelKind,
        ...this.getShaders({
          modules: [project32, picking],
          vs: DECK_PATH_VS,
          fs: DECK_PATH_FS
        }),
        shaderLayout: DECK_PATH_SHADER_LAYOUT
      } as never);
      const previousModel = this.getLayerState().model;
      const previousPrepared = this.getLayerState().prepared;
      this.setState({model, prepared, loadVersion} satisfies ArrowPathLayerState);
      previousModel?.destroy();
      previousPrepared?.destroy();
      this.setNeedsRedraw();
      if (recordBatches) {
        props.onDataBatch?.({
          loadedBatchCount: recordBatches.length,
          isFirstBatch: true
        });
      }
    } catch (error) {
      if (this.isActiveLoad(loadVersion)) {
        props.onDataError?.(error);
      }
    }
  }

  private async getRecordBatches(props: ArrowPathLayerProps): Promise<RecordBatch[] | undefined> {
    if (!props.data) {
      return undefined;
    }
    const batches: RecordBatch[] = [];
    const iterator = getArrowRecordBatchAsyncIterator(props.data);
    for (let result = await iterator.next(); !result.done; result = await iterator.next()) {
      batches.push(result.value);
    }
    return batches;
  }

  private resolveModel(): 'attribute' {
    return 'attribute';
  }

  private isActiveLoad(loadVersion: number): boolean {
    return this.getLayerState().loadVersion === loadVersion;
  }

  private destroyPreparedState(state: ArrowPathLayerState): void {
    state.model?.destroy();
    state.prepared?.destroy();
  }

  private getLayerState(): ArrowPathLayerState {
    return this.state as ArrowPathLayerState;
  }
}
