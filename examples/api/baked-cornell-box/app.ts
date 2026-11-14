// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {AnimationLoopTemplate, OrbitControls, type AnimationProps} from '@luma.gl/engine';
import {
  createPBRMaterial,
  createPBRModel,
  createLightmapFromData,
  type LightmapBakeResult
} from '@luma.gl/engine/lighting';
import {Matrix4} from '@math.gl/core';
import {loadCornellScene, prepareCornellAtlas} from '../lightmap-baking/cornell-scene';
import {
  CORNELL_BAKE_PROFILES,
  decodeCornellBake,
  matchCornellBakeProfile
} from '../lightmap-baking/cornell-bake-file';
import {
  ExamplePanelManager,
  makeExamplePanelHostHtml,
  makeHtmlCustomPanel
} from '../../example-panels';

export default class BakedCornellBox extends AnimationLoopTemplate {
  static info = makeExamplePanelHostHtml();
  private readonly device;
  private readonly panels;
  private source: ReturnType<typeof loadCornellScene> | null = null;
  private controls: OrbitControls | null = null;
  private result: LightmapBakeResult | null = null;
  private model: ReturnType<typeof createPBRModel> | null = null;
  private material: ReturnType<typeof createPBRMaterial> | null = null;
  private generation = 0;

  constructor(props: AnimationProps) {
    super(props);
    this.device = props.device;
    this.panels = new ExamplePanelManager({
      panel: makeHtmlCustomPanel({
        id: 'baked-cornell-box',
        title: 'Baked Cornell Box',
        html: '<p>Load an exported Cornell Box bake to view its stored lighting.</p><label>Load bake <input type="file" accept=".lmb"></label><p role="status"></p>',
        onRender: root => {
          const input = root.querySelector<HTMLInputElement>('input')!;
          const status = root.querySelector('[role="status"]')!;
          const load = async (read: () => Promise<ArrayBuffer>) => {
            const generation = ++this.generation;
            status.textContent = 'Loading bake…';
            try {
              this.source ??= loadCornellScene().catch(error => {
                this.source = null;
                throw error;
              });
              const [bytes, source] = await Promise.all([read(), this.source]);
              if (generation !== this.generation) return;
              const profile = matchCornellBakeProfile(bytes, {
                assetHash: source.assetHash,
                placements: source.placements.map(placement => placement.id)
              });
              if (CORNELL_BAKE_PROFILES[profile].width > this.device.limits.maxTextureDimension2D) {
                throw new Error('This device cannot upload the exported atlas size.');
              }
              const prepared = prepareCornellAtlas(source, profile);
              const data = decodeCornellBake(bytes, prepared.recipe);
              const result = createLightmapFromData(this.device, data);
              const material = createPBRMaterial(this.device, {
                bindings: {pbr_lightmapSampler: result.textures.lightmapTexture},
                uniforms: {metallicRoughnessValues: [0, 1], lightmapUVSet: 1}
              });
              const model = createPBRModel(this.device, {
                geometry: prepared.geometry,
                material,
                defines: {USE_LIGHTS: true},
                parameters: {depthWriteEnabled: true, depthCompare: 'less-equal', cullMode: 'back'}
              });
              this.model?.destroy();
              this.material?.destroy();
              this.result?.destroy();
              this.result = result;
              this.material = material;
              this.model = model;
              status.textContent = `Loaded ${data.width} × ${data.height} baked irradiance.`;
            } catch (error) {
              if (generation === this.generation) status.textContent = String(error);
            }
          };
          const openFile = () => {
            const file = input.files?.[0];
            if (file) void load(() => file.arrayBuffer());
          };
          input.addEventListener('change', openFile);
          void load(async () => {
            const response = await fetch(new URL('./cornell-box.lmb-gzip', import.meta.url));
            if (!response.ok || !response.body) throw new Error('Could not load the default bake.');
            const stream = response.body.pipeThrough(new DecompressionStream('gzip'));
            return new Response(stream).arrayBuffer();
          });
          return () => input.removeEventListener('change', openFile);
        }
      })
    });
    this.panels.mount();
  }

  onRender({canvasContext, time}: AnimationProps): void {
    if (!(canvasContext.canvas instanceof HTMLCanvasElement)) return;
    this.controls ??= new OrbitControls(canvasContext.canvas, {
      target: [0, 1, 0],
      distance: 10,
      yaw: 0.55,
      pitch: 0.35,
      minDistance: 4,
      maxDistance: 18
    });
    this.controls.update(time);
    if (!this.model) return;
    const framebuffer = canvasContext.getCurrentFramebuffer();
    const eye = this.controls.getEyePosition();
    const view = new Matrix4().lookAt({eye, center: [0, 1, 0]});
    const projection = new Matrix4().perspective({
      fovy: Math.PI / 4,
      aspect: framebuffer.width / framebuffer.height,
      near: 0.1,
      far: 40
    });
    if (this.device.type === 'webgpu') {
      projection.multiplyLeft(new Matrix4([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.5, 0, 0, 0, 0.5, 1]));
    }
    this.model.shaderInputs.setProps({
      pbrProjection: {modelViewProjectionMatrix: projection.multiplyRight(view), camera: eye},
      lighting: {useByteColors: false, lights: [{type: 'ambient', color: [0, 0, 0]}]},
      pbrScene: {toneMapMode: 2, outputEncoding: 1}
    });
    const pass = this.device.beginRenderPass({
      framebuffer,
      clearColor: [0.04, 0.04, 0.04, 1],
      clearDepth: 1
    });
    this.model.draw(pass);
    pass.end();
  }

  onFinalize(): void {
    this.generation++;
    this.source = null;
    this.panels.finalize();
    this.controls?.destroy();
    this.model?.destroy();
    this.material?.destroy();
    this.result?.destroy();
  }
}
