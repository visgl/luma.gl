/** @todo - import from texture-types */
// import { type TextureFormatPacked } from "../textures/texture-format-types";
export type TextureFormatPacked =
  | 'rgba4unorm-webgl'
  | 'rgb565unorm-webgl'
  | 'rgb5a1unorm-webgl'
  | 'rgb10a2unorm'
  | 'rgb10a2uint'
  | 'rgb9e5ufloat'
  | 'rg11b10ufloat';

export type DecodeRGBA = (
  bits: number,
  format: any,
  target?: [number, number, number, number]
) => [number, number, number, number];
export type EncodeRGBA = (rgba: [number, number, number, number], format: any) => number;

export type TextureFormatEncoders = Record<
  TextureFormatPacked,
  {decodeRGBA?: DecodeRGBA; encodeRGBA?: EncodeRGBA}
>;

export type RBGADecoderProps = {
  tables?: TextureFormatEncoders[];
};

/**
 * RGBADecoder encodes and decodes packed pixel format
 * Supports installable texture format definitions to keep core small
 */
export class RGBADecoder {
  tables: TextureFormatEncoders[] = [];

  constructor(props?: RBGADecoderProps) {
    props?.tables?.forEach(table => this.addTable(table));
  }

  addTable(newTable: TextureFormatEncoders) {
    if (!this.tables.find(table => table === newTable)) {
      this.tables.push(newTable);
    }
  }

  /**
   * Generic decode: looks up the decoder in the provided table and calls it.
   */
  decodeRGBA(
    bits: number,
    format: TextureFormatPacked,
    target?: [number, number, number, number]
  ): [number, number, number, number] {
    const tableWithFormat = this.tables.find(table => table[format]);
    const entry = tableWithFormat?.[format];
    if (!entry?.decodeRGBA) {
      throw new Error(`No decoder for format ${format}`);
    }
    // decodeRGBA signature is (bits, format, target?)
    return entry.decodeRGBA(bits, format, target);
  }

  /**
   * Generic encode: looks up the encoder in the provided table and calls it.
   */
  encodeRGBA(rgba: [number, number, number, number], format: TextureFormatPacked): number {
    const tableWithFormat = this.tables.find(table => table[format]);
    const entry = tableWithFormat?.[format];
    if (!entry?.encodeRGBA) {
      throw new Error(`No encoder for format ${format}`);
    }

    // encodeRGBA signature is (rgba, format) => bits
    return entry.encodeRGBA(rgba, format);
  }
}
