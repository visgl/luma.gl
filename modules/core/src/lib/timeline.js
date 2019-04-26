const WRAP_LOOP = 0;
const WRAP_CLAMP = 1;
const WRAP_MAP = {
  loop: WRAP_LOOP,
  clamp: WRAP_CLAMP
};

export class Timeline {
  constructor() {
    this.time = 0;
    this.duration = Number.POSITIVE_INFINITY;
    this.wrapMode = WRAP_LOOP;
    this.channels = [];
    this.rate = 1;
    this.playing = false;
    this.lastEngineTime = -1;
  }

  addChannel(props) {
    const {duration = Number.POSITIVE_INFINITY, wrapMode = 'loop', rate = 1} = props;

    const handle = this.channels.length;
    const channel = {
      time: 0,
      duration: duration * rate,
      wrapMode: WRAP_MAP[wrapMode],
      rate
    };
    this._setChannelTime(channel, this.time);
    this.channels.push(channel);

    return handle;
  }

  getTime() {
    return this.time;
  }

  getChannelTime(handle) {
    return this.channels[handle].time;
  }

  setTime(time) {
    this._setChannelTime(this, time);
    for (let i = 0, len = this.channels.length; i < len; ++i) {
      this._setChannelTime(this.channels[i], this.time);
    }
  }

  setChannelProps(handle, props = {}) {
    const channel = this.channels[handle];

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
    this.time = 0;
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
