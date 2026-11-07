// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {transpileWGSL} from '@luma.gl/slang/wgsl';

const VERTEX_SOURCE = `
struct Varyings {
  @builtin(position) position: vec4f,
  @location(0) color: vec3f,
}
@vertex fn vertexMain(@location(0) position: vec2f, @location(1) color: vec3f) -> Varyings {
  var result: Varyings;
  result.position = vec4f(position, 0.0, 1.0);
  result.color = color;
  return result;
}
`;

export const WGSL_EXAMPLES = [
  {
    name: 'WGSL · interpolated triangle',
    wgsl: true,
    code: `${VERTEX_SOURCE}
@fragment fn fragmentMain(@location(0) color: vec3f) -> @location(0) vec4f {
  return vec4f(color, 1.0);
}
`
  },
  {
    name: 'WGSL · color channels',
    wgsl: true,
    code: `${VERTEX_SOURCE}
@fragment fn fragmentMain(@location(0) color: vec3f) -> @location(0) vec4f {
  let reversed = color.bgr;
  return vec4f(reversed * 0.75 + vec3f(0.1), 1.0);
}
`
  },
  {
    name: 'WGSL · typed helpers',
    wgsl: true,
    code: `${VERTEX_SOURCE}
fn tint(color: vec3f, amount: f32) -> vec3f {
  return color * amount + vec3f(0.15);
}
@fragment fn fragmentMain(@location(0) color: vec3f) -> @location(0) vec4f {
  let amount: f32 = 1.0 / 2.0;
  let tinted = tint(color, amount);
  var result: vec4f;
  result = vec4f(tinted, 1.0);
  return result;
}
`
  },
  {
    name: 'WGSL · uniform matrix and tint',
    wgsl: true,
    code: `${VERTEX_SOURCE}
struct Settings { transform: mat4x4f, tint: vec4f, }
@group(0) @binding(0) var<uniform> settings: Settings;
@fragment fn fragmentMain(@location(0) color: vec3f) -> @location(0) vec4f {
  return settings.transform * vec4f(color, 1.0) * settings.tint;
}`
  },
  {
    name: 'WGSL · sampled checker texture',
    wgsl: true,
    code: `${VERTEX_SOURCE}
@group(0) @binding(1) var image: texture_2d<f32>;
@group(0) @binding(2) var filtering: sampler;
@fragment fn fragmentMain(@location(0) color:vec3f)->@location(0) vec4f {
  let size=vec2f(textureDimensions(image));
  let sampled=textureSampleLevel(image,filtering,color.xy * 3.0,0.0);
  let loaded=textureLoad(image,vec2i(0),0);
  return mix(sampled,loaded,1.0 / size.x) * vec4f(color * 0.5 + vec3f(0.5),1.0);
}`
  },
  {
    name: 'WGSL · arrays and control flow',
    wgsl: true,
    code: `${VERTEX_SOURCE}
const COUNT=3;
alias Palette=array<vec3f,COUNT>;
fn paletteColor(palette:Palette,index:i32)->vec3f {return palette[index];}
@fragment fn fragmentMain(@location(0) color:vec3f)->@location(0) vec4f {
  let palette=Palette(vec3f(0.9,0.2,0.1),vec3f(0.1,0.8,0.4),vec3f(0.2,0.3,0.9));
  var result=vec3f(0.0);
  for(var index=0;index<COUNT;index++) {
    if(color[index]<0.15) {continue;}
    result+=paletteColor(palette,index) * color[index];
  }
  var count=0;
  while(count<2) {result+=vec3f(0.025);count++;}
  switch count {case 1: {result=vec3f(0.0);} default: {result=clamp(result,vec3f(0.0),vec3f(1.0));}}
  let mask=select(vec3f(0.8),vec3f(1.0),color>vec3f(0.3));
  let one=bitcast<f32>(bitcast<u32>(1.0));
  return vec4f(result * mask,one);
}`
  }
];

