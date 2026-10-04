// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {SourceLocation} from './ast';

export type SlangDiagnostic = SourceLocation & {message: string; sourceName: string};

/** A source diagnostic raised before any generated code is returned. */
export class SlangTranspileError extends Error {
  readonly diagnostics: SlangDiagnostic[];

  constructor(message: string, location: SourceLocation, sourceName = 'shader.slang') {
    super(`${sourceName}:${location.line}:${location.column}: ${message}`);
    this.name = 'SlangTranspileError';
    this.diagnostics = [{...location, message, sourceName}];
  }
}
