// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Bindings, BindingsByGroup, RenderBundle, RenderPass} from '@luma.gl/core';
import {Buffer, Device, normalizeBindingsByGroup} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate, CubeGeometry, Model} from '@luma.gl/engine';
import {Matrix4, radians} from '@math.gl/core';
import {
  ColumnPanel,
  type Panel,
  type SettingsChangeDescriptor,
  type SettingsSchema
} from '@deck.gl-community/panels';
import {
  ExamplePanelManager,
  ExampleSettingsPanelManager,
  getChangedSetting,
  makeExamplePanelHostHtml,
  makeHtmlCustomPanel
} from '../../example-panels';

const DEFAULT_DRAW_COUNT = 5000;
const DRAW_COUNT_OPTIONS = [1000, DEFAULT_DRAW_COUNT, 10000];
const DRAW_COUNT_OPTION_SET = new Set(DRAW_COUNT_OPTIONS);
const FRAME_UNIFORM_FLOAT_COUNT = 32;
const OBJECT_UNIFORM_FLOAT_COUNT = 20;

const WGSL_SHADER = /* wgsl */ `\
struct FrameUniforms {
  viewMatrix: mat4x4<f32>,
  projectionMatrix: mat4x4<f32>,
};

@group(0) @binding(0) var<uniform> frameUniforms : FrameUniforms;

struct ObjectUniforms {
  modelMatrix: mat4x4<f32>,
  color: vec4<f32>,
};

@group(1) @binding(0) var<uniform> objectUniforms : ObjectUniforms;

struct VertexInputs {
  @location(0) positions : vec4<f32>,
  @location(1) normals : vec3<f32>,
};

struct FragmentInputs {
  @builtin(position) position : vec4<f32>,
  @location(0) normal : vec3<f32>,
  @location(1) color : vec4<f32>,
};

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  var outputs: FragmentInputs;
  let worldPosition = objectUniforms.modelMatrix * inputs.positions;
  outputs.position = frameUniforms.projectionMatrix * frameUniforms.viewMatrix * worldPosition;
  outputs.normal = normalize((objectUniforms.modelMatrix * vec4<f32>(inputs.normals, 0.0)).xyz);
  outputs.color = objectUniforms.color;
  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  let lightDirection = normalize(vec3<f32>(0.4, 0.8, 0.3));
  let diffuse = max(dot(normalize(inputs.normal), lightDirection), 0.18);
  return vec4<f32>(inputs.color.rgb * diffuse, inputs.color.a);
}
`;

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
  private readonly frameBindGroupCacheKey = {};
  renderables: SceneRenderable[] = [];
  renderBundle: RenderBundle | null = null;
  drawCount = DEFAULT_DRAW_COUNT;
  useRenderBundles = true;
  private cpuTimeElement: HTMLElement | null = null;
  private drawCountElement: HTMLElement | null = null;
  private modeElement: HTMLElement | null = null;

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
    this.panels = new ExamplePanelManager({panel: this.makePanel()});
    this.createScene();
    this.rebuildRenderBundle();
    this.panels.mount();
  }

  onRender({animationLoop, aspect, device, tick}: AnimationProps): void {
    this.updateFrameUniforms(aspect, tick);

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
    this.updateStats(animationLoop.cpuTime.getSampleAverageTime());
  }

  onFinalize(): void {
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

  private updateFrameUniforms(aspect: number, tick: number): void {
    const orbitAngle = tick * 0.003;
    const eye: [number, number, number] = [
      Math.cos(orbitAngle) * 38,
      12 + Math.sin(orbitAngle * 0.7) * 4,
      Math.sin(orbitAngle) * 38
    ];
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

  private makePanel(): Panel {
    return new ColumnPanel({
      id: 'api-render-bundles-controls',
      title: 'Render Bundles',
      panels: [
        makeHtmlCustomPanel({
          id: 'api-render-bundles-description',
          title: '',
          html: `\
          <p>This scene intentionally issues thousands of individual draws. Render bundles record those WebGPU commands once, so per-frame CPU work is mostly the camera buffer update and bundle replay.</p>
          `
        }),
        makeHtmlCustomPanel({
          id: 'api-render-bundles-stats',
          title: 'Frame Stats',
          html: `\
          <style>
            .render-bundle-stats {
              display: grid;
              gap: 8px;
            }
            .render-bundle-stat {
              display: flex;
              justify-content: space-between;
              gap: 16px;
              font-variant-numeric: tabular-nums;
            }
            .render-bundle-stat strong {
              font-weight: 700;
            }
          </style>
          <div class="render-bundle-stats">
            <div class="render-bundle-stat"><span>CPU Time</span><strong data-cpu-time>0.00 ms</strong></div>
            <div class="render-bundle-stat"><span>Draw Calls</span><strong data-draw-count>${formatDrawCount(this.drawCount)}</strong></div>
            <div class="render-bundle-stat"><span>Mode</span><strong data-mode>Render bundle</strong></div>
          </div>
          `,
          onRender: rootElement => {
            this.cpuTimeElement = rootElement.querySelector('[data-cpu-time]');
            this.drawCountElement = rootElement.querySelector('[data-draw-count]');
            this.modeElement = rootElement.querySelector('[data-mode]');
            this.updateStats(0);
            return () => {
              this.cpuTimeElement = null;
              this.drawCountElement = null;
              this.modeElement = null;
            };
          }
        }),
        this.settingsPanel.makePanel()
      ]
    });
  }

  private updateStats(cpuTimeMilliseconds: number): void {
    if (this.cpuTimeElement) {
      this.cpuTimeElement.textContent = `${cpuTimeMilliseconds.toFixed(2)} ms`;
    }
    if (this.drawCountElement) {
      this.drawCountElement.textContent = formatDrawCount(this.drawCount);
    }
    if (this.modeElement) {
      this.modeElement.textContent = this.useRenderBundles ? 'Render bundle' : 'Replay draws';
    }
  }

  private readonly handleSettingsChange = (
    _settings: Record<string, unknown>,
    changedSettings?: SettingsChangeDescriptor[]
  ): void => {
    const useRenderBundles = getChangedSetting(changedSettings, 'useRenderBundles')?.nextValue;
    if (typeof useRenderBundles === 'boolean') {
      this.useRenderBundles = useRenderBundles;
      this.updateStats(0);
    }

    const drawCount = getChangedSetting(changedSettings, 'drawCount')?.nextValue;
    if (typeof drawCount === 'number') {
      this.handleDrawCountChange(drawCount);
    }
  };

  private handleDrawCountChange(drawCount: number): void {
    if (!DRAW_COUNT_OPTION_SET.has(drawCount) || drawCount === this.drawCount) {
      return;
    }

    this.drawCount = drawCount;
    this.destroyScene();
    this.createScene();
    this.rebuildRenderBundle();
    this.updateStats(0);
  }
}

function makeRenderBundlesSettingsSchema(): SettingsSchema {
  return {
    title: 'Settings',
    sections: [
      {
        id: 'render-bundles',
        name: 'Render',
        initiallyCollapsed: false,
        settings: [
          {
            name: 'useRenderBundles',
            label: 'Use Render Bundles',
            type: 'boolean',
            persist: 'none'
          },
          {
            name: 'drawCount',
            label: 'Draw Calls',
            type: 'select',
            persist: 'none',
            options: DRAW_COUNT_OPTIONS.map(drawCount => ({
              label: formatDrawCount(drawCount),
              value: drawCount
            }))
          }
        ]
      }
    ]
  };
}

function makeObjectUniforms(index: number, drawCount: number): Float32Array {
  const objectUniforms = new Float32Array(OBJECT_UNIFORM_FLOAT_COUNT);
  const modelMatrix = makeModelMatrix(index, drawCount);
  objectUniforms.set(modelMatrix.toArray(), 0);
  objectUniforms.set(makeObjectColor(index), 16);
  return objectUniforms;
}

function makeModelMatrix(index: number, drawCount: number): Matrix4 {
  if (index === 0) {
    return new Matrix4().scale([5, 5, 5]);
  }

  const normalizedIndex = index / Math.max(drawCount - 1, 1);
  const angle = normalizedIndex * Math.PI * 96 + index * 0.013;
  const radius = 10 + (index % 64) * 0.14;
  const height = Math.sin(index * 0.73) * 2.4;
  const scale = 0.08 + ((index * 17) % 23) / 110;

  return new Matrix4()
    .translate([Math.cos(angle) * radius, height, Math.sin(angle) * radius])
    .rotateXYZ([index * 0.09, index * 0.13, index * 0.17])
    .scale([scale, scale, scale]);
}

function makeObjectColor(index: number): [number, number, number, number] {
  if (index === 0) {
    return [0.86, 0.76, 0.5, 1];
  }

  const colorBand = index % 7;
  return [
    0.28 + colorBand * 0.055,
    0.24 + ((index * 3) % 7) * 0.045,
    0.3 + ((index * 5) % 7) * 0.05,
    1
  ];
}

function formatDrawCount(drawCount: number): string {
  return `${drawCount.toLocaleString()} individual draws`;
}
