// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {DepthStencilParameters, StencilFaceState} from './parameters';

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
