// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {luma} from '@luma.gl/core';
import {webgpuAdapter, WebGPUDevice} from '@luma.gl/core/webgpu';
import {OrthographicCamera, WebGPURenderer} from 'three/webgpu';
import {createStreamedLayout} from './streamed-layout';

const canvas = document.querySelector('canvas')!;
const status = document.querySelector('#status')!;
const device = await luma.createDevice({type: 'webgpu', adapters: [webgpuAdapter]});
if (!(device instanceof WebGPUDevice)) throw new Error('WebGPU required');
const renderer = new WebGPURenderer({device: device.handle, canvas});
await renderer.init();
let layout = createStreamedLayout(device, renderer);
const camera = new OrthographicCamera(-5, 5, 5, -1, 0.1, 10);
camera.position.z = 2;
let batchCount = 0;
let rowCount = 0;
const retainedBatches: ReturnType<typeof layout.append>[] = [];
const maximumBatches = 12;
function append() {
  const rows = new Float32Array(512 * 2);
  for (let row = 0; row < 512; row++) {
    rows[row * 2] = ((row * 73 + batchCount * 137) % 512) / 51.2 - 5;
    rows[row * 2 + 1] = ((row * 193 + batchCount * 67) % 997) / 9.97;
  }
  retainedBatches.push(layout.append(rows));
  if (retainedBatches.length > maximumBatches) retainedBatches.shift()!.remove();
  batchCount++;
  rowCount += 512;
  status.textContent = ` ${rowCount} received rows · ${retainedBatches.length} retained batches`;
}
document.querySelector('#append')!.addEventListener('click', append);
document.querySelector('#reset')!.addEventListener('click', () => {
  layout.dispose();
  layout = createStreamedLayout(device, renderer);
  batchCount = 0;
  rowCount = 0;
  retainedBatches.length = 0;
  append();
});
const observer = new ResizeObserver(() =>
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false)
);
observer.observe(canvas);
append();
const streamTimer = window.setInterval(append, 1000);
renderer.setAnimationLoop(() => renderer.render(layout.scene, camera));
window.addEventListener(
  'pagehide',
  () => {
    window.clearInterval(streamTimer);
    renderer.setAnimationLoop(null);
    observer.disconnect();
    layout.dispose();
    renderer.dispose();
    device.destroy();
  },
  {once: true}
);
