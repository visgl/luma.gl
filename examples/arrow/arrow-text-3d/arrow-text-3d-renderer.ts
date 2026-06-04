// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {makeGPUTableFromArrowTable} from '@luma.gl/arrow';
import {
  type CommandEncoder,
  type Device,
  type RenderPass,
  type ShaderLayout,
  type TransformFeedback
} from '@luma.gl/core';
import {Model, ShaderInputs} from '@luma.gl/engine';
import type {ShaderModule} from '@luma.gl/shadertools';
import {
  buildText3DGlyphAtlas,
  type Font,
  type Text3DBounds,
  type Text3DGlyphAtlasOptions
} from '@luma.gl/text/text-3d';
import type {GPUTable} from '@luma.gl/tables';
import type {Matrix4, NumberArray4, NumberArray16} from '@math.gl/core';
import {
  makeArrowText3DGlyphData,
  makeArrowText3DTextTable,
  type ArrowText3DGlyphDrawRange,
  type ArrowText3DGlyphInstanceTable,
  type ArrowText3DTextTable
} from './arrow-text-3d-data';

/** Uniforms shared by Arrow 3D text vertex and fragment shaders. */
export type ArrowText3DAppUniforms = {
  modelMatrix: Readonly<Matrix4 | NumberArray16>;
  viewMatrix: Readonly<Matrix4 | NumberArray16>;
  projectionMatrix: Readonly<Matrix4 | NumberArray16>;
  normalMatrix: Readonly<Matrix4 | NumberArray16>;
  time: number;
  crawlColor: Readonly<NumberArray4>;
  fade: Readonly<NumberArray4>;
};

/** Public renderer construction props for the Arrow 3D crawl example. */
export type ArrowText3DRendererProps = Omit<Text3DGlyphAtlasOptions, 'font'> & {
  /** Arrow Utf8 rows expanded into visible glyph occurrences. */
  textRows: readonly string[];
  /** Typeface used to build shared renderable glyph geometry. */
  font: Font;
};

const WGSL_SHADER = /* wgsl */ `
struct AppUniforms {
  modelMatrix : mat4x4<f32>,
  viewMatrix : mat4x4<f32>,
  projectionMatrix : mat4x4<f32>,
  normalMatrix : mat4x4<f32>,
  time : f32,
  crawlColor : vec4<f32>,
  fade : vec4<f32>,
};

@group(0) @binding(auto) var<uniform> app : AppUniforms;

struct VertexInputs {
  @location(0) positions : vec3<f32>,
  @location(1) normals : vec3<f32>,
  @location(2) texCoords : vec2<f32>,
  @location(3) instanceOffsets : vec3<f32>,
};

struct FragmentInputs {
  @builtin(position) Position : vec4<f32>,
  @location(0) vNormal : vec3<f32>,
  @location(1) vWorldY : f32,
  @location(2) vTexCoord : vec2<f32>,
};

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  var outputs : FragmentInputs;
  let localPosition = inputs.positions + inputs.instanceOffsets;
  let worldPosition = app.modelMatrix * vec4<f32>(localPosition, 1.0);
  outputs.Position = app.projectionMatrix * app.viewMatrix * worldPosition;
  outputs.vNormal = normalize((app.normalMatrix * vec4<f32>(inputs.normals, 0.0)).xyz);
  outputs.vWorldY = worldPosition.y;
  outputs.vTexCoord = inputs.texCoords;
  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  let lightDirection = normalize(vec3<f32>(0.5, 1.0, 0.25));
  let diffuse = max(dot(lightDirection, normalize(inputs.vNormal)), 0.16);
  let glow = 0.1 + 0.07 * sin(app.time * 0.35);
  let fadeIn = smoothstep(app.fade.x, app.fade.y, inputs.vWorldY);
  let fadeOut = 1.0 - smoothstep(app.fade.z, app.fade.w, inputs.vWorldY);
  let crawlFade = clamp(fadeIn * fadeOut, 0.0, 1.0);
  let texBloom = 1.0 + 0.02 * sin(inputs.vTexCoord.x * 0.35);
  let baseColor = app.crawlColor.rgb;
  return vec4<f32>(baseColor * (diffuse + glow) * crawlFade * texBloom, app.crawlColor.a);
}
`;

const VS_GLSL = /* glsl */ `#version 300 es
#define SHADER_NAME arrow-text-3d-vs

uniform appUniforms {
  mat4 modelMatrix;
  mat4 viewMatrix;
  mat4 projectionMatrix;
  mat4 normalMatrix;
  float time;
  vec4 crawlColor;
  vec4 fade;
} app;

layout(location=0) in vec3 positions;
layout(location=1) in vec3 normals;
layout(location=2) in vec2 texCoords;
layout(location=3) in vec3 instanceOffsets;

out vec3 vNormal;
out vec2 vTexCoord;
out float vWorldY;

void main() {
  vec4 worldPosition = app.modelMatrix * vec4(positions + instanceOffsets, 1.0);
  gl_Position = app.projectionMatrix * app.viewMatrix * worldPosition;
  vNormal = normalize((app.normalMatrix * vec4(normals, 0.0)).xyz);
  vTexCoord = texCoords;
  vWorldY = worldPosition.y;
}
`;

