// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {SourceLocation} from './ast';
import type {SlangSourceMapEntry} from './types';
import type {SlangDiagnostic} from './diagnostics';

export function markSlangSource(code: string, location: SourceLocation): string {
  return `// @slang-source:${location.offset}:${location.line}:${location.column}${location.sourceName ? `:${JSON.stringify(location.sourceName)}` : ''}\n${code}`;
}

/** Strip internal provenance markers while retaining a mapping for each generated line. */
export function mapSlangSource(
  code: string,
  sourceName: string
): {code: string; sourceMap: SlangSourceMapEntry[]} {
  const lines: string[] = [];
  const sourceMap: SlangSourceMapEntry[] = [];
  let original = {offset: 0, line: 1, column: 1, sourceName};
  for (const line of code.split('\n')) {
    const marker = /^\s*\/\/ @slang-source:(\d+):(\d+):(\d+)(?::(.*))?$/.exec(line);
    if (marker) {
      original = {
        offset: Number(marker[1]),
        line: Number(marker[2]),
        column: Number(marker[3]),
        sourceName: marker[4] ? JSON.parse(marker[4]) : sourceName
      };
    } else {
      lines.push(line);
      sourceMap.push({...original, generatedLine: lines.length});
    }
  }
  return {code: lines.join('\n'), sourceMap};
}

/** Map a target compiler error to the source statement that produced it. */
export function mapSlangDiagnostic(
  sourceMap: readonly SlangSourceMapEntry[],
  generatedLine: number,
  message: string
): SlangDiagnostic | undefined {
  const source = sourceMap.find(entry => entry.generatedLine === generatedLine);
  if (!source) return undefined;
  const {generatedLine: _generatedLine, ...location} = source;
  return {...location, message};
}
