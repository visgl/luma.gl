/**
 * RGBADecoder encodes and decodes packed pixel format
 * Supports installable texture format definitions to keep core small
 */
export class RGBADecoder {
    tables = [];
    constructor(props) {
        props?.tables?.forEach(table => this.addTable(table));
    }
    addTable(newTable) {
        if (!this.tables.find(table => table === newTable)) {
            this.tables.push(newTable);
        }
    }
    /**
     * Generic decode: looks up the decoder in the provided table and calls it.
     */
    decodeRGBA(bits, format, target) {
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
    encodeRGBA(rgba, format) {
        const tableWithFormat = this.tables.find(table => table[format]);
        const entry = tableWithFormat?.[format];
        if (!entry?.encodeRGBA) {
            throw new Error(`No encoder for format ${format}`);
        }
        // encodeRGBA signature is (rgba, format) => bits
        return entry.encodeRGBA(rgba, format);
    }
}
