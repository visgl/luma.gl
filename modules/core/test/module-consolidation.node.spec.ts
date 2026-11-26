// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, it} from 'vitest';
import * as core from '@luma.gl/core';
import * as webgl from '@luma.gl/core/webgl';
import {WebGPUDevice} from '@luma.gl/core/webgpu';
import {GL} from '@luma.gl/core/webgl-constants';
import {scanWGSLInterface} from '@luma.gl/core/wgsl';
import {scanWGSLInterface as scanShadersWGSLInterface} from '@luma.gl/shaders/wgsl';

describe('consolidated core module', () => {
  it('exports API and shader types at the root and keeps backends separate', () => {
    expect(core.Device).toBeTypeOf('function');
    expect(core.vertexFormatDecoder).toBeDefined();
    expect(core).not.toHaveProperty('WebGLDevice');
    expect(core).not.toHaveProperty('WebGPUDevice');
    expect(core).not.toHaveProperty('webgl2Adapter');
    expect(core).not.toHaveProperty('webgpuAdapter');
    expect(core).not.toHaveProperty('GL');
    expect(webgl).not.toHaveProperty('GL');
    expect(webgl.WebGLDevice.prototype).toBeInstanceOf(core.Device);
    expect(WebGPUDevice.prototype).toBeInstanceOf(core.Device);
  });

  it('exports constants separately and shares WGSL scanning', () => {
    expect(scanWGSLInterface).toBe(scanShadersWGSLInterface);
    expect(GL.TRIANGLES).toBe(4);
    expect(
      scanWGSLInterface('@vertex fn main() -> @builtin(position) vec4f { return vec4f(); }')
    ).not.toBeNull();
  });
});
