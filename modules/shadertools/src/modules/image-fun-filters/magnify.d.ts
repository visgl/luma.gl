import {ShaderPass} from '../../types';

/**
 * Magnify - display a circle with magnify effect applied to surrounding the pixels given position
 * @param screenXY: position on screen coords, both x and y is normalized and in range [0, 1] 
 * @param radiusPixels: effect radius in pixels 
 * @param zoom: magnify level 
 * @param borderWidthPixels: border width of the circle, donnot show border when <= 0.0
 * @param borderColor: border color of the circle
 */
export const magnify: ShaderPass;
