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
  resetCamera: () => void,
  resetBake: () => void
) {
  return makeExampleTabbedPanel({
    id: 'pbr-shadows-panels',
    title: 'PBR Shadows',
    panels: [
      makeHtmlCustomPanel({
        id: 'pbr-shadows-info',
        title: 'Info',
        html: `<p>Standalone PBR meshes cast and receive shadows on a ground plane. Native models share materials with depth-only casters; no scene renderer is involved.</p><p>Switch between a spotlight, directional cascades, and a point light with six shadow faces. Compare shadow maps, contact shadows, or both as the sphere bounces: short contact shadows fade with separation, while map shadows remain visible. Contact shadows apply only to the directional light; spot and point lights use maps, and contact-only mode leaves them unshadowed. Short screen-space contact rays cannot see hidden or offscreen occluders. Ambient occlusion reduces indirect light in creases: SSAO means Screen-Space Ambient Occlusion; GTAO means Ground-Truth Ambient Occlusion. Shadow receiving affects direct light while ambient light remains visible.</p><p>${backend === 'webgpu' ? 'Choose no AO, cheap SSAO, or higher-quality GTAO. These visibility passes do not accumulate temporal history.' : 'AO evaluation requires WebGPU; this backend runs without AO.'}</p><p>Backend: <strong>${backend === 'webgpu' ? 'WebGPU' : 'WebGL2'}</strong>.</p><p>Cluster occupancy (WebGPU) displays eight depth slices for 32 moving sample lights. Red/yellow indicates candidate count; blue marks overflow above eight retained lights. The preview reads GPU lists directly and does not change PBR lighting.</p><p>Lightmap demo uses fixed atlas UVs: Live follows a moving light, Baking averages samples, and Baked freezes an independent result. Use Reset bake to clear history. <span data-bake-samples>Samples: 0</span></p><p>Drag to orbit · Scroll or pinch to zoom · Shift-drag to pan.</p>`
      }),
      new ColumnPanel({
        id: 'pbr-shadows-controls',
        title: 'Controls',
        panels: [
          settings.makePanel(),
          makeHtmlCustomPanel({
            id: 'pbr-lightmap-status',
            title: 'Lightmap bake',
            html: '<p data-bake-samples>Samples: 0</p><button type="button" data-reset-bake>Reset bake</button>',
            onRender: root => {
              const button = root.querySelector<HTMLButtonElement>('[data-reset-bake]');
              button?.addEventListener('click', resetBake);
              return () => button?.removeEventListener('click', resetBake);
            }
          }),
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

export function makeShadowSettingsSchema(supportsAmbientOcclusion = false): SettingsSchema {
  return {
    title: 'Lighting',
    sections: [
      {
        id: 'lighting',
        name: 'Lighting',
        initiallyCollapsed: false,
        settings: [
          {
            name: 'bakeMode',
            label: 'Lightmap demo',
            type: 'select',
            persist: 'none',
            options: [
              {label: 'Off', value: 'off'},
              {label: 'Live', value: 'live'},
              {label: 'Baking', value: 'baking'},
              {label: 'Baked', value: 'baked'}
            ]
          },
          {
            name: 'showClusters',
            label: 'Cluster occupancy (WebGPU)',
            type: 'boolean',
            persist: 'none'
          },
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
          {
            name: 'ambientOcclusionMode',
            label: 'Ambient occlusion',
            type: 'select',
            persist: 'none',
            options: [
              {label: 'None', value: 'none'},
              ...(supportsAmbientOcclusion
                ? [
                    {label: 'Cheap — SSAO', value: 'ssao'},
                    {label: 'Good — GTAO', value: 'gtao'}
                  ]
                : [])
            ]
          },
          {
            name: 'shadowMode',
            label: 'Shadow technique',
            type: 'select',
            persist: 'none',
            options: [
              {label: 'Shadow maps', value: 'maps'},
              {label: 'Contact shadows (directional)', value: 'contacts'},
              {label: 'Maps + contact shadows', value: 'both'}
            ]
          },
          {
            name: 'contactDistance',
            label: 'Contact distance',
            type: 'number',
            persist: 'none',
            min: 0.1,
            max: 3,
            step: 0.1
          },
          {
            name: 'contactThickness',
            label: 'Contact thickness',
            type: 'number',
            persist: 'none',
            min: 0.01,
            max: 0.3,
            step: 0.01
          },
          {name: 'receiveShadows', label: 'Receive shadows', type: 'boolean', persist: 'none'},
          {name: 'animate', label: 'Animate / bounce', type: 'boolean', persist: 'none'},
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
