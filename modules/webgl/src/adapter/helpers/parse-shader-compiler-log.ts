// luma.gl, MIT license
import type {CompilerMessage} from '@luma.gl/api';

const MESSAGE_TYPES = ['warning', 'error', 'info'];

/**
 * Parse a WebGL-format GLSL compilation log into an array of WebGPU style message records.
 * This follows documented WebGL conventions for compilation logs.
 * Based on https://github.com/wwwtyro/gl-format-compiler-error (public domain)
 */
export function parseShaderCompilerLog(errLog: string) : readonly CompilerMessage[] {
  // Parse the error - note: browser and driver dependent
  const lines = errLog.split(/\r?\n/);

  const messages: CompilerMessage[] = [];

  for (const line of lines) {
    if (line.length <= 1) {
      continue;
    }

    const segments: string[] = line.split(':');
    const [messageType, linePosition, lineNumber, ...rest] = segments;

    let lineNum = parseInt(lineNumber, 10);
    if (isNaN(lineNum)) {
      lineNum = 0;
    }

    let linePos = parseInt(linePosition, 10);
    if (isNaN(linePos)) {
      linePos = 0;
    }

    // Ensure supported type
    const lowerCaseType = messageType.toLowerCase();
    const type = (MESSAGE_TYPES.includes(lowerCaseType) ? lowerCaseType : 'info') as 'warning' | 'error' | 'info';

    messages.push({
      message: rest.join(':').trim(),
      type,
      lineNum,
      linePos // TODO
    })
  }

  return messages;
}
