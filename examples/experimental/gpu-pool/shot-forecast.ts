// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph} from '@luma.gl/graph/gpu-core';
import {
  GPUSphereWorld,
  type GPUSphereBodyState,
  type GPUSphereWorldProps
} from '@luma.gl/graph/gpu-physics';
import {BALL_RADIUS} from './table';

/** Table-plane coordinate in simulation units. */
type Point = [number, number];
/** World-space vector in the sphere solver coordinate system. */
type Vector = [number, number, number];

/** Complete launch command shared by forecast and play. */
export type PoolStrike = {
  /** Linear impulse passed to the sphere world. */
  impulse: Vector;
  /** World-space cue tip contact point that produces angular impulse. */
  point: Vector;
  /** Initial cue-ball speed in table units per second. */
  speed: number;
};
/** Full-power initial speed in table units per second. */
export const MAX_SHOT_SPEED = 18;
/** Maximum simulated duration for one guide. */
const FORECAST_SECONDS = 6;
/** Fixed solver steps between captured positions. */
const STEPS_PER_SAMPLE = 4;
/** Position samples collected by one readback. */
const SAMPLES_PER_BATCH = 6;
/** Wait for the shot inputs to settle before starting GPU work. */
const INPUT_IDLE_MILLISECONDS = 140;

/** Resolve the selected power and tip offset into the solver's impulse and application point. */
export function makePoolStrike(
  center: Vector,
  direction: number,
  contactPoint: Point,
  power: number
): PoolStrike {
  const speed = 0.3 + (MAX_SHOT_SPEED - 0.3) * (power / 100) ** 1.35;
  const horizontal = Math.cos(direction);
  const vertical = Math.sin(direction);
  const [sideSpin, verticalSpin] = contactPoint;
  const depth = Math.sqrt(Math.max(0, 1 - sideSpin ** 2 - verticalSpin ** 2));
  return {
    speed,
    impulse: [horizontal * speed, vertical * speed, 0],
    point: [
      center[0] + BALL_RADIUS * (-horizontal * depth + vertical * sideSpin),
      center[1] + BALL_RADIUS * (-vertical * depth - horizontal * sideSpin),
      center[2] + BALL_RADIUS * verticalSpin
    ]
  };
}

/** In-progress forecast with its input identity and sampled paths. */
type Forecast = {
  /** Snapshot identity changes on reset and after a played shot. */
  states: readonly GPUSphereBodyState[];
  /** Serialized aim, power, spin and throw selections. */
  revision: string;
  /** Strike replayed in the forecast world. */
  strike: PoolStrike;
  /** Sampled paths indexed by ball. */
  paths: Point[][];
  /** Animation timestamp when the input last changed. */
  requestedAt: number;
  /** Number of fixed steps completed. */
  steps: number;
  /** Consecutive batches without visible planar motion. */
  stationaryBatches: number;
  /** Indicates the preview could not finish. */
  failed: boolean;
};

