// deck.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {SignedDataType, type TextureFormat, type VertexFormat} from '@luma.gl/core';

export type QualifiedVectorSize = 1 | 2 | 3 | 4;

export function getAttributeType(
  type: SignedDataType,
  size: QualifiedVectorSize,
  normalized: boolean = false
): string {
  if (normalized) {
    return size === 1 ? 'float' : `vec${size}`;
  }

  switch (type) {
    case 'uint8':
    case 'uint16':
    case 'uint32':
      return size === 1 ? 'uint' : `uvec${size}`;

    case 'sint8':
    case 'sint16':
    case 'sint32':
      return size === 1 ? 'int' : `ivec${size}`;

    default:
      return size === 1 ? 'float' : `vec${size}`;
  }
}

export function getVertexFormat(
  type: SignedDataType,
  size: QualifiedVectorSize,
  normalized: boolean = false
): VertexFormat {
  let baseFormat: string;

  if (normalized) {
    switch (type) {
      case 'uint8':
        baseFormat = 'unorm8';
        break;

      case 'sint8':
        baseFormat = 'snorm8';
        break;

      case 'uint16':
        baseFormat = 'unorm16';
        break;

      case 'sint16':
        baseFormat = 'snorm16';
        break;

      case 'float32':
        baseFormat = 'float32';
        break;

      default:
        throw new Error(`Unsupported normalized vertex format for ${type}`);
    }
  } else {
    baseFormat = type;
  }

  if (size === 1) {
    return baseFormat as VertexFormat;
  }
  if (size === 3 && !baseFormat.startsWith('float32') && !baseFormat.endsWith('32')) {
    return `${baseFormat}x3-webgl` as VertexFormat;
  }
  return `${baseFormat}x${size}` as VertexFormat;
}

export function getZeroLiteral(type: string): string {
  switch (type[0]) {
    case 'u':
      return '0u';

    case 's':
      return '0';

    default:
      return '0.';
  }
}

export function formatLiteralValue(type: SignedDataType, value: number): string {
  switch (type) {
    case 'uint8':
    case 'uint16':
    case 'uint32':
      return `${Math.trunc(value)}u`;

    case 'sint8':
    case 'sint16':
    case 'sint32':
      return `${Math.trunc(value)}`;

    default:
      return Number.isInteger(value) ? `${value}.0` : `${value}`;
  }
}

export function getTextureFormat(type: SignedDataType): TextureFormat {
  switch (type) {
    case 'uint8':
      return 'r8uint';

    case 'sint8':
      return 'r8sint';

    case 'uint16':
      return 'r16uint';

    case 'sint16':
      return 'r16sint';

    case 'uint32':
      return 'r32uint';

    case 'sint32':
      return 'r32sint';

    case 'float32':
      return 'r32float';

    default:
      throw new Error(`Unsupported WebGL gather texture format for ${type}`);
  }
}

export function getTextureDataType(type: SignedDataType): SignedDataType {
  return type;
}

export function getSamplerType(type: SignedDataType): string {
  switch (type) {
    case 'uint32':
      return 'usampler2D';

    case 'sint32':
      return 'isampler2D';

    case 'float32':
      return 'sampler2D';

    default:
      throw new Error(`Unsupported WebGL gather sampler type for ${type}`);
  }
}
