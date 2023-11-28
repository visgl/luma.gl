import {Device} from '@luma.gl/core/index';
import {AnimationLoopTemplate, AnimationProps, Model} from '@luma.gl/engine/index';
import {load} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import {createGLTFObjects} from '@luma.gl/gltf/index';
import {Matrix4} from '@math.gl/core';

const INFO_HTML = `
Have to start somewhere...
`;

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = INFO_HTML;

  scenes = [];
  model: Model;
  time: number = 0;

  constructor({device}: AnimationProps) {
    super();

    this.loadGLTF(device);
  }

  onFinalize() {
    this.model.destroy();
  }

  onRender({device}: AnimationProps): void {
    if (!this.model) return;
    const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1]});

    this.time += 0.01;
    const eye = [3 * Math.sin(this.time), 2, 3 * Math.cos(this.time)];
    const viewMatrix = new Matrix4().lookAt({eye});
    const projectionMatrix = new Matrix4().perspective({fovy: Math.PI / 3, aspect: 1, near: 0.1, far: 9000});

    const u_MVPMatrix = projectionMatrix.multiplyRight(viewMatrix);
    const u_ModelMatrix = new Matrix4();
    const u_NormalMatrix = new Matrix4();
    const u_Camera = eye;

    this.scenes[0].traverse(({model}, {worldMatrix}) => {
      model.setUniforms({
        u_Camera,
        u_MVPMatrix, u_ModelMatrix, u_NormalMatrix,
        u_ScaleDiffBaseMR: [0, 0, 0, 0],
        u_ScaleFGDSpec: [0, 0, 0, 0]
      })
      model.draw(renderPass);
    });
    renderPass.end();
  }

  async loadGLTF(device: Device) {
    const gltf = await load('box.glb', GLTFLoader);
    const processedGLTF = postProcessGLTF(gltf);

    const options = { pbrDebug: false, imageBasedLightingEnvironment: null, lights: true };
    const {scenes} = createGLTFObjects(device, processedGLTF, options);

    // @ts-ignore
    const {model} = scenes[0].children[0].children[0].children[0].children[0];
    this.model = model;
    this.scenes = scenes;

    // Apply lighting
    this.model.updateModuleSettings({
      lightSources: {
        ambientLight: { color: [255, 255, 255], intensity: 1.0 },
        directionalLights: [ 
          { color: [255, 255, 255], direction: [0.0, 0.5, 0.5], intensity: 10.0 }
        ],
        pointLights: [
          { color: [255, 255, 255], position: [3.0, 10.0, 0.0], attenuation: [0, 0, 0.01], intensity: 10.0 }
        ],
      }
    });
  }
}
