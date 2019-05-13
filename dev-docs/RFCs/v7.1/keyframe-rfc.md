# RFC: Animation Key Frame Management in luma.gl

* **Author**: Tarek Sherif
* **Date**: May, 2019
* **Status**: **Draft**


## Summary

This RFC specifies a simple key frame management system.


## Background

luma.gl currently supports basic animations through the `AnimationLoop`'s [timeline object](animation-timeline-rfc.md). It allows for some flexibility in manipulating animations where the
only input is a `time` value. While this is all that is required for simple generative animations, more complex animations are often authored with [key frames](https://en.wikipedia.org/wiki/Key_frame),
where the input `time` value resolves to a pair of frames in the animation and an interpolation factor between them. Managing this resolution at the application level is complex,
and luma.gl could provide a simple mechanism to simplify setting up key frames and resolving them based on an input `time`. This system can be built upon `AnimationLoop.timeline` allowing key frames to take
advantage of the flexibility provided by that system.


## Customers

The Elevate team uses key frames heavily for their animations. They currently have to manage them explicitly at the application level, leading to complex error-prone code, and have inquired as
to what kind of support could be provided in luma.gl or deck.gl.


## Overview

A key frame manager that provides an API to set key frame times, and query the current key frame index and interpolation factor based on the current time provided by a `Timeline` object.


## Implementation

A `KeyFrames` class that is constructed with a `Timeline` object and optional `channel` handle. It will provide the following methods:
- setKeyFrames(): Takes an array of numbers that indicate the key frame times
- getIndex(): Returns the current key frame index (i.e. the index of the lower-bound time of the current key frame pair)
- getFactor(): Returns a value between 0 and 1 representing the interpolation factor between the current key frame pair


## Example

```js

const kf = new KeyFrames(timeline);

kf.setKeyFrames([
  0,
  500,   // In milliseconds
  800,
  1200,
  1500
]);

timeline.setTime(1000);

kf.getIndex();   // => 2    (i.e. between 800 and 1200)
kf.getFactor();  // => 0.5  (i.e. halfway between 800 and 1200)
```
