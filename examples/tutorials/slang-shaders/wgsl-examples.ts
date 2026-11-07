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
  const destroy = () => {
    context.bindBuffer(context.ARRAY_BUFFER, null);
    context.useProgram(null);
    shaders.forEach(shader => context.deleteShader(shader));
    context.deleteBuffer(buffer);
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
