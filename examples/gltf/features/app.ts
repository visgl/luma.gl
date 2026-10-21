// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {AnimationLoopTemplate, AnimationProps, ModelNode, OrbitControls} from '@luma.gl/engine';
import {Device, log} from '@luma.gl/core';
import {load} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import {createScenegraphsFromGLTF, GLTFBillboardController} from '@luma.gl/gltf';
import {Light, LightingProps} from '@luma.gl/shadertools';
import {Matrix4} from '@math.gl/core';
import {INFO_HTML, LIGHTMAP_INFO_HTML, showError} from './app-ui';

import {GLTF_FEATURE_PRESETS, type GLTFFeature} from './presets';

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

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = INFO_HTML;

  static getInfo(feature: GLTFFeature): string {
    return feature === 'lightmap' ? LIGHTMAP_INFO_HTML : INFO_HTML;
  }

  device: Device;
  orbitControls: OrbitControls;
  scenegraphsFromGLTF?: ReturnType<typeof createScenegraphsFromGLTF>;
  modelLights: Light[] = [];
  billboardController?: GLTFBillboardController;
  center = [0, 0, 0];
  cameraHeight = 0;
  sceneRadius = 1;
  isFinalized = false;

  constructor(
    {device}: AnimationProps,
    readonly feature: GLTFFeature = 'billboard'
  ) {
    super();
    this.device = device;

    const canvas = this.device.getDefaultCanvasContext().canvas as HTMLCanvasElement;
    this.orbitControls = new OrbitControls(canvas, {
      distance: 2,
      yaw: feature === 'lightmap' ? 0 : Math.PI / 4,
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
    this.billboardController?.destroy();

    destroyScenegraphs(this.scenegraphsFromGLTF);
    this.scenegraphsFromGLTF = undefined;
    this.modelLights = [];
  }

  getClearColor(): [number, number, number, number] {
    return [0.95, 0.95, 0.97, 1];
  }

  async loadGLTF(): Promise<void> {
    const canvas = this.device.getDefaultCanvasContext().canvas as HTMLCanvasElement;

    try {
      log.log(0, 'Starting glTF feature load', {
        modelUrl: GLTF_FEATURE_PRESETS[this.feature].modelUrl
      })();
      showError();
      canvas.style.opacity = '0.2';

      const gltf = await load(GLTF_FEATURE_PRESETS[this.feature].modelUrl, GLTFLoader);
      if (this.isFinalized) return;
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
      this.billboardController?.destroy();
      this.billboardController = new GLTFBillboardController({
        gltf: processedGLTF,
        ...scenegraphsFromGLTF,
        allowLegacyYAxis: GLTF_FEATURE_PRESETS[this.feature].allowLegacyYAxis
      });

      const sceneBounds = scenegraphsFromGLTF.sceneBounds[0] || scenegraphsFromGLTF.modelBounds;
      this.center = [...sceneBounds.center];
      this.sceneRadius = sceneBounds.radius;
      this.cameraHeight =
        this.center[1] + (this.feature === 'lightmap' ? 0 : this.sceneRadius * 0.3);
      this.orbitControls.setProps({
        target: [this.center[0], this.cameraHeight, this.center[2]],
        distance: sceneBounds.recommendedOrbitDistance * (this.feature === 'lightmap' ? 2 : 1),
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
    const lighting =
      this.feature === 'lightmap'
        ? {lights: []}
        : this.modelLights.length > 0
          ? {lights: this.modelLights}
          : lightSources;

    for (const {node, modelMatrix, overlay} of this.billboardController!.getDrawEntries({
      viewMatrix
    })) {
      if (!(node instanceof ModelNode)) continue;
      const {model} = node;
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
      const parameters = model.parameters;
      try {
        if (overlay)
          model.setParameters({...parameters, depthCompare: 'always', depthWriteEnabled: false});
        model.draw(renderPass);
      } finally {
        if (overlay) model.setParameters(parameters);
      }
    }

    renderPass.end();
  }
}

function destroyScenegraphs(scenegraphsFromGLTF?: ReturnType<typeof createScenegraphsFromGLTF>) {
  scenegraphsFromGLTF?.destroy();
}
