import {ShaderPass} from '../../types';

/**
 * Bulge / Pinch -
 * Bulges or pinches the image in a circle.
 * @param center  The [x, y] coordinates of the center of the circle of effect.
 * @param radius   The radius of the circle of effect.
 * @param strength -1 to 1 (-1 is strong pinch, 0 is no effect, 1 is strong bulge)
 */
export const bulgePinch: ShaderPass;
