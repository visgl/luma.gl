// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {createGlowScene} from './app';

declare global {
  interface Window {
    glowScene: ReturnType<typeof createGlowScene>;
  }
}
const parent = document.querySelector<HTMLDivElement>('#scene')!;
const backend = document.querySelector<HTMLSelectElement>('#backend')!;
backend.value =
  new URLSearchParams(location.search).get('backend') === 'webgl' ? 'webgl' : 'webgpu';
const scene = createGlowScene(parent, {deviceType: backend.value === 'webgl' ? 'webgl' : 'webgpu'});
window.glowScene = scene;
backend.addEventListener('change', () => {
  location.search = `?backend=${backend.value}`;
});
const enabled = document.querySelector<HTMLInputElement>('#enabled')!;
enabled.addEventListener('change', () => scene.setEnabled(enabled.checked));
const radius = document.querySelector<HTMLInputElement>('#radius')!;
radius.addEventListener('input', () => scene.setRadius(Number(radius.value)));
for (const property of ['coreRadius', 'coreIntensity', 'haloIntensity', 'falloff'] as const) {
  const input = document.querySelector<HTMLInputElement>(`#${property}`)!;
  input.addEventListener('input', () => scene.setStyle({[property]: Number(input.value)}));
}
parent.addEventListener('glow-selection', () => {
  document.querySelector('#selection')!.textContent =
    scene.diagnostics.selected || 'Click a light to inspect';
});
scene.ready
  .then(() => {
    document.body.dataset['ready'] = 'true';
  })
  .catch(error => {
    document.querySelector('#status')!.textContent = error.message;
  });
window.addEventListener('pagehide', () => scene.finalize());
