// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {AnimationLoopTemplate, AnimationProps, ModelNode, OrbitControls} from '@luma.gl/engine';
import {Color, Device, log} from '@luma.gl/core';
import {load} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import {createScenegraphsFromGLTF} from '@luma.gl/gltf';
import {Light, LightingProps} from '@luma.gl/shadertools';
import {Matrix4} from '@math.gl/core';

const MODEL_URL =
  'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/CesiumMan/glTF/CesiumMan.gltf';
const MAX_CAMERA_TILT = 0.6;
const CAMERA_TILT_HEIGHT_FACTOR = 0.35;

const lightSources = {
  ambientLight: {
    color: [255, 255, 255],
    intensity: 0.35,
    type: 'ambient'
  },
  directionalLights: [
    {
      color: [255, 244, 235],
      direction: [0.6, -0.7, 0.5],
      intensity: 2.4,
      type: 'directional'
    },
    {
      color: [214, 232, 255],
      direction: [-0.45, -0.35, -0.7],
      intensity: 0.8,
      type: 'directional'
    }
  ]
} as const satisfies LightingProps;

const INFO_HTML = `\
<p>
  Minimal glTF loading example using <code>@loaders.gl/gltf</code> and
  <code>@luma.gl/gltf</code>.
</p>
<p>Drag to orbit. Use the mouse wheel or trackpad to zoom.</p>
<div id="error" style="color: #b00020; margin-top: 8px;"></div>
`;

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = INFO_HTML;

  device: Device;
  orbitControls: OrbitControls;
  scenegraphsFromGLTF?: ReturnType<typeof createScenegraphsFromGLTF>;
  modelLights: Light[] = [];
  center = [0, 0, 0];
  cameraHeight = 0;
  sceneRadius = 1;
  isFinalized = false;

  constructor({device}: AnimationProps) {
    super();
    this.device = device;

    const canvas = this.device.getDefaultCanvasContext().canvas as HTMLCanvasElement;
    this.orbitControls = new OrbitControls(canvas, {
      distance: 2,
      yaw: Math.PI / 4,
      pitch: 0.18,
      minDistance: 0.05,
      maxDistance: 40,
      minPitch: -MAX_CAMERA_TILT,
      maxPitch: MAX_CAMERA_TILT,
      rotateSpeed: 0.01,
      zoomSpeed: 0.0015
    });

    this.loadGLTF();
  }

  onFinalize(): void {
    this.isFinalized = true;
    this.orbitControls.destroy();

    destroyScenegraphs(this.scenegraphsFromGLTF);
    this.scenegraphsFromGLTF = undefined;
    this.modelLights = [];
  }

  getClearColor(): Color {
    return [0.95, 0.95, 0.97, 1];
  }

  async loadGLTF(): Promise<void> {
    const canvas = this.device.getDefaultCanvasContext().canvas as HTMLCanvasElement;

    try {
      log.log(0, 'Starting tutorial glTF load', {modelUrl: MODEL_URL})();
      showError();
      canvas.style.opacity = '0.2';

      const gltf = await load(MODEL_URL, GLTFLoader);
      const processedGLTF = postProcessGLTF(gltf);
      const scenegraphsFromGLTF = createScenegraphsFromGLTF(this.device, processedGLTF, {
        lights: true,
        pbrDebug: false,
        useTangents: true
      });

      if (this.isFinalized) {
        destroyScenegraphs(scenegraphsFromGLTF);
        return;
      }

      destroyScenegraphs(this.scenegraphsFromGLTF);
      this.scenegraphsFromGLTF = scenegraphsFromGLTF;
      this.modelLights = scenegraphsFromGLTF.lights;

      const sceneBounds = scenegraphsFromGLTF.sceneBounds[0] || scenegraphsFromGLTF.modelBounds;
      this.center = [...sceneBounds.center];
      this.sceneRadius = sceneBounds.radius;
      this.cameraHeight = this.center[1] + this.sceneRadius * 0.3;
      this.orbitControls.setProps({
        target: [this.center[0], this.cameraHeight, this.center[2]],
        distance: sceneBounds.recommendedOrbitDistance,
        minDistance: Math.max(this.sceneRadius * 0.08, 0.025),
        maxDistance: Math.max(this.sceneRadius * 32, 12)
      });

      canvas.style.opacity = '1';
      showError();
    } catch (error) {
      if (this.isFinalized) {
        return;
      }

      log.error('Failed to load tutorial glTF model', error)();
      canvas.style.opacity = '1';
      showError(error);
    }
  }

  onRender({aspect, device, time}: AnimationProps): void {
    const renderPass = device.beginRenderPass({clearColor: this.getClearColor(), clearDepth: 1});

    if (!this.scenegraphsFromGLTF?.scenes?.length) {
      renderPass.end();
      return;
    }

    this.scenegraphsFromGLTF.animator?.setTime(time);
    this.orbitControls.update(time);

    const orbitDistance = this.orbitControls.distance;
    const far = Math.max(orbitDistance + this.sceneRadius * 8, 10);
    const near = Math.max(this.sceneRadius / 1000, 0.01);
    const projectionMatrix = new Matrix4().perspective({fovy: Math.PI / 3, aspect, near, far});
    const cameraPos = this.orbitControls.getEyePosition();
    cameraPos[1] =
      this.cameraHeight + (cameraPos[1] - this.cameraHeight) * CAMERA_TILT_HEIGHT_FACTOR;
    const viewMatrix = new Matrix4().lookAt({eye: cameraPos, center: this.center});
    const lighting = this.modelLights.length > 0 ? {lights: this.modelLights} : lightSources;

    this.scenegraphsFromGLTF.scenes[0].traverse((node, {worldMatrix: modelMatrix}) => {
      const {model} = node as ModelNode;
      const modelViewProjectionMatrix = new Matrix4(projectionMatrix)
        .multiplyRight(viewMatrix)
        .multiplyRight(modelMatrix);

      model.shaderInputs.setProps({
        lighting,
        pbrProjection: {
          camera: cameraPos,
          modelViewProjectionMatrix,
          modelMatrix,
          normalMatrix: new Matrix4(modelMatrix).invert().transpose()
        },
        skin: {
          scenegraphsFromGLTF: this.scenegraphsFromGLTF
        }
      });
      model.draw(renderPass);
    });

    renderPass.end();
  }
}

function showError(error?: unknown): void {
  const errorDiv = document.getElementById('error') as HTMLDivElement | null;
  if (!errorDiv) {
    return;
  }

  errorDiv.textContent = error ? `Error loading model: ${getErrorMessage(error)}` : '';
  errorDiv.style.display = error ? 'block' : 'none';
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function destroyScenegraphs(scenegraphsFromGLTF?: ReturnType<typeof createScenegraphsFromGLTF>) {
  for (const scene of scenegraphsFromGLTF?.scenes || []) {
    scene.traverse(node => {
      const model = (node as Partial<ModelNode>).model;
      model?.destroy();
    });
  }
}
