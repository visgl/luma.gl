// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {AnimationLoopTemplate, AnimationProps, ModelNode, OrbitControls} from '@luma.gl/engine';
import {Device, log} from '@luma.gl/core';
import {load} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import {GLTFAudioController, createScenegraphsFromGLTF} from '@luma.gl/gltf';
import {Light, LightingProps} from '@luma.gl/shadertools';
import {Matrix4} from '@math.gl/core';
import {INFO_HTML, GRAPH_INFO_HTML, ENVIRONMENT_INFO_HTML} from './app-ui';

import {GLTF_AUDIO_PRESETS, type GLTFAudioFeature} from './presets';

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
  static graphInfo = GRAPH_INFO_HTML;
  static environmentInfo = ENVIRONMENT_INFO_HTML;

  device: Device;
  orbitControls: OrbitControls;
  scenegraphsFromGLTF?: ReturnType<typeof createScenegraphsFromGLTF>;
  modelLights: Light[] = [];
  center = [0, 0, 0];
  cameraHeight = 0;
  sceneRadius = 1;
  isFinalized = false;
  audioContext?: AudioContext;
  audio?: GLTFAudioController;
  controls = document.createElement('div');
  status = document.createElement('span');
  playbackGeneration = 0;
  volume = 0.5;

  async playAudio(): Promise<void> {
    if (!this.scenegraphsFromGLTF) return;
    const generation = ++this.playbackGeneration;
    try {
      this.audioContext ||= new AudioContext();
      const resumed = this.audioContext.resume();
      this.audio ||= new GLTFAudioController({
        scenegraphs: this.scenegraphsFromGLTF,
        audioContext: this.audioContext,
        baseUrl: GLTF_AUDIO_PRESETS[this.feature].modelUrl
      });
      this.audio.gain.gain.value = this.volume;
      this.status.textContent = 'Loading audio…';
      await resumed;
      if (this.isFinalized || generation !== this.playbackGeneration) return;
      await this.audio.play();
      if (!this.isFinalized && generation === this.playbackGeneration)
        this.status.textContent = 'Playing — orbit and zoom to hear spatial sound';
    } catch (error) {
      if (!this.isFinalized) this.status.textContent = String(error);
    }
  }

  constructor(
    {device}: AnimationProps,
    readonly feature: GLTFAudioFeature = 'emitter'
  ) {
    super();
    this.device = device;
    const credits = document.getElementById('credits');
    if (credits)
      credits.innerHTML =
        feature === 'environment'
          ? ENVIRONMENT_INFO_HTML
          : feature === 'graph'
            ? GRAPH_INFO_HTML
            : INFO_HTML;

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

    Object.assign(this.controls.style, {
      position: 'absolute',
      top: '12px',
      left: '12px',
      zIndex: '2',
      background: '#18202c',
      color: '#edf2fa',
      padding: '12px',
      borderRadius: '6px',
      maxWidth: '320px'
    });
    const playButton = document.createElement('button');
    playButton.textContent = 'Enable / restart audio';
    playButton.onclick = () => void this.playAudio();
    const stopButton = document.createElement('button');
    stopButton.textContent = 'Stop';
    stopButton.onclick = () => {
      this.playbackGeneration++;
      this.audio?.stop();
      this.status.textContent = 'Stopped';
    };
    const volumeLabel = document.createElement('label');
    volumeLabel.textContent = ' Volume ';
    const volume = document.createElement('input');
    volume.type = 'range';
    volume.min = '0';
    volume.max = '1';
    volume.step = '0.01';
    volume.value = '0.5';
    volume.oninput = () => {
      this.volume = Number(volume.value);
      if (this.audio) this.audio.gain.gain.value = this.volume;
    };
    volumeLabel.append(volume);
    this.status.textContent = feature !== 'emitter' ? 'Loading Drum Kit…' : 'Loading Boom Box…';
    this.status.style.display = 'block';
    this.controls.append(playButton, stopButton, volumeLabel, this.status);
    canvas.parentElement?.append(this.controls);
    void this.loadGLTF();
  }

  onFinalize(): void {
    this.isFinalized = true;
    this.audio?.destroy();
    void this.audioContext?.close();
    this.controls.remove();
    this.orbitControls.destroy();

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
      log.log(0, 'Starting tutorial glTF load', {
        modelUrl: GLTF_AUDIO_PRESETS[this.feature].modelUrl
      })();
      canvas.style.opacity = '0.2';

      const gltf = await load(GLTF_AUDIO_PRESETS[this.feature].modelUrl, GLTFLoader);
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
      this.status.textContent = 'Ready — enable audio, then orbit and zoom';
    } catch (error) {
      if (this.isFinalized) {
        return;
      }

      log.error('Failed to load tutorial glTF model', error)();
      canvas.style.opacity = '1';
      this.status.textContent = String(error);
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
    this.audio?.update(new Matrix4(viewMatrix).invert());
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

function destroyScenegraphs(scenegraphsFromGLTF?: ReturnType<typeof createScenegraphsFromGLTF>) {
  scenegraphsFromGLTF?.destroy();
}
