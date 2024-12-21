import {AnimationLoopTemplate, AnimationProps, GroupNode, ModelNode} from '@luma.gl/engine';
import {Device} from '@luma.gl/core';
import {load} from '@loaders.gl/core';
import {LightingProps} from '@luma.gl/shadertools';
import {createScenegraphsFromGLTF} from '@luma.gl/gltf';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import {Matrix4} from '@math.gl/core';

/* eslint-disable camelcase */

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  device: Device;
  scenes: GroupNode[] = [];
  center = [0, 0, 0];
  vantage = [0, 0, 0];
  time: number = 0;

  constructor({device}: AnimationProps) {
    super();
    this.device = device;
    this.loadGLTF('Avocado');

    const modelSelector = document.getElementById('model-select');
    modelSelector?.addEventListener('change', e => {
      this.loadGLTF((e.target as HTMLSelectElement).value);
    });
  }

  onFinalize() {
    this.scenes[0].traverse(node => (node as ModelNode).model.destroy());
  }

  onRender({aspect, device, time}: AnimationProps): void {
    if (!this.scenes?.length) return;
    const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1], clearDepth: true});

    const far = 2 * this.vantage[0];
    const near = far / 1000;
    const projectionMatrix = new Matrix4().perspective({fovy: Math.PI / 3, aspect, near, far});
    const vantage = [
      this.vantage[0] * Math.sin(0.001 * time),
      this.vantage[1],
      this.vantage[2] * Math.cos(0.001 * time)
    ];

    this.scenes[0].traverse((node, {worldMatrix}) => {
      const {model} = node as ModelNode;

      const eye = worldMatrix.transformAsPoint(vantage);
      const center = worldMatrix.transformAsPoint(this.center);
      const viewMatrix = new Matrix4().lookAt({eye, center});
      const modelViewProjectionMatrix = new Matrix4(projectionMatrix)
        .multiplyRight(viewMatrix)
        .multiplyRight(worldMatrix);

      model.shaderInputs.setProps({
        lighting: lightSources,
        pbrProjection: {
          camera: eye,
          modelViewProjectionMatrix,
          modelMatrix: worldMatrix,
          normalMatrix: new Matrix4(worldMatrix).invert().transpose()
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
    const {scenes} = createScenegraphsFromGLTF(this.device, processedGLTF, options);
    this.scenes = scenes;

    // Calculate nice camera view
    // TODO move to utility in gltf module
    let min = [Infinity, Infinity, Infinity];
    let max = [0, 0, 0];
    this.scenes[0].traverse(node => {
      const {bounds} = node as ModelNode;
      min = min.map((n, i) => Math.min(n, bounds[0][i], bounds[1][i]));
      max = max.map((n, i) => Math.max(n, bounds[0][i], bounds[1][i]));
    });
    this.vantage = [2 * (max[0] + max[2]), max[1], 2 * (max[0] + max[2])];
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
    // @ts-expect-error Remove once npm package updated with new types
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