const FS_GLSL = /* glsl */ `#version 300 es
#define SHADER_NAME arrow-text-3d-fs
precision highp float;

uniform appUniforms {
  mat4 modelMatrix;
  mat4 viewMatrix;
  mat4 projectionMatrix;
  mat4 normalMatrix;
  float time;
  vec4 crawlColor;
  vec4 fade;
} app;

in vec3 vNormal;
in vec2 vTexCoord;
in float vWorldY;
layout(location=0) out vec4 fragColor;

void main() {
  vec3 lightDirection = normalize(vec3(0.5, 1.0, 0.25));
  float diffuse = max(dot(lightDirection, normalize(vNormal)), 0.16);
  float glow = 0.1 + 0.07 * sin(app.time * 0.35);
  float fadeIn = smoothstep(app.fade.x, app.fade.y, vWorldY);
  float fadeOut = 1.0 - smoothstep(app.fade.z, app.fade.w, vWorldY);
  float crawlFade = clamp(fadeIn * fadeOut, 0.0, 1.0);
  float texBloom = 1.0 + 0.02 * sin(vTexCoord.x * 0.35);
  vec3 baseColor = app.crawlColor.rgb * texBloom;
  fragColor = vec4(baseColor * (diffuse + glow) * crawlFade, app.crawlColor.a);
}
`;

const app: ShaderModule<ArrowText3DAppUniforms, ArrowText3DAppUniforms> = {
  name: 'app',
  uniformTypes: {
    modelMatrix: 'mat4x4<f32>',
    viewMatrix: 'mat4x4<f32>',
    projectionMatrix: 'mat4x4<f32>',
    normalMatrix: 'mat4x4<f32>',
    time: 'f32',
    crawlColor: 'vec4<f32>',
    fade: 'vec4<f32>'
  }
};

/** Attribute layout shared by Arrow upload and the glyph-ranged text model. */
export const ARROW_TEXT_3D_SHADER_LAYOUT = {
  attributes: [
    {name: 'positions', location: 0, type: 'vec3<f32>'},
    {name: 'normals', location: 1, type: 'vec3<f32>'},
    {name: 'texCoords', location: 2, type: 'vec2<f32>'},
    {name: 'instanceOffsets', location: 3, type: 'vec3<f32>', stepMode: 'instance'}
  ],
  bindings: []
} satisfies ShaderLayout;

const IDENTITY_MATRIX: NumberArray16 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

/** Renders grouped Arrow glyph batches through shared 3D glyph geometry vertex ranges. */
export class ArrowText3DRenderer {
  /** Arrow Utf8 crawl rows retained before glyph expansion. */
  readonly textTable: ArrowText3DTextTable;
  /** Grouped CPU Arrow glyph occurrence batches before GPU upload. */
  readonly glyphInstanceArrowTable: ArrowText3DGlyphInstanceTable;
  /** Arrow/GPU glyph occurrence batches grouped by atlas glyph. */
  readonly glyphInstanceTable: GPUTable;
  /** Shared glyph geometry ranges aligned with {@link glyphInstanceTable} batches. */
  readonly glyphDrawRanges: ArrowText3DGlyphDrawRange[];
  /** Positioned visible glyph bounds before crawl world transforms. */
  readonly bounds: Text3DBounds;
  /** Shader inputs updated by the crawl app each frame. */
  readonly shaderInputs = new ShaderInputs<{app: typeof app.props}>({app});
  /** Glyph-ranged instanced model. */
  readonly model: Model;

  /** Creates Arrow glyph batches and one shared 3D glyph model. */
  constructor(device: Device, props: ArrowText3DRendererProps) {
    const glyphAtlas = buildText3DGlyphAtlas(props.textRows, props);
    const glyphData = makeArrowText3DGlyphData(
      makeArrowText3DTextTable(props.textRows),
      glyphAtlas
    );
    this.textTable = glyphData.textTable;
    this.glyphInstanceArrowTable = glyphData.glyphInstanceTable;
    this.glyphInstanceTable = makeGPUTableFromArrowTable(device, this.glyphInstanceArrowTable, {
      shaderLayout: ARROW_TEXT_3D_SHADER_LAYOUT
    });
    this.glyphDrawRanges = glyphData.drawRanges;
    this.bounds = glyphData.glyphLayout.bounds;
    this.shaderInputs.setProps({
      app: {
        modelMatrix: IDENTITY_MATRIX,
        viewMatrix: IDENTITY_MATRIX,
        projectionMatrix: IDENTITY_MATRIX,
        normalMatrix: IDENTITY_MATRIX,
        time: 0,
        crawlColor: [1, 1, 1, 1],
        fade: [0, 0, 0, 0]
      }
    });

    const firstGlyphBatch = this.glyphInstanceTable.batches[0];
    if (!firstGlyphBatch) {
      throw new Error('Arrow 3D text renderer requires at least one visible glyph batch');
    }
    this.model = new Model(device, {
      id: 'arrow-text-3d',
      source: WGSL_SHADER,
      vs: VS_GLSL,
      fs: FS_GLSL,
      shaderInputs: this.shaderInputs,
      shaderLayout: ARROW_TEXT_3D_SHADER_LAYOUT,
      geometry: glyphAtlas.geometry,
      bufferLayout: this.glyphInstanceTable.bufferLayout,
      attributes: firstGlyphBatch.attributes,
      instanceCount: firstGlyphBatch.numRows,
      parameters: {
        depthWriteEnabled: true,
        depthCompare: 'less-equal',
        cullMode: 'back'
      }
    });
  }

