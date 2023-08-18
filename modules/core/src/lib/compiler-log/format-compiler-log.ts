// luma.gl, MIT license
import type {CompilerMessage} from './compiler-message';

/** @returns annotated errors or warnings */
export function formatCompilerLog(
  shaderLog: readonly CompilerMessage[],
  source: string,
  options?: {
    showSourceCode?: boolean;
  }
): string {
  // Parse the error - note: browser and driver dependent
  const lines = source.split(/\r?\n/);
  let formattedLog = '';
  for (const message of shaderLog) {
    formattedLog += formatCompilerMessage(message, lines, message.lineNum, options);
  }
  return formattedLog;
}

// Helpers

/** Format one message */
function formatCompilerMessage(
  message: CompilerMessage,
  lines: readonly string[],
  lineNum: number,
  options?: {
    showSourceCode?: boolean;
  }
): string {
  if (options?.showSourceCode) {
    // If we got error position on line add a `^^^` indicator on next line
    const positionIndicator = message.linePos > 0 ? `${' '.repeat(message.linePos + 5)}^^^\n` : '';
    const numberedLines = getNumberedLines(lines, lineNum);
    return `\
${numberedLines}${positionIndicator}${message.type.toUpperCase()}: ${message.message}

`;
  }
  return `${message.type.toUpperCase()}: ${message.message}\n`;
}

function getNumberedLines(lines: readonly string[], lineNum: number): string {
  let numberedLines = '';
  for (let line = lineNum - 2; line <= lineNum; line++) {
    const sourceLine = lines[line]
    if (sourceLine !== undefined) {
      numberedLines += `${padLeft(String(line), 4)}: ${sourceLine}\n`;
    }
  }
  return numberedLines;
}

/**
 * Pads a string with a number of spaces (space characters) to the left
 * @param {String} string - string to pad
 * @param {Number} digits - number of spaces to add
 * @return {String} string - The padded string
 */
function padLeft(string: string, paddedLength: number): string {
  let result = '';
  for (let i = string.length; i < paddedLength; ++i) {
    result += ' ';
  }
  return result + string;
}
