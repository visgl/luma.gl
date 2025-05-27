// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {AnimationLoopTemplate, AnimationProps, ModelNode} from '@luma.gl/engine';
import {Device} from '@luma.gl/core';
import {load} from '@loaders.gl/core';
import {LightingProps} from '@luma.gl/shadertools';
import {createScenegraphsFromGLTF} from '@luma.gl/gltf';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import {Matrix4} from '@math.gl/core';

/* eslint-disable camelcase */

const MODEL_DIRECTORY_URL =
  'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models';
const MODEL_LIST_URL = `${MODEL_DIRECTORY_URL}/model-index.json`;

const lightSources = {
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
} as const satisfies LightingProps;

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  device: Device;
  scenegraphsFromGLTF?: ReturnType<typeof createScenegraphsFromGLTF>;
  center = [0, 0, 0];
  cameraPos = [0, 0, 0];
  mouseCameraTime: number = 0;
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

    window.localStorage['last-gltf-model'] ??= 'Avocado';
    this.loadGLTF(window.localStorage['last-gltf-model']);

    setOptionsUI(this.options);

    // Asynchronously fetch the model list and set up the model selector
    this.fetchModelList().then(models => {
      const currentModel = window.localStorage['last-gltf-model'];
      setModelMenu(
        models.map(model => model.name),
        currentModel,
        (modelName: string) => {
          this.loadGLTF(modelName);
          window.localStorage['last-gltf-model'] = modelName;
        }
      );
    });

    this.device.getDefaultCanvasContext().canvas.addEventListener('mousemove', event => {
      const e = event as MouseEvent;
      if (e.buttons) {
        this.mouseCameraTime -= e.movementX * 3.5;
      }
    });
  }

  onFinalize() {
    this.scenegraphsFromGLTF?.scenes[0].traverse(node => (node as ModelNode).model.destroy());
  }

  onRender({aspect, device, time}: AnimationProps): void {
    if (!this.scenegraphsFromGLTF?.scenes?.length) return;
    const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1], clearDepth: 1});

    const far = 2 * this.cameraPos[0];
    const near = far / 1000;
    const projectionMatrix = new Matrix4().perspective({fovy: Math.PI / 3, aspect, near, far});
    const cameraTime = this.options['cameraAnimation'] ? time : this.mouseCameraTime;
    const cameraPos = [
      this.cameraPos[0] * Math.sin(0.001 * cameraTime),
      this.cameraPos[1],
      this.cameraPos[2] * Math.cos(0.001 * cameraTime)
    ];

    if (this.options['gltfAnimation']) {
      this.scenegraphsFromGLTF.animator?.setTime(time);
    }

    const viewMatrix = new Matrix4().lookAt({eye: cameraPos, center: this.center});

    this.scenegraphsFromGLTF.scenes[0].traverse((node, {worldMatrix: modelMatrix}) => {
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
        },
        skin: {
          // TODO: This is required to trigger getUniforms() of skin.
          // Fix it, then remove this.
          scenegraphsFromGLTF: this.scenegraphsFromGLTF
        }
      });
      model.draw(renderPass);
    });
    renderPass.end();
  }

  async fetchModelList(): Promise<{name: string}[]> {
    const response = await fetch(MODEL_LIST_URL);
    const models = await response.json();
    return models;
  }

  async loadGLTF(modelName: string) {
    try {
      const canvas = this.device.getDefaultCanvasContext().canvas as HTMLCanvasElement;
      canvas.style.opacity = '0.1';

      const gltf = await load(
        `${MODEL_DIRECTORY_URL}/${modelName}/glTF/${modelName}.gltf`,
        GLTFLoader
      );
      const processedGLTF = postProcessGLTF(gltf);

      this.scenegraphsFromGLTF = createScenegraphsFromGLTF(this.device, processedGLTF, {
        lights: true,
        imageBasedLightingEnvironment: undefined,
        pbrDebug: false
      });

      // Calculate nice camera view
      // TODO move to utility in gltf module
      let min = [Infinity, Infinity, Infinity];
      let max = [0, 0, 0];
      this.scenegraphsFromGLTF?.scenes[0].traverse(node => {
        const {bounds} = node as ModelNode;
        min = min.map((n, i) => Math.min(n, bounds[0][i], bounds[1][i]));
        max = max.map((n, i) => Math.max(n, bounds[0][i], bounds[1][i]));
      });
      this.cameraPos = [2 * (max[0] + max[2]), max[1], 2 * (max[0] + max[2])];
      this.center = [0.5 * (min[0] + max[0]), 0.5 * (min[1] + max[1]), 0.5 * (min[2] + max[2])];

      canvas.style.opacity = '1';
      showError();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      showError(error as Error);
    }
  }
}

//
// HTML helpers, can be cut if copying this code
//

function setModelMenu(
  items: string[],
  currentItem: string,
  onMenuItemSelected: (item: string) => void
) {
  const modelSelector = document.getElementById('model-select') as HTMLSelectElement;
  modelSelector?.addEventListener('change', e => {
    const name = (e.target as HTMLSelectElement).value;
    onMenuItemSelected(name);
  });
  const options = items.map(item => {
    const option = document.createElement('option');
    option.value = item;
    option.textContent = item;
    return option;
  });

  modelSelector.append(...options);
  modelSelector.value = currentItem;
}

function setOptionsUI(options: Record<string, boolean>) {
  for (const id of Object.keys(options)) {
    const checkbox = document.getElementById(id) as HTMLInputElement;
    checkbox.checked = options[id];
    checkbox.addEventListener('change', e => {
      options[id] = checkbox.checked;
    });
  }
}

function showError(error?: Error) {
  const errorDiv = document.getElementById('error') as HTMLDivElement;
  errorDiv.innerHTML = error ? `Error loading model ${error.message}` : '';
  errorDiv.style.display = error ? 'block' : 'hidden';
}
