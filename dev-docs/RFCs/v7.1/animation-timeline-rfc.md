# RFC: Hiearchical Animation Timeline in luma.gl

* **Author**: Tarek Sherif
* **Date**: April, 2019
* **Status**: **Draft**


## Summary

This RFC specifies a timeline management system to facilate more complex animations that can be easily controlled by the application.


## Background

Currently, the only support for animation provided by luma.gl is the passing of elapsed wall time and frame counts as `animationProps`. This pushes all orchestration of animation to the application, which can end up being quite complex. Since systems like deck.gl's transitions and luma.gl's uniform animations track `animationProps` time, there is no way to control them independantly of wall time.


## Customers

The Elevate team has requested the ability to control transitions in deck.gl, specifically, the ability to pause, play and scrub through a transition.


## Overview

A timeline manager that can provide `time` values to be used in animations that are independent of wall time. The timeline manager should support the following features:

- play: provide a `time` value that elapses at the same rate as wall time
- pause: `time` remains constant at the current value
- set: set `time` to a specific value
- multiple `channels` that provide `channelTime` values, related to `time`, but with the following additional properties (all optional):
  * `rate`: (default `1`) a scaling factor that indicates how quickly `channelTime` elapses relative to `time`
  * `delay`: (default `0`) an offset into `time` at which `channelTime` begins elapsing
  * `duration`: (default `Infinity`) how long `channelTime` runs for
  * `repeat`: (default `1`) Number of times to repeat `channelTime` (only meaningful if `duration` has been set)

The `channels` provide a mechanism for orchestrating complex animatons that elapse differently but all relative to the same base timeline.

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

## Implentation

`AnimatonLoop` will have a new `timeline` property which is an instance of the class `Timeline`. The `Timeline` class will provide the following methods:

- `play`: elapse `time` automatically with wall time
- `pause`: stop elapsing `time` automatically with wall time
- `reset`: set `time` to 0
- `setTime(time)`: set `time` to a specific value
- `getTime`: get current `time`
- `addChannel(props)`: create a new channel with given properties and return a handle to it
- `getChannelTime(handle)`: get the current `channelTime` from the `channel` indicated by `handle`
- `removeChannel(handle)`: remove a channel from the timeline

The `time` property provided in `animationProps` will be the value returned by `animationLoop.timeline.getTime()`. This will ensure that all animations tracking `animationProps.time` will follow timeline controls rather than wall time. `animationLoop.timeline` will also be passed in `animatonProps` so that applications can easily manipulate it.

