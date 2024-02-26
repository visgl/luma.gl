// luma.gl, MIT license
import {glsl, UniformStore, NumberArray, ShaderUniformType, loadImage} from '@luma.gl/core';
import {AnimationLoopTemplate, AnimationProps, Model, CubeGeometry} from '@luma.gl/engine';
import {Matrix4} from '@math.gl/core';

const INFO_HTML = `\
<p>
Drawing a textured cube
</p>
`;

type AppUniforms = {
  mvpMatrix: NumberArray;
};

const app: {uniformTypes: Record<keyof AppUniforms, ShaderUniformType>} = {
  uniformTypes: {
    mvpMatrix: 'mat4x4<f32>'
  }
};

const vs = glsl`\
#version 300 es
#define SHADER_NAME cube-vs

uniform appUniforms {
  mat4 uMVP;
} app;

// CUBE GEOMETRY 
layout(location=0) in vec3 positions;
layout(location=1) in vec2 texCoords;

out vec2 fragUV;

void main(void) {
  gl_Position = app.uMVP * vec4(positions, 1.0);
  fragUV = texCoords;
}
`;

const fs = glsl`\
#version 300 es
#define SHADER_NAME cube-fs
precision highp float;

uniform sampler2D uTexture;

in vec2 fragUV;

layout (location=0) out vec4 fragColor;

void main(void) {
  fragColor = texture(uTexture, vec2(fragUV.x, 1.0 - fragUV.y));
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
      data: loadImage('vis-logo.png'),
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
      geometry: new CubeGeometry({indices: false}),
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
      app: {mvpMatrix: this.mvpMatrix}
    });

    const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1]});
    this.model.draw(renderPass);
    renderPass.end();
  }
}
