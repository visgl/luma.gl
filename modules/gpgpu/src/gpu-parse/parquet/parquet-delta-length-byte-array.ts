// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  parseParquetDeltaBinaryPackedPlan,
  type ParquetDeltaBinaryPackedPlan
} from './parquet-delta-binary-packed';

/** CPU control data for a Parquet DELTA_LENGTH_BYTE_ARRAY stream. */
export type ParquetDeltaLengthByteArrayPlan = {
  lengthPlan: ParquetDeltaBinaryPackedPlan;
  payloadByteOffset: number;
  payloadByteLength: number;
};

/** Separates delta-encoded lengths from the contiguous byte-array payload. */
export function parseParquetDeltaLengthByteArrayPlan(
  encoded: Uint8Array
): ParquetDeltaLengthByteArrayPlan {
  const lengthPlan = parseParquetDeltaBinaryPackedPlan(encoded);
  return Object.freeze({
    lengthPlan,
    payloadByteOffset: lengthPlan.bytesConsumed,
    payloadByteLength: encoded.length - lengthPlan.bytesConsumed
  });
}
