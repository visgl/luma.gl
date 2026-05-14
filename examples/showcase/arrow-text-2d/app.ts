// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {makeArrowFixedSizeListVector} from '@luma.gl/arrow';
import {type Device, type ShaderLayout} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {
  AnimationLoopTemplate,
  Model,
  PickingManager,
  ShaderInputs,
  indexColorPicking,
  indexPicking,
  picking,
  supportsIndexPicking
} from '@luma.gl/engine';
import {ShaderModule} from '@luma.gl/shadertools';
import {ArrowTextModel} from '@luma.gl/text';
import * as arrow from 'apache-arrow';

export const title = 'Arrow 2D Text';
export const description =
  'One million generated Arrow UTF-8 labels expanded into GPU glyph instances.';

const LABEL_COUNT = 1_000_000;
const LABEL_COLUMN_COUNT = 400;
const LABEL_ROW_COUNT = LABEL_COUNT / LABEL_COLUMN_COUNT;
const LABEL_COLUMN_SPACING = 540;
const LABEL_ROW_SPACING = 112;
const LABEL_FIELD_WIDTH = LABEL_COLUMN_COUNT * LABEL_COLUMN_SPACING;
const LABEL_FIELD_HEIGHT = LABEL_ROW_COUNT * LABEL_ROW_SPACING;
const GLYPH_WORLD_SCALE = 0.36;
const VIEW_HEIGHT = 820;
const LABEL_CLIP_WIDTH = 720;
const CHARACTER_SET = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/-';
const ANIMATE_TOGGLE_ID = 'arrow-text-2d-animate';
const CLIPPING_TOGGLE_ID = 'arrow-text-2d-clipping';
const ATTRIBUTE_BUILD_TIME_ID = 'arrow-text-2d-attribute-build-time';
const ATTRIBUTE_SIZE_ID = 'arrow-text-2d-attribute-size';
const DECK_ATTRIBUTE_SIZE_ID = 'arrow-text-2d-deck-attribute-size';
const PICKED_LABEL_ID = 'arrow-text-2d-picked-label';
const INITIAL_ANIMATION_DELTA_SECONDS = 1 / 60;
const MAX_ANIMATION_DELTA_SECONDS = 1 / 30;
const ANIMATION_DELTA_SMOOTHING = 0.12;
// IconLayer + MultiIconLayer character attributes, assuming float32 positions in the active path.
const DECK_CHARACTER_ATTRIBUTE_BYTES_PER_GLYPH = 80;

const TEXT_SHADER_LAYOUT = {
  attributes: [
    {name: 'positions', location: 0, type: 'vec2<f32>', stepMode: 'instance'},
    {name: 'glyphOffsets', location: 1, type: 'vec2<i32>', stepMode: 'instance'},
    {name: 'glyphFrames', location: 2, type: 'vec4<u32>', stepMode: 'instance'},
    {name: 'rowIndices', location: 3, type: 'u32', stepMode: 'instance'},
    {name: 'glyphClipRects', location: 4, type: 'vec4<i32>', stepMode: 'instance'}
  ],
  bindings: []
} satisfies ShaderLayout;

