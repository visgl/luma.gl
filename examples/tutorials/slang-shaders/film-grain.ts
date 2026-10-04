// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Texture, type Device, type Framebuffer} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import {valueNoise, type ShaderModule} from '@luma.gl/shadertools';

const uniforms = {
  name: 'filmGrain',
  uniformTypes: {amount: 'f32', time: 'f32'},
  defaultUniforms: {amount: 0.035, time: 0},
  fs: `
layout(std140) uniform filmGrainUniforms {
  float amount;
  float time;
} filmGrain;
`,
  source: `struct FilmGrainUniforms { amount: f32, time: f32 };
@group(0) @binding(auto) var<uniform> filmGrain: FilmGrainUniforms;`
} as const satisfies ShaderModule;

const source = /* wgsl */ `
@group(0) @binding(auto) var sceneTexture: texture_2d<f32>;
@group(0) @binding(auto) var sceneSampler: sampler;
struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) coordinates: vec2<f32>,
};
@vertex fn vertexMain(@builtin(vertex_index) index: u32) -> VertexOutput {
  let positions = array<vec2<f32>, 3>(vec2<f32>(-1, -1), vec2<f32>(3, -1), vec2<f32>(-1, 3));
  let position = positions[index];
  return VertexOutput(vec4<f32>(position, 0, 1), vec2<f32>(position.x * 0.5 + 0.5, 0.5 - position.y * 0.5));
}
@fragment fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  let color = textureSample(sceneTexture, sceneSampler, input.coordinates);
  let noise = valueNoise_noise(input.position.xy + vec2<f32>(filmGrain.time * 47.0, filmGrain.time * 31.0));
  return vec4<f32>(clamp(color.rgb + vec3<f32>((noise - 0.5) * filmGrain.amount), vec3<f32>(0), vec3<f32>(1)), color.a);
}
`;
const vertexSource = /* glsl */ `#version 300 es
out vec2 coordinates;
void main() {
  vec2 position = vec2(-1, -1);
  if (gl_VertexID == 1) position = vec2(3, -1);
  if (gl_VertexID == 2) position = vec2(-1, 3);
  gl_Position = vec4(position, 0, 1);
  coordinates = position * 0.5 + 0.5;
}
`;
const fragmentSource = /* glsl */ `#version 300 es
precision highp float;
uniform sampler2D sceneTexture;
in vec2 coordinates;
out vec4 fragmentColor;
void main() {
  vec4 color = texture(sceneTexture, coordinates);
  float noise = valueNoise_noise(gl_FragCoord.xy + vec2(filmGrain.time * 47.0, filmGrain.time * 31.0));
  fragmentColor = vec4(clamp(color.rgb + vec3((noise - 0.5) * filmGrain.amount), 0.0, 1.0), color.a);
}
`;

/** A texture is the explicit boundary between Slang rendering and a native shader module. */
export class FilmGrainPass {
  readonly model: Model;
  private sceneTexture: Texture;
  private sceneFramebuffer: Framebuffer;

  constructor(private readonly device: Device) {
    this.sceneTexture = this.createTexture(1, 1);
    this.sceneFramebuffer = device.createFramebuffer({
      width: 1,
      height: 1,
      colorAttachments: [this.sceneTexture]
    });
    this.model = new Model(device, {
      id: 'native-film-grain',
      source,
      vs: vertexSource,
      fs: fragmentSource,
      vertexEntryPoint: 'vertexMain',
      fragmentEntryPoint: 'fragmentMain',
      // This existing module supplies native WGSL and GLSL implementations of the same helper.
      modules: [uniforms, valueNoise],
      bindings: {sceneTexture: this.sceneTexture, sceneSampler: this.sceneTexture.sampler},
      topology: 'triangle-list',
      vertexCount: 3
    });
  }

  getSourceFiles(): {name: string; code: string}[] {
    return this.device.info.shadingLanguage === 'wgsl'
      ? [
          {name: 'Film grain (WGSL)', code: source},
          {name: 'valueNoise (WGSL)', code: valueNoise.source}
        ]
      : [
          {name: 'Film grain (GLSL vertex)', code: vertexSource},
          {name: 'Film grain (GLSL fragment)', code: fragmentSource},
          {name: 'valueNoise (GLSL)', code: valueNoise.fs}
        ];
  }

  draw(
    scene: Model,
    width: number,
    height: number,
    time: number,
    amount: number,
    framebuffer?: Framebuffer
  ): boolean {
    if (this.sceneTexture.width !== width || this.sceneTexture.height !== height) {
      const previousTexture = this.sceneTexture;
      const previousFramebuffer = this.sceneFramebuffer;
      this.sceneTexture = this.createTexture(width, height);
      this.sceneFramebuffer = this.device.createFramebuffer({
        width,
        height,
        colorAttachments: [this.sceneTexture]
      });
      this.model.setBindings({
        sceneTexture: this.sceneTexture,
        sceneSampler: this.sceneTexture.sampler
      });
      previousFramebuffer.destroy();
      previousTexture.destroy();
    }
    const scenePass = this.device.beginRenderPass({
      framebuffer: this.sceneFramebuffer,
      clearColor: [0.01, 0.02, 0.04, 1]
    });
    const sceneDrawn = scene.draw(scenePass);
    scenePass.end();
    this.model.shaderInputs.setProps({filmGrain: {amount, time}});
    const grainPass = this.device.beginRenderPass({framebuffer, clearColor: [0.01, 0.02, 0.04, 1]});
    const grainDrawn = this.model.draw(grainPass);
    grainPass.end();
    return sceneDrawn && grainDrawn;
  }

  destroy(): void {
    this.model.destroy();
    this.sceneFramebuffer.destroy();
    this.sceneTexture.destroy();
  }

  private createTexture(width: number, height: number): Texture {
    return this.device.createTexture({
      id: 'slang-scene-color',
      width,
      height,
      format: 'rgba8unorm',
      usage: Texture.RENDER | Texture.TEXTURE,
      sampler: {minFilter: 'nearest', magFilter: 'nearest'}
    });
  }
}
