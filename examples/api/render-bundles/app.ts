// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Bindings, BindingsByGroup, RenderBundle, RenderPass} from '@luma.gl/core';
import {Buffer, Device, normalizeBindingsByGroup} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate, CubeGeometry, Model, OrbitControls} from '@luma.gl/engine';
import {Matrix4, radians} from '@math.gl/core';
import {type SettingsChangeDescriptor} from '@deck.gl-community/panels';
import {
  ExamplePanelManager,
  ExampleSettingsPanelManager,
  getChangedSetting,
  makeExamplePanelHostHtml
} from '../../example-panels';
import {
  DEFAULT_DRAW_COUNT,
  isRenderBundleDrawCount,
  makeRenderBundlesSettingsSchema,
  RenderBundlesUI
} from './app-ui';
import {CAMERA_DISTANCE, CAMERA_PITCH, CAMERA_YAW, makeObjectUniforms} from './scene';
import {WGSL_SHADER} from './shaders';

const FRAME_UNIFORM_FLOAT_COUNT = 32;

type SceneRenderable = {
  bindings: Bindings;
  bindGroups: BindingsByGroup;
  bindGroupCacheKeys: Partial<Record<number, object>>;
  objectUniformBuffer: Buffer;
};

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeExamplePanelHostHtml();

  static props = {createFramebuffer: true, debug: true};

  readonly device: Device;
  readonly model: Model;
  readonly frameUniformBuffer: Buffer;
  readonly settingsPanel: ExampleSettingsPanelManager;
  readonly panels: ExamplePanelManager;
  readonly ui: RenderBundlesUI;
  private readonly frameBindGroupCacheKey = {};
  renderables: SceneRenderable[] = [];
  renderBundle: RenderBundle | null = null;
  drawCount = DEFAULT_DRAW_COUNT;
  useRenderBundles = true;
  private orbitControls: OrbitControls | null = null;

  constructor({device}: AnimationProps) {
    super();

    if (device.type !== 'webgpu') {
      throw new Error('Render bundles example requires WebGPU');
    }

    this.device = device;
    this.frameUniformBuffer = device.createBuffer({
      id: 'render-bundles-frame-uniforms',
      byteLength: FRAME_UNIFORM_FLOAT_COUNT * Float32Array.BYTES_PER_ELEMENT,
      usage: Buffer.UNIFORM | Buffer.COPY_DST
    });
    this.model = new Model(device, {
      id: 'render-bundles-cube',
      source: WGSL_SHADER,
      geometry: new CubeGeometry({indices: true}),
      colorAttachmentFormats: [device.preferredColorFormat],
      parameters: {
        cullMode: 'back',
        depthCompare: 'less-equal',
        depthWriteEnabled: true
      }
    });
    this.settingsPanel = new ExampleSettingsPanelManager({
      id: 'api-render-bundles-settings',
      schema: makeRenderBundlesSettingsSchema(),
      settings: {
        useRenderBundles: this.useRenderBundles,
        drawCount: this.drawCount
      },
      onSettingsChange: this.handleSettingsChange
    });
    this.ui = new RenderBundlesUI(this.settingsPanel, this.drawCount);
    this.panels = new ExamplePanelManager({panel: this.ui.panel});
    this.createScene();
    this.rebuildRenderBundle();
    this.panels.mount();
  }

  override async onInitialize({canvas}: AnimationProps): Promise<void> {
    if (canvas instanceof HTMLCanvasElement) {
      this.orbitControls = new OrbitControls(canvas, {
        yaw: CAMERA_YAW,
        pitch: CAMERA_PITCH,
        distance: CAMERA_DISTANCE,
        minDistance: 12,
        maxDistance: 100,
        minPitch: -1.2,
        maxPitch: 1.2,
        autoRotate: true,
        autoRotateSpeed: -0.18
      });
    }
  }

  onRender({animationLoop, aspect, device, time}: AnimationProps): void {
    this.orbitControls?.update(time);
    this.updateFrameUniforms(aspect, time);

    const renderPass = device.beginRenderPass({
      clearColor: [0.01, 0.01, 0.015, 1],
      clearDepth: 1
    });

    if (this.useRenderBundles) {
      renderPass.executeBundles([this.renderBundle!]);
    } else {
      this.renderScene(renderPass);
    }
    renderPass.end();
    this.ui.updateStats(
      animationLoop.cpuTime.getSampleAverageTime(),
      this.drawCount,
      this.useRenderBundles
    );
  }

  onFinalize(): void {
    this.orbitControls?.destroy();
    this.settingsPanel.finalize();
    this.panels.finalize();
    this.renderBundle?.destroy();
    this.destroyScene();
    this.frameUniformBuffer.destroy();
    this.model.destroy();
  }

  private createScene(): void {
    this.renderables = Array.from({length: this.drawCount}, (_, index) =>
      this.createRenderable(index)
    );
  }

  private destroyScene(): void {
    for (const renderable of this.renderables) {
      renderable.objectUniformBuffer.destroy();
    }
    this.renderables = [];
  }

  private createRenderable(index: number): SceneRenderable {
    const objectUniformBuffer = this.device.createBuffer({
      id: `render-bundles-object-uniforms-${index}`,
      data: makeObjectUniforms(index, this.drawCount),
      usage: Buffer.UNIFORM | Buffer.COPY_DST
    });
    const bindings = {
      frameUniforms: this.frameUniformBuffer,
      objectUniforms: objectUniformBuffer
    };

    return {
      bindings,
      bindGroups: normalizeBindingsByGroup(this.model.pipeline.shaderLayout, bindings),
      bindGroupCacheKeys: {
        0: this.frameBindGroupCacheKey,
        1: {}
      },
      objectUniformBuffer
    };
  }

  private rebuildRenderBundle(): void {
    this.renderBundle?.destroy();
    const renderBundleEncoder = this.device.createRenderBundleEncoder({
      id: 'render-bundles-encoder',
      colorAttachmentFormats: [this.device.preferredColorFormat]
    });
    this.renderScene(renderBundleEncoder);
    this.renderBundle = renderBundleEncoder.finish();
  }

  private renderScene(renderPass: RenderPass): void {
    const {indexBuffer} = this.model.vertexArray;
    const indexCount = indexBuffer
      ? (this.model.indexCount ??
        indexBuffer.byteLength / (indexBuffer.indexType === 'uint32' ? 4 : 2))
      : undefined;

    for (const renderable of this.renderables) {
      this.model.pipeline.draw({
        renderPass,
        vertexArray: this.model.vertexArray,
        vertexCount: this.model.vertexCount,
        indexCount,
        bindings: renderable.bindings,
        bindGroups: renderable.bindGroups,
        _bindGroupCacheKeys: renderable.bindGroupCacheKeys
      });
    }
  }

  private updateFrameUniforms(aspect: number, timeMilliseconds: number): void {
    const orbitAngle = timeMilliseconds * 0.00018;
    const eye = this.orbitControls?.getEyePosition() ?? [
      Math.cos(orbitAngle) * 38,
      12,
      Math.sin(orbitAngle) * 38
    ];
    eye[1] += Math.sin(orbitAngle * 0.7) * 4;
    const viewMatrix = new Matrix4().lookAt({eye, center: [0, 0, 0], up: [0, 1, 0]});
    const projectionMatrix = new Matrix4().perspective({
      fovy: radians(52),
      aspect,
      near: 0.1,
      far: 140
    });
    const frameUniforms = new Float32Array(FRAME_UNIFORM_FLOAT_COUNT);
    frameUniforms.set(viewMatrix.toArray(), 0);
    frameUniforms.set(projectionMatrix.toArray(), 16);
    this.frameUniformBuffer.write(frameUniforms);
  }

  private readonly handleSettingsChange = (
    _settings: Record<string, unknown>,
    changedSettings?: SettingsChangeDescriptor[]
  ): void => {
    const useRenderBundles = getChangedSetting(changedSettings, 'useRenderBundles')?.nextValue;
    if (typeof useRenderBundles === 'boolean') {
      this.useRenderBundles = useRenderBundles;
      this.ui.updateStats(0, this.drawCount, this.useRenderBundles);
    }

    const drawCount = getChangedSetting(changedSettings, 'drawCount')?.nextValue;
    if (typeof drawCount === 'number') {
      this.handleDrawCountChange(drawCount);
    }
  };

  private handleDrawCountChange(drawCount: number): void {
    if (!isRenderBundleDrawCount(drawCount) || drawCount === this.drawCount) {
      return;
    }

    this.drawCount = drawCount;
    this.destroyScene();
    this.createScene();
    this.rebuildRenderBundle();
    this.ui.updateStats(0, this.drawCount, this.useRenderBundles);
  }
}