const WGSL_SHADER = /* wgsl */ `\
struct TextViewportUniforms {
  cameraOffset : vec2<f32>,
  viewportScale : vec2<f32>,
  glyphWorldScale : f32,
  time : f32,
  clippingEnabled : f32,
};

@group(0) @binding(auto) var<uniform> textViewport : TextViewportUniforms;
@group(0) @binding(auto) var fontAtlasTexture : texture_2d<f32>;
@group(0) @binding(auto) var fontAtlasTextureSampler : sampler;
struct VertexInputs {
  @builtin(vertex_index) vertexIndex : u32,
  @location(0) positions : vec2<f32>,
  @location(1) glyphOffsets : vec2<i32>,
  @location(2) glyphFrames : vec4<u32>,
  @location(3) rowIndices : u32,
  @location(4) glyphClipRects : vec4<i32>,
};

struct FragmentInputs {
  @builtin(position) Position : vec4<f32>,
  @location(0) textureCoordinate : vec2<f32>,
  @location(1) labelTone : f32,
  @interpolate(flat)
  @location(2) objectIndex : i32,
};

struct PickingFragmentOutputs {
  @location(0) fragColor : vec4<f32>,
  @location(1) pickingColor : vec2<i32>,
};

fn getCorner(vertexIndex : u32) -> vec2<f32> {
  if (vertexIndex == 0u) { return vec2<f32>(0.0, 0.0); }
  if (vertexIndex == 1u) { return vec2<f32>(1.0, 0.0); }
  if (vertexIndex == 2u) { return vec2<f32>(1.0, 1.0); }
  if (vertexIndex == 3u) { return vec2<f32>(0.0, 0.0); }
  if (vertexIndex == 4u) { return vec2<f32>(1.0, 1.0); }
  return vec2<f32>(0.0, 1.0);
}

fn isGlyphVertexClipped(glyphVertexOffset : vec2<f32>, clipRect : vec4<i32>) -> bool {
  if (clipRect.z >= 0) {
    let clipMinX = f32(clipRect.x);
    let clipMaxX = clipMinX + f32(clipRect.z);
    if (glyphVertexOffset.x < clipMinX || glyphVertexOffset.x > clipMaxX) {
      return true;
    }
  }
  if (clipRect.w >= 0) {
    let clipMinY = f32(clipRect.y);
    let clipMaxY = clipMinY + f32(clipRect.w);
    if (glyphVertexOffset.y < clipMinY || glyphVertexOffset.y > clipMaxY) {
      return true;
    }
  }
  return false;
}

@vertex
fn vertexMain(inputs : VertexInputs) -> FragmentInputs {
  var outputs : FragmentInputs;
  let corner = getCorner(inputs.vertexIndex % 6u);
  let glyphFrame = vec4<f32>(inputs.glyphFrames);
  let glyphOffset = vec2<f32>(inputs.glyphOffsets);
  let glyphSize = glyphFrame.zw;
  let glyphVertexOffset = glyphOffset + corner * glyphSize;
  let glyphWorldOffset = glyphVertexOffset * textViewport.glyphWorldScale;
  let worldPosition = inputs.positions + glyphWorldOffset;
  let clipPosition = (worldPosition - textViewport.cameraOffset) * textViewport.viewportScale;
  let atlasSize = vec2<f32>(textureDimensions(fontAtlasTexture));
  let atlasCorner = vec2<f32>(corner.x, 1.0 - corner.y);
  let atlasPixel = glyphFrame.xy + atlasCorner * glyphSize;

  outputs.Position = select(
    vec4<f32>(clipPosition, 0.0, 1.0),
    vec4<f32>(0.0),
    textViewport.clippingEnabled > 0.5 &&
    isGlyphVertexClipped(glyphVertexOffset, inputs.glyphClipRects)
  );
  outputs.textureCoordinate = atlasPixel / atlasSize;
  outputs.labelTone = 0.5 + 0.5 * sin(inputs.positions.y * 0.016 + textViewport.time * 0.5);
  outputs.objectIndex = i32(inputs.rowIndices);
  return outputs;
}

@fragment
fn fragmentMain(inputs : FragmentInputs) -> @location(0) vec4<f32> {
  let sampledAlpha = textureSample(fontAtlasTexture, fontAtlasTextureSampler, inputs.textureCoordinate).a;
  let glyphAlpha = smoothstep(0.68, 0.82, sampledAlpha);
  let coolText = vec3<f32>(0.62, 0.88, 1.0);
  let warmText = vec3<f32>(1.0, 0.95, 0.72);
  let textColor = mix(coolText, warmText, inputs.labelTone);
  let fragColor = vec4<f32>(textColor, glyphAlpha);
  return picking_filterHighlightColor(fragColor, inputs.objectIndex);
}

@fragment
fn fragmentPicking(inputs : FragmentInputs) -> PickingFragmentOutputs {
  let sampledAlpha = textureSample(fontAtlasTexture, fontAtlasTextureSampler, inputs.textureCoordinate).a;
  if (sampledAlpha <= 0.68) {
    discard;
  }
  var outputs : PickingFragmentOutputs;
  outputs.fragColor = vec4<f32>(0.0, 0.0, 0.0, 0.0);
  outputs.pickingColor = picking_getPickingColor(inputs.objectIndex);
  return outputs;
}
`;

