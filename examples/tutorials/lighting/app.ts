// @ts-ignore Remove once package puublished
import {NumberArray, loadImage} from '@luma.gl/core';
import {
  AnimationLoopTemplate,
  AnimationProps,
  Model,
  CubeGeometry,
  _ShaderInputs
} from '@luma.gl/engine';
import {phongMaterial, lighting, ShaderModule} from '@luma.gl/shadertools';
import {Matrix4} from '@math.gl/core';

const INFO_HTML = `
<p>
Drawing a phong-shaded cube
</p>
`;

const vs = /* glsl */ `\
#version 300 es

in vec3 positions;
in vec3 normals;
in vec2 texCoords;

out vec3 vPosition;
out vec3 vNormal;
out vec2 vUV;
out vec3 vColor;

uniform appUniforms {
  mat4 modelMatrix;
  mat4 mvpMatrix;
  vec3 eyePosition;
} app;

void main(void) {
  vPosition = (app.modelMatrix * vec4(positions, 1.0)).xyz;
  vNormal = mat3(app.modelMatrix) * normals;
  vUV = texCoords;

  #if (defined(LIGHTING_VERTEX))
  vColor = lighting_getLightColor(vec3(1.0), app.eyePosition, vPosition, normalize(vNormal));
  #endif
  gl_Position = app.mvpMatrix * vec4(positions, 1.0);
}
`;

const fs = /* glsl */ `\
#version 300 es
precision highp float;

in vec3 vPosition;
in vec3 vNormal;
in vec2 vUV;
in vec3 vColor;

uniform sampler2D uTexture;

uniform appUniforms {
  mat4 modelMatrix;
  mat4 mvpMatrix;
  vec3 eyePosition;
} app;

out vec4 fragColor;

void main(void) {
  #if (defined(LIGHTING_FRAGMENT))
  vec3 surfaceColor = texture(uTexture, vec2(vUV.x, 1.0 - vUV.y)).rgb;
  surfaceColor = lighting_getLightColor(surfaceColor, app.eyePosition, vPosition, normalize(vNormal));
  fragColor = vec4(surfaceColor, 1.0);
  #endif

  #if (defined(LIGHTING_VERTEX))
  fragColor = vec4(vColor, 1.0);
  #endif
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

  model: Model;

  shaderInputs = new _ShaderInputs<{
    app: typeof app.props;
    lighting: typeof lighting.props;
    // Can replace with gouraudMaterial
    phongMaterial: typeof phongMaterial.props;
  }>({app, lighting, phongMaterial});

  modelMatrix = new Matrix4();
  viewMatrix = new Matrix4().lookAt({eye: eyePosition});
  mvpMatrix = new Matrix4();

  constructor({device}: AnimationProps) {
    super();

    // Set up static uniforms
    this.shaderInputs.setProps({
      lighting: {
        lights: [
          {type: 'ambient', color: [255, 255, 255]},
          {type: 'point', color: [255, 120, 10], position: [2, 4, 3]},
          {type: 'point', color: [0, 255, 10], position: [-2, 1, 3]}
          // {type: 'directional', color: [0, 0, 255], direction: [-1, 0, -1]}
        ]
      },
      phongMaterial: {
        specularColor: [255, 255, 255],
        shininess: 100
      }
    });

    const texture = device.createTexture({data: loadImage('vis-logo.png')});

    this.model = new Model(device, {
      vs,
      fs,
      shaderInputs: this.shaderInputs,
      geometry: new CubeGeometry(),
      bindings: {
        uTexture: texture
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

    // This updates the "app" uniform buffer, which is already bound
    this.shaderInputs.setProps({
      app: {
        mvpMatrix: this.mvpMatrix,
        modelMatrix: this.modelMatrix
      }
    });

    const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1], clearDepth: true});
    this.model.draw(renderPass);
    renderPass.end();
  }
}
