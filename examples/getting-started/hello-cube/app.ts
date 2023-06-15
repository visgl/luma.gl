import {glsl, Texture} from '@luma.gl/api';
import {AnimationLoopTemplate, AnimationProps, Model, CubeGeometry} from '@luma.gl/engine';
import {Matrix4} from '@math.gl/core';

const INFO_HTML = `
<p>
Drawing a textured cube
</p>
`;

const vs = glsl`\
  attribute vec3 positions;
  attribute vec2 texCoords;

  uniform mat4 uMVP;
  varying vec2 vUV;

  void main(void) {
    gl_Position = uMVP * vec4(positions, 1.0);
    vUV = texCoords;
  }
`;

const fs = glsl`\
  precision highp float;

  uniform sampler2D uTexture;
  varying vec2 vUV;

  void main(void) {
    gl_FragColor = texture2D(uTexture, vec2(vUV.x, 1.0 - vUV.y));
  }
`;

const eyePosition = [0, 0, 5];

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = INFO_HTML;

  mvpMatrix  = new Matrix4();
  viewMatrix = new Matrix4().lookAt({eye: eyePosition});

  texture: Texture;
  model: Model;

  constructor({device}: AnimationProps) {
    super();

    const texture = device.createTexture({data: 'vis-logo.png'});

    this.model = new Model(device, {
      vs,
      fs,
      geometry: new CubeGeometry(),
      bindings: {
        uTexture: texture
      },
      parameters: {
        depthWriteEnabled: true,
        depthCompare: 'less-equal',
      }
    });
  }

  onFinalize() {
    this.model.destroy();
    this.texture.destroy();
  }

  onRender({device, aspect, tick}: AnimationProps) {
    const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1]});

    this.mvpMatrix
      .perspective({fovy: Math.PI / 3, aspect})
      .multiplyRight(this.viewMatrix)
      .rotateX(tick * 0.01)
      .rotateY(tick * 0.013);
    this.model.setUniforms({uMVP: this.mvpMatrix});

    this.model.draw(renderPass);

    renderPass.end();
  }
}
