// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {ShaderAssembler} from '@luma.gl/shadertools';
import {beforeEach, describe, expect, it, vi} from 'vitest';

const testState = vi.hoisted(() => {
  // Node workers reuse modules; reload ArrowDeck after installing this file's Deck mock.
  vi.resetModules();
  return {
    device: {info: {shadingLanguage: 'wgsl'}},
    finalizeCallCount: 0
  };
});

vi.mock('@deck.gl/core', () => ({
  Deck: class {
    device = testState.device;

    constructor(properties: {
      onDeviceInitialized?: (device: typeof testState.device) => void;
      onLoad: () => void;
    }) {
      properties.onDeviceInitialized?.(this.device);
      properties.onLoad();
    }

    finalize(): void {
      testState.finalizeCallCount++;
    }
  }
}));

import {ArrowDeck} from '../../examples/deck/arrow-deck';

describe('ArrowDeck device initialization', () => {
  beforeEach(() => {
    testState.finalizeCallCount = 0;
  });

  it('forwards device initialization without replacing the default shader assembler', () => {
    const getDefaultShaderAssembler = ShaderAssembler.getDefaultShaderAssembler;
    let userCallbackDevice: typeof testState.device | null = null;
    let finalizeCallCount = 0;

    const deck = new ArrowDeck({
      onDeviceInitialized: device => {
        userCallbackDevice = device;
      },
      onFinalize: () => finalizeCallCount++
    });

    expect(userCallbackDevice).toBe(testState.device);
    expect(ShaderAssembler.getDefaultShaderAssembler).toBe(getDefaultShaderAssembler);

    deck.finalize();
    expect(finalizeCallCount).toBe(1);
    expect(testState.finalizeCallCount).toBe(1);
  });

  it('does not unhook or re-hook the static getter across overlapping Deck lifecycles', () => {
    const getDefaultShaderAssembler = ShaderAssembler.getDefaultShaderAssembler;
    let initializationCallCount = 0;

    const makeDeck = () =>
      new ArrowDeck({
        onDeviceInitialized: () => {
          initializationCallCount++;
          expect(ShaderAssembler.getDefaultShaderAssembler).toBe(getDefaultShaderAssembler);
        }
      });

    const firstDeck = makeDeck();
    expect(ShaderAssembler.getDefaultShaderAssembler).toBe(getDefaultShaderAssembler);

    const secondDeck = makeDeck();
    expect(ShaderAssembler.getDefaultShaderAssembler).toBe(getDefaultShaderAssembler);

    firstDeck.finalize();
    expect(ShaderAssembler.getDefaultShaderAssembler).toBe(getDefaultShaderAssembler);

    secondDeck.finalize();
    expect(ShaderAssembler.getDefaultShaderAssembler).toBe(getDefaultShaderAssembler);
    expect(initializationCallCount).toBe(2);
    expect(testState.finalizeCallCount).toBe(2);
  });
});