/** Replay a prospective shot in a separate GPU sphere world with the same solver settings. */
export async function createShotForecast(
  device: Device,
  liveWorld: GPUSphereWorld,
  props: GPUSphereWorldProps
) {
  /** Packed position, velocity, or orientation byte size for all balls. */
  const byteLength = liveWorld.count * 16;
  /** Allow the solver and the snapshot copies to share the forecast buffers. */
  const usage = Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST;
  /** Independent position and signed radius buffer for the forecast world. */
  const positions = device.createBuffer({byteLength, usage});
  /** Independent velocity and inverse mass buffer for the forecast world. */
  const velocities = device.createBuffer({byteLength, usage});
  /** Consecutive position snapshots read together after one submission. */
  const samples = device.createBuffer({byteLength: byteLength * SAMPLES_PER_BATCH, usage});
  /** Shadow simulation initialized from the same settings as the live table. */
  const world = new GPUSphereWorld({
    ...props,
    id: 'pool-shot-forecast',
    positions,
    velocities,
    orientations: undefined,
    angularVelocities: undefined,
    sleepStates: undefined,
    diagnostics: undefined,
    eventCapacity: 64
  });
  /** Graph definition for a fixed step of the forecast world. */
  const definition = new GPUCommandGraph<void>(device);
  world.addToGraph(definition);
  /** Compiled forecast step reused for all candidate shots. */
  const graph = await definition.compileAsync();
  /** Latest forecast, including any partial path available for display. */
  let current: Forecast | undefined;
  /** The single submitted forecast batch that is awaiting readback. */
  let pending: Promise<void> | undefined;
  /** Fixed steps covered by the preview time limit. */
  const maximumSteps = Math.round(FORECAST_SECONDS / world.timeStep);

  /** Copy the live inputs before a strike. Applying an impulse clears the warm-start cache. */
  function begin(forecast: Forecast): void {
    const encoder = device.createCommandEncoder();
    const fields = [
      'positions',
      'velocities',
      'orientations',
      'angularVelocities',
      'sleepStates'
    ] as const;
    for (const field of fields) {
      encoder.copyBufferToBuffer({
        sourceBuffer: liveWorld[field]!,
        destinationBuffer: world[field]!,
        size: byteLength
      });
    }
    device.submit(encoder.finish());
    world.events!.write(new Uint32Array(4));
    world.applyImpulse(0, forecast.strike.impulse, forecast.strike.point);
  }

  /** Advance one bounded batch and capture positions along the way, including pocket entry. */
  async function advance(forecast: Forecast): Promise<void> {
    if (!forecast.steps) begin(forecast);
    const encoder = device.createCommandEncoder();
    for (let sample = 0; sample < SAMPLES_PER_BATCH; sample++) {
      for (let step = 0; step < STEPS_PER_SAMPLE; step++) {
        graph.encode(encoder, {parameters: undefined});
      }
      encoder.copyBufferToBuffer({
        sourceBuffer: positions,
        destinationBuffer: samples,
        destinationOffset: sample * byteLength,
        size: byteLength
      });
    }
    device.submit(encoder.finish());
    const bytes = await samples.readAsync();
    if (current !== forecast) return;
    const values = new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
    let moved = false;
    for (let sample = 0; sample < SAMPLES_PER_BATCH; sample++) {
      for (const [index, path] of forecast.paths.entries()) {
        if (!path.length) continue;
        const offset = (sample * liveWorld.count + index) * 4;
        const point: Point = [values[offset], values[offset + 1]];
        const last = path.at(-1)!;
        if (Math.hypot(point[0] - last[0], point[1] - last[1]) >= 0.004) {
          path.push(point);
          moved = true;
        }
      }
    }
    forecast.steps += SAMPLES_PER_BATCH * STEPS_PER_SAMPLE;
    forecast.stationaryBatches = moved ? 0 : forecast.stationaryBatches + 1;
  }

  return {
    /** Apply the same settings mutations as the live solver to keep wake revisions aligned. */
    setThrow(cutInducedThrow: boolean, spinInducedThrow: boolean): void {
      world.update({cutInducedThrow, spinInducedThrow});
    },
    /** Return only paths that match the current table, spin, power, aim and throw settings. */
    update(
      now: number,
      states: readonly GPUSphereBodyState[],
      revision: string,
      strike: PoolStrike
    ): Pick<Forecast, 'paths' | 'failed'> {
      if (current?.states !== states || current.revision !== revision) {
        current = {
          states,
          revision,
          strike,
          requestedAt: now,
          steps: 0,
          stationaryBatches: 0,
          failed: false,
          paths: states.map(state =>
            state.enabled ? [[state.position[0], state.position[1]]] : []
          )
        };
      }
      if (
        !pending &&
        now - current.requestedAt >= INPUT_IDLE_MILLISECONDS &&
        current.steps < maximumSteps &&
        current.stationaryBatches < 3
      ) {
        const forecast = current;
        pending = advance(forecast)
          .catch(() => {
            for (const path of forecast.paths) path.length = 0;
            forecast.failed = true;
            forecast.steps = maximumSteps;
          })
          .finally(() => {
            pending = undefined;
          });
      }
      return current;
    },
    /** Discard a forecast when the table resets or play starts. */
    cancel(): void {
      current = undefined;
    },
    /** Drain pending GPU work before releasing forecast resources. */
    async destroy(): Promise<void> {
      current = undefined;
      await pending;
      graph.destroy();
      world.destroy();
      samples.destroy();
      positions.destroy();
      velocities.destroy();
    }
  };
}
