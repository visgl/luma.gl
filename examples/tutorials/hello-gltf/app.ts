// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {AnimationLoopTemplate, AnimationProps, GroupNode, ModelNode} from '@luma.gl/engine';
import {Device} from '@luma.gl/core';
import {load} from '@loaders.gl/core';
import {LightingProps} from '@luma.gl/shadertools';
import {createScenegraphsFromGLTF, GLTFAnimator} from '@luma.gl/gltf';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import {Matrix4} from '@math.gl/core';

/* eslint-disable camelcase */

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  device: Device;
  scenes: GroupNode[] = [];
  animator?: GLTFAnimator;
  center = [0, 0, 0];
  cameraPos = [0, 0, 0];
  time: number = 0;
  options: Record<string, boolean> = {
    cameraAnimation: true,
    gltfAnimation: false,
    pbr: false
  };

  constructor({device, animationLoop}: AnimationProps) {
    super();
    this.device = device;

    if (device.type !== 'webgl') {
      throw new Error('This demo is only implemented for WebGL2');
    }

    window.localStorage['lastGltfModel'] ??= 'Avocado';
    this.loadGLTF(window.localStorage['lastGltfModel']);

    this.initUiOptions();
  }

  initUiOptions() {
    Object.keys(this.options).forEach(id => {
      const checkbox = document.getElementById(id) as HTMLInputElement;
      checkbox.checked = this.options[id];
      checkbox.addEventListener('change', e => {
        this.options[id] = checkbox.checked;
      });
    });

    const modelSelector = document.getElementById('model-select') as HTMLSelectElement;

    this.fetchModelList(modelSelector);

    modelSelector?.addEventListener('change', e => {
      const name = (e.target as HTMLSelectElement).value;
      this.loadGLTF(name);
      window.localStorage['lastGltfModel'] = name;
    });
  }

  async fetchModelList(modelSelector: HTMLSelectElement) {
    const response = await fetch(
      'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/model-index.json'
    );
    const models = await response.json();

    const options = models.map(({name}) => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      return option;
    });

    modelSelector.append(...options);
    modelSelector.value = window.localStorage['lastGltfModel'];
  }

  onFinalize() {
    this.scenes[0].traverse(node => (node as ModelNode).model.destroy());
  }

  onRender({aspect, device, time}: AnimationProps): void {
    if (!this.scenes?.length) return;
    const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1], clearDepth: 1});

    const far = 2 * this.cameraPos[0];
    const near = far / 1000;
    const projectionMatrix = new Matrix4().perspective({fovy: Math.PI / 3, aspect, near, far});
    const cameraTime = this.options['cameraAnimation'] ? time : 0;
    const cameraPos = [
      this.cameraPos[0] * Math.sin(0.001 * cameraTime),
      this.cameraPos[1],
      this.cameraPos[2] * Math.cos(0.001 * cameraTime)
    ];

    if (this.options['gltfAnimation']) {
      this.animator?.setTime(time);
    }

    const viewMatrix = new Matrix4().lookAt({eye: cameraPos, center: this.center});

    this.scenes[0].traverse((node, {worldMatrix: modelMatrix}) => {
      const {model} = node as ModelNode;

      const modelViewProjectionMatrix = new Matrix4(projectionMatrix)
        .multiplyRight(viewMatrix)
        .multiplyRight(modelMatrix);

      model.shaderInputs.setProps({
        lighting: lightSources,
        pbrProjection: {
          camera: cameraPos,
          modelViewProjectionMatrix,
          modelMatrix,
          normalMatrix: new Matrix4(modelMatrix).invert().transpose()
        }
      });
      model.draw(renderPass);
    });
    renderPass.end();
  }

  async loadGLTF(modelName: string) {
    const canvas = this.device.getDefaultCanvasContext().canvas as HTMLCanvasElement;
    canvas.style.opacity = '0.1';

    const gltf = await load(
      `https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/${modelName}/glTF/${modelName}.gltf`,
      GLTFLoader
    );
    const processedGLTF = postProcessGLTF(gltf);

    const options = {pbrDebug: false, imageBasedLightingEnvironment: null, lights: true};
    const {scenes, animator} = createScenegraphsFromGLTF(this.device, processedGLTF, options);
    this.scenes = scenes;
    this.animator = animator;

    // Calculate nice camera view
    // TODO move to utility in gltf module
    let min = [Infinity, Infinity, Infinity];
    let max = [0, 0, 0];
    this.scenes[0].traverse(node => {
      const {bounds} = node as ModelNode;
      min = min.map((n, i) => Math.min(n, bounds[0][i], bounds[1][i]));
      max = max.map((n, i) => Math.max(n, bounds[0][i], bounds[1][i]));
    });
    this.cameraPos = [2 * (max[0] + max[2]), max[1], 2 * (max[0] + max[2])];
    this.center = [0.5 * (min[0] + max[0]), 0.5 * (min[1] + max[1]), 0.5 * (min[2] + max[2])];

    canvas.style.opacity = '1';
  }
}

export const lightSources: LightingProps = {
  ambientLight: {
    color: [255, 133, 133],
    intensity: 1,
    type: 'ambient'
  },
  directionalLights: [
    {
      color: [222, 244, 255],
      direction: [1, -0.5, 0.5],
      intensity: 10,
      type: 'directional'
    }
  ],
  pointLights: [
    {
      color: [255, 222, 222],
      position: [3, 10, 0],
      intensity: 5,
      type: 'point'
    }
  ]
};
