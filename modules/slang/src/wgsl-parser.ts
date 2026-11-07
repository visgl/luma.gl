// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Program} from './ast';
import {parseWGSLDeclarations} from './wgsl-declarations';
import {createWGSLBodyParser} from './wgsl-body-parser';

/** Full syntax parser used by WGSL semantic analysis and code generation. */
export function parseWGSL(source: string, sourceName: string): Program {
  return parseWGSLDeclarations(source, sourceName, createWGSLBodyParser);
}
