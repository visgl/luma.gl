// Ported from PicoGL.js example: https://tsherif.github.io/picogl.js/examples/3Dtexture.html

import type {AnimationProps} from '@luma.gl/engine';
import {Texture} from '@luma.gl/core';
import {AnimationLoopTemplate, Model, ShaderInputs, makeRandomGenerator} from '@luma.gl/engine';
import {ShaderModule} from '@luma.gl/shadertools';
import {Matrix4, radians, NumericArray} from '@math.gl/core';
import {perlin, lerp, shuffle, range} from './perlin';

const random = makeRandomGenerator();

const INFO_HTML = `
<p>
Volumetric 3D noise visualized using a <b>3D texture</b>.
<p>
Uses the luma.gl <code>Texture3D</code> class.
`;

// TODO - WGSL shader is work in progress
const source = /* WGSL */ `\
struct Uniforms {
  mvpMatrix : mat4x4<f32>,
};

@binding(0) @group(0) var<uniform> app : Uniforms;

struct VertexInputs {
  // CUBE GEOMETRY
  @location(0) positions : vec4<f32>,
};

struct FragmentInputs {
  @builtin(position) Position : vec4<f32>,
  @location(0) fragUVW : vec3<f32>,
}

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  var outputs : FragmentInputs;
  outputs.Position = app.mvpMatrix * inputs.positions;
  outputs.fragUVW = inputs.positions.xyz;
  outputs.fragPosition = 0.5 * (inputs.positions + vec4(1.0, 1.0, 1.0, 1.0));
  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  // TODO - port GLSL
  return inputs.fragPosition;
}
`;

const vs = /* glsl */ `\
#version 300 es
in vec3 position;

uniform appUniforms {
  mat4 mvpMatrix;
  float time;
} app;

out vec3 vUVW;
void main() {
  vUVW = position.xyz + 0.5;
  gl_Position = app.mvpMatrix * vec4(position, 1.0);
  gl_PointSize = 2.0;
}`;

const fs = /* glsl */ `\
#version 300 es
precision highp float;
precision lowp sampler3D;

uniform appUniforms {
  mat4 mvpMatrix;
  float time;
} app;

uniform sampler3D uTexture;

in vec3 vUVW;
out vec4 fragColor;

void main() {
  vec4 sampleColor = texture(uTexture, vUVW + vec3(0.0, 0.0, app.time));
  float alpha = sampleColor.r * 0.1;
  fragColor = vec4(fract(vUVW) * alpha, alpha);
}`;

type AppUniforms = {
  mvpMatrix: NumericArray;
  time: number;
};

const app: ShaderModule<AppUniforms> = {
  name: 'app',
  uniformTypes: {
    mvpMatrix: 'mat4x4<f32>',
    time: 'f32'
  }
};

// APPLICATION

/** number of points per side */
const POINTS_PER_SIDE = 128;
const TEXTURE_DIMENSIONS = 16;

const NEAR = 0.1;
const FAR = 10.0;

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = INFO_HTML;
  static props = {useDevicePixels: true};

  mvpMatrix = new Matrix4();
  viewMat = new Matrix4().lookAt({eye: [1, 1, 1]});
  
  texture3d: Texture;
  cloud: Model;

  shaderInputs = new ShaderInputs<{app: typeof app.props}>({app});

  constructor({device}: AnimationProps) {
    super();

    const positionData = createPointCloud(POINTS_PER_SIDE);
    const positionBuffer = device.createBuffer(positionData);

    const textureData = createNoiseTexture3D(TEXTURE_DIMENSIONS);

    // console.log('SETTING DATA', textureData);

    this.texture3d = device.createTexture({
      dimension: '3d',
      data: textureData,
      width: TEXTURE_DIMENSIONS,
      height: TEXTURE_DIMENSIONS,
      depth: TEXTURE_DIMENSIONS,
      format: 'r8unorm',
      mipmaps: true,
      sampler: {
        magFilter: 'nearest',
        minFilter: 'nearest',
        mipmapFilter: 'nearest'
      }
    });

    // const pixels = device.readPixelsToArrayWebGL(this.texture3d);
    // console.log('GETTING DATA', pixels);

    this.cloud = new Model(device, {
      // source,
      vs,
      fs,
      topology: 'point-list',
      vertexCount: positionData.length / 3,
      bufferLayout: [{name: 'position', format: 'float32x3'}],
      attributes: {
        position: positionBuffer
      },
      bindings: {
        uTexture: this.texture3d
      },
      shaderInputs: this.shaderInputs,
      parameters: {
        depthWriteEnabled: true,
        depthCompare: 'less-equal',
        blend: true,
        blendColorOperation: 'add',
        blendAlphaOperation: 'add',
        blendColorSrcFactor: 'one',
        blendColorDstFactor: 'one-minus-src-color',
        blendAlphaSrcFactor: 'one',
        blendAlphaDstFactor: 'one-minus-src-alpha'
      }
    });
  }

  onFinalize() {
    this.cloud.destroy();
  }

  onRender({device, tick, aspect}: AnimationProps) {
    // Update mvp matrix with current aspect ratio
    this.mvpMatrix
      .perspective({fovy: radians(75), aspect, near: NEAR, far: FAR})
      .multiplyRight(this.viewMat);

    // This updates the "app" uniform buffer, which is already bound
    this.shaderInputs.setProps({
      app: {
        time: tick / 100,
        mvpMatrix: this.mvpMatrix
      }
    });
    this.cloud.updateShaderInputs();

    // Draw the cubes
    const renderPass = device.beginRenderPass({
      clearColor: [0,0,0,1],
      clearDepth: 1
    });

    this.cloud.draw(renderPass);
    renderPass.end();
  }
}

/** Create a cube of points */
function createPointCloud(pointsPerSide: number): Float32Array {
  // CREATE POINT CLOUD
  const INCREMENT = 1 / pointsPerSide;

  const positionData = new Float32Array(pointsPerSide ** 3 * 3);
  let positionIndex = 0;
  let x = -0.5;
  for (let i = 0; i < pointsPerSide; ++i) {
    let y = -0.5;
    for (let j = 0; j < pointsPerSide; ++j) {
      let z = -0.5;
      for (let k = 0; k < pointsPerSide; ++k) {
        positionData[positionIndex++] = x;
        positionData[positionIndex++] = y;
        positionData[positionIndex++] = z;
        z += INCREMENT;
      }
      y += INCREMENT;
    }
    x += INCREMENT;
  }
  return positionData;
}

/** Create a cube of 16x16x16 noise values */
function createNoiseTexture3D(texelsPerSide: number): Uint8Array {
  const noise = perlin({
    interpolation: lerp,
    permutation: shuffle(range(0, 255), random)
  });

  // CREATE 3D TEXTURE
  const NOISE_DIMENSIONS = texelsPerSide * 0.07;
  const textureData = new Uint8Array(texelsPerSide ** 3);
  let textureIndex = 0;
  for (let i = 0; i < texelsPerSide; ++i) {
    for (let j = 0; j < texelsPerSide; ++j) {
      for (let k = 0; k < texelsPerSide; ++k) {
        const noiseLevel = noise(
          i / NOISE_DIMENSIONS,
          j / NOISE_DIMENSIONS,
          k / NOISE_DIMENSIONS
        );
        textureData[textureIndex++] = (0.5 + 0.5 * noiseLevel) * 255;
      }
    }
  }
  return textureData;
}
