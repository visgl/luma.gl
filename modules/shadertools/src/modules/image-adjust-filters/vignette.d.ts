import {ShaderPass} from '../../types';

/**
 * Vignette -
 * Adds a simulated lens edge darkening effect.
 * @param radius   0 to 1 (0 for center of frame, 1 for edge of frame)
 * @param amount   0 to 1 (0 for no effect, 1 for maximum lens darkening)
 */
export const vignette: ShaderPass;
