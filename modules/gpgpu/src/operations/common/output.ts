// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type { SignedDataType } from "@luma.gl/core";
import { GPUTable } from "../../operation/gpu-table";

export function deduceOutputProps(
  ...inputs: GPUTable[]
): {
  isConstant: boolean;
  type: SignedDataType;
  size: number;
  length: number;
} {
  return {
    isConstant: inputs.every(x => x.isConstant),
    type: inputs.reduce((t, x) => joinType(t, x.type), inputs[0].type),
    size: inputs.reduce((s, x) => Math.max(s, x.size), 0),
    length: inputs.reduce((l, x) => Math.max(l, x.length), 0)
  };
}

/** Alternative data types that can losslessly store the same value, sorted by preference */
const CompatibleTypes: Record<SignedDataType, SignedDataType[]> = {
  uint8: ['uint16', 'sint16', 'float16', 'uint32', 'sint32', 'float32'],
  uint16: ['uint32', 'sint32', 'float32'],
  uint32: [],
  sint8: ['sint16', 'float16', 'sint32', 'float32'],
  sint16: ['sint32', 'float32'],
  sint32: [],
  float16: ['float32'],
  float32: []
} as const;

/** Get the nearest data type that can represent both t1 and t2 types of values
 * If none exists, return float32
 */
function joinType(t1: SignedDataType, t2: SignedDataType): SignedDataType {
  if (t1 === t2) return t1;
  const alt1 = CompatibleTypes[t1];
  const alt2 = CompatibleTypes[t2];
  if (alt1.includes(t2)) return t2;
  if (alt2.includes(t1)) return t1;
  for (const t of alt1) {
    if (alt2.includes(t)) return t;
  }
  // Fall back to the type that has the best range & precision
  return 'float32';
}
