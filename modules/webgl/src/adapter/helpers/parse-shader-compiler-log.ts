// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CompilerMessage} from '@luma.gl/core';

/**
 * Parse a WebGL-format GLSL compilation log into an array of WebGPU style message records.
 * This follows documented WebGL conventions for compilation logs.
 * Based on https://github.com/wwwtyro/gl-format-compiler-error (public domain)
 */
export function parseShaderCompilerLog(errLog: string): readonly CompilerMessage[] {
  // Parse the error - note: browser and driver dependent
  const lines = errLog.split(/\r?\n/);

  const messages: CompilerMessage[] = [];

  for (const line of lines) {
    if (line.length <= 1) {
      continue; // eslint-disable-line no-continue
    }

    const segments: string[] = line.split(':');

    // Check for messages with no line information `ERROR: unsupported shader version`
    if (segments.length === 2) {
      const [messageType, message] = segments;
      messages.push({
        message: message.trim(),
        type: getMessageType(messageType),
        lineNum: 0,
        linePos: 0
      });
      continue; // eslint-disable-line no-continue
    }

    const [messageType, linePosition, lineNumber, ...rest] = segments;

    let lineNum = parseInt(lineNumber, 10);
    if (isNaN(lineNum)) {
      lineNum = 0;
    }

    let linePos = parseInt(linePosition, 10);
    if (isNaN(linePos)) {
      linePos = 0;
    }

    messages.push({
      message: rest.join(':').trim(),
      type: getMessageType(messageType),
      lineNum,
      linePos // TODO
    });
  }

  return messages;
}

/** Ensure supported type */
function getMessageType(messageType: string): 'warning' | 'error' | 'info' {
  const MESSAGE_TYPES = ['warning', 'error', 'info'];
  const lowerCaseType = messageType.toLowerCase();
  return (MESSAGE_TYPES.includes(lowerCaseType) ? lowerCaseType : 'info') as
    | 'warning'
    | 'error'
    | 'info';
}
