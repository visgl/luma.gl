// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** WebGPU style compiler message */
export type CompilerMessage = {
  type: 'error' | 'warning' | 'info';
  message: string;
  lineNum: number;
  linePos: number;
};
