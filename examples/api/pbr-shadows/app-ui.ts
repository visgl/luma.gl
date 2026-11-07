// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {ColumnPanel, type SettingsSchema} from '@deck.gl-community/panels';
import {
  ExampleSettingsPanelManager,
  makeExampleTabbedPanel,
  makeHtmlCustomPanel
} from '../../example-panels';

export function makeShadowPanel(
  settings: ExampleSettingsPanelManager,
  backend: string,
  resetCamera: () => void
) {
  return makeExampleTabbedPanel({
    id: 'pbr-shadows-panels',
    title: 'PBR Shadows',
    panels: [
      makeHtmlCustomPanel({
        id: 'pbr-shadows-info',
        title: 'Info',
        html: `<p>Standalone PBR meshes cast and receive shadows on a ground plane. Native models share materials with depth-only casters; no scene renderer is involved.</p><p>Switch between a spotlight, directional cascades, and a point light with six shadow faces. Shadow receiving affects direct light while ambient light remains visible.</p><p>Backend: <strong>${backend === 'webgpu' ? 'WebGPU' : 'WebGL2'}</strong>.</p><p>Drag to orbit · Scroll or pinch to zoom · Shift-drag to pan.</p>`
      }),
      new ColumnPanel({
        id: 'pbr-shadows-controls',
        title: 'Controls',
        panels: [
          settings.makePanel(),
          makeHtmlCustomPanel({
            id: 'pbr-shadows-camera',
            title: 'Camera',
            html: '<button type="button" data-reset-camera>Reset view</button>',
            onRender: root => {
              const button = root.querySelector<HTMLButtonElement>('[data-reset-camera]');
              button?.addEventListener('click', resetCamera);
              return () => button?.removeEventListener('click', resetCamera);
            }
          })
        ]
      })
    ]
  });
}

export function makeShadowSettingsSchema(): SettingsSchema {
  return {
    title: 'Lighting',
    sections: [
      {
        id: 'lighting',
        name: 'Lighting',
        initiallyCollapsed: false,
        settings: [
          {
            name: 'lightType',
            label: 'Light',
            type: 'select',
            persist: 'none',
            options: [
              {label: 'Spotlight', value: 'spot'},
              {label: 'Directional cascades', value: 'directional'},
              {label: 'Point light', value: 'point'}
            ]
          },
          {
            name: 'quality',
            label: 'Shadow quality',
            type: 'select',
            persist: 'none',
            options: [
              {label: 'Low', value: 'low'},
              {label: 'Balanced', value: 'balanced'},
              {label: 'Cinematic', value: 'cinematic'}
            ]
          },
          {name: 'receiveShadows', label: 'Receive shadows', type: 'boolean', persist: 'none'},
          {name: 'animate', label: 'Animate meshes', type: 'boolean', persist: 'none'},
          {
            name: 'normalBias',
            label: 'Normal bias',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 0.15,
            step: 0.005
          }
        ]
      }
    ]
  };
}
