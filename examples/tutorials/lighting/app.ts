import {NumberArray} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate, Model, CubeGeometry} from '@luma.gl/engine';
import {ShaderInputs, loadImageBitmap, AsyncTexture} from '@luma.gl/engine';
import {phongMaterial, lighting, ShaderModule} from '@luma.gl/shadertools';
import {Matrix4} from '@math.gl/core';

const INFO_HTML = `
<p>
Drawing a phong-shaded cube
</p>
`;

const WGSL_SHADER = /* wgsl */ `\

struct Uniforms {
  modelMatrix : mat4x4<f32>,
  mvpMatrix : mat4x4<f32>,
  eyePosition : vec3<f32>,
};

@binding(0) @group(0) var<uniform> app : Uniforms;

struct VertexInputs {
  // CUBE GEOMETRY
  @location(0) positions : vec3<f32>,
  @location(1) normals : vec3<f32>,
  @location(2) texCoords : vec2<f32>
};

struct FragmentInputs {
  @builtin(position) Position : vec4<f32>,
  @location(0) fragUV : vec2<f32>,
  @location(1) fragPosition: vec3<f32>,
  @location(2) fragNormal: vec3<f32>
}

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  var outputs : FragmentInputs;
  outputs.Position = app.mvpMatrix * app.modelMatrix * vec4<f32>(inputs.positions, 1);
  outputs.fragUV = inputs.texCoords;
  outputs.fragPosition = (app.modelMatrix * vec4<f32>(inputs.positions, 1.0)).xyz;
  // NOTE: WGSL lacks conversion syntax: https://github.com/gpuweb/gpuweb/issues/2399
  let mat3 = mat3x3(app.modelMatrix[0].xyz, app.modelMatrix[1].xyz, app.modelMatrix[2].xyz);
  outputs.fragNormal = mat3 * inputs.normals;
  return outputs;
}

// void main(void) {
//   vPosition = (app.modelMatrix * vec4(positions, 1.0)).xyz;
//   vNormal = mat3(app.modelMatrix) * normals;
//   vUV = texCoords;
//   gl_Position = app.mvpMatrix * vec4(positions, 1.0);
// }

// uniform sampler2D uTexture;

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  return vec4<f32>(inputs.fragPosition, 1);
}

// void main(void) {
//   vec3 surfaceColor = texture(uTexture, vec2(vUV.x, 1.0 - vUV.y)).rgb;
//   surfaceColor = lighting_getLightColor(surfaceColor, uApp.eyePosition, vPosition, normalize(vNormal));
//   fragColor = vec4(surfaceColor, 1.0);
// }
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

  shaderInputs = new ShaderInputs<{
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

    const texture = new AsyncTexture(device, {data: loadImageBitmap('vis-logo.png')});

    this.model = new Model(device, {
      source: WGSL_SHADER,
      vs,
      fs,
      shaderInputs: this.shaderInputs,
      geometry: new CubeGeometry(),
      instanceCount: 1,
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
