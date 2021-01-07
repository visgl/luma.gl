import {ShaderPass} from '../../types';

/**
 * Tilt Shift
 * Simulates the shallow depth of field normally encountered in close-up
 * photography, which makes the scene seem much smaller than it actually
 * is. This filter assumes the scene is relatively planar, in which case
 * the part of the scene that is completely in focus can be described by
 * a line (the intersection of the focal plane and the scene). An example
 * of a planar scene might be looking at a road from above at a downward
 * angle. The image is then blurred with a blur radius that starts at zero
 * on the line and increases further from the line.
 * @param startX         The x coordinate of the start of the line segment.
 * @param startY         The y coordinate of the start of the line segment.
 * @param endX           The x coordinate of the end of the line segment.
 * @param endY           The y coordinate of the end of the line segment.
 * @param blurRadius     The maximum radius of the pyramid blur.
 * @param gradientRadius The distance from the line at which the maximum blur radius is reached.
 */
export const tiltShift: ShaderPass;
