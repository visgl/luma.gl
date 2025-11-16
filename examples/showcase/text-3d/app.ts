// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {NumberArray} from '@luma.gl/core'
import type {AnimationProps} from '@luma.gl/engine'
import {AnimationLoopTemplate, Model, ShaderInputs} from '@luma.gl/engine'
import {ShaderModule} from '@luma.gl/shadertools'
import {Matrix4} from '@math.gl/core'
import {parseFont, TextGeometry} from '@luma.gl/text'
import {helvetiker} from './helvetiker-font'

export const title = '3D Text'
export const description = 'Extruded text geometry rendered with lighting.'

const WGSL_SHADER = /* wgsl */ `
struct AppUniforms {
  modelMatrix : mat4x4<f32>,
  viewMatrix : mat4x4<f32>,
  projectionMatrix : mat4x4<f32>,
  normalMatrix : mat4x4<f32>,
  time : f32,
};

@group(0) @binding(0) var<uniform> app : AppUniforms;

struct VertexInputs {
  @location(0) positions : vec3<f32>,
  @location(1) normals : vec3<f32>,
};

struct FragmentInputs {
  @builtin(position) Position : vec4<f32>,
  @location(0) vNormal : vec3<f32>,
};

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  var outputs : FragmentInputs;
  let worldPosition = app.modelMatrix * vec4<f32>(inputs.positions, 1.0);
  outputs.Position = app.projectionMatrix * app.viewMatrix * worldPosition;
  outputs.vNormal = normalize((app.normalMatrix * vec4<f32>(inputs.normals, 0.0)).xyz);
  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  let lightDirection = normalize(vec3<f32>(0.5, 1.0, 0.25));
  let diffuse = max(dot(lightDirection, normalize(inputs.vNormal)), 0.18);
  let glow = 0.08 + 0.05 * sin(app.time * 0.5);
  let baseColor = vec3<f32>(0.8, 0.45, 1.0);
  return vec4<f32>(baseColor * (diffuse + glow), 1.0);
}
`

const VS_GLSL = /* glsl */ `
#version 300 es
#define SHADER_NAME text-3d-vs

uniform appUniforms {
  mat4 modelMatrix;
  mat4 viewMatrix;
  mat4 projectionMatrix;
  mat4 normalMatrix;
  float time;
} app;

layout(location=0) in vec3 positions;
layout(location=1) in vec3 normals;

out vec3 vNormal;

void main() {
  vec4 worldPosition = app.modelMatrix * vec4(positions, 1.0);
  gl_Position = app.projectionMatrix * app.viewMatrix * worldPosition;
  vNormal = normalize((app.normalMatrix * vec4(normals, 0.0)).xyz);
}
`

const FS_GLSL = /* glsl */ `
#version 300 es
#define SHADER_NAME text-3d-fs
precision highp float;

uniform appUniforms {
  mat4 modelMatrix;
  mat4 viewMatrix;
  mat4 projectionMatrix;
  mat4 normalMatrix;
  float time;
} app;

in vec3 vNormal;
layout(location=0) out vec4 fragColor;

void main() {
  vec3 lightDirection = normalize(vec3(0.5, 1.0, 0.25));
  float diffuse = max(dot(lightDirection, normalize(vNormal)), 0.18);
  float glow = 0.08 + 0.05 * sin(app.time * 0.5);
  vec3 baseColor = vec3(0.8, 0.45, 1.0);
  fragColor = vec4(baseColor * (diffuse + glow), 1.0);
}
`

type AppUniforms = {
  modelMatrix: NumberArray
  viewMatrix: NumberArray
  projectionMatrix: NumberArray
  normalMatrix: NumberArray
  time: number
}

const app: ShaderModule<AppUniforms, AppUniforms> = {
  name: 'app',
  uniformTypes: {
    modelMatrix: 'mat4x4<f32>',
    viewMatrix: 'mat4x4<f32>',
    projectionMatrix: 'mat4x4<f32>',
    normalMatrix: 'mat4x4<f32>',
    time: 'f32'
  }
}

const font = parseFont(helvetiker)

export default class TextAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = `
<p>Extrudes text geometry using a typeface JSON font with beveling.</p>
`

  modelMatrix = new Matrix4()
  normalMatrix = new Matrix4()
  viewMatrix = new Matrix4().lookAt({eye: [0, 140, 320], center: [0, 40, 0]})
  projectionMatrix = new Matrix4()
  shaderInputs = new ShaderInputs<{app: typeof app.props}>({app})
  model: Model

  constructor({device}: AnimationProps) {
    super()

    const geometry = new TextGeometry('luma.gl', {
      font,
      size: 90,
      depth: 28,
      bevelEnabled: true,
      bevelThickness: 4,
      bevelSize: 6,
      bevelSegments: 3,
      curveSegments: 10
    })

    this.model = new Model(device, {
      id: 'text-geometry',
      source: WGSL_SHADER,
      vs: VS_GLSL,
      fs: FS_GLSL,
      shaderInputs: this.shaderInputs,
      geometry,
      parameters: {
        depthWriteEnabled: true,
        depthCompare: 'less-equal'
      }
    })
  }

  onRender({device, tick, aspect}: AnimationProps) {
    this.modelMatrix
      .identity()
      .translate([-110, -40, 0])
      .rotateY(tick * 0.01)
      .rotateX(0.15 + tick * 0.003)

    this.normalMatrix.copy(this.modelMatrix).invert().transpose()
    this.projectionMatrix.perspective({fovy: Math.PI / 4, aspect, near: 0.1, far: 1000})

    this.shaderInputs.setProps({
      app: {
        modelMatrix: this.modelMatrix,
        viewMatrix: this.viewMatrix,
        projectionMatrix: this.projectionMatrix,
        normalMatrix: this.normalMatrix,
        time: tick * 0.016
      }
    })

    const renderPass = device.beginRenderPass({clearColor: [0.02, 0.02, 0.06, 1], clearDepth: true})
    this.model.draw(renderPass)
    renderPass.end()
  }

  onFinalize() {
    this.model.destroy()
  }
}
