type KeyFrame<T> = [number, T]

export class KeyFrames<T> {
  _lastTime: number
  startIndex: number
  endIndex: number
  factor: number
  times: Array<number>
  values: Array<T>

  constructor(keyFrames: Array<KeyFrame<T>> | number[][]);
  setKeyFrames(keyFrames: Array<KeyFrame<T>> | number[][]): void;
  setTime(time: number): void;
  getStartTime(): number;
  getEndTime(): number;
  getStartData(): T;
  getEndData(): T;
  _calculateKeys(time: number): void;
}
