// luma.gl, MIT license
// Copyright (c) 2020 OpenJS Foundation
// Copyright (c) vis.gl contributors

/** WebGPU style compiler message */
export type CompilerMessage = {
  type: 'error' | 'warning' | 'info';
  message: string;
  lineNum: number;
  linePos: number;
}
