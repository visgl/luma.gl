// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {luma} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {makeAnimationLoop} from '@luma.gl/engine';
import MarionetteTheater from './ragdoll-app';

/** Own the standalone WebGPU canvas and the theater app lifecycle. */
const animationLoop = makeAnimationLoop(MarionetteTheater, {
  device: luma.createDevice({adapters: [webgpuAdapter], createCanvasContext: true})
});
void animationLoop.start().catch(error => {
  document.querySelector<HTMLElement>('#startup-error')!.textContent = String(error);
});
window.addEventListener('pagehide', () => animationLoop.destroy(), {once: true});
