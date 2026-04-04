// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderPassPipeline} from '@luma.gl/shadertools';
import {dof} from './dof';

type DofTargetName = 'blurScratch';

/**
 * Reusable DOF pipeline.
 *
 * The pipeline runs {@link dof} twice:
 * - horizontal blur from `original` into `blurScratch`
 * - vertical blur from `blurScratch` back into `previous`
 *
 * The caller still supplies the external `depthTexture` binding and the public DOF uniforms.
 */
export const dofShaderPassPipeline = {
  name: 'dofShaderPassPipeline',
  renderTargets: {
    blurScratch: {}
  },
  steps: [
    {
      shaderPass: dof,
      inputs: {
        sourceTexture: 'original'
      },
      output: 'blurScratch',
      uniforms: {
        texelOffset: [1, 0]
      }
    },
    {
      shaderPass: dof,
      inputs: {
        sourceTexture: 'blurScratch'
      },
      output: 'previous',
      uniforms: {
        texelOffset: [0, 1]
      }
    }
  ]
} as const satisfies ShaderPassPipeline<DofTargetName>;
