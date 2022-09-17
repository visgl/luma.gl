import {AnimationLoop} from '@luma.gl/engine';
import Display from './display';
export default class VRDisplay extends Display {
  static isSupported(): boolean;
  constructor(props: any);
  delete(): void;
  getViews(
    options: any
  ):
    | {
        params: {
          viewport: any[];
          scissor: any[];
          scissorTest: boolean;
        };
      }[]
    | {
        displayEye: string;
        projectionMatrix: any;
        viewMatrix: any;
        params: {
          viewport: any[];
          scissor: any[];
          scissorTest: boolean;
        };
      }[];
  submitFrame(): boolean;
  requestAnimationFrame(renderFrame: any): boolean;
  _addVRButton(): Promise<void>;
  _getCanvas(): any;
  _removeVRButton(): void;
  _startDisplay(): void;
  _vrDisplayPresentChange(): void;
}