const VS_GLSL = /* glsl */ `\
#version 300 es
precision highp float;
precision highp int;

in vec2 positions;
in ivec2 glyphOffsets;
in uvec4 glyphFrames;
in uint rowIndices;
in ivec4 glyphClipRects;

layout(std140) uniform textViewportUniforms {
  vec2 cameraOffset;
  vec2 viewportScale;
  float glyphWorldScale;
  float time;
  float clippingEnabled;
} textViewport;

uniform sampler2D fontAtlasTexture;
out vec2 vTextureCoordinate;
out float vLabelTone;

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
  picking_setObjectIndex(int(rowIndices));
  vec2 corner = getCorner(gl_VertexID % 6);
  vec4 glyphFrame = vec4(glyphFrames);
  vec2 glyphOffset = vec2(glyphOffsets);
  vec2 glyphSize = glyphFrame.zw;
  vec2 glyphVertexOffset = glyphOffset + corner * glyphSize;
  vec2 glyphWorldOffset = glyphVertexOffset * textViewport.glyphWorldScale;
  vec2 worldPosition = positions + glyphWorldOffset;
  vec2 clipPosition = (worldPosition - textViewport.cameraOffset) * textViewport.viewportScale;
  vec2 atlasSize = vec2(textureSize(fontAtlasTexture, 0));
  vec2 atlasCorner = vec2(corner.x, 1.0 - corner.y);
  vec2 atlasPixel = glyphFrame.xy + atlasCorner * glyphSize;

  gl_Position = textViewport.clippingEnabled > 0.5 &&
    isGlyphVertexClipped(glyphVertexOffset, glyphClipRects)
    ? vec4(0.0)
    : vec4(clipPosition, 0.0, 1.0);
  vTextureCoordinate = atlasPixel / atlasSize;
  vLabelTone = 0.5 + 0.5 * sin(positions.y * 0.016 + textViewport.time * 0.5);
}
`;

const FS_GLSL = /* glsl */ `\
#version 300 es
precision highp float;

uniform sampler2D fontAtlasTexture;

in vec2 vTextureCoordinate;
in float vLabelTone;
out vec4 fragColor;

void main() {
  float sampledAlpha = texture(fontAtlasTexture, vTextureCoordinate).a;
  float glyphAlpha = smoothstep(0.68, 0.82, sampledAlpha);
  vec3 coolText = vec3(0.62, 0.88, 1.0);
  vec3 warmText = vec3(1.0, 0.95, 0.72);
  vec3 textColor = mix(coolText, warmText, vLabelTone);
  fragColor = vec4(textColor, glyphAlpha);
  fragColor = picking_filterColor(fragColor);
}
`;

const PICKING_FS_GLSL = /* glsl */ `\
#version 300 es
precision highp float;
precision highp int;

uniform sampler2D fontAtlasTexture;

in vec2 vTextureCoordinate;
layout(location = 0) out vec4 fragColor;
layout(location = 1) out ivec4 pickingColor;

void main() {
  float sampledAlpha = texture(fontAtlasTexture, vTextureCoordinate).a;
  if (sampledAlpha <= 0.68) {
    discard;
  }
  fragColor = vec4(0.0);
  pickingColor = picking_getPickingColor();
}
`;

type TextViewportUniforms = {
  cameraOffset: [number, number];
  viewportScale: [number, number];
  glyphWorldScale: number;
  time: number;
  clippingEnabled: number;
};

const textViewport: ShaderModule<TextViewportUniforms> = {
  name: 'textViewport',
  uniformTypes: {
    cameraOffset: 'vec2<f32>',
    viewportScale: 'vec2<f32>',
    glyphWorldScale: 'f32',
    time: 'f32',
    clippingEnabled: 'f32'
  }
};

function supportsTextIndexPicking(device: Device): boolean {
  return supportsIndexPicking(device);
}

