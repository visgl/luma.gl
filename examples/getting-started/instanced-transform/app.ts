import {RenderLoop, AnimationProps, Model, Transform, CubeGeometry} from '@luma.gl/engine';
import {Buffer, clear, isWebGL2} from '@luma.gl/webgl';
import {phongLighting} from '@luma.gl/shadertools';
import {Matrix4} from '@math.gl/core';

const INFO_HTML = `
<p>
Transform feedback on an instanced cube
</p>
`;

const ALT_TEXT = "THIS DEMO REQUIRES WEBGL 2, BUT YOUR BROWSER DOESN'T SUPPORT IT";

const PI2 = Math.PI * 2;

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

export default class AppRenderLoop extends RenderLoop {
  static info = INFO_HTML;

  projectionMatrix = new Matrix4();
  model: Model;
  transform: Transform;

  constructor({device, gl}: AnimationProps) {
    super();
    if (!isWebGL2(gl)) {
      throw new Error(ALT_TEXT);
    }

    const offsetBuffer = device.createBuffer(new Float32Array([3, 3, -3, 3, 3, -3, -3, -3]));

    // Create a buffer consisting of 4 normalized vectors
    const axisBufferData = new Float32Array(12);
    for (let i = 0; i < 4; ++i) {
      const vi = i * 3;
      const x = Math.random();
      const y = Math.random();
      const z = Math.random();
      const l = Math.sqrt(x * x + y * y + z * z);

      axisBufferData[vi] = x / l;
      axisBufferData[vi + 1] = y / l;
      axisBufferData[vi + 2] = z / l;
    }
    const axisBuffer = new Buffer(gl, axisBufferData);

    const rotationBuffer = new Buffer(
      gl,
      new Float32Array([Math.random() * PI2, Math.random() * PI2, Math.random() * PI2, Math.random() * PI2])
    );

    const texture = device.createTexture({data: 'vis-logo.png'});

    const eyePosition = [0, 0, 10];
    const viewMatrix = new Matrix4().lookAt({eye: eyePosition});

    this.transform = new Transform(device, {
      vs: transformVs,
      sourceBuffers: {
        rotations: rotationBuffer
      },
      feedbackMap: {
        rotations: 'vRotation'
      },
      elementCount: 4
    });

    this.model = new Model(device, {
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
      instanceCount: 4,
      parameters: {
        depthWriteEnabled: true,
        depthCompare: 'less-equal'
      }    
    });
  }

  onFinalize() {
    this.transform.destroy();
    this.model.destroy();
  }

  onRender({device, aspect}: AnimationProps) {
    this.projectionMatrix.perspective({fov: Math.PI / 3, aspect});

    this.transform.run();

    clear(device, {color: [0, 0, 0, 1], depth: true});
    this.model
      .setAttributes({rotations: [this.transform.getBuffer('vRotation'), {divisor: 1}]})
      .setUniforms({uProjection: this.projectionMatrix})
      .draw();

    this.transform.swap();
  }
}

// @ts-ignore
if (typeof window !== 'undefined' && !window.website) {
  RenderLoop.run(AppRenderLoop);
}
