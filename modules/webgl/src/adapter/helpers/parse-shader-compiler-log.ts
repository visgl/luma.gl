import {CompilerMessage} from '@luma.gl/api';
// TODO - formatGLSLCompilerError should not depend on this
// import getShaderName from './get-shader-name';
// import getShaderTypeName from './get-shader-type-name';

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

    const type = getMessageType(messageType);

    messages.push({
      message: rest.join('').trim(),
      type,
      lineNum,
      linePos // TODO
    })
  }

  return messages;
}

/** Ensure valid type */
function getMessageType(type: string):  'warning' | 'error' | 'info' {
  switch (type) {
    case 'warning':
    case 'error':
      return type;
    default:
      return 'info';
  }
}
