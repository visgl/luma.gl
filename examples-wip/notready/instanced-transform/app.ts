import {glsl} from '@luma.gl/core';
import {AnimationLoopTemplate, AnimationProps, CubeGeometry, Model, Transform} from '@luma.gl/engine';
import {phongLighting} from '@luma.gl/shadertools';
import {Matrix4} from '@math.gl/core';

const INFO_HTML = `
<p>
Transform feedback on an instanced cube
</p>
`;

const ALT_TEXT = 'THIS DEMO REQUIRES WEBGL 2, BUT YOUR BROWSER DOESN\'T SUPPORT IT';

const PI2 = Math.PI * 2;

const transformVs = `
  attribute float rotations;

  varying float vRotation;

  void main() {
    vRotation = rotations + 0.01;
  }
`;

const vs = glsl`\
  attribute vec3 positions;
  attribute vec3 normals;
  attribute vec2 texCoords;
  attribute vec2 instanceOffsets;
  attribute vec3 instanceAxes;
  attribute float instanceRotations;

  uniform mat4 uView;
  uniform mat4 uProjection;

  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUV;

  void main(void) {
    float s = sin(instanceRotations);
    float c = cos(instanceRotations);
    float t = 1.0 - c;
    float xt = instanceAxes.x * t;
    float yt = instanceAxes.y * t;
    float zt = instanceAxes.z * t;
    float xs = instanceAxes.x * s;
    float ys = instanceAxes.y * s;
    float zs = instanceAxes.z * s;

    mat3 rotationMat = mat3(
        instanceAxes.x * xt + c,
        instanceAxes.y * xt + zs,
        instanceAxes.z * xt - ys,
        instanceAxes.x * yt - zs,
        instanceAxes.y * yt + c,
        instanceAxes.z * yt + xs,
        instanceAxes.x * zt + ys,
        instanceAxes.y * zt - xs,
        instanceAxes.z * zt + c
    );

    vPosition = rotationMat * positions;
    vPosition.xy += instanceOffsets;
    vNormal = rotationMat * normals;
    vUV = texCoords;
    gl_Position = uProjection * uView * vec4(vPosition, 1.0);
  }
`;

const fs = glsl`\
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

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = INFO_HTML;

  projectionMatrix = new Matrix4();
  model: Model;
  transform: Transform;

  constructor({device}: AnimationProps) {
    super();
    if (device.info.type !== 'webgl2') {
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
    const axisBuffer = device.createBuffer(axisBufferData);

    const rotationBuffer = device.createBuffer(
      new Float32Array([Math.random() * PI2, Math.random() * PI2, Math.random() * PI2, Math.random() * PI2])
    );

    const texture = device.createTexture({data: 'vis-logo.png'});

    const eyePosition = [0, 0, 10];
    const viewMatrix = new Matrix4().lookAt({eye: eyePosition});

    this.transform = new Transform(device, {
      vs: transformVs,
      sourceBuffers: {
        // @ts-expect-error TODO fix transform so it can use luma/api buffers
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
        instanceOffsets: offsetBuffer,
        instanceAxes: axisBuffer,
        instanceRotations: rotationBuffer
      },
      bindings: {
        uTexture: texture,
      },
      uniforms: {
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
    const renderPass = device.beginRenderPass({
      clearColor: [0, 0, 0, 1], 
      clearDepth: 1
    });
    
    this.projectionMatrix.perspective({fovy: Math.PI / 3, aspect});

    this.transform.run();

    this.model.setAttributes({instanceRotations: this.transform.getBuffer('vRotation')})
    this.model.setUniforms({uProjection: this.projectionMatrix})

    this.model.draw(renderPass);

    this.transform.swap();

    renderPass.end();
  }
}
