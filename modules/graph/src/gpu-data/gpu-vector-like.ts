// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {BufferLayout} from '@luma.gl/core';
import type {GPUData} from './gpu-data';
import type {GPUVectorFormat} from './gpu-vector-format';

/** Read-only vector shape shared by storage and backend-specific chunk views. No ownership implied. */
export interface GPUVectorLike<
  Format extends GPUVectorFormat = GPUVectorFormat,
  Data extends {readonly length: number; readonly format?: Format} = GPUData<Format>
> {
  readonly format?: Format;
  readonly length: number;
  readonly data: readonly Data[];
  /** Optional aggregate metadata. Imports infer omitted values from the chunks. */
  readonly name?: string;
  readonly valueLength?: number;
  readonly stride?: number;
  readonly byteStride?: number;
  readonly rowByteLength?: number;
  readonly bufferLayout?: BufferLayout;
}

/** Typed storage accepted wherever one or more GPU data chunks supply a vector. */
export type GPUVectorInput<Format extends GPUVectorFormat = GPUVectorFormat> =
  | GPUVectorLike<Format>
  | GPUData<Format>
  | readonly GPUData<Format>[];
