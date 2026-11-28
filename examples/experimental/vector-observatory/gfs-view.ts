// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {FlowTrajectorySnapshot} from '@luma.gl/graph/experimental-simulation';
import {GFS_COLORS, GFS_FIXTURE, measureGfsFrames} from './gfs-data';

/** Canvas coordinates for the regional geographic chart. */
type Rectangle = {left: number; top: number; width: number; height: number};
/** CPU presentation of explicitly retained GPU trajectories; never reads live particle buffers. */
export class GfsView {
  private readonly context: CanvasRenderingContext2D;
  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly earth: HTMLImageElement
  ) {
    this.context = canvas.getContext('2d')!;
  }

  /** Draw retained GPU paths, archived vectors and independent reference tracks. */
  draw(frames: FlowTrajectorySnapshot[], time: number): void {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    const ratio = Math.min(2, window.devicePixelRatio);
    if (
      this.canvas.width !== Math.round(width * ratio) ||
      this.canvas.height !== Math.round(height * ratio)
    ) {
      this.canvas.width = Math.round(width * ratio);
      this.canvas.height = Math.round(height * ratio);
    }
    const context = this.context;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.fillStyle = '#050c14';
    context.fillRect(0, 0, width, height);
    const compact = width < 850;
    const available = compact ? width - 80 : width - 370;
    const mapHeight = Math.max(120, Math.min(height - 285, available / 0.82));
    const map: Rectangle = {
      left: Math.max(40, (available - mapHeight * 0.82) / 2),
      top: 145,
      width: mapHeight * 0.82,
      height: mapHeight
    };
    context.font = '11px system-ui';
    context.fillStyle = '#7ef5db';
    context.fillText('ARCHIVED ATMOSPHERE / NORTH ATLANTIC', map.left, 113);
    context.font = `${compact ? 19 : 27}px system-ui`;
    context.fillStyle = '#eef7fa';
    context.fillText(
      new Date(Date.parse(GFS_FIXTURE.snapshots[0].date) + time * 1000)
        .toISOString()
        .slice(0, 16)
        .replace('T', ' ') + ' UTC',
      map.left,
      138
    );
    context.save();
    context.beginPath();
    context.rect(map.left, map.top, map.width, map.height);
    context.clip();
    context.globalAlpha = 0.55;
    context.drawImage(
      this.earth,
      (this.earth.width * 95) / 360,
      (this.earth.height * 40) / 180,
      this.earth.width / 12,
      this.earth.height / 6,
      map.left,
      map.top,
      map.width,
      map.height
    );
    context.globalAlpha = 1;
    context.fillStyle = '#07162666';
    context.fillRect(map.left, map.top, map.width, map.height);
    const fraction = time / 21600;
    context.strokeStyle = '#9adce44d';
    context.lineWidth = 0.7;
    for (let row = 1; row < 30; row += 2) {
      for (let column = 1; column < 30; column += 2) {
        const index = row * 31 + column;
        const eastward =
          (1 - fraction) * GFS_FIXTURE.snapshots[0].eastward[index] +
          fraction * GFS_FIXTURE.snapshots[1].eastward[index];
        const northward =
          (1 - fraction) * GFS_FIXTURE.snapshots[0].northward[index] +
          fraction * GFS_FIXTURE.snapshots[1].northward[index];
        const horizontal = map.left + (column / 30) * map.width;
        const vertical = map.top + (1 - row / 30) * map.height;
        const scale = Math.min(0.8, map.height / 600);
        const tipHorizontal = horizontal + eastward * scale;
        const tipVertical = vertical - northward * scale;
        const angle = Math.atan2(-northward, eastward);
        context.beginPath();
        context.moveTo(horizontal, vertical);
        context.lineTo(tipHorizontal, tipVertical);
        context.lineTo(
          tipHorizontal - 3 * Math.cos(angle - 0.5),
          tipVertical - 3 * Math.sin(angle - 0.5)
        );
        context.moveTo(tipHorizontal, tipVertical);
        context.lineTo(
          tipHorizontal - 3 * Math.cos(angle + 0.5),
          tipVertical - 3 * Math.sin(angle + 0.5)
        );
        context.stroke();
      }
    }
    const last = Math.min(frames.length - 1, Math.floor(time / 300));
    if (last >= 0) {
      context.lineWidth = 1;
      context.strokeStyle = '#57d9e369';
      for (let particle = 4; particle < frames[last].particles.length / 4; particle++) {
        context.beginPath();
        for (let frameIndex = Math.max(0, last - 8); frameIndex <= last; frameIndex++) {
          const particles = frames[frameIndex].particles;
          const horizontal = map.left + particles[particle * 4] * map.width;
          const vertical = map.top + (1 - particles[particle * 4 + 1]) * map.height;
          if (frameIndex === Math.max(0, last - 8)) context.moveTo(horizontal, vertical);
          else context.lineTo(horizontal, vertical);
        }
        context.stroke();
      }
      for (let particle = 0; particle < 4; particle++)
        this.drawRelease(map, frames, last, particle, [-85, 20, -55, 50], true);
    }
    context.restore();
    context.strokeStyle = '#45606b';
    context.lineWidth = 1;
    context.strokeRect(map.left, map.top, map.width, map.height);
    context.font = '10px system-ui';
    context.fillStyle = '#9ab1bf';
    for (let tick = 0; tick <= 6; tick++) {
      const horizontal = map.left + (tick / 6) * map.width;
      const vertical = map.top + (1 - tick / 6) * map.height;
      context.fillText(`${85 - tick * 5}°W`, horizontal - 10, map.top + map.height + 18);
      context.fillText(`${20 + tick * 5}°N`, map.left - 35, vertical + 3);
    }
    context.fillText(
      '10 m winds · 1° grid · two snapshots · 1,028 GPU trajectories',
      map.left,
      map.top + map.height + 42
    );
    if (!compact && last >= 0) {
      const errors = measureGfsFrames(frames);
      const cardHeight = Math.min(135, (height - 165) / 4);
      for (let particle = 0; particle < 4; particle++) {
        const card: Rectangle = {
          left: width - 305,
          top: 120 + particle * cardHeight,
          width: 260,
          height: cardHeight - 16
        };
        context.fillStyle = '#0c1a27';
        context.fillRect(card.left, card.top, card.width, card.height);
        context.font = '12px system-ui';
        context.fillStyle = GFS_COLORS[particle];
        context.fillText(`RELEASE ${particle + 1}`, card.left + 12, card.top + 20);
        context.fillStyle = '#b7cbd4';
        context.font = '11px system-ui';
        context.fillText(
          `${errors[particle].toFixed(2)} m max hourly error`,
          card.left + 104,
          card.top + 20
        );
        const reference = GFS_FIXTURE.reference.frames.map(frame => frame.positions[particle]);
        const west = Math.min(...reference.map(position => position[0])) - 0.2;
        const south = Math.min(...reference.map(position => position[1])) - 0.2;
        const east = Math.max(...reference.map(position => position[0])) + 0.2;
        const north = Math.max(...reference.map(position => position[1])) + 0.2;
        const inset = {
          left: card.left + 15,
          top: card.top + 35,
          width: card.width - 30,
          height: card.height - 50
        };
        this.drawRelease(inset, frames, last, particle, [west, south, east, north], false);
      }
    }
  }

  /** Magnified release comparison; white dashes are independent CPU hourly samples. */
  private drawRelease(
    rectangle: Rectangle,
    frames: FlowTrajectorySnapshot[],
    last: number,
    particle: number,
    bounds: number[],
    label: boolean
  ): void {
    const context = this.context;
    const project = (longitude: number, latitude: number): [number, number] => [
      rectangle.left + ((longitude - bounds[0]) / (bounds[2] - bounds[0])) * rectangle.width,
      rectangle.top + ((bounds[3] - latitude) / (bounds[3] - bounds[1])) * rectangle.height
    ];
    context.strokeStyle = '#ffffffaa';
    context.lineWidth = 1.5;
    context.setLineDash([3, 4]);
    context.beginPath();
    for (let index = 0; index < GFS_FIXTURE.reference.frames.length; index++) {
      const position = GFS_FIXTURE.reference.frames[index].positions[particle];
      const point = project(position[0], position[1]);
      if (index === 0) context.moveTo(...point);
      else context.lineTo(...point);
    }
    context.stroke();
    context.setLineDash([]);
    context.strokeStyle = GFS_COLORS[particle];
    context.lineWidth = 2;
    context.beginPath();
    for (let index = 0; index <= last; index++) {
      const state = frames[index].particles;
      const point = project(-85 + state[particle * 4] * 30, 20 + state[particle * 4 + 1] * 30);
      if (index === 0) context.moveTo(...point);
      else context.lineTo(...point);
    }
    context.stroke();
    const state = frames[last].particles;
    const point = project(-85 + state[particle * 4] * 30, 20 + state[particle * 4 + 1] * 30);
    context.fillStyle = GFS_COLORS[particle];
    context.beginPath();
    context.arc(...point, label ? 4 : 3, 0, Math.PI * 2);
    context.fill();
    if (label) {
      context.font = 'bold 12px system-ui';
      context.fillText(String(particle + 1), point[0] + 8, point[1] - 7);
    }
  }
}
