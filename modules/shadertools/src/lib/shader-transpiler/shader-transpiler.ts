// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {PlatformInfo} from '../shader-assembly/platform-info';

export type ShaderTranspilerEntryPoints = {
  vertex?: string;
  fragment?: string;
  compute?: string;
};

/** One translation unit, including source-language module dependencies. */
export type ShaderTranspileProps = {
  source: string;
  target: 'glsl' | 'wgsl';
  /** GLSL compiles one stage at a time; WGSL may compile a unified render program. */
  stage?: 'vertex' | 'fragment' | 'compute';
  entryPoints: ShaderTranspilerEntryPoints;
  platformInfo: PlatformInfo;
};

export type ShaderTranspileResult = {
  code: string;
  /** Generated names selected by subsequent interface scanning and pipeline creation. */
  entryPoints?: ShaderTranspilerEntryPoints;
};

/** Application-owned compiler. Shadertools has no dependency on its implementation. */
export type ShaderTranspiler = {
  name: string;
  sourceLanguage: string;
  transpile: (props: ShaderTranspileProps) => ShaderTranspileResult;
};
