import {ShaderPass} from '../../types';

/**
 * Zoom Blur
 * Blurs the image away from a certain point, which looks like radial motion blur.
 * @param centerX  The x coordinate of the blur origin.
 * @param centerY  The y coordinate of the blur origin.
 * @param strength The strength of the blur. Values in the range 0 to 1 are usually sufficient,
 *                 where 0 doesn't change the image and 1 creates a highly blurred image.
 */
export const zoomBlur: ShaderPass;
