let channelHandles = 1;
let animationHandles = 1;

export class Timeline {
  constructor() {
    this.time = 0;
    this.channels = new Map();
    this.animations = new Map();
    this.playing = false;
    this.lastEngineTime = -1;
  }

  addChannel(props) {
    const {delay = 0, duration = Number.POSITIVE_INFINITY, rate = 1, repeat = 1} = props;

    const handle = channelHandles++;
    const channel = {
      time: 0,
      delay,
      duration,
      rate,
      repeat
    };
    this._setChannelTime(channel, this.time);
    this.channels.set(handle, channel);

    return handle;
  }

  removeChannel(handle) {
    this.channels.delete(handle);

    for (const [animationHandle, animation] of this.animations) {
      if (animation.channel === handle) {
        this.detachAnimation(animationHandle);
      }
    }
  }

  isFinished(handle) {
    const channel = this.channels.get(handle);
    if (channel === undefined) {
      return false;
    }

    return this.time >= channel.delay + channel.duration * channel.repeat;
  }

  getTime(handle) {
    if (handle === undefined) {
      return this.time;
    }

    const channel = this.channels.get(handle);

    if (channel === undefined) {
      return -1;
    }

    return channel.time;
  }

  setTime(time) {
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

  play() {
    this.playing = true;
  }

  pause() {
    this.playing = false;
    this.lastEngineTime = -1;
  }

  reset() {
    this.setTime(0);
  }

  attachAnimation(animation, channelHandle) {
    const animationHandle = animationHandles++;

    this.animations.set(animationHandle, {
      animation,
      channel: channelHandle
    });

    animation.setTime(this.getTime(channelHandle));

    return animationHandle;
  }

  detachAnimation(handle) {
    this.animations.delete(handle);
  }

  update(engineTime) {
    if (this.playing) {
      if (this.lastEngineTime === -1) {
        this.lastEngineTime = engineTime;
      }
      this.setTime(this.time + (engineTime - this.lastEngineTime));
      this.lastEngineTime = engineTime;
    }
  }

  _setChannelTime(channel, time) {
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
