import {Device} from '@luma.gl/api';
import {Timeline} from '../animation/timeline'

/** Properties passed to every render frame  */
export type AnimationProps = {
  device: Device;

  /** @todo Should be canvasContext */
  canvas: HTMLCanvasElement | OffscreenCanvas;
  useDevicePixels: number | boolean;
  width: number;
  height: number;
  aspect: number;

  // Animation props
  time: number;
  startTime: number;
  engineTime: number;
  tick: number;
  tock: number;

  // Initial values
  needsRedraw?: string;

  timeline: Timeline;

  // Experimental
  _mousePosition?: [number, number]; // [offsetX, offsetY],
};
