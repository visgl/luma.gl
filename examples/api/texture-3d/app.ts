// Ported from PicoGL.js example: https://tsherif.github.io/picogl.js/examples/3Dtexture.html

import type {AnimationProps} from '@luma.gl/engine';
import {Texture} from '@luma.gl/core';
import {AnimationLoopTemplate, Model, _ShaderInputs, makeRandomGenerator} from '@luma.gl/engine';
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

const vs = /* glsl */ `\
#version 300 es
in vec3 position;

uniform appUniforms {
  mat4 mvpMatrix;
  float time;
} app;

out vec3 vUV;
void main() {
  vUV = position.xyz + 0.5;
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

in vec3 vUV;
out vec4 fragColor;

void main() {
  vec4 sampleColor = texture(uTexture, vUV + vec3(0.0, 0.0, app.time));
  float alpha = sampleColor.r * 0.1;
  fragColor = vec4(fract(vUV) * alpha, alpha);
  // fragColor = vec4(fract(app.time), 0., 0., 1.);
  fragColor *= 256.;
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

const NEAR = 0.1;
const FAR = 10.0;

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = INFO_HTML;
  static props = {useDevicePixels: true};

  mvpMatrix = new Matrix4();
  viewMat = new Matrix4().lookAt({eye: [1, 1, 1]});
  texture3d: Texture;
  cloud: Model;

  shaderInputs = new _ShaderInputs<{app: typeof app.props}>({app});

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
        blendColorDstFactor: 'one-minus-src-alpha',
        blendAlphaSrcFactor: 'one',
        blendAlphaDstFactor: 'one-minus-src-alpha'
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
      clearColor: [0, 0, 0, 1]
      // clearDepth: true
    });

    this.cloud.draw(renderPass);
    renderPass.end();
  }
}
