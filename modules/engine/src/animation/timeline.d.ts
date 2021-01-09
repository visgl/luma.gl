export class Timeline {
  constructor();
  addChannel(props: any): number;
  removeChannel(handle: any): void;
  isFinished(handle: any): boolean;
  getTime(handle: any): any;
  setTime(time: any): void;
  play(): void;
  pause(): void;
  reset(): void;
  attachAnimation(animation: any, channelHandle: any): number;
  detachAnimation(handle: any): void;
  update(engineTime: any): void;
}
