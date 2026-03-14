// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
const IFDEF_REGEXP = /^\s*\#\s*ifdef\s*([a-zA-Z_]+)\s*$/;
const ENDIF_REGEXP = /^\s*\#\s*endif\s*$/;
export function preprocess(source, options) {
    const lines = source.split('\n');
    const output = [];
    let conditional = true;
    let currentDefine = null;
    for (const line of lines) {
        const matchIf = line.match(IFDEF_REGEXP);
        const matchEnd = line.match(ENDIF_REGEXP);
        if (matchIf) {
            currentDefine = matchIf[1];
            conditional = Boolean(options?.defines?.[currentDefine]);
        }
        else if (matchEnd) {
            conditional = true;
        }
        else if (conditional) {
            output.push(line);
        }
    }
    return output.join('\n');
}
