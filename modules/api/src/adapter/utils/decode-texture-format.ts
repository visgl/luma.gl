import {TextureFormat, VertexType} from '../types/formats';
import { decodeVertexType } from './decode-data-type';

const REGEX = /^(rg?b?a?)([0-9]*)([a-z]*)(-srgb)?(-webgl|-unsized)?$/

// const EXCEPTIONS: Record<TextureFormat, any> = {
//   'rgba4norm-webgl': {format: 'rgba'}, 
//   'rgb565norm-webgl': {format: 'rgb'},
//   'rgb5a1norm-webgl': {format: 'rgba'} 
// };

/**
 * Decodes a vertex format, returning type, components, byte  length and flags (integer, signed, normalized)
 */
export function decodeTextureFormat(format: TextureFormat): {
  format: string;
  components: number;
  dataType: VertexType;
  srgb: boolean;
  webgl: boolean;
  unsized: boolean;
  byteLength: number;
  integer: boolean;
  signed: boolean;
  normalized: boolean;
} {
  const matches = (format as string).match(REGEX);
  if (matches) {
    const [, format, length, type, srgb, suffix] = matches;
    const dataType = `${type}${length}` as VertexType;
    const decodedType = decodeVertexType(dataType);
    return {
      format,
      components: 0,
      dataType,
      srgb: srgb === '-srgb',
      unsized: suffix === '-unsized',
      webgl: suffix === '-webgl',
      ...decodedType,
    };
  }
  throw new Error(`Unknown format ${format}`);
}
