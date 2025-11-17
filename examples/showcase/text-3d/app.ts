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
export const description = 'Star Wars-style opening crawl built with extruded text geometry.'

const WGSL_SHADER = /* wgsl */ `
struct AppUniforms {
  modelMatrix : mat4x4<f32>,
  viewMatrix : mat4x4<f32>,
  projectionMatrix : mat4x4<f32>,
  normalMatrix : mat4x4<f32>,
  time : f32,
  fade : vec4<f32>,
};

@group(0) @binding(0) var<uniform> app : AppUniforms;

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
  let baseColor = vec3<f32>(1.0, 0.9, 0.32);
  return vec4<f32>(baseColor * (diffuse + glow) * crawlFade * texBloom, 1.0);
}
`

const VS_GLSL = /* glsl */ `#version 300 es
#define SHADER_NAME text-3d-vs

uniform appUniforms {
  mat4 modelMatrix;
  mat4 viewMatrix;
  mat4 projectionMatrix;
  mat4 normalMatrix;
  float time;
  vec4 fade;
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
`

const FS_GLSL = /* glsl */ `#version 300 es
#define SHADER_NAME text-3d-fs
precision highp float;

uniform appUniforms {
  mat4 modelMatrix;
  mat4 viewMatrix;
  mat4 projectionMatrix;
  mat4 normalMatrix;
  float time;
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
  vec3 baseColor = vec3(1.0, 0.9, 0.32) * texBloom;
  fragColor = vec4(baseColor * (diffuse + glow) * crawlFade, 1.0);
}
`

type AppUniforms = {
  modelMatrix: NumberArray
  viewMatrix: NumberArray
  projectionMatrix: NumberArray
  normalMatrix: NumberArray
  time: number
  fade: NumberArray
}

const app: ShaderModule<AppUniforms, AppUniforms> = {
  name: 'app',
  uniformTypes: {
    modelMatrix: 'mat4x4<f32>',
    viewMatrix: 'mat4x4<f32>',
    projectionMatrix: 'mat4x4<f32>',
    normalMatrix: 'mat4x4<f32>',
    time: 'f32',
    fade: 'vec4<f32>'
  }
}

const font = parseFont(helvetiker)

const crawlText = [
  'EPISODE IV',
  'A NEW HOPE',
  '',
  'It is a period of civil war.',
  'Rebel spaceships, striking',
  'from a hidden base, have won',
  'their first victory against',
  'the evil Galactic Empire.'
].join('\n')

export default class TextAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = `
<p>Extrudes text geometry using a typeface JSON font with beveling.</p>
<p>The text scrolls into deep space in homage to the Star Wars opening crawl.</p>
<p>Enable canvas antialiasing or increase bevel and curve segments if the edges shimmer.</p>
`

  modelMatrix = new Matrix4()
  normalMatrix = new Matrix4()
  viewMatrix = new Matrix4().lookAt({eye: [0, 90, 520], center: [0, 80, -420]})
  projectionMatrix = new Matrix4()
  shaderInputs = new ShaderInputs<{app: typeof app.props}>({app})
  model: Model
  /** Horizontal translation that centers the generated text geometry. */
  geometryOffset: [number, number, number]

  constructor({device}: AnimationProps) {
    super()

    this.shaderInputs.setProps({
      app: {
        modelMatrix: new Matrix4(),
        viewMatrix: this.viewMatrix,
        projectionMatrix: new Matrix4(),
        normalMatrix: new Matrix4(),
        time: 0,
        fade: [0, 0, 0, 0]
      }
    })

    // Reduced tessellation to stay well under default WebGPU buffer limits
    const geometry = new TextGeometry(crawlText, {
      font,
      size: 78,
      depth: 20,
      bevelEnabled: true,
      bevelThickness: 3.5,
      bevelSize: 5,
      bevelSegments: 3,
      curveSegments: 6
    })

    const geometryAttributes = geometry.getAttributes()
    const positionAttribute = geometryAttributes.positions || geometryAttributes.POSITION
    let minX = Number.POSITIVE_INFINITY
    let maxX = Number.NEGATIVE_INFINITY

    if (positionAttribute) {
      const {value} = positionAttribute
      for (let index = 0; index < value.length; index += 3) {
        const positionX = value[index]
        minX = Math.min(minX, positionX)
        maxX = Math.max(maxX, positionX)
      }
    }

    const centerX = Number.isFinite(minX) && Number.isFinite(maxX) ? (minX + maxX) / 2 : 0
    this.geometryOffset = [-centerX, 0, 0]

    this.model = new Model(device, {
      id: 'text-geometry',
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
    })
  }

  onRender({device, tick, aspect}: AnimationProps) {
    const elapsedSeconds = tick * 0.016
    const crawlDurationSeconds = 46 / 5
    const crawlProgress = (elapsedSeconds % crawlDurationSeconds) / crawlDurationSeconds
    const depthOffset = -120 - crawlProgress * 520
    const verticalOffset = -220 + crawlProgress * 320

    this.modelMatrix
      .identity()
      .translate(this.geometryOffset)
      .translate([0, verticalOffset, depthOffset])
      .rotateX(-0.9)
      .rotateZ(0.08)
      .scale([1.12, 1.12, 1])

    this.normalMatrix.copy(this.modelMatrix).invert().transpose()
    this.projectionMatrix.perspective({fovy: Math.PI / 4.5, aspect, near: 24, far: 3200})

    this.shaderInputs.setProps({
      app: {
        modelMatrix: this.modelMatrix,
        viewMatrix: this.viewMatrix,
        projectionMatrix: this.projectionMatrix,
        normalMatrix: this.normalMatrix,
        time: tick * 0.016,
        fade: [-220, -80, 380, 620]
      }
    })

    const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1], clearDepth: true})
    this.model.draw(renderPass)
    renderPass.end()
  }

  onFinalize() {
    this.model.destroy()
  }
}
