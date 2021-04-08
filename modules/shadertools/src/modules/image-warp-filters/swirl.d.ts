import {ShaderPass} from '../../types';

/**
 * Warps a circular region of the image in a swirl.
 * @param center  The [x, y] coordinates of the center of the circle of effect.
 * @param radius  The radius of the circular region.
 * @param angle   The angle in radians that the pixels in the center of
 *                the circular region will be rotated by.
 */
export const swirl: ShaderPass;
