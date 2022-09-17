import {ShaderPass} from '../../types';

/**
 * Magnify - display a circle with magnify effect applied to surrounding the pixels given position
 * @param screenXY: x, y position in screen coords, both x and y is normalized and in range `[0, 1]`. `[0, 0]` is the up left corner, `[1, 1]` is the bottom right corner. Default value is `[0, 0]`.
 * @param radiusPixels: effect radius in pixels. Default value is `100`.
 * @param zoom: magnify level. Default value is `2`.
 * @param borderWidthPixels: border width of the effect circle, will not show border if value <= 0.0. Default value is `0`.
 * @param borderColor: border color of the effect circle. Default value is `[255, 255, 255, 255]`.
 */
export const magnify: ShaderPass;
