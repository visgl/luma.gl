import {glsl} from '@luma.gl/api';
import {AnimationLoopTemplate, AnimationProps, Model, CubeGeometry} from '@luma.gl/engine';
import {phongLighting} from '@luma.gl/shadertools';
import {Matrix4} from '@math.gl/core';

const INFO_HTML = `
<p>
Drawing a phong-shaded cube
</p>
`;

const vs = glsl`\
  attribute vec3 positions;
  attribute vec3 normals;
  attribute vec2 texCoords;

  uniform mat4 uModel;
  uniform mat4 uMVP;

  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUV;

  void main(void) {
    vPosition = (uModel * vec4(positions, 1.0)).xyz;
    vNormal = mat3(uModel) * normals;
    vUV = texCoords;
    gl_Position = uMVP * vec4(positions, 1.0);
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

const eyePosition = [0, 0, 5];

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = INFO_HTML;

  model: Model;
  modelMatrix = new Matrix4();
  viewMatrix = new Matrix4().lookAt({eye: eyePosition});
  mvpMatrix = new Matrix4();
  
  constructor({device}: AnimationProps) {
    super();

    const texture = device.createTexture({data: 'vis-logo.png'});

    this.model = new Model(device, {
      vs,
      fs,
      geometry: new CubeGeometry(),
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
            position: [1, 2, 1]
          }
        ]
      },
      bindings: {
        uTexture: texture,
      },
      uniforms: {
        uEyePosition: eyePosition
      },
      parameters: {
        depthWriteEnabled: true,
        depthCompare: 'less-equal'  
      }
    });
  }

  override onFinalize() {
    this.model.destroy();
  }

  override onRender({device, aspect, tick}) {
    const renderPass = device.beginRenderPass({
      clearColor: [0, 0, 0, 1], 
      clearDepth: true
    });
    this.modelMatrix
      .identity()
      .rotateX(tick * 0.01)
      .rotateY(tick * 0.013);

    this.mvpMatrix
      .perspective({fovy: Math.PI / 3, aspect})
      .multiplyRight(this.viewMatrix)
      .multiplyRight(this.modelMatrix);

    this.model.setUniforms({uMVP: this.mvpMatrix, uModel: this.modelMatrix});

    this.model.draw(renderPass);

    renderPass.end();
  }
}
