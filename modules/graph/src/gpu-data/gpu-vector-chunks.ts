// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** A chunk's logical position; physical format, offset and row layout belong to data. */
export type GPUVectorChunk<Data extends {readonly length: number}> = Readonly<{
  offset: number;
  length: number;
  data: Data;
}>;

/** Describes ordered chunks without copying their storage, including empty chunks. */
export function getGPUVectorChunks<Data extends {readonly length: number}>(
  data: readonly Data[]
): readonly GPUVectorChunk<Data>[] {
  let offset = 0;
  return Object.freeze(
    data.map(chunk => {
      const descriptor = Object.freeze({offset, length: chunk.length, data: chunk});
      offset += chunk.length;
      return descriptor;
    })
  );
}