/** Run the displayed WGSL through the real compiler and draw its GLSL on WebGL 2. */
export function renderWGSLExample(
  canvas: HTMLCanvasElement,
  source: string
): {
  shaders: {name: string; code: string}[];
  destroy: () => void;
} {
  const context = canvas.getContext('webgl2', {antialias: false, preserveDrawingBuffer: true});
  if (!context) throw new Error('WebGL 2 is required for WGSL sample previews');
  const program = context.createProgram()!;
  const buffer = context.createBuffer()!;
  const shaders: WebGLShader[] = [];
  const uniformBuffers: WebGLBuffer[] = [];
  const textures: WebGLTexture[] = [];
  const destroy = () => {
    context.bindBuffer(context.ARRAY_BUFFER, null);
    context.useProgram(null);
    shaders.forEach(shader => context.deleteShader(shader));
    context.deleteBuffer(buffer);
    uniformBuffers.forEach(value => context.deleteBuffer(value));
    textures.forEach(value => context.deleteTexture(value));
    context.deleteProgram(program);
  };
  try {
    const compiled = [
      transpileWGSL(source, {entryPoint: 'vertexMain', sourceName: 'sample.wgsl'}),
      transpileWGSL(source, {entryPoint: 'fragmentMain', sourceName: 'sample.wgsl'})
    ];
    for (const result of compiled) {
      const shader = context.createShader(
        result.stage === 'vertex' ? context.VERTEX_SHADER : context.FRAGMENT_SHADER
      )!;
      shaders.push(shader);
      context.shaderSource(shader, result.code);
      context.compileShader(shader);
      if (!context.getShaderParameter(shader, context.COMPILE_STATUS))
        throw new Error(context.getShaderInfoLog(shader) || 'Shader compilation failed');
      context.attachShader(program, shader);
    }
    context.linkProgram(program);
    if (!context.getProgramParameter(program, context.LINK_STATUS))
      throw new Error(context.getProgramInfoLog(program) || 'Shader linking failed');
    context.useProgram(program);
    const bindings = new Map(
      compiled
        .flatMap(result => result.reflection.bindings)
        .map(binding => [binding.shaderName, binding])
    );
    for (const binding of bindings.values()) {
      if (binding.kind === 'uniform') {
        const uniformBuffer = context.createBuffer()!;
        uniformBuffers.push(uniformBuffer);
        context.bindBuffer(context.UNIFORM_BUFFER, uniformBuffer);
        // WGSL column-major mat4 followed by tint; the compiler verifies the std140 offsets.
        context.bufferData(
          context.UNIFORM_BUFFER,
          new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0.7, 0.9, 1, 1]),
          context.STATIC_DRAW
        );
        const block = context.getUniformBlockIndex(program, binding.blockName!);
        if (block !== context.INVALID_INDEX) {
          context.uniformBlockBinding(program, block, binding.binding);
          context.bindBufferBase(context.UNIFORM_BUFFER, binding.binding, uniformBuffer);
        }
      } else if (binding.kind === 'texture') {
        const texture = context.createTexture()!;
        textures.push(texture);
        context.activeTexture(context.TEXTURE0 + textures.length - 1);
        context.bindTexture(context.TEXTURE_2D, texture);
        context.texImage2D(
          context.TEXTURE_2D,
          0,
          context.RGBA8,
          2,
          2,
          0,
          context.RGBA,
          context.UNSIGNED_BYTE,
          new Uint8Array([255, 180, 80, 255, 30, 90, 220, 255, 30, 90, 220, 255, 255, 180, 80, 255])
        );
        context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.NEAREST);
        context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.NEAREST);
        context.uniform1i(
          context.getUniformLocation(program, binding.shaderName),
          textures.length - 1
        );
      }
    }
    context.bindBuffer(context.ARRAY_BUFFER, buffer);
    context.bufferData(
      context.ARRAY_BUFFER,
      new Float32Array([-0.9, -0.85, 1, 0, 0, 0.9, -0.85, 0, 1, 0, 0, 0.85, 0, 0, 1]),
      context.STATIC_DRAW
    );
    context.enableVertexAttribArray(0);
    context.vertexAttribPointer(0, 2, context.FLOAT, false, 20, 0);
    context.enableVertexAttribArray(1);
    context.vertexAttribPointer(1, 3, context.FLOAT, false, 20, 8);
    context.viewport(0, 0, canvas.width, canvas.height);
    context.clearColor(0.025, 0.04, 0.065, 1);
    context.clear(context.COLOR_BUFFER_BIT);
    context.drawArrays(context.TRIANGLES, 0, 3);
    return {
      shaders: compiled.map(result => ({
        name: `GLSL ES 300 · WGSL ${result.stage}`,
        code: result.code
      })),
      destroy
    };
  } catch (error) {
    destroy();
    throw error;
  }
}
