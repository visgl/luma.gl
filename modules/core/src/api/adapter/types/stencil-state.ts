// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {
  DepthStencilParameters,
  RenderPipelineParameters,
  StencilFaceState
} from './parameters';

/** Applies face overrides per field while leaving native defaults implicit. */
export function resolveStencilFace(
  parameters: DepthStencilParameters,
  face?: StencilFaceState
): StencilFaceState {
  return {
    compare: face?.compare ?? parameters.stencilCompare,
    failOp: face?.failOp ?? parameters.stencilFailOperation,
    depthFailOp: face?.depthFailOp ?? parameters.stencilDepthFailOperation,
    passOp: face?.passOp ?? parameters.stencilPassOperation
  };
}

/** Reports whether the caller configured a stencil comparison or operation. */
export function hasStencilFaceState(parameters: DepthStencilParameters): boolean {
  return Boolean(
    parameters.stencilFront ||
      parameters.stencilBack ||
      parameters.stencilCompare ||
      parameters.stencilFailOperation ||
      parameters.stencilDepthFailOperation ||
      parameters.stencilPassOperation
  );
}

/** Reports whether an unculled face can update stencil with the configured write mask. */
export function writesStencil(parameters: RenderPipelineParameters): boolean {
  if (parameters.stencilWriteMask === 0) return false;
  const front = resolveStencilFace(parameters, parameters.stencilFront);
  const back = resolveStencilFace(parameters, parameters.stencilBack);
  return (
    (parameters.cullMode !== 'front' && hasStencilWriteOperation(front)) ||
    (parameters.cullMode !== 'back' && hasStencilWriteOperation(back))
  );
}

/** Reports whether any of the face's outcomes can modify stencil. */
export function hasStencilWriteOperation(face: StencilFaceState): boolean {
  return [face.failOp, face.depthFailOp, face.passOp].some(
    operation => operation !== undefined && operation !== 'keep'
  );
}