  /** Replaces frame-varying crawl uniforms. */
  setProps(props: {app: ArrowText3DAppUniforms}): void {
    this.shaderInputs.setProps(props);
  }

  /** Flushes frame uniforms before opening a WebGPU render pass. */
  predraw(commandEncoder: CommandEncoder): void {
    this.model.predraw(commandEncoder);
  }

  /** Draws one grouped Arrow instance batch for each shared glyph geometry range. */
  draw(renderPass: RenderPass): boolean {
    return drawArrowText3DGlyphRanges(
      this.model,
      renderPass,
      this.glyphInstanceTable,
      this.glyphDrawRanges
    );
  }

  /** Releases grouped Arrow instance buffers plus the shared glyph model. */
  destroy(): void {
    this.model.destroy();
    this.glyphInstanceTable.destroy();
  }
}

/** Internal model fields needed while issuing one glyph geometry range draw per glyph batch. */
type RangedDrawableModel = {
  _areBindingsLoading(): string | false;
  _syncAttachmentFormats(renderPass: RenderPass): void;
  _updatePipeline(): Model['pipeline'];
  _getBindings(): Record<string, any>;
  _getBindGroups(): Record<number, Record<string, any>>;
  _getBindGroupCacheKeys(): Partial<Record<number, object>>;
  pipeline: Model['pipeline'];
  vertexArray: Model['vertexArray'];
  isInstanced: Model['isInstanced'];
  transformFeedback: TransformFeedback | null;
  props: {uniforms?: Record<string, unknown>};
  parameters: Model['parameters'];
  topology: Model['topology'];
};

/** Issues one glyph geometry range draw per glyph while rebinding grouped Arrow instance batches. */
function drawArrowText3DGlyphRanges(
  model: Model,
  renderPass: RenderPass,
  glyphInstanceTable: GPUTable,
  glyphDrawRanges: readonly ArrowText3DGlyphDrawRange[]
): boolean {
  const drawableModel = model as unknown as RangedDrawableModel;
  if (drawableModel._areBindingsLoading()) {
    return false;
  }

  drawableModel._syncAttachmentFormats(renderPass);
  drawableModel.pipeline = drawableModel._updatePipeline();
  if (drawableModel.pipeline.isErrored) {
    return false;
  }

  let drawSuccess = true;
  for (const glyphDrawRange of glyphDrawRanges) {
    const glyphInstanceBatch = glyphInstanceTable.batches[glyphDrawRange.batchIndex];
    if (!glyphInstanceBatch) {
      throw new Error('Arrow 3D text draw range is missing its grouped glyph instance batch');
    }
    model.setAttributes(glyphInstanceBatch.attributes);
    model.setInstanceCount(glyphDrawRange.instanceCount);
    const drawValidationError = drawableModel.vertexArray.getDrawValidationError();
    if (drawValidationError) {
      throw new Error(`Arrow 3D text draw validation failed: ${drawValidationError}`);
    }

    const indexBuffer = drawableModel.vertexArray.indexBuffer;
    const indexCount = indexBuffer
      ? indexBuffer.byteLength / (indexBuffer.indexType === 'uint32' ? 4 : 2)
      : undefined;
    drawSuccess =
      drawableModel.pipeline.draw({
        renderPass,
        vertexArray: drawableModel.vertexArray,
        isInstanced: drawableModel.isInstanced,
        vertexCount: glyphDrawRange.vertexCount,
        firstVertex: glyphDrawRange.firstVertex,
        instanceCount: glyphDrawRange.instanceCount,
        indexCount,
        transformFeedback: drawableModel.transformFeedback || undefined,
        bindings: drawableModel._getBindings(),
        bindGroups: drawableModel._getBindGroups(),
        _bindGroupCacheKeys: drawableModel._getBindGroupCacheKeys(),
        uniforms: drawableModel.props.uniforms,
        parameters: drawableModel.parameters,
        topology: drawableModel.topology
      }) && drawSuccess;
  }

  return drawSuccess;
}
