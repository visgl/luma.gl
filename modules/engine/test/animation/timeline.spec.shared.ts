import {expect, test} from 'vitest';
import { Timeline } from '@luma.gl/engine';

// NOTE(Tarek): This is for the x * CHANNEL1_RATE
// lines, which are important for clarity.
/* eslint-disable no-implicit-coercion */
export function registerTimelineTests(): void {
  test('Animation#Timeline', () => {
    const timeline = new Timeline();
    timeline.pause();
    timeline.reset();
    expect(timeline.getTime(), 'Timeline was reset').toBe(0);
    expect(!timeline.isFinished(-1), 'Unknown channels are never finished').toBeTruthy();
    const defaultChannel = timeline.addChannel({});
    expect(timeline.getTime(defaultChannel), 'Default channel starts at 0').toBe(0);
    timeline.removeChannel(99999);
    expect(timeline.getTime(defaultChannel), 'Removing unknown channels is a no-op').toBe(0);
    const CHANNEL1_RATE = 2;
    const CHANNEL2_RATE = 3;
    const channel1 = timeline.addChannel({
      rate: CHANNEL1_RATE,
      delay: 2,
      duration: 4,
      repeat: 1
    });
    const channel2 = timeline.addChannel({
      rate: CHANNEL2_RATE,
      delay: 3,
      duration: 3,
      repeat: 2
    });
    const animationBase = {
      time: 0,
      setTime(time) {
        this.time = time;
      }
    };
    const animationChannel1 = {
      time: 0,
      setTime(time) {
        this.time = time;
      }
    };
    const animationBaseHandle = timeline.attachAnimation(animationBase);
    timeline.attachAnimation(animationChannel1, channel1); // Will be deleted when channel is removed

    expect(timeline.getTime(channel1), 'Channel 1 initialized').toBe(0 * CHANNEL1_RATE);
    expect(timeline.getTime(channel2), 'Channel 2 initialized').toBe(0 * CHANNEL2_RATE);
    expect(animationBase.time, 'Animation updated for base timeline').toBe(timeline.getTime());
    expect(animationChannel1.time, 'Animation updated for channel timeline').toBe(timeline.getTime(channel1));
    timeline.setTime(1);
    expect(timeline.getTime(), 'Timeline was set').toBe(1);
    expect(timeline.getTime(channel1), 'Channel 1 time does not elapse before delay').toBe(0 * CHANNEL1_RATE);
    expect(timeline.getTime(channel2), 'Channel 2 time does not elapse before delay').toBe(0 * CHANNEL2_RATE);
    timeline.setTime(4);
    expect(timeline.getTime(channel1), 'Channel 1 set').toBe(2 * CHANNEL1_RATE);
    expect(!timeline.isFinished(channel1), 'Channel 1 is not finished').toBeTruthy();
    expect(timeline.getTime(channel2), 'Channel 2 set').toBe(1 * CHANNEL2_RATE);
    expect(!timeline.isFinished(channel2), 'Channel 2 is not finished').toBeTruthy();
    expect(animationBase.time, 'Animation updated for base timeline').toBe(timeline.getTime());
    expect(animationChannel1.time, 'Animation updated for channel timeline').toBe(timeline.getTime(channel1));
    timeline.setTime(7);
    expect(timeline.getTime(channel1), 'Channel 1 does not loop').toBe(4 * CHANNEL1_RATE);
    expect(timeline.isFinished(channel1), 'Channel 1 is finished').toBeTruthy();
    expect(timeline.getTime(channel2), 'Channel 2 looped once').toBe(1 * CHANNEL2_RATE);
    expect(!timeline.isFinished(channel2), 'Channel 2 is not finished').toBeTruthy();
    expect(animationBase.time, 'Animation updated for base timeline').toBe(timeline.getTime());
    expect(animationChannel1.time, 'Animation updated for channel timeline').toBe(timeline.getTime(channel1));
    timeline.setTime(10);
    expect(timeline.getTime(channel1), 'Channel 1 does not loop').toBe(4 * CHANNEL1_RATE);
    expect(timeline.isFinished(channel1), 'Channel 1 is finished').toBeTruthy();
    expect(timeline.getTime(channel2), 'Channel 2 only looped once').toBe(3 * CHANNEL2_RATE);
    expect(timeline.isFinished(channel2), 'Channel 2 is finished').toBeTruthy();
    expect(animationBase.time, 'Animation updated for base timeline').toBe(timeline.getTime());
    expect(animationChannel1.time, 'Animation updated for channel timeline').toBe(timeline.getTime(channel1));
    timeline.reset();
    expect(timeline.getTime(), 'Timeline was reset').toBe(0);
    timeline.play();
    timeline.update(4);
    expect(timeline.getTime(), 'First update while playing seeds engine time').toBe(0);
    timeline.update(8);
    expect(timeline.getTime(), 'Timeline was set on update while playing').toBe(4);
    expect(timeline.getTime(channel1), 'Channel 1 was set on update while playing').toBe(2 * CHANNEL1_RATE);
    expect(timeline.getTime(channel2), 'Channel 2 was set on update while playing').toBe(1 * CHANNEL2_RATE);
    timeline.reset();
    expect(timeline.getTime(), 'Timeline was reset').toBe(0);
    timeline.pause();
    timeline.update(4);
    timeline.update(8);
    expect(timeline.getTime(), 'Timeline was not set on update while paused').toBe(0);
    expect(timeline.getTime(channel1), 'Channel 1 was not set on update while paused').toBe(0 * CHANNEL1_RATE);
    expect(timeline.getTime(channel2), 'Channel 2 was not set on update while paused').toBe(0 * CHANNEL2_RATE);
    const baseAnimationTime = animationBase.time;
    timeline.detachAnimation(animationBaseHandle);
    timeline.setTime(timeline.getTime() + 1);
    expect(animationBase.time, 'Animation was detached').toBe(baseAnimationTime);
    const channel1AnimationTime = animationChannel1.time;
    timeline.removeChannel(channel1);
    expect(timeline.getTime(channel1), 'Channel 1 was deleted').toBe(-1);
    timeline.setTime(timeline.getTime() + 1);
    expect(animationChannel1.time, 'Channel deletion detaches animation').toBe(channel1AnimationTime);
  });
}
