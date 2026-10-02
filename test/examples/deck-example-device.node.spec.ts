// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {ShaderAssembler} from '@luma.gl/shadertools';
import {describe, expect, it, vi} from 'vitest';

const testState = vi.hoisted(() => {
  // Node workers reuse modules; reload ArrowDeck after installing this file's Deck mock.
  vi.resetModules();
  return {
    device: {info: {shadingLanguage: 'wgsl'}},
    consumeLegacyCall: true,
    assemblerDuringInitialization: null as ShaderAssembler | null,
    finalizeCallCount: 0
  };
});

vi.mock('@deck.gl/core', () => ({
  Deck: class {
    device = testState.device;

    constructor(properties: {
      onDeviceInitialized: (device: typeof testState.device) => void;
      onLoad: () => void;
    }) {
      properties.onDeviceInitialized(this.device);
      if (testState.consumeLegacyCall) {
        const getDefaultShaderAssembler =
          ShaderAssembler.getDefaultShaderAssembler as () => ShaderAssembler;
        testState.assemblerDuringInitialization = getDefaultShaderAssembler.call(ShaderAssembler);
      }
      properties.onLoad();
    }

    finalize(): void {
      testState.finalizeCallCount++;
    }
  }
}));

import {ArrowDeck} from '../../examples/deck/arrow-deck';

describe('ArrowDeck device initialization', () => {
  it('scopes the legacy shader assembler shim to LayerManager construction', () => {
    const strictGetDefaultShaderAssembler = ShaderAssembler.getDefaultShaderAssembler;
    let userCallbackDevice: typeof testState.device | null = null;

    new ArrowDeck({
      onDeviceInitialized: device => {
        userCallbackDevice = device;
        expect(ShaderAssembler.getDefaultShaderAssembler).toBe(strictGetDefaultShaderAssembler);
      }
    });

    expect(userCallbackDevice).toBe(testState.device);
    expect(testState.assemblerDuringInitialization).toBe(
      strictGetDefaultShaderAssembler.call(ShaderAssembler, 'wgsl')
    );
    expect(ShaderAssembler.getDefaultShaderAssembler).toBe(strictGetDefaultShaderAssembler);
    expect(() =>
      (ShaderAssembler.getDefaultShaderAssembler as unknown as () => ShaderAssembler).call(
        ShaderAssembler
      )
    ).toThrow();

    testState.device = {info: {shadingLanguage: 'glsl'}};
    testState.consumeLegacyCall = false;
    const unconsumedDeck = new ArrowDeck({});
    expect(ShaderAssembler.getDefaultShaderAssembler).not.toBe(strictGetDefaultShaderAssembler);

    unconsumedDeck.finalize();
    expect(ShaderAssembler.getDefaultShaderAssembler).toBe(strictGetDefaultShaderAssembler);
    expect(testState.finalizeCallCount).toBe(1);
  });
});
