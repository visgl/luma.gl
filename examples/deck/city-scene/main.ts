// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {createCityScene, type CityScene} from './app';

declare global {
  interface Window {
    cityScene: CityScene;
  }
}

const parent = document.querySelector<HTMLDivElement>('#city');
const status = document.querySelector<HTMLOutputElement>('#status');
const selection = document.querySelector<HTMLOutputElement>('#selection');
const backend = document.querySelector<HTMLSelectElement>('#backend');
const camera = document.querySelector<HTMLSelectElement>('#camera');
const buildings = document.querySelector<HTMLInputElement>('#buildings');
if (!parent || !status || !selection || !backend || !camera || !buildings) {
  throw new Error('Missing city scene controls');
}
const cityParent = parent;
const cityStatus = status;
const cameraControl = camera;
const buildingsControl = buildings;
const backendControl = backend;
let scene: CityScene;

async function startScene() {
  scene?.finalize();
  document.body.dataset['ready'] = 'false';
  cityStatus.value = 'Preparing the district…';
  const deviceType = backendControl.value === 'webgl' ? 'webgl' : 'webgpu';
  scene = createCityScene(cityParent, {deviceType});
  const startingScene = scene;
  window.cityScene = scene;
  try {
    await startingScene.ready;
    if (scene !== startingScene) return;
    cameraControl.value = 'district';
    buildingsControl.checked = true;
    cityStatus.value = `${scene.features.filter(feature => feature.kind === 'building').length} buildings · local fixture`;
    document.body.dataset['ready'] = 'true';
  } catch (error) {
    if (scene !== startingScene) return;
    cityStatus.value = error instanceof Error ? error.message : String(error);
    document.body.dataset['ready'] = 'error';
  }
}
backend.addEventListener('change', () => {
  void startScene();
});
camera.addEventListener('change', () => {
  const value = cameraControl.value;
  scene.setCamera(value === 'overhead' || value === 'waterfront' ? value : 'district');
});
buildings.addEventListener('change', () => scene.setBuildingsVisible(buildingsControl.checked));
parent.addEventListener('city-selection', () => {
  selection.value = scene.diagnostics.selected || 'Click a building or the river';
});
parent.addEventListener('city-error', () => {
  cityStatus.value = scene.diagnostics.error;
  document.body.dataset['ready'] = 'error';
});
window.addEventListener('pagehide', () => scene.finalize());
const requestedBackend = new URLSearchParams(location.search).get('backend');
if (requestedBackend === 'webgl' || requestedBackend === 'webgpu') backend.value = requestedBackend;
void startScene();
