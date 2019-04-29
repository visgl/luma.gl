const WRAP_LOOP = 0;
const WRAP_CLAMP = 1;
const WRAP_MAP = {
  loop: WRAP_LOOP,
  clamp: WRAP_CLAMP
};

let ids = 0;

export class Timeline {
  constructor() {
    this.time = 0;
    this.channels = new Map();
    this.playing = false;
    this.lastEngineTime = -1;
  }

  addChannel(props, parent) {
    const {
      start = 0,
      end = Number.POSITIVE_INFINITY,
      wrapStart = 'loop',
      wrapEnd = 'loop',
      rate = 1
    } = props;

    const handle = ids++;
    const channel = {
      time: 0,
      start,
      end,
      wrapStart: WRAP_MAP[wrapStart] || WRAP_LOOP,
      wrapEnd: WRAP_MAP[wrapEnd] || WRAP_LOOP,
      rate
    };
    this._setChannelTime(channel, this.time);
    this.channels.set(handle, channel);

    return handle;
  }

  removeChannel(handle) {
    this.channels.delete(handle);
  }

  getTime() {
    return this.time;
  }

  getChannelTime(handle) {
    const channel = this.channels.get(handle);

    if (channel === undefined) {
      return -1;
    }

    return channel.time;
  }

  setTime(time) {
    this.time = time;
    const channels = this.channels.values();
    for (const channel of channels) {
      this._setChannelTime(channel, this.time);
    }
  }

  setChannelProps(handle, props = {}) {
    const channel = this.channels.get(handle);

    if (channel === undefined) {
      return;
    }

    const {start = channel.start, end = channel.end, rate = channel.rate} = props;

    channel.start = start;
    channel.end = end;
    channel.rate = rate;

    if (props.wrapStart) {
      channel.wrapStart = WRAP_MAP[props.wrapStart] || WRAP_LOOP;
    }

    if (props.wrapEnd) {
      channel.wrapEnd = WRAP_MAP[props.wrapEnd] || WRAP_LOOP;
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
    const channelStart = channel.start * channel.rate;
    const channelDuration = channel.end * channel.rate - channelStart;
    channel.time = time * channel.rate - channelStart;
    if (channel.time < 0) {
      if (channel.wrapStart === WRAP_LOOP) {
        if (channel.time < 0) {
          channel.time += Math.ceil(-channel.time / channelDuration) * channelDuration;
        }
        channel.time %= channelDuration;
      } else {
        channel.time = Math.max(0, channel.time);
      }
    }

    if (channel.time > channelDuration) {
      if (channel.wrapEnd === WRAP_LOOP) {
        channel.time %= channelDuration;
      } else {
        channel.time = Math.min(channel.time, channelDuration);
      }
    }
  }
}
