// luma.gl, MIT license
import {glsl, UniformStore, NumberArray, ShaderUniformType} from '@luma.gl/core';
import {AnimationLoopTemplate, AnimationProps, Model, CubeGeometry} from '@luma.gl/engine';
import {Matrix4} from '@math.gl/core';

const INFO_HTML = `\
<p>
Drawing a textured cube
</p>
`;

type AppUniforms = {
  uMVP: NumberArray;
};

const app: {uniformTypes: Record<keyof AppUniforms, ShaderUniformType>} = {
  uniformTypes: {
    uMVP: 'mat4x4<f32>'
  }
};

const vs = glsl`\
#version 300 es
in vec3 positions;
in vec2 texCoords;

uniform appUniforms {
  uniform mat4 uMVP;
} app;

out vec2 vUV;

void main(void) {
  gl_Position = app.uMVP * vec4(positions, 1.0);
  vUV = texCoords;
}
`;

const fs = glsl`\
#version 300 es
precision highp float;

uniform sampler2D uTexture;
in vec2 vUV;
out vec4 fragColor;

void main(void) {
  fragColor = texture2D(uTexture, vec2(vUV.x, 1.0 - vUV.y));
}
`;

const eyePosition = [0, 0, 5];

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = INFO_HTML;

  mvpMatrix = new Matrix4();
  viewMatrix = new Matrix4().lookAt({eye: eyePosition});
  model: Model;

  uniformStore = new UniformStore<{app: AppUniforms}>({app});

  constructor({device}: AnimationProps) {
    super();

    const texture = device.createTexture({
      data: 'vis-logo.png',
      mipmaps: true,
      sampler: device.createSampler({
        minFilter: 'linear',
        magFilter: 'linear',
        mipmapFilter: 'linear'
      })
    });

    this.model = new Model(device, {
      vs,
      fs,
      geometry: new CubeGeometry(),
      bindings: {
        uTexture: texture,
        app: this.uniformStore.getManagedUniformBuffer(device, 'app')
      },
      parameters: {
        depthWriteEnabled: true,
        depthCompare: 'less-equal'
      }
    });
  }

  onFinalize() {
    this.model.destroy();
    this.uniformStore.destroy();
  }

  onRender({device, aspect, tick}: AnimationProps) {
    this.mvpMatrix
      .perspective({fovy: Math.PI / 3, aspect})
      .multiplyRight(this.viewMatrix)
      .rotateX(tick * 0.01)
      .rotateY(tick * 0.013);

    this.uniformStore.setUniforms({
      app: {uMVP: this.mvpMatrix}
    });

    const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1]});
    this.model.draw(renderPass);
    renderPass.end();
  }
}
