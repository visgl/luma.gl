// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {NumberArray3} from '@math.gl/core';
import type {WebXRInputState} from './webxr-manager';

/** Experimental v10 world-space target ray derived from one WebXR input source. */
export type WebXRInputRay = {
  inputState: WebXRInputState;
  origin: NumberArray3;
  direction: NumberArray3;
  matrix: Float32Array;
};

export function getWebXRInputRay(inputState: WebXRInputState): WebXRInputRay | null {
  const matrix = inputState.targetRayMatrix;
  if (!matrix) {
    return null;
  }

  const direction: NumberArray3 = [-matrix[8], -matrix[9], -matrix[10]];
  normalizeVector3(direction);

  return {
    inputState,
    origin: [matrix[12], matrix[13], matrix[14]],
    direction,
    matrix
  };
}

function normalizeVector3(vector: NumberArray3): void {
  const length = Math.hypot(vector[0], vector[1], vector[2]);
  if (length === 0) {
    vector[0] = 0;
    vector[1] = 0;
    vector[2] = -1;
    return;
  }

  vector[0] /= length;
  vector[1] /= length;
  vector[2] /= length;
  vector[0] ||= 0;
  vector[1] ||= 0;
  vector[2] ||= 0;
}
