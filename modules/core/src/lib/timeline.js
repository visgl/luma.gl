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
    this.duration = Number.POSITIVE_INFINITY;
    this.wrapMode = WRAP_LOOP;
    this.channels = new Map();
    this.rate = 1;
    this.playing = false;
    this.lastEngineTime = -1;
  }

  addChannel(props) {
    const {duration = Number.POSITIVE_INFINITY, wrapMode = 'loop', rate = 1} = props;

    const handle = ids++;
    const channel = {
      time: 0,
      duration: duration * rate,
      wrapMode: WRAP_MAP[wrapMode],
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
    this._setChannelTime(this, time);
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

    const {duration = channel.duration, rate = channel.rate} = props;

    channel.duration = duration;
    channel.rate = rate;

    if (props.wrapMode) {
      channel.wrapMode = WRAP_MAP[props.wrapMode];
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
    channel.time = time * channel.rate;
    if (channel.wrapMode === WRAP_LOOP) {
      channel.time %= channel.duration;
    } else {
      channel.time = Math.max(0, Math.min(channel.time, channel.duration));
    }
  }
}
