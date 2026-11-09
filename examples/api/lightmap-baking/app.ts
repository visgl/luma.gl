// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {AnimationLoopTemplate, OrbitControls, type AnimationProps} from '@luma.gl/engine';
import {encodeLightmapData, decodeLightmapData} from '@luma.gl/engine/lighting';
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
  private readonly preview: LightmapPreview;
  private readonly settings: ExampleSettingsPanelManager;
  private readonly panels: ExamplePanelManager;
  private controls: OrbitControls | null = null;
  private mode: 'live' | 'baking' | 'baked' = 'baking';
  private disposed = false;
  constructor(props: AnimationProps) {
    super(props);
    this.preview = new LightmapPreview(props.device);
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
      settings: {mode: 'baking'},
      onSettingsChange: values => {
        if (values.mode === 'live' || values.mode === 'baking' || values.mode === 'baked')
          this.mode = values.mode;
      }
    });
    this.panels = new ExamplePanelManager({panel: this.makePanel()});
    this.panels.mount();
  }
  private setMode(mode: 'live' | 'baking' | 'baked'): void {
    this.mode = mode;
    this.settings.setSettings({mode});
    this.panels.setPanel(this.makePanel());
  }
  private makePanel() {
    return makeExampleTabbedPanel({
      id: 'baking-panels',
      title: 'Lightmap Baking',
      panels: [
        makeHtmlCustomPanel({
          id: 'baking-info',
          title: 'Info',
          html: '<p>Two static rooms share a doorway. Warm and cool lights illuminate colored boxes and neutral walls. Orbit to inspect shadows through the opening.</p><p>Baking averages fixed-light and environment samples. Baked mode uses only stored diffuse lighting. Live uses direct shadowed lights with unoccluded ambient as a reference. There is no multi-bounce color bleeding.</p><p>Change the warm light to mark the bake stale, then reset to rebake. Export preserves linear HDR irradiance and UV-set metadata; loading requires this same scene and UV layout.</p><p>Drag to orbit · Scroll to zoom.</p>'
        }),
        new ColumnPanel({
          id: 'baking-controls',
          title: 'Controls',
          panels: [
            this.settings.makePanel(),
            makeHtmlCustomPanel({
              id: 'baking-actions',
              title: 'Bake',
              html: '<p data-bake-samples></p><button data-reset>Reset bake</button> <button data-light>Change warm light</button> <button data-export>Export bake</button> <button data-atlas>View atlas</button><canvas data-atlas-view width="256" height="128" style="display:none;width:100%;height:auto"></canvas><p><label>Load bake <input data-import type="file" accept=".lml"></label></p><p data-status role="status"></p>',
              onRender: root => {
                const reset = () => {
                  this.preview.reset();
                  this.setMode('baking');
                };
                const change = () => this.preview.changeLight();
                const status = (message: string) => {
                  const label = root.querySelector('[data-status]');
                  if (label) label.textContent = message;
                };
                const download = async () => {
                  try {
                    const data = await this.preview.exportData();
                    if (this.disposed) return;
                    const url = URL.createObjectURL(
                      new Blob([encodeLightmapData(data)], {type: 'application/octet-stream'})
                    );
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'two-rooms.lml';
                    link.click();
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                    status('Bake exported.');
                  } catch (error) {
                    status(String(error));
                  }
                };
                const showAtlas = async () => {
                  try {
                    const data = await this.preview.exportData();
                    if (this.disposed) return;
                    const canvas = root.querySelector<HTMLCanvasElement>('[data-atlas-view]');
                    const context = canvas?.getContext('2d');
                    if (!canvas || !context) return;
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
                    status(String(error));
                  }
                };
                const upload = async () => {
                  const input = root.querySelector<HTMLInputElement>('[data-import]');
                  const file = input?.files?.[0];
                  if (!file) return;
                  try {
                    const data = decodeLightmapData(await file.arrayBuffer());
                    if (this.disposed) return;
                    if (data.width !== 256 || data.height !== 128 || data.uvSet !== 1)
                      throw new Error('This scene requires its 256 × 128 UV1 atlas.');
                    this.preview.loadData(data);
                    this.setMode('baked');
                    status('Loaded — displaying baked lighting.');
                  } catch (error) {
                    status(String(error));
                  }
                };
                const bindings: [string, string, EventListener][] = [
                  ['[data-reset]', 'click', reset],
                  ['[data-light]', 'click', change],
                  ['[data-export]', 'click', download],
                  ['[data-atlas]', 'click', showAtlas],
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
    this.preview.destroy();
  }
}
