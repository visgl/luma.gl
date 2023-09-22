import {glsl, NumberArray, UniformStore, ShaderUniformType} from '@luma.gl/core';
import {AnimationLoopTemplate, AnimationProps, Model, CubeGeometry} from '@luma.gl/engine';
import {phongMaterial, PhongMaterialUniforms, lighting} from '@luma.gl/shadertools';
import {Matrix4} from '@math.gl/core';

const INFO_HTML = `
<p>
Drawing a phong-shaded cube
</p>
`;

type AppUniforms = {
  uModel: NumberArray;
  uMVP: NumberArray;
  uEyePosition: NumberArray;
};

const appUniforms: {uniformTypes: Record<keyof AppUniforms, ShaderUniformType>} = {
  uniformTypes: {
    uMVP: 'mat4x4<f32>',
    uModel: 'mat4x4<f32>',
    uEyePosition: 'vec3<f32>'
  }
};

const vs = glsl`\
#version 300 es
  attribute vec3 positions;
  attribute vec3 normals;
  attribute vec2 texCoords;

  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUV;

  uniform appUniforms {
    mat4 uModel;
    mat4 uMVP;
    vec3 uEyePosition;
  } app;

  void main(void) {
    vPosition = (app.uModel * vec4(positions, 1.0)).xyz;
    vNormal = mat3(app.uModel) * normals;
    vUV = texCoords;
    gl_Position = app.uMVP * vec4(positions, 1.0);
  }
`;

const fs = glsl`\
#version 300 es
  precision highp float;

  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUV;

  uniform sampler2D uTexture;

  uniform appUniforms {
    mat4 uModel;
    mat4 uMVP;
    vec3 uEyePosition;
  } app;

  void main(void) {
    vec3 materialColor = texture2D(uTexture, vec2(vUV.x, 1.0 - vUV.y)).rgb;
    vec3 surfaceColor = lighting_getLightColor(materialColor, app.uEyePosition, vPosition, normalize(vNormal));

    gl_FragColor = vec4(surfaceColor, 1.0);
  }
`;

// APPLICATION

const eyePosition = [0, 0, 5];

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = INFO_HTML;

  uniformStore = new UniformStore<{
    app: AppUniforms, 
    lighting: typeof lighting['uniformTypes'],
    phongMaterial: PhongMaterialUniforms
  }>({
    app: appUniforms,
    lighting, 
    phongMaterial
  });

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
      modules: [phongMaterial],
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
        appUniforms: this.uniformStore.getManagedUniformBuffer(device, 'app'),
        lightingUniforms: this.uniformStore.getManagedUniformBuffer(device, 'lighting'),
        phongMaterialUniforms: this.uniformStore.getManagedUniformBuffer(device, 'phongMaterial')
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

  onFinalize() {
    this.model.destroy();
  }

  onRender({device, aspect, tick}) {
    this.modelMatrix
      .identity()
      .rotateX(tick * 0.01)
      .rotateY(tick * 0.013);

    this.mvpMatrix
      .perspective({fovy: Math.PI / 3, aspect})
      .multiplyRight(this.viewMatrix)
      .multiplyRight(this.modelMatrix);

    this.uniformStore.setUniforms({
      app: {uMVP: this.mvpMatrix, uModel: this.modelMatrix}
    });

    const renderPass = device.beginRenderPass({
      clearColor: [0, 0, 0, 1], 
      clearDepth: true
    });
    this.model.draw(renderPass);
    renderPass.end();
  }
}
