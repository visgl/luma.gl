import {AnimationLoop, setParameters, Model, Texture3D, Buffer} from '@luma.gl/core';
import {Matrix4, radians} from 'math.gl';
import {perlin, lerp, shuffle, range} from './perlin';

/*
  Ported from PicoGL.js example: https://tsherif.github.io/picogl.js/examples/3Dtexture.html
*/

const INFO_HTML = `
<p>
Volumetric 3D noise visualized using a <b>3D texture</b>.
<p>
Uses the luma.gl <code>Texture3D</code> class.
`;

const vs = `\
#version 300 es
in vec3 position;

uniform mat4 uMVP;

out vec3 vUV;
void main() {
  vUV = position.xyz + 0.5;
  gl_Position = uMVP * vec4(position, 1.0);
  gl_PointSize = 2.0;
}`;

const fs = `\
#version 300 es
precision highp float;
precision lowp sampler3D;
in vec3 vUV;
uniform sampler3D uTexture;
uniform float uTime;
out vec4 fragColor;
void main() {
  float alpha = texture(uTexture, vUV + vec3(0.0, 0.0, uTime)).r * 0.1;
  fragColor = vec4(fract(vUV) * alpha, alpha);
}`;

const NEAR = 0.1;
const FAR = 10.0;

class AppAnimationLoop extends AnimationLoop {
  constructor() {
    super({useDevicePixels: false});
  }

  getInfo() {
    return INFO_HTML;
  }

  onInitialize({gl}) {
    const noise = perlin({
      interpolation: lerp,
      permutation: shuffle(range(0, 255), Math.random)
    });

    setParameters(gl, {
      clearColor: [0, 0, 0, 1],
      blend: true,
      blendFunc: [gl.ONE, gl.ONE_MINUS_SRC_ALPHA]
    });

    // CREATE POINT CLOUD
    const DIMENSIONS = 128;
    const INCREMENT = 1 / DIMENSIONS;

    const positionData = new Float32Array(DIMENSIONS * DIMENSIONS * DIMENSIONS * 3);
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

    const positionBuffer = new Buffer(gl, positionData);

    // CREATE 3D TEXTURE
    const TEXTURE_DIMENSIONS = 16;
    const NOISE_DIMENSIONS = TEXTURE_DIMENSIONS * 0.07;
    const textureData = new Uint8Array(
      TEXTURE_DIMENSIONS * TEXTURE_DIMENSIONS * TEXTURE_DIMENSIONS
    );
    let textureIndex = 0;
    for (let i = 0; i < TEXTURE_DIMENSIONS; ++i) {
      for (let j = 0; j < TEXTURE_DIMENSIONS; ++j) {
        for (let k = 0; k < TEXTURE_DIMENSIONS; ++k) {
          textureData[textureIndex++] =
            (0.5 + 0.5 * noise(i / NOISE_DIMENSIONS, j / NOISE_DIMENSIONS, k / NOISE_DIMENSIONS)) *
            255;
        }
      }
    }

    const mvpMat = new Matrix4();
    const viewMat = new Matrix4().lookAt({eye: [1, 1, 1]});

    const texture = new Texture3D(gl, {
      width: TEXTURE_DIMENSIONS,
      height: TEXTURE_DIMENSIONS,
      depth: TEXTURE_DIMENSIONS,
      data: textureData,
      format: gl.RED,
      dataFormat: gl.R8
    });

    const cloud = new Model(gl, {
      vs,
      fs,
      drawMode: gl.POINTS,
      vertexCount: positionData.length / 3,
      attributes: {
        position: positionBuffer
      },
      uniforms: {
        uTexture: texture,
        uView: viewMat
      }
    });

    return {cloud, mvpMat, viewMat};
  }

  onRender(animationProps) {
    const {gl, cloud, mvpMat, viewMat, tick, aspect} = animationProps;

    mvpMat.perspective({fov: radians(75), aspect, near: NEAR, far: FAR}).multiplyRight(viewMat);

    // Draw the cubes
    gl.clear(gl.COLOR_BUFFER_BIT);
    cloud.draw({
      uniforms: {
        uTime: tick / 100,
        uMVP: mvpMat
      }
    });
  }

  onFinalize({gl, cloud}) {
    cloud.delete();
  }
}

const animationLoop = new AppAnimationLoop();

export default animationLoop;

/* global window */
if (typeof window !== 'undefined' && !window.website) {
  animationLoop.start();
}
