// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {createWeatherScene, type WeatherPreset} from './app';
import {resolveDeckExampleDeviceType} from '../deck-example-device';
declare global {
  interface Window {
    weatherScene: ReturnType<typeof createWeatherScene>;
  }
}
const backend = document.querySelector<HTMLSelectElement>('#backend')!;
const deviceType = await resolveDeckExampleDeviceType(
  new URLSearchParams(location.search).get('backend')
);
backend.value = deviceType;
const scene = createWeatherScene(document.querySelector<HTMLDivElement>('#scene')!, {
  deviceType
});
window.weatherScene = scene;
backend.addEventListener('change', () => {
  location.search = `?backend=${backend.value}`;
});
const preset = document.querySelector<HTMLSelectElement>('#preset')!;
preset.addEventListener('change', () => {
  const value: WeatherPreset =
    preset.value === 'snow' ? 'snow' : preset.value === 'rain' ? 'rain' : 'clear';
  scene.setPreset(value);
});
const fogEnabled = document.querySelector<HTMLInputElement>('#fog-enabled')!;
fogEnabled.addEventListener('change', () => {
  scene.setFogEnabled(fogEnabled.checked);
  for (const identifier of ['visibility', 'fog-variation', 'fog-speed']) {
    document.querySelector<HTMLInputElement>(`#${identifier}`)!.disabled = !fogEnabled.checked;
  }
});
const playing = document.querySelector<HTMLInputElement>('#playing')!;
playing.addEventListener('change', () => scene.setPlaying(playing.checked));
for (const [identifier, setter] of [
  ['intensity', scene.setIntensity],
  ['wind-speed', scene.setWindSpeed],
  ['wind-direction', scene.setWindDirection],
  ['visibility', scene.setVisibility],
  ['fog-variation', scene.setFogVariation],
  ['fog-speed', scene.setFogSpeed]
] as const) {
  const input = document.querySelector<HTMLInputElement>(`#${identifier}`)!;
  input.addEventListener('input', () => setter(Number(input.value)));
}
document.querySelector('#reset')!.addEventListener('click', () => scene.reset());
scene.ready
  .then(() => {
    document.body.dataset['ready'] = 'true';
  })
  .catch(error => {
    document.querySelector('#status')!.textContent = error.message;
  });
window.addEventListener('pagehide', () => scene.finalize());
