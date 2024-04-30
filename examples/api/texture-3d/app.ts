// Ported from PicoGL.js example: https://tsherif.github.io/picogl.js/examples/3Dtexture.html

import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate, Model, makeRandomGenerator} from '@luma.gl/engine';
import {Matrix4, radians} from '@math.gl/core';
import {perlin, lerp, shuffle, range} from './perlin';

const random = makeRandomGenerator();

const INFO_HTML = `
<p>
Volumetric 3D noise visualized using a <b>3D texture</b>.
<p>
Uses the luma.gl <code>Texture3D</code> class.
`;

const vs = /* glsl */ `\
#version 300 es
in vec3 position;

uniform mat4 uMVP;

out vec3 vUV;
void main() {
  vUV = position.xyz + 0.5;
  gl_Position = uMVP * vec4(position, 1.0);
  gl_PointSize = 2.0;
}`;

const fs = /* glsl */ `\
#version 300 es
precision highp float;
precision lowp sampler3D;

uniform sampler3D uTexture;
uniform float uTime;

in vec3 vUV;
out vec4 fragColor;

void main() {
  vec4 sampleColor = texture(uTexture, vUV + vec3(0.0, 0.0, uTime));
  float alpha = sampleColor.r * 0.01;
  fragColor = vec4(fract(vUV) * alpha, alpha * 0.3);
  // fragColor = vec4(fract(uTime), 0., 0., 1.);
}`;

const NEAR = 0.1;
const FAR = 10.0;

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = INFO_HTML;
  static props = {useDevicePixels: true};

  mvpMat = new Matrix4();
  viewMat = new Matrix4().lookAt({eye: [1, 1, 1]});
  cloud: Model;

  constructor({device}: AnimationProps) {
    super();

    const noise = perlin({
      interpolation: lerp,
      permutation: shuffle(range(0, 255), random)
    });

    // CREATE POINT CLOUD
    const DIMENSIONS = 32;
    const INCREMENT = 1 / DIMENSIONS;

    const positionData = new Float32Array(DIMENSIONS ** 3 * 3);
    let positionIndex = 0;
    let x = -0.5;
    for (let i = 0; i < DIMENSIONS; ++i) {
      let y = -0.5;
      for (let j = 0; j < DIMENSIONS; ++j) {
        let z = -0.5;
        for (let k = 0; k < DIMENSIONS; ++k) {
          positionData[positionIndex++] = x;
          positionData[positionIndex++] = y;
          positionData[positionIndex++] = z;
          z += INCREMENT;
        }
        y += INCREMENT;
      }
      x += INCREMENT;
    }

    const positionBuffer = device.createBuffer(positionData);

    // CREATE 3D TEXTURE
    const TEXTURE_DIMENSIONS = 16;
    const NOISE_DIMENSIONS = TEXTURE_DIMENSIONS * 0.07;
    const textureData = new Uint8Array(TEXTURE_DIMENSIONS ** 3);
    let textureIndex = 0;
    for (let i = 0; i < TEXTURE_DIMENSIONS; ++i) {
      for (let j = 0; j < TEXTURE_DIMENSIONS; ++j) {
        for (let k = 0; k < TEXTURE_DIMENSIONS; ++k) {
          const noiseLevel = noise(
            i / NOISE_DIMENSIONS,
            j / NOISE_DIMENSIONS,
            k / NOISE_DIMENSIONS
          );
          textureData[textureIndex++] = (0.5 + 0.5 * noiseLevel) * 255;
        }
      }
    }

    const texture = device.createTexture({
      dimension: '3d',
      data: textureData,
      width: TEXTURE_DIMENSIONS,
      height: TEXTURE_DIMENSIONS,
      depth: TEXTURE_DIMENSIONS,
      format: 'r8unorm',
      // mipmaps: true,
      sampler: {
        magFilter: 'nearest',
        minFilter: 'nearest',
        mipmapFilter: 'nearest'
      }
    });

    this.cloud = new Model(device, {
      vs,
      fs,
      topology: 'point-list',
      vertexCount: positionData.length / 3,
      bufferLayout: [{name: 'position', format: 'float32x3'}],
      attributes: {
        position: positionBuffer
      },
      bindings: {
        uTexture: texture
      },
      uniforms: {
        uView: this.viewMat
      },
      parameters: {
        depthWriteEnabled: true,
        depthCompare: 'less-equal',
        blendColorOperation: 'add',
        blendColorSrcFactor: 'one',
        blendColorDstFactor: 'one-minus-src-alpha'
        //   // TODO these should be set on the model, but doesn't work...
        //   blend: true,
        //   blendFunc: [GL.ONE, GL.ONE_MINUS_SRC_ALPHA]
      }
    });
  }

  onFinalize() {
    this.cloud.destroy();
  }

  onRender({device, tick, aspect}: AnimationProps) {
    this.mvpMat
      .perspective({fovy: radians(75), aspect, near: NEAR, far: FAR})
      .multiplyRight(this.viewMat);

    // Draw the cubes
    const renderPass = device.beginRenderPass({
      clearColor: [0, 0, 0, 1]
      // clearDepth: true
    });

    this.cloud.setUniforms({
      uTime: tick / 100,
      uMVP: this.mvpMat
    });
    this.cloud.draw(renderPass);
    renderPass.end();
  }
}