export default class ArrowText2DAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = `\
  <p>
  Renders <b>${LABEL_COUNT.toLocaleString()}</b> generated Arrow UTF-8 labels, each about
  30 characters, through <code>ArrowTextModel</code>. The source label vector stays in
  Arrow form while one text model expands it into roughly thirty-one million glyph instances.
  </p>
  <p>
  Arrow fixed-size-list columns provide per-label placement. The camera drifts over the
  full label field so the workload remains large while the labels stay readable.
  </p>
  <div style="margin-top: 16px; padding: 14px 16px; border: 1px solid rgba(208, 215, 222, 0.9); border-radius: 16px; background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(246, 248, 250, 0.96) 100%); box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);">
    <label for="${ANIMATE_TOGGLE_ID}" style="display: flex; align-items: center; gap: 10px; color: #0f172a; font-size: 15px; font-weight: 600; cursor: pointer;">
      <input id="${ANIMATE_TOGGLE_ID}" type="checkbox" checked style="width: 18px; height: 18px; margin: 0; accent-color: #2563eb;" />
      <span>Animate</span>
    </label>
    <label for="${CLIPPING_TOGGLE_ID}" style="display: flex; align-items: center; gap: 10px; margin-top: 10px; color: #0f172a; font-size: 15px; font-weight: 600; cursor: pointer;">
      <input id="${CLIPPING_TOGGLE_ID}" type="checkbox" checked style="width: 18px; height: 18px; margin: 0; accent-color: #2563eb;" />
      <span>Clip labels</span>
    </label>
    <div style="display: flex; justify-content: space-between; gap: 16px; margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(208, 215, 222, 0.9); color: #334155; font-size: 13px; line-height: 1.4;">
      <span>Glyph attribute build</span>
      <strong id="${ATTRIBUTE_BUILD_TIME_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong>
    </div>
    <div style="display: flex; justify-content: space-between; gap: 16px; margin-top: 8px; color: #334155; font-size: 13px; line-height: 1.4;">
      <span>Generated attributes</span>
      <strong id="${ATTRIBUTE_SIZE_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong>
    </div>
    <div style="display: flex; justify-content: space-between; gap: 16px; margin-top: 8px; color: #334155; font-size: 13px; line-height: 1.4;">
      <span>deck.gl equivalent attributes</span>
      <strong id="${DECK_ATTRIBUTE_SIZE_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong>
    </div>
    <div style="display: flex; justify-content: space-between; gap: 16px; margin-top: 8px; color: #334155; font-size: 13px; line-height: 1.4;">
      <span>Picked Arrow row</span>
      <strong id="${PICKED_LABEL_ID}" style="max-width: 220px; overflow-wrap: anywhere; color: #0f172a; font-variant-numeric: tabular-nums;">Hover text</strong>
    </div>
    <table style="width: 100%; margin-top: 14px; border-collapse: collapse; color: #334155; font-size: 12px; line-height: 1.4;">
      <thead>
        <tr style="border-top: 1px solid rgba(208, 215, 222, 0.9); border-bottom: 1px solid rgba(208, 215, 222, 0.9); color: #0f172a;">
          <th style="padding: 8px 0; text-align: left; font-weight: 700;">Not implemented yet</th>
          <th style="padding: 8px 0; text-align: left; font-weight: 700;">Current Arrow renderer scope</th>
        </tr>
      </thead>
      <tbody>
        <tr style="border-bottom: 1px solid rgba(226, 232, 240, 0.9);">
          <td style="padding: 7px 0;">Multiline layout and wrapping</td>
          <td style="padding: 7px 0;">One-line labels only</td>
        </tr>
        <tr style="border-bottom: 1px solid rgba(226, 232, 240, 0.9);">
          <td style="padding: 7px 0;">Per-label size, angle, and pixel offset</td>
          <td style="padding: 7px 0;">Shared visual styling in the demo shader</td>
        </tr>
        <tr style="border-bottom: 1px solid rgba(226, 232, 240, 0.9);">
          <td style="padding: 7px 0;">Per-label colors</td>
          <td style="padding: 7px 0;">Indexed picking maps glyphs back to Arrow label rows</td>
        </tr>
        <tr style="border-bottom: 1px solid rgba(226, 232, 240, 0.9);">
          <td style="padding: 7px 0;">Content alignment modes</td>
          <td style="padding: 7px 0;">Packed i16x4 clip rectangles; no scroll alignment yet</td>
        </tr>
        <tr>
          <td style="padding: 7px 0;">Text backgrounds and outlines</td>
          <td style="padding: 7px 0;">Atlas-backed glyph rendering only</td>
        </tr>
      </tbody>
    </table>
  </div>
  `;

  static props = {createFramebuffer: true, useDevicePixels: true};

  readonly shaderInputs = new ShaderInputs<{
    textViewport: typeof textViewport.props;
    picking: typeof picking.props;
  }>({textViewport, picking});
  readonly device: Device;
  readonly textModel: ArrowTextModel;
  readonly pickingModel: Model | null;
  readonly picker: PickingManager | null;
  animate = true;
  clippingEnabled = true;
  animationSeconds = 0;
  lastRenderSeconds: number | null = null;
  smoothedAnimationDeltaSeconds = INITIAL_ANIMATION_DELTA_SECONDS;
  animateToggle: HTMLInputElement | null = null;
  clippingToggle: HTMLInputElement | null = null;
  attributeBuildTimeLabel: HTMLElement | null = null;
  attributeSizeLabel: HTMLElement | null = null;
  deckAttributeSizeLabel: HTMLElement | null = null;
  pickedLabel: HTMLElement | null = null;

  constructor({device}: AnimationProps) {
    super();
    this.device = device as Device;

    const {labelTable, texts, clipRects} = makeArrowTextInput();
    this.textModel = new ArrowTextModel(this.device, {
      id: 'arrow-text-2d',
      labelTable,
      texts,
      clipRects,
      characterSet: CHARACTER_SET,
      fontSettings: {
        fontFamily: 'Monaco, Menlo, monospace',
        fontWeight: '600',
        fontSize: 64,
        buffer: 6,
        sdf: true,
        radius: 12
      },
      source: WGSL_SHADER,
      vs: VS_GLSL,
      fs: FS_GLSL,
      shaderLayout: TEXT_SHADER_LAYOUT,
      shaderInputs: this.shaderInputs,
      // @ts-expect-error Remove once npm package updated with new types
      modules: [supportsTextIndexPicking(this.device) ? indexPicking : indexColorPicking],
      parameters: {
        depthWriteEnabled: false,
        blend: true,
        blendColorOperation: 'add',
        blendAlphaOperation: 'add',
        blendColorSrcFactor: 'src-alpha',
        blendColorDstFactor: 'one-minus-src-alpha',
        blendAlphaSrcFactor: 'one',
        blendAlphaDstFactor: 'one-minus-src-alpha'
      }
    });
    this.pickingModel = supportsTextIndexPicking(this.device)
      ? this.createPickingModel(this.textModel)
      : null;
    this.picker = supportsTextIndexPicking(this.device)
      ? new PickingManager(this.device, {
          shaderInputs: this.shaderInputs,
          mode: 'index',
          onObjectPicked: this.handleObjectPicked
        })
      : null;

    this.initializeAnimateToggle();
    this.initializeClippingToggle();
    this.initializeAttributeMetricLabels();
    this.initializePickedLabel();
  }

  override onRender({device, aspect, time, needsRedraw, _mousePosition}: AnimationProps): void {
    const seconds = time / 1000;
    if (!this.animateToggle) {
      this.initializeAnimateToggle();
    }
    if (!this.clippingToggle) {
      this.initializeClippingToggle();
    }
    if (!this.attributeBuildTimeLabel || !this.attributeSizeLabel || !this.deckAttributeSizeLabel) {
      this.initializeAttributeMetricLabels();
    }
    if (!this.pickedLabel) {
      this.initializePickedLabel();
    }
    if (this.lastRenderSeconds === null) {
      this.lastRenderSeconds = seconds;
    }
    const elapsedSeconds = Math.max(seconds - this.lastRenderSeconds, 0);
    this.lastRenderSeconds = seconds;
    if (this.animate) {
      const boundedElapsedSeconds = Math.min(elapsedSeconds, MAX_ANIMATION_DELTA_SECONDS);
      this.smoothedAnimationDeltaSeconds +=
        (boundedElapsedSeconds - this.smoothedAnimationDeltaSeconds) * ANIMATION_DELTA_SMOOTHING;
      this.animationSeconds += this.smoothedAnimationDeltaSeconds;
    }

    const textModelNeedsRedraw = this.textModel.needsRedraw();
    const shouldRenderText = this.animate || Boolean(needsRedraw) || Boolean(textModelNeedsRedraw);
    if (shouldRenderText) {
      const cameraOffset: [number, number] = [
        Math.sin(this.animationSeconds * 0.004) * LABEL_FIELD_WIDTH * 0.43,
        Math.cos(this.animationSeconds * 0.006) * LABEL_FIELD_HEIGHT * 0.38
      ];
      const viewportWidth = VIEW_HEIGHT * Math.max(aspect, 0.2);
      const viewportScale: [number, number] = [2 / viewportWidth, 2 / VIEW_HEIGHT];

      this.shaderInputs.setProps({
        textViewport: {
          cameraOffset,
          viewportScale,
          glyphWorldScale: GLYPH_WORLD_SCALE,
          time: this.animationSeconds,
          clippingEnabled: this.clippingEnabled ? 1 : 0
        }
      });
      this.shaderInputs.setProps({picking: {isActive: false}});

      const renderPass = device.beginRenderPass({
        clearColor: [0.015, 0.035, 0.07, 1]
      });
      this.shaderInputs.setProps({picking: {batchIndex: 0}});
      this.textModel.draw(renderPass);
      renderPass.end();
    }
    this.pickLabel(_mousePosition);
  }

  override onFinalize(): void {
    this.animateToggle?.removeEventListener('change', this.handleAnimateToggle);
    this.clippingToggle?.removeEventListener('change', this.handleClippingToggle);
    this.animateToggle = null;
    this.clippingToggle = null;
    this.attributeBuildTimeLabel = null;
    this.attributeSizeLabel = null;
    this.deckAttributeSizeLabel = null;
    this.pickedLabel = null;
    this.picker?.destroy();
    this.pickingModel?.destroy();
    this.textModel.destroy();
  }

  pickLabel(mousePosition: number[] | null | undefined): void {
    if (!this.picker || !this.picker.shouldPick(mousePosition as [number, number] | null)) {
      return;
    }

    const pickingPass = this.picker.beginRenderPass();
    this.shaderInputs.setProps({picking: {batchIndex: 0}});
    this.pickingModel?.draw(pickingPass);
    pickingPass.end();
    this.shaderInputs.setProps({picking: {isActive: false}});
    void this.picker.updatePickInfo(mousePosition as [number, number]);
  }

  createPickingModel(textModel: ArrowTextModel): Model {
    return new Model(this.device, {
      id: `${textModel.id || 'arrow-text-2d'}-picking`,
      source: WGSL_SHADER,
      vs: VS_GLSL,
      fs: PICKING_FS_GLSL,
      fragmentEntryPoint: 'fragmentPicking',
      // @ts-expect-error Remove once npm package updated with new types
      modules: [indexPicking],
      bufferLayout: textModel.bufferLayout,
      attributes: textModel.arrowGPUTable!.attributes,
      instanceCount: textModel.instanceCount,
      vertexCount: 6,
      bindings: {...textModel.bindings},
      shaderInputs: this.shaderInputs,
      colorAttachmentFormats: ['rgba8unorm', 'rg32sint'],
      depthStencilAttachmentFormat: 'depth24plus',
      parameters: {
        depthWriteEnabled: false,
        blend: false
      }
    });
  }

  initializeAnimateToggle(): void {
    this.animateToggle = initializeCheckboxToggle(
      ANIMATE_TOGGLE_ID,
      this.animate,
      this.handleAnimateToggle
    );
  }

  handleAnimateToggle = (event: Event): void => {
    this.animate = (event.target as HTMLInputElement).checked;
  };

  initializeClippingToggle(): void {
    this.clippingToggle = initializeCheckboxToggle(
      CLIPPING_TOGGLE_ID,
      this.clippingEnabled,
      this.handleClippingToggle
    );
  }

  handleClippingToggle = (event: Event): void => {
    this.clippingEnabled = (event.target as HTMLInputElement).checked;
    this.textModel.setNeedsRedraw('text clipping toggled');
  };

  initializeAttributeMetricLabels(): void {
    this.attributeBuildTimeLabel = initializeAttributeBuildTimeLabel(
      ATTRIBUTE_BUILD_TIME_ID,
      this.textModel.glyphAttributeBuildTimeMs
    );
    this.attributeSizeLabel = initializeAttributeSizeLabel(
      ATTRIBUTE_SIZE_ID,
      this.textModel.glyphAttributeByteLength
    );
    this.deckAttributeSizeLabel = initializeAttributeSizeLabel(
      DECK_ATTRIBUTE_SIZE_ID,
      this.textModel.glyphLayout.glyphCount * DECK_CHARACTER_ATTRIBUTE_BYTES_PER_GLYPH
    );
  }

  initializePickedLabel(): void {
    this.pickedLabel = document.getElementById(PICKED_LABEL_ID);
  }

  handleObjectPicked = ({
    batchIndex,
    objectIndex
  }: {
    batchIndex: number | null;
    objectIndex: number | null;
  }): void => {
    this.textModel.setNeedsRedraw('picked Arrow row changed');
    if (!this.pickedLabel) {
      this.initializePickedLabel();
    }
    if (!this.pickedLabel || batchIndex === null || objectIndex === null) {
      if (this.pickedLabel) {
        this.pickedLabel.textContent = 'Hover text';
      }
      return;
    }
    this.pickedLabel.textContent = `row ${objectIndex.toLocaleString()}`;
  };
}

