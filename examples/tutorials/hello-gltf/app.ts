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
  time: number = 0;

  constructor({device}: AnimationProps) {
    super();

    this.loadGLTF(device);
  }

  onFinalize() {
    this.scenes[0].traverse(({model}) => model.destroy());
  }

  onRender({aspect, device, time}: AnimationProps): void {
    if (!this.scenes?.length) return;
    const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1]});

    const eye = [0.1 * Math.sin(0.001 * time), 0.1, 0.1 * Math.cos(0.001 * time)];
    const viewMatrix = new Matrix4().lookAt({eye});
    const projectionMatrix = new Matrix4().perspective({fovy: Math.PI / 3, aspect, near: 0.01, far: 100});

    const u_Camera = eye;

    this.scenes[0].traverse(({model}, {worldMatrix}) => {
      const u_MVPMatrix = new Matrix4(projectionMatrix).multiplyRight(viewMatrix).multiplyRight(worldMatrix);
      model.setUniforms({
        u_Camera,
        u_MVPMatrix,
        u_ModelMatrix: worldMatrix,
        u_NormalMatrix: new Matrix4(worldMatrix).invert().transpose(),
        u_ScaleDiffBaseMR: [0, 0, 0, 0],
        u_ScaleFGDSpec: [0, 0, 0, 0]
      })

      // Apply lighting
      model.updateModuleSettings({
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

      model.draw(renderPass);
    });
    renderPass.end();
  }

  async loadGLTF(device: Device) {
    const gltf = await load('https://github.khronos.org/glTF-Sample-Viewer-Release/assets/models/Models/Avocado/glTF/Avocado.gltf', GLTFLoader);
    const processedGLTF = postProcessGLTF(gltf);

    const options = { pbrDebug: false, imageBasedLightingEnvironment: null, lights: true };
    const {scenes} = createGLTFObjects(device, processedGLTF, options);
    this.scenes = scenes;
  }
}
