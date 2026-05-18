// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {SignedDataType} from '@luma.gl/core';

export function getLiteralValue(type: string, value: number): string {
  switch (type) {
    case 'u32':
      return `${value}u`;

    case 'f32':
      return Number.isInteger(value) ? `${value}.0` : `${value}`;

    default:
      return `${value}`;
  }
}

export function getZeroValue(type: SignedDataType): string {
  switch (type) {
    case 'uint32':
      return '0u';

    case 'sint32':
      return '0';

    case 'float32':
      return '0.0';

    default:
      throw new Error(`WebGPU operations only support 32-bit output types, got ${type}`);
  }
}

export function getWGSLType(type: SignedDataType): string {
  switch (type) {
    case 'uint32':
      return 'u32';

    case 'sint32':
      return 'i32';

    case 'float32':
      return 'f32';

    default:
      throw new Error(`WebGPU operations only support 32-bit storage types, got ${type}`);
  }
}
