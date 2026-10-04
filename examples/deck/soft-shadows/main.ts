// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {createRiverfrontSoftShadowScene} from './app';
import {FIRST_HOUR, LAST_HOUR, getRiverfrontSun, formatSunHour} from './sun';

declare global {
  interface Window {
    riverfrontSoftShadowScene: ReturnType<typeof createRiverfrontSoftShadowScene>;
  }
}

const parent = document.querySelector<HTMLDivElement>('#scene')!;
const status = document.querySelector<HTMLOutputElement>('#status')!;
const hourInput = document.querySelector<HTMLInputElement>('#hour')!;
const timeOutput = document.querySelector<HTMLOutputElement>('#time')!;
const sunMarker = document.querySelector<SVGCircleElement>('#sun')!;
const sunPath = document.querySelector<SVGPathElement>('#sunPath')!;
const scene = createRiverfrontSoftShadowScene(parent);
window.riverfrontSoftShadowScene = scene;

function getSunPoint(hour: number): [number, number] {
  const sun = getRiverfrontSun(hour);
  return [40 + (1 - sun.direction[0]) * 260, 118 - sun.direction[2] * 95];
}
sunPath.setAttribute(
  'd',
  Array.from({length: 97}, (_, index) => {
    const [east, up] = getSunPoint(FIRST_HOUR + (index / 96) * (LAST_HOUR - FIRST_HOUR));
    return `${index ? 'L' : 'M'} ${east} ${up}`;
  }).join(' ')
);
parent.addEventListener('sun-frame', () => {
  const hour = scene.settings.hour;
  const [east, up] = getSunPoint(hour);
  sunMarker.setAttribute('cx', String(east));
  sunMarker.setAttribute('cy', String(up));
  timeOutput.value = formatSunHour(hour);
  if (document.activeElement !== hourInput) hourInput.value = String(hour);
  status.value = `Sun altitude ${((scene.sun.altitude * 180) / Math.PI).toFixed(0)}° · New York, June 21`;
});
hourInput.addEventListener('input', () => {
  scene.setAnimated(false);
  document.querySelector<HTMLInputElement>('#animated')!.checked = false;
  scene.setHour(Number(hourInput.value));
});
for (const [id, setter] of [
  ['animated', scene.setAnimated],
  ['shadows', scene.setShadows]
] as const) {
  const input = document.querySelector<HTMLInputElement>(`#${id}`)!;
  input.addEventListener('change', () => setter(input.checked));
}
for (const [id, setter] of [
  ['softness', scene.setSoftness],
  ['speed', scene.setSpeed]
] as const) {
  const input = document.querySelector<HTMLInputElement>(`#${id}`)!;
  input.addEventListener('input', () => setter(Number(input.value)));
}
const qualityInput = document.querySelector<HTMLSelectElement>('#quality')!;
qualityInput.addEventListener('change', () => {
  const value = qualityInput.value;
  if (value === 'low' || value === 'balanced' || value === 'cinematic') scene.setQuality(value);
});
scene.ready
  .then(() => {
    document.body.dataset['ready'] = 'true';
  })
  .catch(error => {
    status.value = error instanceof Error ? error.message : String(error);
    document.body.dataset['ready'] = 'error';
  });
window.addEventListener('pagehide', () => scene.finalize());
