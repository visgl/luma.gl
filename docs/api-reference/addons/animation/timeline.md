# Timeline

Manages an animation timeline, with multiple channels that can be running at different rates, durations, etc. Many methods (`play`, `pause`) assume that the `update` method is being called once per frame with a "global time". This automatically done for `AnimationLoop.timeline` object.

## Parallel Times

The key concept at work in the `Timeline` is running multiple time frames in parallel:
* Global Time: The "system time" as determined by the application. Used by `Timeline` to determine the rate at which to play.
* Timeline Time: The "parent" time of all channels on the timeline. Can be played at the same rate as "Global Time" or manipulated manually.
* Channel Time: Will update in lock step with "Timeline Time", but may move at different rates, loop, etc. depending on channel parameters.

## Usage

Automatic update usage (assume `update` method is being called once per frame):
```js
animationLoop.attachTimeline(new Timeline());
const timeline = animationLoop.timeline;
const channel1 = timeline.addChannel({
  rate: 0.5,
  duration: 4000,
  repeat: Number.POSITIVE_INFINITY
});
const channel2 = timeline.addChannel({
  rate: 2,
  delay: 500,
  duration: 1000,
  repeat: 3
});

timeline.pause();
timeline.play();

model.setUniforms({
  uValue1: timeline.getTime(channel1);
  uValue2: timeline.getTime(channel2);
});
```

Manual usage:
```js
const timeline = new Timeline();
const channel1 = timeline.addChannel({
  rate: 0.5,
  duration: 4000,
  repeat: Number.POSITIVE_INFINITY
});
const channel2 = timeline.addChannel({
  rate: 2,
  delay: 500,
  duration: 1000,
  repeat: 3
});
timeline.setTime(500);

model.setUniforms({
  uValue1: timeline.getTime(channel1);
  uValue2: timeline.getTime(channel2);
});
```


## Methods

### addChannel([props: Object]) : Number

Add a new channel to the timeline. Returns a handle to the channel that can be use for subsequent interactions. Valid propeties are:
* `rate` the speed of the channel's time relative to timeline time.
* `delay` offset into timeline time at which channel time starts elapsing, in timeline time units.
* `duration` the length of the channel time frame, in timeline time units.
* `repeat` how many time to repeat channel time's timeline. Only meaningful if `duration` is finite.

### removeChannel(handle : Number)

Remove a channel from the timeline. `handle` should be a value that was returned by `addChannel`.

### getTime([handle : Number]) : Number

Return the current time of the channel indicated by `handle`. If no handle is provided, return timeline time.

### setTime(time : Number)

Set the timeline time to the given value.

### play

Allow timeline time to be updated by calls to `update`.

### pause

Prevent timeline time from being updated by calls to `update`.

### reset

Reset timeline time to `0`.

### attachAnimation(animation: Object, [channelHandle : Number]) : Number

Attach an animation object (can be any object with a `setTime` method, e.g. [KeyFrames](./key-frames.md), `GLTFAnimator`) to the timeline, optionally attached to a specific channel referenced by `channelHandle`.
The animation object's time will be updated whenever the timeline updates. Returns a handle that can be used to reference the animation attachement.

### detachAnimation(handle : Number)

Detach an animation object from the timeline. `handle` should be a value that was returned by `attachAnimation`.

### update(globalTime : Number)

Expected to be called once per frame, with whatever is considered the "system time". Required for `play` and `pause` to work properly.
