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
  ArrowPolygonRenderer,
  type ArrowPolygonRendererDataBatchUpdate,
  type ArrowPolygonRendererProps
} from '@luma.gl/arrow';
import type {Model} from '@luma.gl/engine';
import {DECK_ARROW_ALPHA_BLEND_PARAMETERS, getViewportAspect} from './arrow-layer-types';

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

/** Deck-facing props for an Arrow-backed filled polygon layer. */
export type ArrowPolygonLayerProps = Omit<LayerProps, 'data'> &
  ArrowPolygonRendererProps & {
    /** Deck-managed opacity multiplier. */
    opacity?: number;
  };

type ArrowPolygonLayerState = {
  renderer: ArrowPolygonRenderer | null;
};

/** deck.gl layer that keeps polygon columns in Arrow-owned GPU vectors. */
export class ArrowPolygonLayer extends Layer<ArrowPolygonLayerProps> {
  static override layerName = 'ArrowPolygonLayer';
  static override defaultProps = {parameters: DECK_ARROW_ALPHA_BLEND_PARAMETERS};

  override getAttributeManager() {
    return null;
  }

  override initializeState({device}: LayerContext): void {
    this.setState({
      renderer: new ArrowPolygonRenderer(device, this.getRendererProps(this.props))
    } satisfies ArrowPolygonLayerState);
  }

  override updateState(params: UpdateParameters<this>): void {
    const renderer = this.getRenderer();
    const {props, oldProps, changeFlags} = params;
    const sourceChanged =
      changeFlags.dataChanged ||
      props.polygons !== oldProps.polygons ||
      props.colors !== oldProps.colors ||
      props.tessellated !== oldProps.tessellated ||
      props.color !== oldProps.color;

    renderer.setProps(
      sourceChanged
        ? this.getRendererProps(props)
        : {
            model: props.model,
            center: props.center,
            scale: props.scale
          }
    );
  }

  override getModels(): Model[] {
    const model = this.getRendererOrNull()?.model;
    return model ? [model] : [];
  }

  override draw({renderPass, context}: Parameters<Layer<ArrowPolygonLayerProps>['draw']>[0]): void {
    const renderer = this.getRenderer();
    renderer.predraw(context.device.commandEncoder);
    renderer.draw(renderPass, {aspect: getViewportAspect(context.viewport)});
  }

  override finalizeState(context: LayerContext): void {
    this.getRendererOrNull()?.destroy();
    this.setState({renderer: null} satisfies ArrowPolygonLayerState);
    super.finalizeState(context);
  }

  private getRendererProps(props: ArrowPolygonLayerProps): ArrowPolygonRendererProps {
    return {
      model: props.model,
      data: props.data,
      polygons: props.polygons,
      colors: props.colors,
      tessellated: props.tessellated,
      color: props.color,
      center: props.center,
      scale: props.scale,
      onPick: props.onPick,
      modelProps: this.getShaders({
        modules: [project32, picking],
        vs: DECK_POLYGON_VS,
        fs: DECK_POLYGON_FS
      }),
      onDataBatch: update => this.handleDataBatch(update, props.onDataBatch),
      onDataError: props.onDataError
    };
  }

  private handleDataBatch(
    update: ArrowPolygonRendererDataBatchUpdate,
    onDataBatch: ArrowPolygonRendererProps['onDataBatch']
  ): void {
    this.setNeedsRedraw();
    onDataBatch?.(update);
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
}
