interface ChannelProps {
  delay?: number
  duration?: number
  rate?: number
  repeat?: number
}

interface Channel {
  time: number
  delay: number
  duration: number
  rate: number
  repeat: number
}

interface Animation {
  setTime: (time: number) => void
}

export class Timeline {
  time: number
  channels: Map<number, Channel>
  animations: Map<number, Animation>
  playing: boolean
  lastEngineTime: number
  constructor();
  addChannel(props: ChannelProps): number;
  removeChannel(handle: number): void;
  isFinished(handle: number): boolean;
  getTime(handle?: number): any;
  setTime(time: number): void;
  play(): void;
  pause(): void;
  reset(): void;
  attachAnimation(animation: Animation, channelHandle: any): number;
  detachAnimation(handle: number): void;
  update(engineTime: number): void;
  _setChannelTime(channel: Channel, time: number): void;
}
