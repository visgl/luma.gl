// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {PipelineFactory} from './pipeline-factory';
import type {ShaderFactory} from './shader-factory';

export type CoreModuleState = {
  defaultPipelineFactory?: PipelineFactory;
  defaultShaderFactory?: ShaderFactory;
};
