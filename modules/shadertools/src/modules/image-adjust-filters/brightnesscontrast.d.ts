import {ShaderPass} from '../../types';

/**
 * Brightness / Contrast -
 * Provides additive brightness and multiplicative contrast control.
 * @param brightness -1 to 1 (-1 is solid black, 0 is no change, and 1 is solid white)
 * @param contrast   -1 to 1 (-1 is solid gray, 0 is no change, and 1 is maximum contrast)
 */
export const brightnessContrast: ShaderPass;
