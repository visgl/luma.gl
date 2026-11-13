// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {AnimationLoopTemplate, OrbitControls, type AnimationProps} from '@luma.gl/engine';
import {getLightmapAtlasDebugData, validateLightmapAtlas} from '@luma.gl/engine/lighting';
import {BAKING_SCENES, type BakingScene} from './scenes';
import {encodeSceneBake, decodeSceneBake} from './bake-file';
import {ColumnPanel} from '@deck.gl-community/panels';
import {
  ExamplePanelManager,
  ExampleSettingsPanelManager,
  makeExamplePanelHostHtml,
  makeExampleTabbedPanel,
  makeHtmlCustomPanel
} from '../../example-panels';
import {LightmapPreview} from '../pbr-shadows/lightmap-preview';

export default class LightmapExample extends AnimationLoopTemplate {
  static info = makeExamplePanelHostHtml();
  private preview: LightmapPreview | null;
  private readonly settings: ExampleSettingsPanelManager;
  private readonly panels: ExamplePanelManager;
  private controls: OrbitControls | null = null;
  private mode: 'live' | 'baking' | 'baked' = 'baking';
  private disposed = false;
  private scene: BakingScene = 'courtyard';
  private readonly device;
  private statusMessage = '';
  private activePanelId: string | undefined = 'baking-info';
  constructor(props: AnimationProps) {
    super(props);
    this.device = props.device;
    this.preview = LightmapPreview.isSupported(props.device)
      ? new LightmapPreview(props.device, 'full', 'generated', this.scene)
      : null;
    this.settings = new ExampleSettingsPanelManager({
      id: 'lightmap-baking-settings',
      schema: {
        title: 'Baking',
        sections: [
          {
            id: 'lighting',
            name: 'Lighting',
            settings: [
              {
                name: 'scene',
                label: 'Scene',
                type: 'select',
                persist: 'none',
                options: BAKING_SCENES.map(scene => ({...scene}))
              },
              {
                name: 'mode',
                label: 'Lighting',
                type: 'select',
                persist: 'none',
                options: [
                  {label: 'Live', value: 'live'},
                  {label: 'Baking', value: 'baking'},
                  {label: 'Baked / loaded', value: 'baked'}
                ]
              }
            ]
          }
        ]
      },
      settings: {mode: 'baking', scene: this.scene},
      onSettingsChange: values => {
        const selected = BAKING_SCENES.find(scene => scene.value === values.scene);
        if (selected && selected.value !== this.scene) {
          const next = new LightmapPreview(this.device, 'full', 'generated', selected.value);
          this.preview?.destroy();
          this.preview = next;
          this.scene = selected.value;
          this.statusMessage = '';
          this.setMode('baking');
          return;
        }
        if (values.mode === 'live' || values.mode === 'baking' || values.mode === 'baked')
          this.mode = values.mode;
      }
    });
    this.panels = new ExamplePanelManager({panel: this.makePanel()});
    this.panels.mount();
  }
  private setMode(mode: 'live' | 'baking' | 'baked'): void {
    this.mode = mode;
    this.settings.setSettings({mode, scene: this.scene});
    this.panels.setPanel(this.makePanel());
  }
  private makePanel() {
    const preview = this.preview;
    if (!preview)
      return makeHtmlCustomPanel({
        id: 'baking-unsupported',
        title: 'Unsupported device',
        html: '<p>Lightmap baking requires renderable float32 textures and renderable, filterable float16 textures. Try WebGPU or a WebGL2 device with floating-point color-buffer support.</p>'
      });
    return makeExampleTabbedPanel({
      id: 'baking-panels',
      title: 'Lightmap Baking',
      activePanelId: this.activePanelId,
      onActivePanelIdChange: activePanelId => {
        this.activePanelId = activePanelId;
        this.panels.setPanel(this.makePanel());
      },
      panels: [
        makeHtmlCustomPanel({
          id: 'baking-info',
          title: 'Info',
          html: '<p>Explore static architectural scenes. Courtyard & Arcade contrasts terracotta walls, pale stone and blue sculpture; Two Rooms remains available for comparison.</p><p>Baking averages fixed-light and environment samples. Baked mode uses only stored diffuse lighting. Live uses direct shadowed lights with unoccluded ambient as a reference. WebGPU also traces two diffuse bounces for indirect color bleeding.</p><p>Change the warm light to mark the bake stale, then reset to rebake. Export preserves linear HDR irradiance and UV-set metadata; loading requires this same scene and generated UV layout. View UV charts to inspect density, allocation and validation.</p><p>Drag to orbit · Scroll to zoom.</p>'
        }),
        new ColumnPanel({
          id: 'baking-controls',
          title: 'Controls',
          panels: [
            this.settings.makePanel(),
            makeHtmlCustomPanel({
              id: 'baking-actions',
              title: 'Bake',
              html: '<p data-bake-samples></p><button data-reset>Reset bake</button> <button data-light>Change warm light</button> <button data-export>Export bake</button> <button data-atlas>View irradiance</button> <button data-charts>View UV charts</button><canvas data-atlas-view width="256" height="128" style="display:none;width:100%;height:auto"></canvas><p><label>Load bake <input data-import type="file" accept=".lmb"></label></p><p data-status role="status"></p>',
              onRender: root => {
                const reset = () => {
                  this.statusMessage = '';
                  preview.reset();
                  this.setMode('baking');
                };
                const change = () => preview.changeLight();
                const status = (message: string) => {
                  this.statusMessage = message;
                  const label = root.querySelector('[data-status]');
                  if (label) label.textContent = message;
                };
                status(this.statusMessage);
                const download = async () => {
                  try {
                    const data = await preview.exportData();
                    if (this.disposed || this.preview !== preview) return;
                    const url = URL.createObjectURL(
                      new Blob([encodeSceneBake(data, this.scene)], {
                        type: 'application/octet-stream'
                      })
                    );
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${this.scene}.lmb`;
                    link.click();
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                    status('Bake exported.');
                  } catch (error) {
                    if (this.disposed || this.preview !== preview) return;
                    status(String(error));
                  }
                };
                const showAtlas = async () => {
                  try {
                    const data = await preview.exportData();
                    if (this.disposed || this.preview !== preview) return;
                    const canvas = root.querySelector<HTMLCanvasElement>('[data-atlas-view]');
                    const context = canvas?.getContext('2d');
                    if (!canvas || !context) return;
                    canvas.width = data.width;
                    canvas.height = data.height;
                    const image = context.createImageData(data.width, data.height);
                    for (let pixel = 0; pixel < data.width * data.height; pixel++) {
                      for (let channel = 0; channel < 3; channel++) {
                        const value = Math.max(0, data.data[pixel * 4 + channel]);
                        image.data[pixel * 4 + channel] = Math.round(
                          255 * (value / (1 + value)) ** (1 / 2.2)
                        );
                      }
                      image.data[pixel * 4 + 3] = 255;
                    }
                    context.putImageData(image, 0, 0);
                    canvas.style.display = 'block';
                    status('Atlas preview — tone mapped for display.');
                  } catch (error) {
                    if (this.disposed || this.preview !== preview) return;
                    status(String(error));
                  }
                };
                const showCharts = () => {
                  const atlas = preview.atlas;
                  const canvas = root.querySelector<HTMLCanvasElement>('[data-atlas-view]');
                  const context = canvas?.getContext('2d');
                  if (!atlas || !canvas || !context) return;
                  canvas.width = atlas.width;
                  canvas.height = atlas.height;
                  const image = context.createImageData(atlas.width, atlas.height);
                  image.data.set(getLightmapAtlasDebugData(atlas));
                  context.putImageData(image, 0, 0);
                  canvas.style.display = 'block';
                  const errors = validateLightmapAtlas(atlas);
                  status(
                    `${atlas.charts.length} charts · ${atlas.texelsPerUnit} texels/unit · ${Math.round(atlas.occupancy * 100)}% allocated · ${errors.length ? errors.join('; ') : 'UV validation passed'}`
                  );
                };
                const upload = async () => {
                  const input = root.querySelector<HTMLInputElement>('[data-import]');
                  const file = input?.files?.[0];
                  if (!file) return;
                  try {
                    const buffer = await file.arrayBuffer();
                    if (this.disposed || this.preview !== preview) return;
                    const data = decodeSceneBake(buffer, this.scene);
                    if (
                      data.width !== preview.baker.width ||
                      data.height !== preview.baker.height ||
                      data.uvSet !== 1
                    )
                      throw new Error('This scene requires its 2048 × 1024 UV1 atlas.');
                    preview.loadData(data);
                    status('Loaded — displaying baked lighting.');
                    this.setMode('baked');
                  } catch (error) {
                    if (this.disposed || this.preview !== preview) return;
                    status(String(error));
                  }
                };
                const bindings: [string, string, EventListener][] = [
                  ['[data-reset]', 'click', reset],
                  ['[data-light]', 'click', change],
                  ['[data-export]', 'click', download],
                  ['[data-atlas]', 'click', showAtlas],
                  ['[data-charts]', 'click', showCharts],
                  ['[data-import]', 'change', upload]
                ];
                for (const [selector, event, handler] of bindings)
                  root.querySelector(selector)?.addEventListener(event, handler);
                return () => {
                  for (const [selector, event, handler] of bindings)
                    root.querySelector(selector)?.removeEventListener(event, handler);
                };
              }
            })
          ]
        })
      ]
    });
  }
  onRender({canvasContext, time}: AnimationProps) {
    if (!this.preview) return;
    if (!(canvasContext.canvas instanceof HTMLCanvasElement)) return;
    this.controls ??= new OrbitControls(canvasContext.canvas, {
      target: [0, 1, 0],
      distance: 10,
      yaw: 0.55,
      pitch: 0.35,
      minDistance: 4,
      maxDistance: 18,
      enableRotate: true,
      enablePan: false
    });
    this.controls.update(time);
    this.preview.render(
      canvasContext.getCurrentFramebuffer(),
      this.mode,
      time,
      this.controls.getEyePosition()
    );
  }
  onFinalize() {
    this.disposed = true;
    this.controls?.destroy();
    this.panels.finalize();
    this.settings.finalize();
    this.preview?.destroy();
  }
}
