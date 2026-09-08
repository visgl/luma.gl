// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {NumberArray} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {
  AnimationLoopTemplate,
  Model,
  CubeGeometry,
  ShaderInputs,
  loadImageBitmap,
  DynamicTexture
} from '@luma.gl/engine';
import {phongMaterial, lighting, ShaderModule} from '@luma.gl/shadertools';
import {Matrix4} from '@math.gl/core';
import {LIGHTING_INFO_HTML} from './app-ui';

import {fs, vs, WGSL_SHADER} from './shaders';

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
  static info = LIGHTING_INFO_HTML;

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
      app: {
        eyePosition
      },
      lighting: {
        useByteColors: false,
        lights: [
          {type: 'ambient', color: [1, 1, 1], intensity: 0.15},
          {
            type: 'spot',
            color: [1, 0.47, 0.04],
            position: [2, 4, 3],
            direction: [-2, -4, -3],
            innerConeAngle: 0.2,
            outerConeAngle: 0.55
          },
          {
            type: 'spot',
            color: [0, 1, 0.04],
            position: [-2, 1, 3],
            direction: [2, -1, -3],
            innerConeAngle: 0.2,
            outerConeAngle: 0.5
          },
          {
            type: 'spot',
            color: [0.31, 0.63, 1],
            position: [-3, -2, 2],
            direction: [3, 2, -2],
            innerConeAngle: 0.2,
            outerConeAngle: 0.6
          },
          {
            type: 'spot',
            color: [1, 0.31, 0.71],
            position: [3, -3, 2],
            direction: [-3, 3, -2],
            innerConeAngle: 0.25,
            outerConeAngle: 0.7
          },
          {type: 'directional', color: [1, 1, 0.86], direction: [-1, -0.5, -1]}
        ]
      },
      phongMaterial: {
        specularColor: [1, 1, 1],
        useByteColors: false,
        shininess: 100
      }
    });

    const texture = new DynamicTexture(device, {data: loadImageBitmap('vis-logo.png')});

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
