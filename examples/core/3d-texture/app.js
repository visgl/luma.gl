import {AnimationLoop, setParameters, Model, Texture3D } from 'luma.gl';
import {Matrix4, radians} from 'math.gl';
import {StatsWidget} from '@probe.gl/stats-widget'
import {default as noise3d} from 'noise3d';

const INFO_HTML = `
<p>
Cube drawn with <b>instanced rendering</b>.
<p>
A luma.gl <code>Cube</code>, rendering 65,536 instances in a
single GPU draw call using instanced vertex attributes.
`;

const vs = `
#version 300 es
in vec3 position;

uniform mat4 uProj;
uniform mat4 uView;

out vec3 vUV;
void main() {
  vUV = position.xyz + 0.5;
  gl_Position = uProj * uView * vec4(position, 1.0);
  gl_PointSize = 2.0;
}`;

const fs = `
#version 300 es
precision highp float;
precision lowp sampler3D;
in vec3 vUV;
uniform sampler3D uTexture;
uniform float uTime;
out vec4 fragColor;
void main() {
  float alpha = texture(uTexture, vUV + vec3(0.0, 0.0, uTime)).r * 0.03;
  fragColor = vec4(fract(vUV) * alpha, alpha);
}`;


class AppAnimationLoop extends AnimationLoop {
  constructor() {
    super({debug: true});
  }

  getInfo() {
    return INFO_HTML;
  }

  onInitialize({gl}) {
    const perlin = noise3d.createPerlin({
      interpolation: noise3d.interpolation.linear,
      permutation: noise3d.array.shuffle(noise3d.array.range(0, 255), Math.random)
    });

    setParameters(gl, {
      clearColor: [0, 0, 0, 1],
      blend: true,
      blendFunc: [gl.ONE, gl.ONE_MINUE_SRC_ALPHA]
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

    // CREATE 3D TEXTURE
    const TEXTURE_DIMENSIONS = 16;
    const textureData = new Uint8Array(TEXTURE_DIMENSIONS * TEXTURE_DIMENSIONS * TEXTURE_DIMENSIONS);
    let textureIndex = 0;
    for (let i = 0; i < TEXTURE_DIMENSIONS; ++i) {
      for (let j = 0; j < TEXTURE_DIMENSIONS; ++j) {
        for (let k = 0; k < TEXTURE_DIMENSIONS; ++k) {
          let val = perlin(i, j, k) * 255
          textureData[textureIndex++] = val;
        }
      }
    }

    const projMat = new Matrix4();
    const viewMat = new Matrix4().lookAt({eye: [1, 1, 1]});

    const texture = new Texture3D(gl, {
      width: DIMENSIONS,
      height: DIMENSIONS,
      depth: DIMENSIONS,
      pixels: textureData
    });

    const cloud = new Model(gl, {
      drawMode: gl.POINTS,
      attributes: {
        position: positionData
      },
      uniforms: {
        uTexture: texture,
        uView: viewMat
      }
    });

    const statsWidget = new StatsWidget(this.stats, {
      containerStyle: 'position: absolute;top: 20px;left: 20px;'
    });
    statsWidget.setFormatter('CPU Time', stat => `CPU Time: ${stat.getAverageTime().toFixed(2)}ms`);
    statsWidget.setFormatter('GPU Time', stat => `GPU Time: ${stat.getAverageTime().toFixed(2)}ms`);
    statsWidget.setFormatter('Frame Rate', stat => `Frame Rate: ${stat.getHz().toFixed(2)}fps`);

    return {cloud, projMat, statsWidget};
  }

  onRender(animationProps) {

    const {gl, cloud, projMat, statsWidget, tick} = animationProps;

    projMat.perspective({fov: radians(75), aspect, near: NEAR, far: FAR});

    if (tick % 60 === 10) {
      statsWidget.update();
      this.cpuTime.reset();
      this.gpuTime.reset();
      this.frameRate.reset();
    }

    // Draw the cubes
    gl.clear(gl.COLOR_BUFFER_BIT);
    cloud.draw({
      uniforms: {
        uTime: tick / 1000,
        uProj: projMat
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
