import {VertexFormat, VertexType} from '../types/formats';


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

/** Decodes a vertex type, returning byte length and flags (integer, signed, normalized) */
export function decodeVertexType(type: VertexType): {
  byteLength: number;
  integer: boolean;
  signed: boolean;
  normalized: boolean;
} {
  const bytes = getTypeBytes(type);
  const integer: boolean = !type.startsWith('float');
  const normalized: boolean = type.includes('norm');
  const signed: boolean = type.startsWith('s');
  return {
    byteLength: bytes,
    integer,
    signed,
    normalized
  };
}

const TYPE_SIZES: Record<string, number> = {
  uint8: 1,
  sint8: 1,
  unorm8: 1,
  snorm8: 1,
  uint16: 2,
  sint16: 2,
  unorm16: 2,
  snorm16: 2,
  float16: 2,
  float32: 4,
  uint32: 4,
  sint32: 4
};

function getTypeBytes(type: string): number {
  const bytes = TYPE_SIZES[type];
  // assert(bytes);
  return bytes;
}
