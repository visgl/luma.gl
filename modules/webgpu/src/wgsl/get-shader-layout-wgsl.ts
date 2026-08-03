// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderLayout} from '@luma.gl/core';
import {scanWGSLInterface, type ScanWGSLInterfaceOptions} from '@luma.gl/shadertools/wgsl';

export type {ScanWGSLInterfaceOptions};

/**
 * Scans the pipeline interface needed to create a WebGPU shader layout.
 * Returns `null` when the interface is ambiguous or uses unsupported syntax.
 */
export function getShaderLayoutFromWGSL(
  source: string,
  options: ScanWGSLInterfaceOptions = {}
): ShaderLayout | null {
  return scanWGSLInterface(source, options);
}
