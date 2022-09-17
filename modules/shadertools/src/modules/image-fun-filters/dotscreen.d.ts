import {ShaderPass} from '../../types';

/**
 * Dot Screen -
 * Simulates a black and white halftone rendering of the image by multiplying
 * pixel values with a rotated 2D sine wave pattern.
 * @param centerX The x coordinate of the pattern origin.
 * @param centerY The y coordinate of the pattern origin.
 * @param angle   The rotation of the pattern in radians.
 * @param size    The diameter of a dot in pixels.
 */
export const dotScreen: ShaderPass;
