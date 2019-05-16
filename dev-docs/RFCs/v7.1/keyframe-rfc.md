# RFC: Animation Key Frame Management in luma.gl

* **Author**: Tarek Sherif
* **Date**: May, 2019
* **Status**: **Approved**


## Summary

This RFC specifies a simple key frame management system.


## Background

luma.gl currently supports basic animations through the `AnimationLoop`'s [timeline object](animation-timeline-rfc.md). It allows for some flexibility in manipulating animations where the
only input is a `time` value. While this is all that is required for simple generative animations, more complex animations are often authored with [key frames](https://en.wikipedia.org/wiki/Key_frame),
where the input `time` value resolves to a pair of frames in the animation and an interpolation factor between them. Managing this resolution at the application level is complex,
and luma.gl could provide a simple mechanism to simplify setting up key frames and resolving them based on an input `time`.

At the most basic level, such a system would simply allow the application to define the key frame time points and associate arbitrary data with them. It would then provide a simple API to query the currently active key frame pair
based on input `time`, the data associated with those key frames, and the current interpolation factor between them. The input `time` itself can be queried from `AnimationLoop.timeline` allowing key frames to take advantage of the flexibility provided by that system.


## Customers

The Elevate team uses key frames heavily for their animations. They currently have to manage them explicitly at the application level, leading to complex error-prone code, and have inquired as
to what kind of support could be provided in luma.gl or deck.gl.


## Overview

The proposed key frame manager will allow the application to define key frames as a simple pair: a time value in milliseconds and some arbitrary data associated with that time point. The semantics of the data will be left
completely up to the application. The key frame manager will not attempt to actually interpolate the data as that would require knowledge of the data being used by the application and add unnecessary complexity to the proposed API. Instead, the key frame manager will provide the application with all data needed to perform the correct interpolation:
- Index and application data of the start key frame
- Index and application data of the end key frame
- The factor to use to interpolate between the start and end key frames


The `Timeline` class will be minimally extended to support attaching "animations", defined as any object with a `setTime` method. When a timelime's time value is updated, it will cascade that update down to any objects attached in this way.

## Implementation

A `KeyFrames` class that is constructed from an array of [time, data] pairs that represent the key frame times and application data associated with them. It will provide the following methods:
- setKeyFrames(): Replaces the current set of key frames with a new one. Takes the same argument as the constructor
- getStartIndex(): Returns the current start key frame index (i.e. the index of the key frame being interpolated from)
- getEndIndex(): Returns the current end key frame index (i.e. the index of the key frame being interpolated to)
- getStartData(): Returns the data at the current start key frame index (i.e. the data being interpolated from)
- getEndData(): Returns the data at the current end key frame index (i.e. the data being interpolated to)
- getFactor(): Returns a value between 0 and 1 representing the interpolation factor between the start and end key frames pair
- setTime(): Set the current time of the key frames

The `Timeline` class will be extended with two methods:
- `attachAnimation`: takes an animation object (i.e. any object with a `setTime` method) and optionally a channel handle, and will update that object's time whenever `Timeline.setTime()` is called. Returns a handle to that animations attachment point.
- `detachAnimation`: takes an animation attachment handle and detaches the associated animation from the timeline.


## Example

```js

const kf = new KeyFrames([
  [0, { val1: [1, 0, 1], val2: 0} ],
  [500, { val1: [1, 1, 1], val2: 2} ],
  [800, { val1: [0, 0, 1], val2: 1} ],
  [1200, { val1: [0, 1, 0], val2: 4} ],
  [1500, { val1: [1, 0, 1], val2: 5} ]
]);

const handle = timeline.attachAnimation(kf, channel);

timeline.setTime(1000);

kf.getStartIndex(); // => 2                            (i.e. key frame at time=800)
kf.getEndIndex();   // => 3                            (i.e. key frame at time=1200)
kf.getStartData()   // => { val1: [0, 0, 1], val2: 1}  (i.e. data at index 2)
kf.getEndData()     // => { val1: [0, 1, 0], val2: 4}  (i.e. data at index 3)
kf.getFactor();     // => 0.5                          (i.e. halfway between 800 and 1200)

timeline.detachAnimation(handle);
```
