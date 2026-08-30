// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  PARQUET_DELTA_BINARY_PACKED_DESCRIPTOR_WORDS,
  parseParquetDeltaBinaryPackedPlan,
  type ParquetDeltaBinaryPackedPlan
} from './parquet-delta-binary-packed';

/** CPU control data for a Parquet DELTA_BYTE_ARRAY stream. */
export type ParquetDeltaByteArrayPlan = {
  prefixLengthPlan: ParquetDeltaBinaryPackedPlan;
  suffixLengthPlan: ParquetDeltaBinaryPackedPlan;
  suffixDataByteOffset: number;
  suffixDataByteLength: number;
};

/** Separates prefix lengths, suffix lengths, and suffix bytes without expanding any values. */
export function parseParquetDeltaByteArrayPlan(encoded: Uint8Array): ParquetDeltaByteArrayPlan {
  const prefixLengthPlan = parseParquetDeltaBinaryPackedPlan(encoded);
  const suffixLengthPlan = rebasePlan(
    parseParquetDeltaBinaryPackedPlan(encoded.subarray(prefixLengthPlan.bytesConsumed)),
    prefixLengthPlan.bytesConsumed
  );
  if (prefixLengthPlan.valueCount !== suffixLengthPlan.valueCount) {
    throw new Error('Parquet delta byte-array prefix and suffix counts must match');
  }
  return Object.freeze({
    prefixLengthPlan,
    suffixLengthPlan,
    suffixDataByteOffset: suffixLengthPlan.bytesConsumed,
    suffixDataByteLength: encoded.length - suffixLengthPlan.bytesConsumed
  });
}

function rebasePlan(
  plan: ParquetDeltaBinaryPackedPlan,
  baseByteOffset: number
): ParquetDeltaBinaryPackedPlan {
  const miniBlockDescriptors = plan.miniBlockDescriptors.slice();
  for (
    let descriptorOffset = 0;
    descriptorOffset < miniBlockDescriptors.length;
    descriptorOffset += PARQUET_DELTA_BINARY_PACKED_DESCRIPTOR_WORDS
  ) {
    const payloadOffsetIndex = descriptorOffset + 2;
    const payloadByteOffset = miniBlockDescriptors[payloadOffsetIndex] + baseByteOffset;
    if (payloadByteOffset > 0xffffffff) {
      throw new Error('Parquet delta byte-array payload offset exceeds uint32');
    }
    miniBlockDescriptors[payloadOffsetIndex] = payloadByteOffset;
  }
  const bytesConsumed = plan.bytesConsumed + baseByteOffset;
  if (bytesConsumed > 0xffffffff) {
    throw new Error('Parquet delta byte-array encoded length exceeds uint32');
  }
  return Object.freeze({...plan, miniBlockDescriptors, bytesConsumed});
}
