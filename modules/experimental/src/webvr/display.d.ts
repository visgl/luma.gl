import {AnimationLoop} from '@luma.gl/engine';

export default class Display {
  readonly animationLoop: AnimationLoop;

  constructor(props: object);

  getViews(
    options: any
  ): {
    params: {
      viewport: any[];
      scissor: any[];
      scissorTest: boolean;
    };
  }[];
  submitFrame(): boolean;
  requestAnimationFrame(renderFrame: any): boolean;
  delete(): void;
  _renderFrame(options: any): boolean;
}
