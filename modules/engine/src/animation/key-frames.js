/** @type {import('@luma.gl/engine').KeyFrames} */

export class KeyFrames {
  constructor(keyFrames) {
    this._lastTime = -1;
    this.startIndex = -1;
    this.endIndex = -1;
    this.factor = 0;
    this.times = [];
    this.values = [];
    this.setKeyFrames(keyFrames);
    this.setTime(0);
  }

  setKeyFrames(keyFrames) {
    const numKeys = keyFrames.length;
    this.times.length = numKeys;
    this.values.length = numKeys;

    for (let i = 0; i < numKeys; ++i) {
      this.times[i] = keyFrames[i][0];
      this.values[i] = keyFrames[i][1];
    }

    this._calculateKeys(this._lastTime);
  }

  setTime(time) {
    time = Math.max(0, time);

    if (time !== this._lastTime) {
      this._calculateKeys(time);
      this._lastTime = time;
    }
  }

  getStartTime() {
    return this.times[this.startIndex];
  }

  getEndTime() {
    return this.times[this.endIndex];
  }

  getStartData() {
    return this.values[this.startIndex];
  }

  getEndData() {
    return this.values[this.endIndex];
  }

  _calculateKeys(time) {
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
