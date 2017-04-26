/* eslint-disable no-continue, max-statements */
import GL from '../api';
import shaderName from 'glsl-shader-name';

/**
 * Formats a GLSL shader compiler error and generates a string
 * showing the source code around the error.
 *
 * From https://github.com/wwwtyro/gl-format-compiler-error (public domain)
 *
 * @param {String} errLog - error log from gl.getShaderInfoLog
 * @param {String} src - original shader source code
 * @param {Number} shaderType - shader type (GL constant)
 * @return {String} - Formatted strings has the error marked inline with src.
 */
export default function formatGLSLCompilerError(errLog, src, shaderType) {
  const errorStrings = errLog.split(/\r?\n/);
  const errors = {};

  // Parse the error - note: browser and driver dependent
  for (let i = 0; i < errorStrings.length; i++) {
    const errorString = errorStrings[i];
    if (errorString.length <= 1) {
      continue;
    }
    const lineNo = parseInt(errorString.split(':')[2], 10);
    if (isNaN(lineNo)) {
      return `Could not parse GLSL compiler error: ${errLog}`;
    }
    errors[lineNo] = errorString;
  }

  // Format the error inline with the code
  let message = '';
  const lines = addLineNumbers(src).split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!errors[i + 3] && !errors[i + 2] && !errors[i + 1]) {
      continue;
    }
    message += `${line}\n`;
    if (errors[i + 1]) {
      let e = errors[i + 1];
      e = e.substr(e.split(':', 3).join(':').length + 1).trim();
      message += `^^^ ${e}\n\n`;
    }
  }

  const name = shaderName(src) || 'unknown name (see npm glsl-shader-name)';
  const type = getShaderTypeName(shaderType);
  return `GLSL error in ${type} shader ${name}\n${message}`;
}

/**
 * Prepends line numbers to each line of a string.
 * The line numbers will be left-padded with spaces to ensure an
 * aligned layout when rendered using monospace fonts.
 *
 * Adapted from https://github.com/Jam3/add-line-numbers, MIT license
 *
 * @param {String} string - multi-line string to add line numbers to
 * @param {Number} start=1 - number of spaces to add
 * @param {String} delim =': ' - injected between line number and original line
 * @return {String} string - The original string with line numbers added
 */
function addLineNumbers(string, start = 1, delim = ': ') {
  const lines = string.split(/\r?\n/);
  const maxDigits = String(lines.length + start - 1).length;
  return lines.map((line, i) => {
    const lineNumber = i + start;
    const digits = String(lineNumber).length;
    const prefix = padLeft(lineNumber, maxDigits - digits);
    return prefix + delim + line;
  }).join('\n');
}

/**
 * Pads a string with a number of spaces (space characters) to the left
 * @param {String} string - string to pad
 * @param {Number} digits - number of spaces to add
 * @return {String} string - The padded string
 */
function padLeft(string, digits) {
  let result = '';
  for (let i = 0; i < digits; ++i) {
    result += ' ';
  }
  return `${result}${string}`;
}

function getShaderTypeName(type) {
  switch (type) {
  case GL.FRAGMENT_SHADER: return 'fragment';
  case GL.VERTEX_SHADER: return 'vertex';
  default: return 'unknown type';
  }
}
