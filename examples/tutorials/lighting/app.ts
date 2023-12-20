import {glsl, NumberArray, UniformStore} from '@luma.gl/core';
import {AnimationLoopTemplate, AnimationProps, Model, CubeGeometry, _ShaderInputs} from '@luma.gl/engine';
import {phongMaterial, lighting, ShaderModule} from '@luma.gl/shadertools';
import {Matrix4} from '@math.gl/core';

const INFO_HTML = `
<p>
Drawing a phong-shaded cube
</p>
`;

const vs = glsl`\
#version 300 es

in vec3 positions;
in vec3 normals;
in vec2 texCoords;

out vec3 vPosition;
out vec3 vNormal;
out vec2 vUV;

uniform appUniforms {
  mat4 modelMatrix;
  mat4 mvpMatrix;
  vec3 eyePosition;
} app;

void main(void) {
  vPosition = (app.modelMatrix * vec4(positions, 1.0)).xyz;
  vNormal = mat3(app.modelMatrix) * normals;
  vUV = texCoords;
  gl_Position = app.mvpMatrix * vec4(positions, 1.0);
}
`;

const fs = glsl`\
#version 300 es
precision highp float;

in vec3 vPosition;
in vec3 vNormal;
in vec2 vUV;

uniform sampler2D uTexture;

uniform appUniforms {
  mat4 modelMatrix;
  mat4 mvpMatrix;
  vec3 eyePosition;
} uApp;

out vec4 fragColor;

void main(void) {
  vec3 materialColor = texture2D(uTexture, vec2(vUV.x, 1.0 - vUV.y)).rgb;
  vec3 surfaceColor = lighting_getLightColor(materialColor, uApp.eyePosition, vPosition, normalize(vNormal));

  fragColor = vec4(surfaceColor, 1.0);
}
`;

type AppUniforms = {
  modelMatrix: NumberArray;
  mvpMatrix: NumberArray;
  eyePosition: NumberArray;
};

const app: ShaderModule<AppUniforms, AppUniforms> = {
  name: 'app',
  uniformTypes: {
    modelMatrix: 'mat4x4<f32>',
    mvpMatrix: 'mat4x4<f32>',
    eyePosition: 'vec3<f32>'
  }
};


// APPLICATION

const eyePosition = [0, 0, 5];

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = INFO_HTML;

  shaderInputs = new _ShaderInputs<{
    app: typeof app.props;
    lighting: typeof lighting.props;
    phongMaterial: typeof phongMaterial.props;
  }>({
    app,
    lighting,
    phongMaterial
  });

  uniformStore: UniformStore;

  model: Model;
  modelMatrix = new Matrix4();
  viewMatrix = new Matrix4().lookAt({eye: eyePosition});
  mvpMatrix = new Matrix4();


  constructor({device}: AnimationProps) {
    super();

    // Set up static uniforms
    this.shaderInputs.setProps({
      phongMaterial: {
        specularColor: [255, 255, 255]
      },
      lighting: {
        enabled: true,
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
      // app: {
      //   modelMatrix: this.modelMatrix,
      //   eyePosition
      // }
    });

    this.uniformStore = new UniformStore(this.shaderInputs.modules);
    const uniformValues = this.shaderInputs.getUniformValues();
    this.uniformStore.setUniforms(uniformValues);
  
    const texture = device.createTexture({data: 'vis-logo.png'});

    this.model = new Model(device, {
      vs,
      fs,
      geometry: new CubeGeometry(),
      modules: [phongMaterial],
      bindings: {
        uTexture: texture,
        app: this.uniformStore.getManagedUniformBuffer(device, 'app'),
        lighting: this.uniformStore.getManagedUniformBuffer(device, 'lighting'),
        phongMaterial: this.uniformStore.getManagedUniformBuffer(device, 'phongMaterial')
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

  onRender({device, aspect, tick}) {
    this.modelMatrix
      .identity()
      .rotateX(tick * 0.01)
      .rotateY(tick * 0.013);

    this.mvpMatrix
      .perspective({fovy: Math.PI / 3, aspect})
      .multiplyRight(this.viewMatrix)
      .multiplyRight(this.modelMatrix);

    // This updates the "app" uniform buffer, which is already bound
    this.shaderInputs.setProps({
      app: {
        mvpMatrix: this.mvpMatrix, 
        modelMatrix: this.modelMatrix
      }
    });
    this.uniformStore.setUniforms(this.shaderInputs.getUniformValues());

    const renderPass = device.beginRenderPass({
      clearColor: [0, 0, 0, 1],
      clearDepth: true
    });

    // Draw the cube using the bindings that were set during initialization
    this.model.draw(renderPass);
    renderPass.end();
  }
}