function makeArrowTextInput(): {
  labelTable: arrow.Table;
  texts: arrow.Vector<arrow.Utf8>;
  clipRects: arrow.Vector<arrow.FixedSizeList<arrow.Int16>>;
} {
  const centerColumn = (LABEL_COLUMN_COUNT - 1) / 2;
  const centerRow = (LABEL_ROW_COUNT - 1) / 2;
  const positions = new Float32Array(LABEL_COUNT * 2);
  const clipRects = new Int16Array(LABEL_COUNT * 4);
  const labels = new Array<string>(LABEL_COUNT);
  let positionIndex = 0;
  let clipRectIndex = 0;

  for (let labelIndex = 0; labelIndex < LABEL_COUNT; labelIndex++) {
    const columnIndex = labelIndex % LABEL_COLUMN_COUNT;
    const rowIndex = Math.floor(labelIndex / LABEL_COLUMN_COUNT);
    positions[positionIndex++] = (columnIndex - centerColumn) * LABEL_COLUMN_SPACING;
    positions[positionIndex++] = (rowIndex - centerRow) * LABEL_ROW_SPACING;
    clipRects[clipRectIndex++] = 0;
    clipRects[clipRectIndex++] = 0;
    clipRects[clipRectIndex++] = LABEL_CLIP_WIDTH;
    clipRects[clipRectIndex++] = -1;
    labels[labelIndex] = `NODE ${String(labelIndex).padStart(6, '0')} / ARROW TEXT VECTOR`;
  }

  return {
    labelTable: new arrow.Table({
      positions: makeArrowFixedSizeListVector(new arrow.Float32(), 2, positions)
    }),
    texts: arrow.vectorFromArray(labels, new arrow.Utf8()),
    clipRects: makeArrowFixedSizeListVector(new arrow.Int16(), 4, clipRects)
  };
}

