// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {ShaderAssembler} from '@luma.gl/shaders';
import {describe, expect, it, vi} from 'vitest';

const testState = vi.hoisted(() => {
  vi.resetModules();
  return {device: {info: {shadingLanguage: 'wgsl'}}, finalizeCallCount: 0};
});

vi.mock('@deck.gl/core', () => ({
  Deck: class {
    device = testState.device;
    constructor(properties: {
      onDeviceInitialized: (device: typeof testState.device) => void;
      onLoad?: () => void;
    }) {
      properties.onDeviceInitialized(this.device);
      properties.onLoad?.();
    }
    finalize(): void {
      testState.finalizeCallCount++;
    }
  }
}));

import {ArrowDeck} from '../../examples/deck/arrow-deck';

describe('ArrowDeck device initialization', () => {
  it('provides an initialization callback when the caller omits it', () => {
    const deck = new ArrowDeck({});
    deck.finalize();
    testState.finalizeCallCount = 0;
  });
  it('forwards initialization and finalizes once without a global assembler shim', async () => {
    const onDeviceInitialized = vi.fn();
    const onLoad = vi.fn();
    const onFinalize = vi.fn();
    const deck = new ArrowDeck({onDeviceInitialized, onLoad, onFinalize});
    await Promise.resolve();
    expect(onDeviceInitialized).toHaveBeenCalledWith(testState.device);
    expect(onLoad).toHaveBeenCalledWith({deck, device: testState.device});
    expect('getDefaultShaderAssembler' in ShaderAssembler).toBe(false);
    deck.finalize();
    deck.finalize();
    expect(onFinalize).toHaveBeenCalledTimes(1);
    expect(testState.finalizeCallCount).toBe(1);
  });
});
