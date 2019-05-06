# RFC: Hiearchical Animation Timeline in luma.gl

* **Author**: Tarek Sherif
* **Date**: April, 2019
* **Status**: **Draft**


## Summary

This RFC specifies a timeline management system to facilitate coordination of disparate animation systems in a way that is easily controlled by the application.


## Background

luma.gl and deck.gl currently support a variety of animation types such as deck.gl attribute transitions and glTF asset animations. Currently, these animations are all driven by the luma.gl `AnimationLoop`'s `time` animation property, which essentially maps to wall time. The problem with this architecture is twofold:
1. Applications have no control over animations.
2. There is no way to coordinate multiple animations from these various systems. Application control would further exacerbate this, as all animations would have to independently track the current "animation time".

Animation systems generally consist of the of the following components, either implicitly or explicitly:
1. A `time` value that is used as input to the system.
2. A `target` value that is updated based on `time`, such as a uniform value or transform parameter. The update can be a simple simulation based directly on `time` or a more complex system involving interpolation between key frames using a function such as linear or bezier interpolation.

The timeline management system proposed in this RFC addresses the problem of coordinating animations solely by manipulating the first component, input `time`. A simple system that introduces application control of this value and allows it to be remapped using simple offset and scaling operations would allow for significantly richer animations to be used in deck.gl and luma.gl.

## Customers

The Elevate team has requested the ability to control transitions in deck.gl, specifically the ability to pause, play and scrub through an attribute transition.


## Overview

A timeline manager that can provide `time` values to be used in animations that are independent of wall time. The timeline manager should support the following features:

- play: provide a `time` value that elapses at the same rate as wall time
- pause: `time` remains constant at the current value
- set: set `time` to a specific value
- multiple `channels` that provide `channelTime` values, related to `time`, but with the following additional properties (all optional):
  * `rate`: (default `1`) a scaling factor that indicates how quickly `channelTime` elapses relative to `time`
  * `delay`: (default `0`) an offset into `time` at which `channelTime` begins elapsing (in units of `time`)
  * `duration`: (default `Infinity`) how long `channelTime` runs for (in units of `time`)
  * `repeat`: (default `1`) Number of times to repeat `channelTime` (only meaningful if `duration` has been set)

The `channels` provide a mechanism for orchestrating complex animations that elapse differently but all relative to the same base timeline.

## Example

A timeline with two channels:
- Channel 1:
  - rate: 0.5
  - delay: 1
  - duration: 4
  - repeat: 3
- Channel 2:
  - rate: 2
  - delay: 5
  - duration: 5
  - repeat: 1

```
                   pause  play
                     |     |
Wall time:      0----5----10----15----20
time:           0----5     5----10----15
channelTime 1:   0---2     2---2---2
channelTime 2:             0----10
```

## Implementation

`AnimatonLoop` will have a new `timeline` property which is an instance of the class `Timeline`. The `Timeline` class will provide the following methods:

- `play`: elapse `time` automatically with wall time
- `pause`: stop elapsing `time` automatically with wall time
- `reset`: set `time` to 0
- `setTime(time)`: set `time` to a specific value
- `getTime(handle)`: get the current `channelTime` from the `channel` indicated by `handle`. If no handle provided, get current `time`
- `addChannel(props)`: create a new channel with given properties and return a handle to it
- `removeChannel(handle)`: remove a channel from the timeline

The `AnimationLoop` will update `timeline` each frame with the current `engineTime` (time since startup), which the `timeline` can use to update `time` if it is playing.

The `time` property provided in `animationProps` will be the value returned by `AnimationLoop.timeline.getTime()`. This will ensure that all animations tracking `animationProps.time` will follow timeline controls rather than wall time.

`AnimationLoop.timeline` will also be passed in `animatonProps` so that applications can easily manipulate it.


## Integration with GLTFAnimaton

Integration with `GLTFAnimation`should amount to simply passing the timeline object, and optionally a channel handle to the constructor. Then the [animate method](https://github.com/uber/luma.gl/blob/7.0-release/modules/addons/src/gltf/gltf-animator.js) would simply use `timeline.getTime()` to update rather than receiving the `timeMs` argument.

Significant advantages of this approach over the current one are that animation become controlable by the application and it becomes straightforward to orchestrate multiple glTF animations of arbitrary duration into customizable application-defined animation sequences.

