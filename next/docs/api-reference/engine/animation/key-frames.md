# KeyFrames

[AnimationLoop](https://luma.gl/next/docs/api-reference/engine/animation-loop.md)[Template](https://luma.gl/next/docs/api-reference/engine/animation-loop-template.md)[KeyFrames](https://luma.gl/next/docs/api-reference/engine/animation/key-frames.md)[Timeline](https://luma.gl/next/docs/api-reference/engine/animation/timeline.md)

Manages key frame animation data. Associates time points with arbitrary data and provides methods to access key times and data, and an interpolation factor, based on the current time.

## Usage[​](#usage "Direct link to Usage")

```
const keyFrames = new KeyFrames([
  [0, {val1: [1, 0, 1], val2: 0}],
  [500, {val1: [1, 1, 1], val2: 2}],
  [800, {val1: [0, 0, 1], val2: 1}],
  [1200, {val1: [0, 1, 0], val2: 4}],
  [1500, {val1: [1, 0, 1], val2: 5}]
]);

keyFrames.setTime(1000);

keyFrames.startIndex; // => 2                            (i.e. key frame at time=800)
keyFrames.endIndex; // => 3                            (i.e. key frame at time=1200)
keyFrames.factor; // => 0.5                          (i.e. halfway between 800 and 1200)
keyFrames.getStartTime(); // => 800                          (i.e. time at index 2)
keyFrames.getEndTime(); // => 1200                         (i.e. time at index 3)
keyFrames.getStartData(); // => { val1: [0, 0, 1], val2: 1}  (i.e. data at index 2)
keyFrames.getEndData(); // => { val1: [0, 1, 0], val2: 4}  (i.e. data at index 3)
```

## Properties[​](#properties "Direct link to Properties")

* `startIndex` (Number): Current start key frame index (i.e. the index of the key frame being interpolated from).
* `endIndex` (Number): Current end key frame index (i.e. the index of the key frame being interpolated to).
* `factor` (Number): A value between 0 and 1 representing the interpolation factor between the start and end key frame pair.

## Methods[​](#methods "Direct link to Methods")

### constructor(keyFrameData: Array)[​](#constructorkeyframedata-array "Direct link to constructor(keyFrameData: Array)")

Takes an array of `[time, data]` pairs to initialize the key frames.

### setKeyFrames(keyFrameData: Array)[​](#setkeyframeskeyframedata-array "Direct link to setKeyFrames(keyFrameData: Array)")

Replaces the current set of key frames with a new one. Takes the same argument as the constructor.

### getStartTime() : number[​](#getstarttime--number "Direct link to getStartTime() : number")

Returns the time at the current start key frame index.

### getEndTime() : number[​](#getendtime--number "Direct link to getEndTime() : number")

Returns the time at the current end key frame index.

### getStartData() : Any[​](#getstartdata--any "Direct link to getStartData() : Any")

Returns the data at the current start key frame index (i.e. the data being interpolated from).

### getEndData() : Any[​](#getenddata--any "Direct link to getEndData() : Any")

Returns the data at the current end key frame index (i.e. the data being interpolated to).

### setTime(time: number)[​](#settimetime-number "Direct link to setTime(time: number)")

Set the current time of the key frames.
