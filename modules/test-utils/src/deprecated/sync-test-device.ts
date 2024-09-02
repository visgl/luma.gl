// luma.gl
// SPDX-License
// Copyright (c) vis.gl contributors

import type {CanvasContextProps} from '@luma.gl/core';
import {WebGLDevice} from '@luma.gl/webgl';

const DEFAULT_CANVAS_CONTEXT_PROPS: CanvasContextProps = {
  width: 1,
  height: 1
};

/**
 * Create a test WebGLDevice
 * @note This WebGL Device is create synchronously and can be used directly but will not have WebGL debugging initialized
 * @deprecated Use getWebGLTestDevice().
 */
export function createTestDevice(): WebGLDevice | null {
  try {
    // TODO - We do not use luma.createDevice since createTestDevice currently expect WebGL context to be created synchronously
    return new WebGLDevice({createCanvasContext: DEFAULT_CANVAS_CONTEXT_PROPS});
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Failed to created device: ${(error as Error).message}`);
    debugger; // eslint-disable-line no-debugger
    return null;
  }
}

/**
 * A pre-created WebGLDevice
 * @note This WebGL Device is create synchronously and can be used directly but will not have WebGL debugging initialized
 * @deprecated Use getWebGLTestDevice().
 */
export const webglDevice = createTestDevice();
