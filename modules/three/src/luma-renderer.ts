// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {Renderer, StandardNodeLibrary, UnsignedByteType} from 'three/webgpu';
import {LumaBackend} from './luma-backend';

export type LumaRendererProps = {device: Device};

/** Experimental Three.js renderer borrowing a luma WebGPU or WebGL2 device and canvas. */
export class LumaRenderer extends Renderer {
  constructor({device}: LumaRendererProps) {
    if (!['webgpu', 'webgl'].includes(device.type) || !device.canvasContext) {
      throw new Error('LumaRenderer requires a WebGPU or WebGL2 device with a canvas context');
    }
    super(new LumaBackend(device), {antialias: false, outputBufferType: UnsignedByteType});
    this.library = new StandardNodeLibrary();
  }
}
