import {ShaderPass} from '../../types';

/**
 * Hue / Saturation
 * Provides rotational hue and multiplicative saturation control. RGB color space
 * can be imagined as a cube where the axes are the red, green, and blue color
 * values. Hue changing works by rotating the color vector around the grayscale
 * line, which is the straight line from black (0, 0, 0) to white (1, 1, 1).
 * Saturation is implemented by scaling all color channel values either toward
 * or away from the average color channel value.
 * @param hue        -1 to 1 (-1 is 180 degree rotation in the negative direction, 0 is no change,
 *                   and 1 is 180 degree rotation in the positive direction)
 * @param saturation -1 to 1 (-1 is solid gray, 0 is no change, and 1 is maximum contrast)
 */
export const hueSaturation: ShaderPass;
