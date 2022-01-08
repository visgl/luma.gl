import {TextureFormat, VertexType} from '../types/formats';
import { decodeVertexType } from './decode-data-type';

const REGEX = /^(rg?b?a?)([0-9]*)([a-z]*)$/

/**
 * Decodes a vertex format, returning type, components, byte  length and flags (integer, signed, normalized)
 */
export function decodeTextureFormat(format: TextureFormat): {
  format: string;
  dataType: VertexType;
  byteLength: number;
  integer: boolean;
  signed: boolean;
  normalized: boolean;
} {
  const matches = (format as string).match(REGEX);
  if (matches) {
    const [, format, length, type] = matches;
    const dataType = `${type}${length}` as VertexType;
    const decodedType = decodeVertexType(dataType);
    return {
      format,
      dataType,
      ...decodedType,
    };
  }
  throw new Error(`Unknown format ${format}`);
}
