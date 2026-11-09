// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {makeExampleTabbedPanel, makeHtmlCustomPanel} from '../../example-panels';

export function makeEnvironmentPanel({
  backend,
  highDynamicRange,
  onResetCamera
}: {
  backend: string;
  highDynamicRange: boolean;
  onResetCamera: () => void;
}) {
  return makeExampleTabbedPanel({
    id: 'prefiltered-environment-panels',
    title: 'Prefiltered Environment',
    panels: [
      makeHtmlCustomPanel({
        id: 'prefiltered-environment-info',
        title: 'Info',
        html: `<p>Native PBR spheres share a prefiltered environment generated from a synthetic procedural sky. No scene renderer or external assets are required.</p>
          <p>Roughness increases left to right. Metalness increases bottom to top.</p>
          <p>Backend: <strong>${backend === 'webgpu' ? 'WebGPU' : 'WebGL2'}</strong>.</p>
          <p role="status">${highDynamicRange ? 'HDR mode: floating-point environment lighting preserves bright sky values.' : 'SDR mode: HDR filtering is unavailable on this device. The example still runs, with bright environment values clipped to the SDR range.'}</p>`
      }),
      makeHtmlCustomPanel({
        id: 'prefiltered-environment-controls',
        title: 'Controls',
        html: '<p>Drag to orbit. Scroll or pinch to zoom. Shift-drag to pan.</p><button type="button" data-reset-camera>Reset view</button>',
        onRender: rootElement => {
          const resetButton = rootElement.querySelector<HTMLButtonElement>('[data-reset-camera]');
          resetButton?.addEventListener('click', onResetCamera);
          return () => resetButton?.removeEventListener('click', onResetCamera);
        }
      })
    ]
  });
}
