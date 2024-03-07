// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// keyframes
export type KeyFrame<T> = [number, T];

/** Holds a list of key frames (timestamped values) */
export class KeyFrames<T = number> {
  startIndex: number = -1;
  endIndex: number = -1;
  factor: number = 0;
  times: number[] = [];
  values: T[] = [];
  private _lastTime = -1;

  constructor(keyFrames: KeyFrame<T>[]) {
    this.setKeyFrames(keyFrames);
    this.setTime(0);
  }

  setKeyFrames(keyFrames: KeyFrame<T>[]): void {
    const numKeys = keyFrames.length;
    this.times.length = numKeys;
    this.values.length = numKeys;

    for (let i = 0; i < numKeys; ++i) {
      this.times[i] = keyFrames[i][0];
      this.values[i] = keyFrames[i][1];
    }

    this._calculateKeys(this._lastTime);
  }

  setTime(time: number): void {
    time = Math.max(0, time);

    if (time !== this._lastTime) {
      this._calculateKeys(time);
      this._lastTime = time;
    }
  }

  getStartTime(): number {
    return this.times[this.startIndex];
  }

  getEndTime(): number {
    return this.times[this.endIndex];
  }

  getStartData(): T {
    return this.values[this.startIndex];
  }

  getEndData(): T {
    return this.values[this.endIndex];
  }

  _calculateKeys(time: number): void {
    let index = 0;
    const numKeys = this.times.length;

    for (index = 0; index < numKeys - 2; ++index) {
      if (this.times[index + 1] > time) {
        break;
      }
    }

    this.startIndex = index;
    this.endIndex = index + 1;

    const startTime = this.times[this.startIndex];
    const endTime = this.times[this.endIndex];
    this.factor = Math.min(Math.max(0, (time - startTime) / (endTime - startTime)), 1);
  }
}
