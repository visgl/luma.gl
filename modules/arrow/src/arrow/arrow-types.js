// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import * as arrow from 'apache-arrow';
export function isNumericArrowType(type) {
    return arrow.DataType.isFloat(type) || arrow.DataType.isInt(type);
}
/** Instance = One "vec1-vec4 value" per step */
export function isInstanceArrowType(type) {
    return (isNumericArrowType(type) ||
        (arrow.DataType.isFixedSizeList(type) && isNumericArrowType(type.children[0].type))
    // TODO - check listSize?
    );
}
/** Vertex = Multiple "vec1-vec4 values" per step */
export function isVertexArrowType(type) {
    return arrow.DataType.isList(type) && isInstanceArrowType(type.children[0].type);
}
/** Get the luma.gl signed shader type corresponding to an Apache Arrow type */
export function getSignedShaderType(arrowType, size) {
    if (arrow.DataType.isInt(arrowType)) {
        switch (arrowType.bitWidth) {
            case 8:
                return arrowType.isSigned ? 'sint8' : 'uint8';
            case 16:
                return arrowType.isSigned ? 'sint16' : 'uint16';
            case 32:
                return arrowType.isSigned ? 'sint32' : 'uint32';
            case 64:
                throw new Error('64-bit integers are not supported in shaders');
        }
    }
    if (arrow.DataType.isFloat(arrowType)) {
        switch (arrowType.precision) {
            case arrow.Precision.HALF:
                return 'float16';
            case arrow.Precision.SINGLE:
                return 'float32';
            case arrow.Precision.DOUBLE:
                throw new Error('Double precision floats are not supported in shaders');
        }
    }
    throw new Error(`Unsupported arrow type ${arrowType}`);
}
