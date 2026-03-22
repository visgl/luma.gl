import {expect, test} from 'vitest';
import { KeyFrames } from '@luma.gl/engine';
export function registerKeyFramesTests(): void {
  test('Animation#KeyFrames', () => {
    const keyFrames = new KeyFrames([[0, {
      val1: [1, 0, 1],
      val2: 0
    }], [500, {
      val1: [1, 1, 1],
      val2: 2
    }], [800, {
      val1: [0, 0, 1],
      val2: 1
    }], [1200, {
      val1: [0, 1, 0],
      val2: 4
    }], [1500, {
      val1: [1, 0, 1],
      val2: 5
    }]]);
    expect(keyFrames.startIndex, 'start index set properly on initialization').toBe(0);
    expect(keyFrames.endIndex, 'end index set properly on initialization').toBe(1);
    expect(keyFrames.factor, 'factor set properly on initialization').toBe(0);
    expect(keyFrames.getStartTime(), 'start time set properly on initialization').toBe(0);
    expect(keyFrames.getEndTime(), 'end time set properly on initialization').toBe(500);
    expect(keyFrames.getStartData().val2, 'start data set properly on initialization').toBe(0);
    expect(keyFrames.getEndData().val2, 'end data set properly on initialization').toBe(2);
    keyFrames.setTime(250);
    expect(keyFrames.startIndex, 'start index set properly after time set in first frame').toBe(0);
    expect(keyFrames.endIndex, 'end index set properly after time set in first frame').toBe(1);
    expect(keyFrames.factor, 'factor set properly after time set in first frame').toBe(0.5);
    expect(keyFrames.getStartTime(), 'start time set properly after time set in first frame').toBe(0);
    expect(keyFrames.getEndTime(), 'end time set properly after time set in first frame').toBe(500);
    expect(keyFrames.getStartData().val2, 'start data set properly after time set in first frame').toBe(0);
    expect(keyFrames.getEndData().val2, 'end data set properly after time set in first frame').toBe(2);
    keyFrames.setTime(1000);
    expect(keyFrames.startIndex, 'start index set properly after time set to interior frame').toBe(2);
    expect(keyFrames.endIndex, 'end index set properly after time set to interior frame').toBe(3);
    expect(keyFrames.factor, 'factor set properly after time set to interior frame').toBe(0.5);
    expect(keyFrames.getStartTime(), 'start time set properly after time set to interior frame').toBe(800);
    expect(keyFrames.getEndTime(), 'end time set properly after time set to interior frame').toBe(1200);
    expect(keyFrames.getStartData().val2, 'start data set properly after time set to interior frame').toBe(1);
    expect(keyFrames.getEndData().val2, 'end data set properly after time set to interior frame').toBe(4);
    keyFrames.setTime(1350);
    expect(keyFrames.startIndex, 'start index set properly after time set to last').toBe(3);
    expect(keyFrames.endIndex, 'end index set properly after time set to last').toBe(4);
    expect(keyFrames.factor, 'factor set properly after time set to last').toBe(0.5);
    expect(keyFrames.getStartTime(), 'start time set properly after time set to last').toBe(1200);
    expect(keyFrames.getEndTime(), 'end time set properly after time set to last').toBe(1500);
    expect(keyFrames.getStartData().val2, 'start data set properly after time set to last').toBe(4);
    expect(keyFrames.getEndData().val2, 'end data set properly after time set to last').toBe(5);
    keyFrames.setTime(-1);
    expect(keyFrames.startIndex, 'start index clamps at 0').toBe(0);
    expect(keyFrames.endIndex, 'end index clamps at 1').toBe(1);
    expect(keyFrames.factor, 'factor set properly when clamped at 0').toBe(0);
    keyFrames.setTime(2000);
    expect(keyFrames.startIndex, 'start index clamps last frame').toBe(3);
    expect(keyFrames.endIndex, 'end index clamps at last frame').toBe(4);
    expect(keyFrames.factor, 'factor set properly when clamped at last frame').toBe(1);
    keyFrames.setKeyFrames([[0, {
      value: 1
    }], [10, {
      value: 2
    }]]);
    keyFrames.setTime(5);
    expect(keyFrames.getStartTime(), 'setKeyFrames updates start times').toBe(0);
    expect(keyFrames.getEndTime(), 'setKeyFrames updates end times').toBe(10);
    expect(keyFrames.factor, 'factor updates after replacing key frames').toBe(0.5);
  });
}
