import {AnimationLoop, Model, Transform, CubeGeometry} from '@luma.gl/engine';
import {Buffer, Texture2D, clear} from '@luma.gl/webgl';
import {setParameters} from '@luma.gl/gltools';
import {phongLighting} from '@luma.gl/shadertools';
import {Matrix4} from 'math.gl';
import {getRandom} from '../../utils';

const INFO_HTML = `
<p>
Transform feedback on an instanced cube
</p>
`;

const PI2 = Math.PI * 2;

const random = getRandom();

const transformVs = `
  attribute float rotations;

  varying float vRotation;

  void main() {
    vRotation = rotations + 0.01;
  }
`;

const vs = `\
  attribute vec3 positions;
  attribute vec3 normals;
  attribute vec2 texCoords;
  attribute vec2 offsets;
  attribute vec3 axes;
  attribute float rotations;

  uniform mat4 uView;
  uniform mat4 uProjection;

  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUV;

  void main(void) {
    float s = sin(rotations);
    float c = cos(rotations);
    float t = 1.0 - c;
    float xt = axes.x * t;
    float yt = axes.y * t;
    float zt = axes.z * t;
    float xs = axes.x * s;
    float ys = axes.y * s;
    float zs = axes.z * s;

    mat3 rotationMat = mat3(
        axes.x * xt + c,
        axes.y * xt + zs,
        axes.z * xt - ys,
        axes.x * yt - zs,
        axes.y * yt + c,
        axes.z * yt + xs,
        axes.x * zt + ys,
        axes.y * zt - xs,
        axes.z * zt + c
    );

    vPosition = rotationMat * positions;
    vPosition.xy += offsets;
    vNormal = rotationMat * normals;
    vUV = texCoords;
    gl_Position = uProjection * uView * vec4(vPosition, 1.0);
  }
`;

const fs = `\
  precision highp float;

  uniform sampler2D uTexture;
  uniform vec3 uEyePosition;

  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUV;

  void main(void) {
    vec3 materialColor = texture2D(uTexture, vec2(vUV.x, 1.0 - vUV.y)).rgb;
    vec3 surfaceColor = lighting_getLightColor(materialColor, uEyePosition, vPosition, normalize(vNormal));

    gl_FragColor = vec4(surfaceColor, 1.0);
  }
`;

export default class AppAnimationLoop extends AnimationLoop {
  static getInfo() {
    return INFO_HTML;
  }

  onInitialize({gl}) {
    setParameters(gl, {
      depthTest: true,
      depthFunc: gl.LEQUAL
    });

    const offsetBuffer = new Buffer(gl, new Float32Array([3, 3, -3, 3, 3, -3, -3, -3]));

    // Create a buffer consisting of 4 normalized vectors
    const axisBufferData = new Float32Array(12);
    for (let i = 0; i < 4; ++i) {
      const vi = i * 3;
      const x = random();
      const y = random();
      const z = random();
      const l = Math.sqrt(x * x + y * y + z * z);

      axisBufferData[vi] = x / l;
      axisBufferData[vi + 1] = y / l;
      axisBufferData[vi + 2] = z / l;
    }
    const axisBuffer = new Buffer(gl, axisBufferData);

    const rotationBuffer = new Buffer(
      gl,
      new Float32Array([random() * PI2, random() * PI2, random() * PI2, random() * PI2])
    );

    const texture = new Texture2D(gl, {
      data: 'vis-logo.png'
    });

    const eyePosition = [0, 0, 10];
    const viewMatrix = new Matrix4().lookAt({eye: eyePosition});
    const projectionMatrix = new Matrix4();

    const transform = new Transform(gl, {
      vs: transformVs,
      sourceBuffers: {
        rotations: rotationBuffer
      },
      feedbackMap: {
        rotations: 'vRotation'
      },
      elementCount: 4
    });

    const model = new Model(gl, {
      vs,
      fs,
      geometry: new CubeGeometry(),
      attributes: {
        offsets: [offsetBuffer, {divisor: 1}],
        axes: [axisBuffer, {divisor: 1}],
        rotations: [rotationBuffer, {divisor: 1}]
      },
      uniforms: {
        uTexture: texture,
        uEyePosition: eyePosition,
        uView: viewMatrix
      },
      modules: [phongLighting],
      moduleSettings: {
        material: {
          specularColor: [255, 255, 255]
        },
        lights: [
          {
            type: 'ambient',
            color: [255, 255, 255]
          },
          {
            type: 'point',
            color: [255, 255, 255],
            position: [4, 8, 4]
          }
        ]
      },
      instanceCount: 4
    });

    return {
      model,
      transform,
      projectionMatrix
    };
  }

  onRender({gl, aspect, tick, model, transform, projectionMatrix}) {
    projectionMatrix.perspective({fov: Math.PI / 3, aspect});

    transform.run();

    clear(gl, {color: [0, 0, 0, 1], depth: true});
    model
      .setAttributes({rotations: [transform.getBuffer('vRotation'), {divisor: 1}]})
      .setUniforms({uProjection: projectionMatrix})
      .draw();

    transform.swap();
  }
}

/* global window */
if (typeof window !== 'undefined' && !window.website) {
  const animationLoop = new AppAnimationLoop();
  animationLoop.start();
}
