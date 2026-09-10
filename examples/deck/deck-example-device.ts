// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {
  ShaderAssembler,
  type GLSLShaderAssembler,
  type WGSLShaderAssembler
} from '@luma.gl/shadertools';
import {webgl2Adapter} from '@luma.gl/webgl';
import {webgpuAdapter} from '@luma.gl/webgpu';

/** GPU backend exposed by the standalone and website-hosted deck.gl examples. */
export type DeckExampleDeviceType = 'webgl' | 'webgpu';

/** Device selection accepted by standalone and website-hosted deck.gl examples. */
export type DeckExampleDeviceOptions = {
  /** Reuse a caller-owned device, such as the device selected by the website DeviceTabs. */
  device?: Device;
  /** Backend Deck should request when it owns device creation. */
  deviceType?: DeckExampleDeviceType;
};

/** Returns the luma.gl device request used when Deck creates its presentation device. */
export function getDeckExampleDeviceProps(deviceType: DeckExampleDeviceType) {
  return {
    type: deviceType,
    adapters: deviceType === 'webgpu' ? [webgpuAdapter, webgl2Adapter] : [webgl2Adapter]
  };
}

/** Resolves host device selection into Deck construction props. */
export function getDeckExampleProps({device, deviceType = 'webgpu'}: DeckExampleDeviceOptions) {
  return device ? {device} : {deviceProps: getDeckExampleDeviceProps(deviceType)};
}

/** Bridges legacy no-argument Deck assembler calls while preserving strict language separation. */
export function installLegacyDeckShaderAssemblerCompatibility(device: Device): () => void {
  const original = ShaderAssembler.getDefaultShaderAssembler;
  let restored = false;

  function restore(): void {
    if (restored) return;
    if (ShaderAssembler.getDefaultShaderAssembler === getLegacyDeckShaderAssembler) {
      ShaderAssembler.getDefaultShaderAssembler = original;
    }
    restored = true;
  }

  function getLegacyDeckShaderAssembler(shaderLanguage: 'glsl'): GLSLShaderAssembler;
  function getLegacyDeckShaderAssembler(shaderLanguage: 'wgsl'): WGSLShaderAssembler;
  function getLegacyDeckShaderAssembler(
    shaderLanguage: 'glsl' | 'wgsl'
  ): GLSLShaderAssembler | WGSLShaderAssembler;
  function getLegacyDeckShaderAssembler(
    shaderLanguage?: 'glsl' | 'wgsl'
  ): GLSLShaderAssembler | WGSLShaderAssembler {
    if (shaderLanguage === undefined) {
      // TODO: Remove after deck.gl forwards its known shading language to luma.gl.
      // Deck.gl calls this without an explicit language on every render and pick, so the
      // patch must stay installed until the caller explicitly invokes the returned `restore`.
      return device.info.shadingLanguage === 'wgsl'
        ? original.call(ShaderAssembler, 'wgsl')
        : original.call(ShaderAssembler, 'glsl');
    }
    return shaderLanguage === 'wgsl'
      ? original.call(ShaderAssembler, 'wgsl')
      : original.call(ShaderAssembler, 'glsl');
  }

  ShaderAssembler.getDefaultShaderAssembler = getLegacyDeckShaderAssembler;
  return restore;
}
