// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const VIDEO_TEXTURE_INFO_HTML = `\
<p>
Wraps a live <code>VideoTexture</code> around a rotating <code>CylinderGeometry</code>.
WebGL samples the copied <code>sampler2D</code> path; WebGPU samples the native
<code>texture_external</code> path when the browser supports it.
</p>
`;

type VideoScrubberProps = {
  onPlay: (fromTime: number) => void;
  onPause: () => void;
  onSeek: (timeSeconds: number) => void;
};

export class VideoScrubber {
  private readonly props: VideoScrubberProps;
  private container: HTMLDivElement | null = null;
  private scrubber: HTMLInputElement | null = null;
  private timeDisplay: HTMLSpanElement | null = null;
  private playButton: HTMLButtonElement | null = null;
  private isPlaying = false;

  constructor(props: VideoScrubberProps) {
    this.props = props;
  }

  show(duration: number): void {
    this.createElements();
    this.scrubber!.max = String(duration);
    this.setTime(0);
    this.container!.style.display = 'flex';
  }

  hide(): void {
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  setPlaying(isPlaying: boolean): void {
    this.isPlaying = isPlaying;
    if (this.playButton) {
      this.playButton.textContent = isPlaying ? '⏸' : '▶';
    }
  }

  setTime(timeSeconds: number): void {
    if (this.scrubber) {
      this.scrubber.value = String(timeSeconds);
    }
    if (this.timeDisplay) {
      const minutes = Math.floor(timeSeconds / 60);
      const seconds = Math.floor(timeSeconds % 60);
      const centiseconds = Math.floor((timeSeconds % 1) * 100);
      this.timeDisplay.textContent = `${minutes}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
    }
  }

  destroy(): void {
    this.container?.remove();
    this.container = null;
    this.scrubber = null;
    this.timeDisplay = null;
    this.playButton = null;
  }

  private createElements(): void {
    if (this.container) {
      return;
    }

    this.container = document.createElement('div');
    this.container.style.cssText =
      'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);' +
      'display:flex;align-items:center;gap:10px;padding:8px 16px;' +
      'background:rgba(0,0,0,0.75);border-radius:8px;z-index:1000;';

    this.playButton = document.createElement('button');
    this.playButton.textContent = '▶';
    this.playButton.style.cssText =
      'background:none;border:none;color:#fff;font-size:18px;cursor:pointer;padding:0 4px;';
    this.playButton.addEventListener('click', () => {
      if (this.isPlaying) {
        this.props.onPause();
      } else {
        this.props.onPlay(Number(this.scrubber?.value ?? 0));
      }
    });

    this.scrubber = document.createElement('input');
    this.scrubber.type = 'range';
    this.scrubber.min = '0';
    this.scrubber.step = 'any';
    this.scrubber.style.cssText = 'width:320px;cursor:pointer;';
    this.scrubber.addEventListener('input', () => {
      const timeSeconds = Number(this.scrubber!.value);
      this.props.onSeek(timeSeconds);
      this.setTime(timeSeconds);
    });

    this.timeDisplay = document.createElement('span');
    this.timeDisplay.style.cssText = 'color:#fff;font:12px monospace;min-width:80px;';

    this.container.append(this.playButton, this.scrubber, this.timeDisplay);
    document.body.appendChild(this.container);
  }
}
