// luma.gl, MIT license

/** WebGPU style compiler message */
export type CompilerMessage = {
  type: 'error' | 'warning' | 'info';
  message: string;
  lineNum: number;
  linePos: number;
}
