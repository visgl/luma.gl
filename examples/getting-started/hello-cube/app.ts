import {RenderLoop, AnimationProps, Model, CubeGeometry} from '@luma.gl/engine';
import {Texture2D, clear, setDeviceParameters} from '@luma.gl/webgl';
import {Matrix4} from '@math.gl/core';

const INFO_HTML = `
<p>
Drawing a textured cube
</p>
`;

const vs = `\
  attribute vec3 positions;
  attribute vec2 texCoords;

  uniform mat4 uMVP;
  varying vec2 vUV;

  void main(void) {
    gl_Position = uMVP * vec4(positions, 1.0);
    vUV = texCoords;
  }
`;

const fs = `\
  precision highp float;

  uniform sampler2D uTexture;
  varying vec2 vUV;

  void main(void) {
    gl_FragColor = texture2D(uTexture, vec2(vUV.x, 1.0 - vUV.y));
  }
`;

const eyePosition = [0, 0, 5];

export default class AppRenderLoop extends RenderLoop {
  static info = INFO_HTML;

  mvpMatrix  = new Matrix4();
  viewMatrix = new Matrix4().lookAt({eye: eyePosition});
  model: Model;

  constructor({device}: AnimationProps) {
    super();

    setDeviceParameters(device, {
      depthWriteEnabled: true,
      depthCompare: 'less-equal',
    });

    const texture = device.createTexture({data: 'vis-logo.png'});

    this.model = new Model(device, {
      vs,
      fs,
      geometry: new CubeGeometry(),
      uniforms: {
        uTexture: texture
      }
    });
  }

  onRender({device, aspect, tick}: AnimationProps) {
    this.mvpMatrix
      .perspective({fov: Math.PI / 3, aspect})
      .multiplyRight(this.viewMatrix)
      .rotateX(tick * 0.01)
      .rotateY(tick * 0.013);
    this.model.setUniforms({uMVP: this.mvpMatrix});

    clear(device, {color: [0, 0, 0, 1], depth: true});
    this.model.draw();
  }

  onFinalize() {
    this.model.destroy();
  }
}

// @ts-ignore
if (typeof window !== 'undefined' && !window.website) {
  RenderLoop.run(AppRenderLoop);
}
