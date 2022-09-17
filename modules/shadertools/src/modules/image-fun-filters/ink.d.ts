import {ShaderPass} from '../../types';

/**
 * Ink -
 * Simulates outlining the image in ink by darkening edges stronger than a
 * certain threshold. The edge detection value is the difference of two
 * copies of the image, each blurred using a blur of a different radius.
 * @param strength The multiplicative scale of the ink edges. Values in the range 0 to 1
 *                 are usually sufficient, where 0 doesn't change the image and 1 adds lots
 *                 of black edges. Negative strength values will create white ink edges
 *                 instead of black ones.
 */
export const ink: ShaderPass;
