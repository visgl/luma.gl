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
  ArrowTextRenderer,
  type ArrowTextRendererDataBatchUpdate,
  type ArrowTextRendererProps
} from '@luma.gl/arrow';
import type {ShaderLayout} from '@luma.gl/core';
import type {Model} from '@luma.gl/engine';
import type {GPURecordBatchSourceInfo} from '@luma.gl/tables';
import {DECK_ARROW_ALPHA_BLEND_PARAMETERS} from './arrow-layer-types';
import type {ArrowLayerPickingInfo} from './arrow-layer-types';

const DECK_TEXT_VS = `#version 300 es
precision highp float;
precision highp int;

in vec2 positions;
in ivec2 glyphOffsets;
in uvec4 glyphFrames;
in uint rowIndices;
in ivec4 glyphClipRects;
in vec4 colors;
in float angles;
in float sizes;
in vec2 pixelOffsets;

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
  float rowSize = sizes;
  float rowAngle = radians(angles);
  vec2 glyphPixelOffset = glyphVertexOffset * textViewport.glyphWorldScale * (rowSize / 32.0);
  mat2 rowRotation = mat2(cos(rowAngle), sin(rowAngle), -sin(rowAngle), cos(rowAngle));
  glyphPixelOffset = rowRotation * glyphPixelOffset + pixelOffsets;
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

function getDeckTextVertexShader(props: ArrowTextLayerProps): string {
  const colorsEnabled = props.colors !== undefined && props.colors !== null;
  const clippingEnabled = props.clipRects !== undefined && props.clipRects !== null;
  const anglesEnabled = props.angles !== undefined && props.angles !== null;
  const sizesEnabled = props.sizes !== undefined && props.sizes !== null;
  const pixelOffsetsEnabled = props.pixelOffsets !== undefined && props.pixelOffsets !== null;
  const color = props.color ?? [199, 219, 245, 255];
  const constantColor = color.map(component => component / 255).join(', ');
  let shader = DECK_TEXT_VS.replace(
    'vec4 neutralTextColor = vec4(0.78, 0.86, 0.96, 1.0);',
    `vec4 neutralTextColor = vec4(${constantColor});`
  );
  if (!colorsEnabled) {
    shader = shader
      .replace(`in vec4 colors;\n`, ``)
      .replace(
        '  vTextColor = mix(neutralTextColor, colors, textViewport.colorsEnabled);',
        '  vTextColor = neutralTextColor;'
      );
  }
  if (!clippingEnabled) {
    shader = shader.replace(`in ivec4 glyphClipRects;\n`, ``).replace(
      `  gl_Position = textViewport.clippingEnabled > 0.5 &&
    isGlyphVertexClipped(glyphVertexOffset, glyphClipRects)
    ? vec4(0.0)
    : clipPosition;`,
      '  gl_Position = clipPosition;'
    );
  }
  if (!anglesEnabled) {
    shader = shader
      .replace(`in float angles;\n`, ``)
      .replace(
        '  float rowAngle = radians(angles);',
        `  float rowAngle = radians(${(props.angle ?? 0).toFixed(1)});`
      );
  }
  if (!sizesEnabled) {
    shader = shader
      .replace(`in float sizes;\n`, ``)
      .replace('  float rowSize = sizes;', `  float rowSize = ${(props.size ?? 32).toFixed(1)};`);
  }
  if (!pixelOffsetsEnabled) {
    shader = shader
      .replace(`in vec2 pixelOffsets;\n`, ``)
      .replace(
        '  glyphPixelOffset = rowRotation * glyphPixelOffset + pixelOffsets;',
        '  glyphPixelOffset = rowRotation * glyphPixelOffset;'
      );
  }
  return shader;
}

function getDeckTextShaderLayout(props: ArrowTextLayerProps): ShaderLayout {
  return {
    attributes: [
      {name: 'positions', location: 0, type: 'vec2<f32>', stepMode: 'instance'},
      {name: 'glyphOffsets', location: 1, type: 'vec2<i32>', stepMode: 'instance'},
      {name: 'glyphFrames', location: 2, type: 'vec4<u32>', stepMode: 'instance'},
      {name: 'rowIndices', location: 3, type: 'u32', stepMode: 'instance'},
      ...(props.clipRects !== undefined && props.clipRects !== null
        ? ([
            {name: 'glyphClipRects', location: 4, type: 'vec4<i32>', stepMode: 'instance'}
          ] as const)
        : []),
      ...(props.colors !== undefined && props.colors !== null
        ? ([{name: 'colors', location: 5, type: 'vec4<f32>', stepMode: 'instance'}] as const)
        : []),
      ...(props.angles !== undefined && props.angles !== null
        ? ([{name: 'angles', location: 6, type: 'f32', stepMode: 'instance'}] as const)
        : []),
      ...(props.sizes !== undefined && props.sizes !== null
        ? ([{name: 'sizes', location: 7, type: 'f32', stepMode: 'instance'}] as const)
        : []),
      ...(props.pixelOffsets !== undefined && props.pixelOffsets !== null
        ? ([{name: 'pixelOffsets', location: 8, type: 'vec2<f32>', stepMode: 'instance'}] as const)
        : [])
    ],
    bindings: []
  };
}

/** Deck-facing props for an Arrow-backed text layer. */
export type ArrowTextLayerProps = Omit<LayerProps, 'data'> & ArrowTextRendererProps;

type ArrowTextLayerState = {
  renderer: ArrowTextRenderer | null;
  loadVersion: number;
  sourceInfos: GPURecordBatchSourceInfo[];
};

/** deck.gl layer that keeps text columns in Arrow-owned GPU vectors. */
export class ArrowTextLayer extends Layer<ArrowTextLayerProps> {
  static override layerName = 'ArrowTextLayer';
  static override defaultProps = {parameters: DECK_ARROW_ALPHA_BLEND_PARAMETERS};

  override getAttributeManager() {
    return null;
  }

  override initializeState(): void {
    this.setState({renderer: null, loadVersion: 0, sourceInfos: []} satisfies ArrowTextLayerState);
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
      props.alignmentBaselines !== oldProps.alignmentBaselines ||
      props.color !== oldProps.color ||
      props.angle !== oldProps.angle ||
      props.size !== oldProps.size;

    if (sourceChanged) {
      this.getLayerState().sourceInfos = [];
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

  override getModels(): Model[] {
    const model = this.getRendererOrNull()?.model;
    return model ? [model] : [];
  }

  override draw({renderPass, context}: Parameters<Layer<ArrowTextLayerProps>['draw']>[0]): void {
    const renderer = this.getRendererOrNull();
    if (!renderer) {
      return;
    }
    renderer.shaderInputs.setProps({
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

  override getPickingInfo({info}: {info: PickingInfo}): ArrowLayerPickingInfo {
    const pickingInfo = info as ArrowLayerPickingInfo;
    const rowIndex = pickingInfo.index;
    const sourceInfo = this.getLayerState().sourceInfos.find(
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

  override finalizeState(context: LayerContext): void {
    const state = this.getLayerState();
    state.loadVersion++;
    state.renderer?.destroy();
    this.setState({
      renderer: null,
      loadVersion: state.loadVersion,
      sourceInfos: []
    } satisfies ArrowTextLayerState);
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
        attributeShaderLayout: getDeckTextShaderLayout(props),
        modelProps: {
          ...this.getShaders({
            modules: [project32, picking],
            vs: getDeckTextVertexShader(props),
            fs: DECK_TEXT_FS
          })
        },
        onDataBatch: update => this.handleDataBatch(update, props.onDataBatch)
      });
      if (this.getLayerState().loadVersion !== loadVersion) {
        renderer.destroy();
        return;
      }
      const previousRenderer = this.getRendererOrNull();
      this.setState({
        renderer,
        loadVersion,
        sourceInfos: this.getLayerState().sourceInfos
      } satisfies ArrowTextLayerState);
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
    let sourceRowIndexOffset = 0;
    this.getLayerState().sourceInfos = update.textInput.sourceVectors.positions.data.map(
      (data, sourceBatchIndex) => {
        const sourceInfo = {
          sourceBatchIndex,
          sourceRowIndexOffset,
          sourceRowCount: data.length
        };
        sourceRowIndexOffset += data.length;
        return sourceInfo;
      }
    );
    this.setNeedsRedraw();
    onDataBatch?.(update);
  }

  private getRendererOrNull(): ArrowTextRenderer | null {
    return (this.state as ArrowTextLayerState | undefined)?.renderer ?? null;
  }

  private getLayerState(): ArrowTextLayerState {
    return this.state as ArrowTextLayerState;
  }
}