function initializeCheckboxToggle(
  id: string,
  checked: boolean,
  onChange: (event: Event) => void
): HTMLInputElement | null {
  const checkboxToggle = document.getElementById(id) as HTMLInputElement | null;
  if (!checkboxToggle) {
    return null;
  }

  checkboxToggle.checked = checked;
  checkboxToggle.addEventListener('change', onChange);
  return checkboxToggle;
}

function initializeAttributeBuildTimeLabel(
  id: string,
  glyphAttributeBuildTimeMs: number
): HTMLElement | null {
  const buildTimeLabel = document.getElementById(id);
  if (!buildTimeLabel) {
    return null;
  }

  buildTimeLabel.textContent = `${glyphAttributeBuildTimeMs.toFixed(1)} ms`;
  return buildTimeLabel;
}

function initializeAttributeSizeLabel(
  id: string,
  glyphAttributeByteLength: number
): HTMLElement | null {
  const attributeSizeLabel = document.getElementById(id);
  if (!attributeSizeLabel) {
    return null;
  }

  attributeSizeLabel.textContent = formatByteLength(glyphAttributeByteLength);
  return attributeSizeLabel;
}

function formatByteLength(byteLength: number): string {
  if (byteLength < 1024) {
    return `${byteLength} B`;
  }
  if (byteLength < 1024 ** 2) {
    return `${(byteLength / 1024).toFixed(1)} KiB`;
  }
  if (byteLength < 1024 ** 3) {
    return `${(byteLength / 1024 ** 2).toFixed(1)} MiB`;
  }
  return `${(byteLength / 1024 ** 3).toFixed(2)} GiB`;
}
