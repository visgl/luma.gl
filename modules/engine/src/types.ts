// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {PipelineFactory} from './factories/pipeline-factory'
import type {ShaderFactory} from './factories/shader-factory'

export type EngineModuleState = {
  defaultPipelineFactory?: PipelineFactory
  defaultShaderFactory?: ShaderFactory
}
