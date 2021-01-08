import {NumberArray} from '../../types';

/**
 * Calculate WebGL 64 bit float
 * @param a  - the input float number
 * @param out - the output array. If not supplied, a new array is created.
 * @param startIndex - the index in the output array to fill from. Default 0.
 * @returns - the fp64 representation of the input number
 */
export function fp64ify(a: number, out?: NumberArray, startIndex?: number): NumberArray;

/**
 * Calculate the low part of a WebGL 64 bit float
 * @param a {number} - the input float number
 * @returns {number} - the lower 32 bit of the number
 */
export function fp64LowPart(a: any): number;

/**
 * Calculate WebGL 64 bit matrix (transposed "Float64Array")
 * @param matrix {Matrix4} - the input matrix
 * @returns {array} - the fp64 representation of the input matrix
 */
export function fp64ifyMatrix4(matrix: NumberArray): Float32Array;
