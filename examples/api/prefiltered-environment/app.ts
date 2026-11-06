// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Texture} from '@luma.gl/core';
import {
  AnimationLoopTemplate,
  SphereGeometry,
  OrbitControls,
  type Model,
  type AnimationProps
} from '@luma.gl/engine';
import {Matrix4} from '@math.gl/core';
import {
  createPBRMaterial,
  createPBRMaterialFactory,
  createPBRModel,
  createPrefilteredEnvironment,
  getPBREnvironmentBindings,
  getPBREnvironmentUniforms,
  type PBRMaterial,
  type PrefilteredEnvironment
} from '@luma.gl/engine/lighting';
import {toHalfFloat} from '@luma.gl/shaders';
import {ExamplePanelManager, makeExamplePanelHostHtml} from '../../example-panels';
import {makeEnvironmentPanel} from './app-ui';

/** An engine-only IBL consumer: roughness increases across columns, metalness across rows. */
export default class EnvironmentExample extends AnimationLoopTemplate {
  static info = makeExamplePanelHostHtml();
  readonly environment: PrefilteredEnvironment;
  readonly source: Texture;
  readonly surfaces: {model: Model; material: PBRMaterial; modelMatrix: Matrix4}[] = [];
  readonly panels: ExamplePanelManager;
  private orbitControls: OrbitControls | null = null;
  private readonly resetCamera = () => {
    this.orbitControls?.setProps({target: [0, 0, 0]});
    this.orbitControls?.reset();
  };

  constructor({device}: AnimationProps) {
    super();
    const capabilities = device.getTextureFormatCapabilities('rgba16float');
    const format = capabilities.render && capabilities.filter ? 'rgba16float' : 'rgba8unorm';
    const width = 128;
    const height = 64;
    const data =
      format === 'rgba16float'
        ? new Uint16Array(width * height * 4)
        : new Uint8Array(width * height * 4);
    for (let row = 0; row < height; row++) {
      for (let column = 0; column < width; column++) {
        const latitude = (row + 0.5) / height;
        const longitude = (column + 0.5) / width;
        const light = 8 * Math.exp(-((longitude - 0.65) ** 2 + (latitude - 0.3) ** 2) / 0.003);
        const sky = 1 - latitude;
        const color = [0.1 + 0.3 * sky + light, 0.12 + 0.5 * sky + light, 0.16 + sky + light, 1];
        data.set(
          color.map(value =>
            format === 'rgba16float'
              ? toHalfFloat(value)
              : Math.round(Math.min(1, Math.max(0, value)) * 255)
          ),
          (row * width + column) * 4
        );
      }
    }
    this.source = device.createTexture({
      width,
      height,
      format,
      data,
      sampler: {
        minFilter: 'linear',
        magFilter: 'linear',
        addressModeU: 'repeat',
        addressModeV: 'clamp-to-edge'
      }
    });
    this.environment = createPrefilteredEnvironment(device, {
      source: this.source,
      format,
      size: 32,
      sampleCount: 128
    });
    const factory = createPBRMaterialFactory(device);
    const geometry = new SphereGeometry({nlat: 24, nlong: 32});
    for (let row = 0; row < 3; row++) {
      for (let column = 0; column < 5; column++) {
        const material = createPBRMaterial(device, {
          factory,
          uniforms: {
            baseColorFactor: [0.7, 0.28, 0.1, 1],
            metallicRoughnessValues: [row / 2, Math.max(0.05, column / 4)],
            IBLenabled: true
          }
        });
        const model = createPBRModel(device, {
          geometry,
          material,
          defines: {USE_IBL: true, USE_SCENE_ENVIRONMENT: true, USE_TEX_LOD: true},
          bindings: getPBREnvironmentBindings(this.environment.textures),
          parameters: {depthWriteEnabled: true, depthCompare: 'less-equal'}
        });
        this.surfaces.push({
          model,
          material,
          modelMatrix: new Matrix4()
            .translate([(column - 2) * 1.7, (row - 1) * 1.7, 0])
            .scale([0.7, 0.7, 0.7])
        });
      }
    }
    this.panels = new ExamplePanelManager({
      panel: makeEnvironmentPanel({
        backend: device.type,
        highDynamicRange: format === 'rgba16float',
        onResetCamera: this.resetCamera
      })
    });
    this.panels.mount();
  }

  async onInitialize({canvas}: AnimationProps): Promise<void> {
    if (canvas instanceof HTMLCanvasElement) {
      this.orbitControls = new OrbitControls(canvas, {
        target: [0, 0, 0],
        distance: 12,
        yaw: 0,
        pitch: 0,
        minDistance: 4,
        maxDistance: 35,
        enableRotate: true,
        enablePan: true
      });
    }
  }

  onRender({device, aspect, time}: AnimationProps) {
    this.orbitControls?.update(time);
    const camera: [number, number, number] = this.orbitControls?.getEyePosition() ?? [0, 0, 12];
    const view = new Matrix4().lookAt({
      eye: camera,
      center: this.orbitControls?.props.target ?? [0, 0, 0],
      up: this.orbitControls?.getUpDirection() ?? [0, 1, 0]
    });
    const projection = new Matrix4().perspective({fovy: Math.PI / 4, aspect, near: 0.1, far: 100});
    if (device.type === 'webgpu') {
      // Convert math.gl's OpenGL clip depth to WebGPU's [0, 1] range.
      projection.multiplyLeft(new Matrix4([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.5, 0, 0, 0, 0.5, 1]));
    }
    const renderPass = device.beginRenderPass({clearColor: [0.02, 0.02, 0.02, 1], clearDepth: 1});
    for (const {model, modelMatrix} of this.surfaces) {
      model.shaderInputs.setProps({
        pbrProjection: {
          modelMatrix,
          normalMatrix: new Matrix4(modelMatrix).invert().transpose(),
          modelViewProjectionMatrix: new Matrix4(projection)
            .multiplyRight(view)
            .multiplyRight(modelMatrix),
          camera
        },
        pbrScene: {
          ...getPBREnvironmentUniforms(this.environment.textures),
          toneMapMode: 2,
          outputEncoding: 1
        }
      });
      model.draw(renderPass);
    }
    renderPass.end();
  }

  onFinalize() {
    this.panels.finalize();
    this.orbitControls?.destroy();
    for (const {model, material} of this.surfaces) {
      model.destroy();
      material.destroy();
    }
    this.environment.destroy();
    this.source.destroy();
  }
}
