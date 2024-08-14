// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CompilerMessage} from '../adapter/types/compiler-message';

/** @returns annotated errors or warnings */
export function formatCompilerLog(
  shaderLog: readonly CompilerMessage[],
  source: string,
  options?: {
    /** Include source code in the log. Either just the lines before issues or all source code */
    showSourceCode?: 'no' | 'issues' | 'all';
    html?: boolean;
  }
): string {
  let formattedLog = '';
  const lines = source.split(/\r?\n/);
  const log = shaderLog.slice().sort((a, b) => a.lineNum - b.lineNum);

  switch (options?.showSourceCode || 'no') {
    case 'all':
      // Parse the error - note: browser and driver dependent
      let currentMessage = 0;
      for (let lineNum = 1; lineNum <= lines.length; lineNum++) {
        formattedLog += getNumberedLine(lines[lineNum - 1], lineNum, options);
        while (log.length > currentMessage && log[currentMessage].lineNum === lineNum) {
          const message = log[currentMessage++];
          formattedLog += formatCompilerMessage(message, lines, message.lineNum, {
            ...options,
            inlineSource: false
          });
        }
      }
      return formattedLog;

    case 'issues':
    case 'no':
      // Parse the error - note: browser and driver dependent
      for (const message of shaderLog) {
        formattedLog += formatCompilerMessage(message, lines, message.lineNum, {
          inlineSource: options?.showSourceCode !== 'no'
        });
      }
      return formattedLog;
  }
}

// Helpers

/** Format one message */
function formatCompilerMessage(
  message: CompilerMessage,
  lines: readonly string[],
  lineNum: number,
  options: {
    inlineSource?: boolean;
    html?: boolean;
  }
): string {
  if (options?.inlineSource) {
    const numberedLines = getNumberedLines(lines, lineNum);
    // If we got error position on line add a `^^^` indicator on next line
    const positionIndicator = message.linePos > 0 ? `${' '.repeat(message.linePos + 5)}^^^\n` : '';
    return `
${numberedLines}${positionIndicator}${message.type.toUpperCase()}: ${message.message}

`;
  }
  const color = message.type === 'error' ? 'red' : '#8B4000'; // dark orange
  return options?.html
    ? `<div class='luma-compiler-log-error' style="color:${color};"><b> ${message.type.toUpperCase()}: ${
        message.message
      }</b></div>`
    : `${message.type.toUpperCase()}: ${message.message}`;
}

function getNumberedLines(
  lines: readonly string[],
  lineNum: number,
  options?: {html?: boolean}
): string {
  let numberedLines = '';
  for (let lineIndex = lineNum - 2; lineIndex <= lineNum; lineIndex++) {
    const sourceLine = lines[lineIndex - 1];
    if (sourceLine !== undefined) {
      numberedLines += getNumberedLine(sourceLine, lineNum, options);
    }
  }
  return numberedLines;
}

function getNumberedLine(line: string, lineNum: number, options?: {html?: boolean}): string {
  const escapedLine = options?.html ? escapeHTML(line) : line;
  return `${padLeft(String(lineNum), 4)}: ${escapedLine}${options?.html ? '<br/>' : '\n'}`;
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

function escapeHTML(unsafe: string): string {
  return unsafe
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
