// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CommandEncoder, Device, RenderPass} from '@luma.gl/core';
import {Model, ShaderInputs} from '@luma.gl/engine';
import type {ShaderModule} from '@luma.gl/shadertools';
import {TextGeometry, type TextGeometryOptions} from '@luma.gl/text/text-3d';
import {
  IDENTITY_MATRIX,
  type TextSpaceCrawlRenderer,
  type TextSpaceCrawlUniforms
} from './crawl-renderer';

export type ExtrudedTextRendererProps = TextGeometryOptions & {
  textRows: readonly string[];
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
  glyphWorldScale : f32,
};

@group(0) @binding(auto) var<uniform> app : AppUniforms;

struct VertexInputs {
  @location(0) positions : vec3<f32>,
  @location(1) normals : vec3<f32>,
  @location(2) texCoords : vec2<f32>,
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
  let worldPosition = app.modelMatrix * vec4<f32>(inputs.positions, 1.0);
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
  return vec4<f32>(app.crawlColor.rgb * (diffuse + glow) * crawlFade * texBloom, app.crawlColor.a);
}
`;

const VS_GLSL = /* glsl */ `#version 300 es
#define SHADER_NAME extruded-text-crawl-vs

uniform appUniforms {
  mat4 modelMatrix;
  mat4 viewMatrix;
  mat4 projectionMatrix;
  mat4 normalMatrix;
  float time;
  vec4 crawlColor;
  vec4 fade;
  float glyphWorldScale;
} app;

layout(location=0) in vec3 positions;
layout(location=1) in vec3 normals;
layout(location=2) in vec2 texCoords;

out vec3 vNormal;
out vec2 vTexCoord;
out float vWorldY;

void main() {
  vec4 worldPosition = app.modelMatrix * vec4(positions, 1.0);
  gl_Position = app.projectionMatrix * app.viewMatrix * worldPosition;
  vNormal = normalize((app.normalMatrix * vec4(normals, 0.0)).xyz);
  vTexCoord = texCoords;
  vWorldY = worldPosition.y;
}
`;

const FS_GLSL = /* glsl */ `#version 300 es
#define SHADER_NAME extruded-text-crawl-fs
precision highp float;

uniform appUniforms {
  mat4 modelMatrix;
  mat4 viewMatrix;
  mat4 projectionMatrix;
  mat4 normalMatrix;
  float time;
  vec4 crawlColor;
  vec4 fade;
  float glyphWorldScale;
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
  fragColor = vec4(app.crawlColor.rgb * (diffuse + glow) * crawlFade * texBloom, app.crawlColor.a);
}
`;

const app: ShaderModule<TextSpaceCrawlUniforms, TextSpaceCrawlUniforms> = {
  name: 'app',
  uniformTypes: {
    modelMatrix: 'mat4x4<f32>',
    viewMatrix: 'mat4x4<f32>',
    projectionMatrix: 'mat4x4<f32>',
    normalMatrix: 'mat4x4<f32>',
    time: 'f32',
    crawlColor: 'vec4<f32>',
    fade: 'vec4<f32>',
    glyphWorldScale: 'f32'
  }
};

/** Conventional extruded text renderer backed by one TextGeometry. */
export class ExtrudedTextRenderer implements TextSpaceCrawlRenderer {
  readonly bounds;
  readonly glyphWorldScale = 1;
  readonly shaderInputs = new ShaderInputs<{app: typeof app.props}>({app});
  readonly model: Model;

  constructor(device: Device, props: ExtrudedTextRendererProps) {
    const {textRows, ...geometryOptions} = props;
    const geometry = new TextGeometry(textRows.join('\n'), {
      ...geometryOptions,
      align: 'center'
    });
    this.bounds = geometry.bounds;
    this.shaderInputs.setProps({
      app: {
        modelMatrix: IDENTITY_MATRIX,
        viewMatrix: IDENTITY_MATRIX,
        projectionMatrix: IDENTITY_MATRIX,
        normalMatrix: IDENTITY_MATRIX,
        time: 0,
        crawlColor: [1, 1, 1, 1],
        fade: [0, 0, 0, 0],
        glyphWorldScale: 1
      }
    });
    this.model = new Model(device, {
      id: 'extruded-text-crawl',
      source: WGSL_SHADER,
      vs: VS_GLSL,
      fs: FS_GLSL,
      shaderInputs: this.shaderInputs,
      geometry,
      bufferLayout: [
        {name: 'positions', format: 'float32x3'},
        {name: 'normals', format: 'float32x3'},
        {name: 'texCoords', format: 'float32x2'}
      ],
      parameters: {
        depthWriteEnabled: true,
        depthCompare: 'less-equal',
        cullMode: 'back'
      }
    });
  }

  setProps(props: {app: TextSpaceCrawlUniforms}): void {
    this.shaderInputs.setProps(props);
  }

  predraw(commandEncoder: CommandEncoder): void {
    this.model.predraw(commandEncoder);
  }

  draw(renderPass: RenderPass): void {
    this.model.draw(renderPass);
  }

  destroy(): void {
    this.model.destroy();
  }
}
