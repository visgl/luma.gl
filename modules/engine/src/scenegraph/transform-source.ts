// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Buffer} from '@luma.gl/core';
import type {NumericArray} from '@math.gl/core';
import type {ScenegraphNode} from './scenegraph-node';

/** One visual node relative to a producer-owned world matrix. */
export type ScenegraphTransformBinding = {
  matrixIndex: number;
  localMatrix: Readonly<NumericArray>;
  visible?: boolean;
};

/** An accepted GPU publication. Buffers are borrowed, never owned by a renderer. */
export type ScenegraphTransformFrame = {
  /** Column-major float32 mat4 array, with STORAGE usage. */
  matrices: Buffer;
  matrixCount: number;
  /** Changes when the producer replaces its buffers or index mapping. */
  revision: number;
  bindings: ReadonlyMap<ScenegraphNode, ScenegraphTransformBinding>;
};

/** Generic GPU transform producer. Returning null selects authored scene transforms. */
export interface ScenegraphTransformSource {
  getFrame(): ScenegraphTransformFrame | null;
}
