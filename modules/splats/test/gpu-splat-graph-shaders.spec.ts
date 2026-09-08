// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {GPU_SPLAT_PROJECTION_SHADER, GPU_SPLAT_RENDER_SHADER} from '../src/gpu-splat-graph-shaders';

it('GPU Gaussian projection and globally sorted rendering compile on WebGPU', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  for (const [name, source] of [
    ['gaussian-splat-graph-projection', GPU_SPLAT_PROJECTION_SHADER],
    ['gaussian-splat-graph-render', GPU_SPLAT_RENDER_SHADER]
  ] as const) {
    const shader = device.createShader({id: name, source});
    try {
      const errors = (await shader.getCompilationInfo())
        .filter(message => message.type === 'error')
        .map(message => `${message.lineNum}:${message.linePos} ${message.message}`)
        .join('\n');
      expect(errors, `${name} compiles${errors ? `\n${errors}` : ''}`).toBe('');
    } finally {
      shader.destroy();
    }
  }

  void 0;
});
