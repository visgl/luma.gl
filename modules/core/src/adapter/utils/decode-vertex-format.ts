import {VertexFormat, VertexType} from '../types/vertex-formats';
import { decodeVertexType } from './decode-data-type';

/**
 * Decodes a vertex format, returning type, components, byte  length and flags (integer, signed, normalized)
 */
export function decodeVertexFormat(format: VertexFormat): {
  /** Length in bytes */
  byteLength: number;
  type: VertexType;
  components: number;
  integer: boolean;
  signed: boolean;
  normalized: boolean;
} {
  const [type_, count] = format.split('x');
  const type = type_ as VertexType;
  const components = count ? parseInt(count) : 1;
  const decodedType = decodeVertexType(type);
  return {
    type,
    components,
    byteLength: decodedType.byteLength * components,
    integer: decodedType.integer,
    signed: decodedType.signed,
    normalized: decodedType.normalized
  };
}
