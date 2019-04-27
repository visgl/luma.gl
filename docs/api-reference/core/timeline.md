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
const timeline = animationLoop.timeline;
const channel1 = timeline.addChannel({
  rate: 0.5,
  start: 1000,
  end: 4000,
  wrapStart: "loop"
  wrapEnd: "loop"
});
const channel2 = timeline.addChannel({
  rate: 2,
  start: 2000,
  end: 6000,
  wrapStart: "clamp"
  wrapEnd: "clamp"
});

timeline.pause();
timeline.play();

model.setUniforms({
  uValue1: timeline.getChannelTime(channel1);
  uValue2: timeline.getChannelTime(channel2);
});
```

Manual usage:
```js
const timeline = new Timeline();
const channel1 = timeline.addChannel({
  rate: 0.5,
  start: 1000,
  end: 4000,
  wrapStart: "loop"
  wrapEnd: "loop"
});
const channel2 = timeline.addChannel({
  rate: 2,
  start: 2000,
  end: 6000,
  wrapStart: "clamp"
  wrapEnd: "clamp"
});
timeline.setTime(500);

model.setUniforms({
  uValue1: timeline.getChannelTime(channel1);
  uValue2: timeline.getChannelTime(channel2);
});
```


## Methods

### addChannel([props: Object]) : Number

Add a new channel to the timeline. Returns a handle to the channel that can be use for subsequent interactions. Valid propeties are:
* `rate` the speed of the channel's time relative to timeline time.
* `duration` the length of the channel time frame.
* `wrapMode` what to do when the timeline time moves outside the channels duration. "loop" repeat the channels timeframe, "clamp"
  will clamp the channel's time to the range (0, duration).

### getTime: Number

Return the current timeline time.

### getChannelTime(handle : Number) : Number

Return the current time of the channel indicated by `handle`.

### setTime(time : Number)

Set the timeline time to the given value.

### setChannelProps(handle : Number, [props: Object])

Update channel indicated by `handle` with the properties given in `props`. Valid propeties are:
* `rate` the speed of the channel's time relative to timeline time.
* `start` when the channel time begins in timeline time.
* `end` when the channel time end in timeline time.
* `wrapStart` what to do when the timeline time is less than `start` time. "loop" repeat the channels timeframe, "clamp" will clamp the channel's time the channel's `start` time.
* `wrapStart` what to do when the timeline time is greater than `end` time. "loop" repeat the channels timeframe, "clamp" will clamp the channel's time to the channel's `end` time.

### play

Allow timeline time to be updated by calls to `update`.

### pause

Prevent timeline time from being updated by calls to `update`.

### reset

Reset timeline time to `0`.

### update(globalTime : Number)

Expected to be called once per frame, with whatever is considered the "system time". Required for `play` and `pause` to work properly.
