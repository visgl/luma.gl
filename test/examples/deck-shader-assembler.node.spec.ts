// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {getShaderAssembler, Layer} from '@deck.gl/core';
import {GLSLShaderAssembler, ShaderAssembler, WGSLShaderAssembler} from '@luma.gl/shadertools';
import {describe, expect, it, vi} from 'vitest';

describe('deck.gl shader assembler ownership', () => {
  it('constructs language-specific assemblers without installing a legacy static hook', () => {
    const originalGetDefaultShaderAssembler = ShaderAssembler.getDefaultShaderAssembler;
    const getDefaultShaderAssembler = vi
      .spyOn(ShaderAssembler, 'getDefaultShaderAssembler')
      .mockImplementation(() => {
        throw new Error('deck.gl must not use the static shader assembler registry');
      });

    try {
      const glslShaderAssembler = getShaderAssembler('glsl');
      const wgslShaderAssembler = getShaderAssembler('wgsl');

      expect(glslShaderAssembler).toBeInstanceOf(GLSLShaderAssembler);
      expect(wgslShaderAssembler).toBeInstanceOf(WGSLShaderAssembler);
      expect(glslShaderAssembler).not.toBe(wgslShaderAssembler);
      expect(getDefaultShaderAssembler).not.toHaveBeenCalled();
    } finally {
      getDefaultShaderAssembler.mockRestore();
    }

    expect(ShaderAssembler.getDefaultShaderAssembler).toBe(originalGetDefaultShaderAssembler);
  });

  it('keeps the context assembler across repeated render and picking shader builds', () => {
    const shaderAssembler = new WGSLShaderAssembler();
    const originalGetDefaultShaderAssembler = ShaderAssembler.getDefaultShaderAssembler;
    const getDefaultShaderAssembler = vi.spyOn(ShaderAssembler, 'getDefaultShaderAssembler');
    const layer = {
      context: {shaderAssembler, defaultShaderModules: []},
      props: {extensions: []}
    };

    try {
      const renderShaders = Layer.prototype.getShaders.call(layer, {source: 'render shader'});
      const pickingShaders = Layer.prototype.getShaders.call(layer, {source: 'picking shader'});
      const nextRenderShaders = Layer.prototype.getShaders.call(layer, {
        source: 'next render shader'
      });

      expect(renderShaders.shaderAssembler).toBe(shaderAssembler);
      expect(pickingShaders.shaderAssembler).toBe(shaderAssembler);
      expect(nextRenderShaders.shaderAssembler).toBe(shaderAssembler);
      expect(getDefaultShaderAssembler).not.toHaveBeenCalled();
      expect(ShaderAssembler.getDefaultShaderAssembler).toBe(getDefaultShaderAssembler);
    } finally {
      getDefaultShaderAssembler.mockRestore();
    }

    expect(ShaderAssembler.getDefaultShaderAssembler).toBe(originalGetDefaultShaderAssembler);
  });
});
