import {ShaderPass} from '../../types';

/**
 * Color Halftone -
 * Simulates a CMYK halftone rendering of the image by multiplying pixel values
 * with a four rotated 2D sine wave patterns, one each for cyan, magenta, yellow,
 * and black.
 * @param centerX The x coordinate of the pattern origin.
 * @param centerY The y coordinate of the pattern origin.
 * @param angle   The rotation of the pattern in radians.
 * @param size    The diameter of a dot in pixels.
 */
export const colorHalftone: ShaderPass;
