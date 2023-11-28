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

    const projectionMatrix = new Matrix4().perspective({fovy: Math.PI / 3, aspect, near: 0.01, far: 100});

    let vantage = [0.05, 0.05, 0.05];
    const eye = [
      vantage[0] * Math.sin(0.001 * time), vantage[1], vantage[2] * Math.cos(0.001 * time)
    ];
    const viewMatrix = new Matrix4().lookAt({eye, center: [0, 0.7 * vantage[1], 0]});

    this.scenes[0].traverse((node, {worldMatrix}) => {
      const {model} = node;
      const u_MVPMatrix = new Matrix4(projectionMatrix).multiplyRight(viewMatrix).multiplyRight(worldMatrix);
      model.setUniforms({
        u_Camera: eye,
        u_MVPMatrix,
        u_ModelMatrix: worldMatrix,
        u_NormalMatrix: new Matrix4(worldMatrix).invert().transpose(),
        u_ScaleDiffBaseMR: [0, 0, 0, 0], // set y, z or w to 1 for PBR debug views (requires pbrDebug=true)
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
    // const gltf = await load('https://github.khronos.org/glTF-Sample-Viewer-Release/assets/models/Models/Avocado/glTF/Avocado.gltf', GLTFLoader);
    // const gltf = await load('https://github.khronos.org/glTF-Sample-Viewer-Release/assets/models/Models/BoomBoxWithAxes/glTF/BoomBoxWithAxes.gltf', GLTFLoader);
    const gltf = await load('https://github.khronos.org/glTF-Sample-Viewer-Release/assets/models/Models/Corset/glTF/Corset.gltf', GLTFLoader);
    // const gltf = await load('https://github.khronos.org/glTF-Sample-Viewer-Release/assets/models/Models/FlightHelmet/glTF/FlightHelmet.gltf', GLTFLoader);
    const processedGLTF = postProcessGLTF(gltf);

    const options = { pbrDebug: false, imageBasedLightingEnvironment: null, lights: true };
    const {scenes} = createGLTFObjects(device, processedGLTF, options);
    this.scenes = scenes;
  }
}
