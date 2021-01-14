import {ShaderPass} from '../../types';

/**
 * Denoise -
 * Smooths over grainy noise in dark images using an 9x9 box filter
 * weighted by color intensity, similar to a bilateral filter.
 * @param exponent The exponent of the color intensity difference, should be greater
 *                 than zero. A value of zero just gives an 9x9 box blur and high values
 *                 give the original image, but ideal values are usually around 10-20.
 */
export const denoise: ShaderPass;
