// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {GPURigidBodyContactEvent} from '@luma.gl/graph/gpu-physics';

/** Create the motor and a short, filtered impact sample on the first driving gesture. */
export function createBuggyAudio(
  button: HTMLButtonElement,
  railPositions: readonly (readonly number[])[]
) {
  let context: AudioContext | undefined;
  let engine: OscillatorNode;
  let exhaust: BiquadFilterNode;
  let engineGain: GainNode;
  let impactBuffer: AudioBuffer;
  let muted = false;
  let lastImpact = -Infinity;
  const previousVelocity = [0, 0, 0];
  const soundingRails = new Set<number>();

  function unlock() {
    if (muted || document.hidden || !window.AudioContext) return;
    if (!context) {
      context = new AudioContext();
      engine = context.createOscillator();
      // The uneven firing pulse has a low fundamental and a short, rough exhaust tail.
      const harmonics = new Float32Array([0, 1, 0.32, 0.7, 0.18, 0.42, 0.11, 0.25, 0.08]);
      engine.setPeriodicWave(
        context.createPeriodicWave(new Float32Array(harmonics.length), harmonics)
      );
      engine.frequency.value = 26;
      exhaust = context.createBiquadFilter();
      exhaust.type = 'lowpass';
      exhaust.frequency.value = 210;
      engineGain = context.createGain();
      engineGain.gain.value = 0;
      engine.connect(exhaust).connect(engineGain).connect(context.destination);
      engine.start();
      impactBuffer = context.createBuffer(
        1,
        Math.ceil(context.sampleRate * 0.22),
        context.sampleRate
      );
      const samples = impactBuffer.getChannelData(0);
      let rumble = 0;
      for (let index = 0; index < samples.length; index++) {
        const time = index / context.sampleRate;
        const noise = Math.random() * 2 - 1;
        rumble += 0.15 * (noise - rumble);
        samples[index] =
          Math.min(1, time * 1300) *
          (noise * 0.25 * Math.exp(-time * 85) +
            rumble * Math.exp(-time * 20) +
            0.5 *
              Math.sin(2 * Math.PI * (68 * time + (1 - Math.exp(-time * 28)) * 1.7)) *
              Math.exp(-time * 24));
      }
    }
    button.textContent = 'Mute sound';
    void context.resume().catch(() => {});
  }
  button.disabled = !window.AudioContext;
  button.onclick = () => {
    muted = Boolean(context) && !muted;
    if (muted) {
      button.textContent = 'Enable sound';
      void context?.suspend().catch(() => {});
    } else unlock();
  };
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) void context?.suspend().catch(() => {});
    else if (context) unlock();
  });
  return {
    unlock,
    reset() {
      previousVelocity.fill(0);
      soundingRails.clear();
      lastImpact = -Infinity;
    },
    update(
      throttle: number,
      wheelSpeed: number,
      position: readonly number[],
      velocity: readonly number[],
      events: readonly GPURigidBodyContactEvent[]
    ) {
      if (!context || muted || context.state !== 'running') return;
      const now = context.currentTime;
      const effort = Math.abs(throttle);
      engine.frequency.setTargetAtTime(
        26 + effort * 27 + Math.min(60, wheelSpeed) * 1.3,
        now,
        0.13
      );
      exhaust.frequency.setTargetAtTime(210 + effort * 660, now, 0.1);
      engineGain.gain.setTargetAtTime(0.033 + 0.055 * effort, now, 0.09);
      // Persistent contacts can flicker for a few steps while the buggy leans into a wall.
      for (const rail of soundingRails) {
        const center = railPositions[rail - 2];
        const axis = center[0] !== 0 ? 0 : 1;
        if (Math.abs(center[axis] - position[axis]) > 3) soundingRails.delete(rail);
      }
      let strongest = 0;
      for (const event of events) {
        // The rail bodies are immediately after chassis body 1.
        const [first, second] = event.bodies;
        const rail = first === 1 ? second : second === 1 ? first : 0;
        if (rail < 2 || rail >= 2 + railPositions.length) continue;
        const approachSpeed = Math.abs(
          event.normal.reduce((sum, component, axis) => sum + component * previousVelocity[axis], 0)
        );
        if (
          event.phase !== 'end' &&
          event.normalImpulse > 120 &&
          approachSpeed > 0.7 &&
          !soundingRails.has(rail)
        ) {
          soundingRails.add(rail);
          strongest = Math.max(strongest, event.normalImpulse);
        }
      }
      for (let axis = 0; axis < 3; axis++) previousVelocity[axis] = velocity[axis];
      if (strongest > 0 && now - lastImpact > 0.22) {
        lastImpact = now;
        const hit = context.createBufferSource();
        hit.buffer = impactBuffer;
        const level = context.createGain();
        level.gain.value = Math.min(0.8, 0.12 + strongest / 3800);
        hit.connect(level).connect(context.destination);
        hit.onended = () => {
          hit.disconnect();
          level.disconnect();
        };
        hit.start();
      }
    }
  };
}
