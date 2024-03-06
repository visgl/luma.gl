// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {VertexFormat, VertexType} from './vertex-formats';
import {decodeVertexType} from './decode-data-type';

export type VertexFormatInfo = {
  /** Length in bytes */
  byteLength: number;
  /** Type of each component */
  type: VertexType;
  /** Number of components per vertex / row */
  components: 1 | 2 | 3 | 4;
  /** Is this an integer format (normalized integer formats are not integer) */
  integer: boolean;
  /** Is this a signed format? */
  signed: boolean;
  /** Is this a normalized format? */
  normalized: boolean;
  /** Is this a webgl only format? */
  webglOnly?: boolean;
};

/**
 * Decodes a vertex format, returning type, components, byte  length and flags (integer, signed, normalized)
 */
export function decodeVertexFormat(format: VertexFormat): VertexFormatInfo {
  // Strip the -webgl ending if present
  let webglOnly: boolean | undefined;
  if (format.endsWith('-webgl')) {
    format.replace('-webgl', '');
    webglOnly = true;
  }
  // split components from type
  const [type_, count] = format.split('x');
  const type = type_ as VertexType;
  const components = (count ? parseInt(count) : 1) as 1 | 2 | 3 | 4;
  // decode the type
  const decodedType = decodeVertexType(type);
  const result: VertexFormatInfo = {
    type,
    components,
    byteLength: decodedType.byteLength * components,
    integer: decodedType.integer,
    signed: decodedType.signed,
    normalized: decodedType.normalized
  };
  if (webglOnly) {
    result.webglOnly = true;
  }
  return result;
}
