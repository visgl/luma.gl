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
  ArrowTextRenderer,
  type ArrowTextRendererDataBatchUpdate,
  type ArrowTextRendererProps
} from '@luma.gl/arrow';
import {getDeckProjectProps} from './arrow-layer-types';

const DECK_TEXT_VS = `#version 300 es
precision highp float;
precision highp int;

in vec2 positions;
in ivec2 glyphOffsets;
in uvec4 glyphFrames;
in uint rowIndices;
in ivec4 glyphClipRects;
in vec4 colors;

layout(std140) uniform textViewportUniforms {
  vec2 cameraOffset;
  vec2 viewportScale;
  float glyphWorldScale;
  float time;
  float clippingEnabled;
  float colorsEnabled;
} textViewport;

uniform sampler2D fontAtlasTexture;
out vec2 vTextureCoordinate;
out vec4 vTextColor;

vec3 encodeDeckPickingColor(int objectIndex) {
  int colorIndex = objectIndex + 1;
  return vec3(
    float(colorIndex % 256),
    float((colorIndex / 256) % 256),
    float((colorIndex / 65536) % 256)
  );
}

vec2 getCorner(int vertexIndex) {
  if (vertexIndex == 0) return vec2(0.0, 0.0);
  if (vertexIndex == 1) return vec2(1.0, 0.0);
  if (vertexIndex == 2) return vec2(1.0, 1.0);
  if (vertexIndex == 3) return vec2(0.0, 0.0);
  if (vertexIndex == 4) return vec2(1.0, 1.0);
  return vec2(0.0, 1.0);
}

bool isGlyphVertexClipped(vec2 glyphVertexOffset, ivec4 clipRect) {
  if (clipRect.z >= 0) {
    float clipMinX = float(clipRect.x);
    float clipMaxX = clipMinX + float(clipRect.z);
    if (glyphVertexOffset.x < clipMinX || glyphVertexOffset.x > clipMaxX) {
      return true;
    }
  }
  if (clipRect.w >= 0) {
    float clipMinY = float(clipRect.y);
    float clipMaxY = clipMinY + float(clipRect.w);
    if (glyphVertexOffset.y < clipMinY || glyphVertexOffset.y > clipMaxY) {
      return true;
    }
  }
  return false;
}

void main() {
  vec2 corner = getCorner(gl_VertexID % 6);
  vec4 glyphFrame = vec4(glyphFrames);
  vec2 glyphOffset = vec2(glyphOffsets);
  vec2 glyphSize = glyphFrame.zw;
  vec2 glyphVertexOffset = glyphOffset + corner * glyphSize;
  vec2 glyphPixelOffset = glyphVertexOffset * textViewport.glyphWorldScale;
  vec4 clipPosition = project_position_to_clipspace(vec3(positions, 0.0), vec3(0.0), vec3(0.0));
  clipPosition.xy += project_pixel_size_to_clipspace(glyphPixelOffset) * clipPosition.w;
  vec2 atlasSize = vec2(textureSize(fontAtlasTexture, 0));
  vec2 atlasCorner = vec2(corner.x, 1.0 - corner.y);
  vec2 atlasPixel = glyphFrame.xy + atlasCorner * glyphSize;

  gl_Position = textViewport.clippingEnabled > 0.5 &&
    isGlyphVertexClipped(glyphVertexOffset, glyphClipRects)
    ? vec4(0.0)
    : clipPosition;
  geometry.position = gl_Position;
  geometry.pickingColor = encodeDeckPickingColor(int(rowIndices));
  DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
  vTextureCoordinate = atlasPixel / atlasSize;
  vec4 neutralTextColor = vec4(0.78, 0.86, 0.96, 1.0);
  vTextColor = mix(neutralTextColor, colors, textViewport.colorsEnabled);
  DECKGL_FILTER_COLOR(vTextColor, geometry);
}
`;

const DECK_TEXT_FS = `#version 300 es
precision highp float;

uniform sampler2D fontAtlasTexture;

in vec2 vTextureCoordinate;
in vec4 vTextColor;
out vec4 fragColor;

void main() {
  float sampledAlpha = texture(fontAtlasTexture, vTextureCoordinate).a;
  float glyphAlpha = smoothstep(0.68, 0.82, sampledAlpha);
  fragColor = vec4(vTextColor.rgb, vTextColor.a * glyphAlpha);
  DECKGL_FILTER_COLOR(fragColor, geometry);
}
`;

function getDeckTextVertexShader(colorsEnabled: boolean): string {
  if (colorsEnabled) {
    return DECK_TEXT_VS;
  }
  return DECK_TEXT_VS.replace(`in vec4 colors;\n`, ``).replace(
    '  vTextColor = mix(neutralTextColor, colors, textViewport.colorsEnabled);',
    '  vTextColor = neutralTextColor;'
  );
}

