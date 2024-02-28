// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * Timeline channel properties
 * @param delay = 0;
 * @param duration = Number.POSITIVE_INFINITY;
 * @param rate = 1
 * @param repeat = 1
 */
export type ChannelOptions = {
  delay?: number;
  duration?: number;
  rate?: number;
  repeat?: number;
};

export type AnimationOptions = {
  setTime: (time: number) => void;
};

type Channel = {
  time: number;
  delay: number;
  duration: number;
  rate: number;
  repeat: number;
};

type Animation = {
  channel?: number;
  animation: {
    setTime: (time: number) => void;
  };
};

let channelHandles = 1;
let animationHandles = 1;

export class Timeline {
  time: number = 0;
  channels = new Map<number, Channel>();
  animations = new Map<number, Animation>();
  playing: boolean = false;
  lastEngineTime: number = -1;

  constructor() {}

  addChannel(props: ChannelOptions): number {
    const {delay = 0, duration = Number.POSITIVE_INFINITY, rate = 1, repeat = 1} = props;

    const channelId = channelHandles++;
    const channel: Channel = {
      time: 0,
      delay,
      duration,
      rate,
      repeat
    };
    this._setChannelTime(channel, this.time);
    this.channels.set(channelId, channel);

    return channelId;
  }

  removeChannel(channelId: number): void {
    this.channels.delete(channelId);

    for (const [animationHandle, animation] of this.animations) {
      if (animation.channel === channelId) {
        this.detachAnimation(animationHandle);
      }
    }
  }

  isFinished(channelId: number): boolean {
    const channel = this.channels.get(channelId);
    if (channel === undefined) {
      return false;
    }

    return this.time >= channel.delay + channel.duration * channel.repeat;
  }

  getTime(channelId?: number): number {
    if (channelId === undefined) {
      return this.time;
    }

    const channel = this.channels.get(channelId);

    if (channel === undefined) {
      return -1;
    }

    return channel.time;
  }

  setTime(time: number): void {
    this.time = Math.max(0, time);

    const channels = this.channels.values();
    for (const channel of channels) {
      this._setChannelTime(channel, this.time);
    }

    const animations = this.animations.values();
    for (const animationData of animations) {
      const {animation, channel} = animationData;
      animation.setTime(this.getTime(channel));
    }
  }

  play(): void {
    this.playing = true;
  }

  pause(): void {
    this.playing = false;
    this.lastEngineTime = -1;
  }

  reset(): void {
    this.setTime(0);
  }

  attachAnimation(animation: AnimationOptions, channelHandle?: number): number {
    const animationHandle = animationHandles++;

    this.animations.set(animationHandle, {
      animation,
      channel: channelHandle
    });

    animation.setTime(this.getTime(channelHandle));

    return animationHandle;
  }

  detachAnimation(channelId: number): void {
    this.animations.delete(channelId);
  }

  update(engineTime: number): void {
    if (this.playing) {
      if (this.lastEngineTime === -1) {
        this.lastEngineTime = engineTime;
      }
      this.setTime(this.time + (engineTime - this.lastEngineTime));
      this.lastEngineTime = engineTime;
    }
  }

  _setChannelTime(channel: Channel, time: number): void {
    const offsetTime = time - channel.delay;
    const totalDuration = channel.duration * channel.repeat;
    // Note(Tarek): Don't loop on final repeat.
    if (offsetTime >= totalDuration) {
      channel.time = channel.duration * channel.rate;
    } else {
      channel.time = Math.max(0, offsetTime) % channel.duration;
      channel.time *= channel.rate;
    }
  }
}