/** Deck-facing props for an Arrow-backed text layer. */
export type ArrowTextLayerProps = Omit<LayerProps, 'data'> & ArrowTextRendererProps;

type ArrowTextLayerState = {
  renderer: ArrowTextRenderer | null;
  loadVersion: number;
};

/** deck.gl layer that keeps text columns in Arrow-owned GPU vectors. */
export class ArrowTextLayer extends Layer<ArrowTextLayerProps> {
  static override layerName = 'ArrowTextLayer';

  override getAttributeManager() {
    return null;
  }

  override initializeState(): void {
    this.setState({renderer: null, loadVersion: 0} satisfies ArrowTextLayerState);
    void this.createRenderer(this.props);
  }

  override updateState(params: UpdateParameters<this>): void {
    const {props, oldProps, changeFlags} = params;
    const sourceChanged =
      changeFlags.dataChanged ||
      props.positions !== oldProps.positions ||
      props.texts !== oldProps.texts ||
      props.clipRects !== oldProps.clipRects ||
      props.colors !== oldProps.colors ||
      props.angles !== oldProps.angles ||
      props.sizes !== oldProps.sizes ||
      props.pixelOffsets !== oldProps.pixelOffsets ||
      props.textAnchors !== oldProps.textAnchors ||
      props.alignmentBaselines !== oldProps.alignmentBaselines;

    if (sourceChanged) {
      void this.createRenderer(props);
      return;
    }

    const renderer = this.getRendererOrNull();
    if (renderer) {
      void renderer.setProps({
        model: props.model,
        characterSet: props.characterSet,
        fontSettings: props.fontSettings,
        color: props.color,
        angle: props.angle,
        size: props.size
      });
    }
  }

  override getModels() {
    // The renderer owns text model bindings and shader inputs.
    return [];
  }

  override draw({
    renderPass,
    context,
    shaderModuleProps
  }: Parameters<Layer<ArrowTextLayerProps>['draw']>[0]): void {
    const renderer = this.getRendererOrNull();
    if (!renderer) {
      return;
    }
    renderer.shaderInputs.setProps({
      project: getDeckProjectProps(this, context),
      picking: shaderModuleProps.picking,
      textViewport: {
        cameraOffset: [0, 0],
        viewportScale: [
          2 / Math.max(context.viewport.width, 1),
          2 / Math.max(context.viewport.height, 1)
        ],
        glyphWorldScale: 0.36,
        time: 0,
        clippingEnabled: this.props.clipRects === null ? 0 : 1,
        colorsEnabled: this.props.colors === null ? 0 : 1
      }
    } as never);
    renderer.predraw(context.device.commandEncoder);
    renderer.draw(renderPass);
  }

  override finalizeState(context: LayerContext): void {
    const state = this.getLayerState();
    state.loadVersion++;
    state.renderer?.destroy();
    this.setState({renderer: null, loadVersion: state.loadVersion} satisfies ArrowTextLayerState);
    super.finalizeState(context);
  }

  private async createRenderer(props: ArrowTextLayerProps): Promise<void> {
    const state = this.getLayerState();
    const loadVersion = state.loadVersion + 1;
    state.loadVersion = loadVersion;
    try {
      const renderer = await ArrowTextRenderer.create(this.context.device, {
        ...props,
        model: 'attribute',
        modelProps: this.getShaders({
          modules: [project32, picking],
          vs: getDeckTextVertexShader(props.colors !== undefined && props.colors !== null),
          fs: DECK_TEXT_FS
        }),
        onDataBatch: update => this.handleDataBatch(update, props.onDataBatch)
      });
      if (this.getLayerState().loadVersion !== loadVersion) {
        renderer.destroy();
        return;
      }
      const previousRenderer = this.getRendererOrNull();
      this.setState({renderer, loadVersion} satisfies ArrowTextLayerState);
      previousRenderer?.destroy();
      this.setNeedsRedraw();
    } catch (error) {
      if (this.getLayerState().loadVersion === loadVersion) {
        props.onDataError?.(error);
      }
    }
  }

  private handleDataBatch(
    update: ArrowTextRendererDataBatchUpdate,
    onDataBatch: ArrowTextRendererProps['onDataBatch']
  ): void {
    this.setNeedsRedraw();
    onDataBatch?.(update);
  }

  private getRendererOrNull(): ArrowTextRenderer | null {
    return this.getLayerState().renderer;
  }

  private getLayerState(): ArrowTextLayerState {
    return this.state as ArrowTextLayerState;
  }
}
