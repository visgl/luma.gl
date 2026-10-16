// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {luma, Buffer} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/webgpu';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {
  GPUSphereWorld,
  getSphereTriggerBodies,
  type GPUSphereBodyState
} from '@luma.gl/gpgpu/gpu-physics';
import {
  BALL_RADIUS,
  POCKET_RADIUS,
  POCKETS,
  TABLE_PLANES,
  makeRack,
  findCuePosition,
  isShotSettled
} from './table';
import {createPoolRenderer} from './render';
import {PoolAudio} from './audio';

function element<ElementType extends HTMLElement>(identifier: string): ElementType {
  return document.querySelector<ElementType>('#' + identifier)!;
}
const status = element<HTMLOutputElement>('status');
const canvas = element<HTMLCanvasElement>('pool');
const shoot = element<HTMLButtonElement>('shoot');
const reset = element<HTMLButtonElement>('reset');
const power = element<HTMLInputElement>('power');
const angle = element<HTMLInputElement>('angle');
const practice = element<HTMLSelectElement>('practice');
const aimLine = document.querySelector<SVGLineElement>('#aim-line')!;
const cueTrail = document.querySelector<SVGPolylineElement>('#cue-trail')!;
const recentCueTrail = document.querySelector<SVGPolylineElement>('#cue-trail-recent')!;
const cueStick = document.querySelector<SVGGElement>('#cue-stick')!;
const audio = new PoolAudio();

try {
  let failure: Error | null = null;
  const device = await luma.createDevice({
    adapters: [webgpuAdapter],
    createCanvasContext: {canvas, autoResize: true},
    onError: error => {
      failure = error;
    }
  });
  const createBuffer = (data: Float32Array) =>
    device.createBuffer({data, usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST});
  const positions = createBuffer(makeRack());
  const velocityData = new Float32Array(64);
  const orientationData = new Float32Array(64);
  for (let index = 0; index < 16; index++) {
    velocityData[index * 4 + 3] = 1;
    orientationData[index * 4] = Math.SQRT1_2;
    orientationData[index * 4 + 3] = Math.SQRT1_2;
  }
  const velocities = createBuffer(velocityData);
  const orientations = createBuffer(orientationData);
  const world = new GPUSphereWorld({
    count: 16,
    positions,
    velocities,
    orientations,
    maximumRadius: BALL_RADIUS,
    maximumContacts: 15,
    timeStep: 1 / 240,
    iterations: 12,
    contactSkin: 0.002,
    restitution: 0.94,
    staticFriction: 0.06,
    dynamicFriction: 0.04,
    rollingResistance: 0.035,
    sleepAfter: 0.3,
    sleepLinearSpeed: 0.025,
    sleepAngularSpeed: 0.12,
    restitutionThreshold: 0.08,
    planes: TABLE_PLANES
  });
  const definition = new GPUCommandGraph<void>(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  const renderer = createPoolRenderer(device, positions, orientations);
  let states: GPUSphereBodyState[] = await world.readState();
  let phase: 'aiming' | 'striking' | 'rolling' | 'complete' = 'aiming';
  let shotCount = 0;
  let objectBallCount = 15;
  let scratch = false;
  let settledSince = 0;
  let strikeStart = 0;
  let shotStart = 0;
  let direction = 0;
  let contactPoint: [number, number] = [0, 0];
  let cutInducedThrow = true;
  let spinInducedThrow = true;
  let accumulator = 0;
  let previous = performance.now();
  let lastSnapshot = 0;
  let snapshot: Promise<void> | null = null;
  let generation = 0;
  let alive = true;
  let animation = 0;
  const potted = new Set<number>();
  const cueTrailPoints: [number, number][] = [];
  function updateControls() {
    shoot.disabled = phase !== 'aiming';
    power.disabled = phase !== 'aiming';
    angle.disabled = phase !== 'aiming';
    for (const identifier of ['center-spin', 'cut-throw', 'spin-throw'])
      element<HTMLButtonElement>(identifier).disabled = phase !== 'aiming';
    element('contact-ball').setAttribute('aria-disabled', String(phase !== 'aiming'));
    element('pot-count').hidden = objectBallCount === 0;
    element('score').textContent = `${potted.size} / ${objectBallCount}`;
    element('shots').textContent = `${shotCount} ${shotCount === 1 ? 'shot' : 'shots'}`;
    element('potted-balls').textContent = potted.size
      ? `Potted: ${[...potted].sort((first, second) => first - second).join(' · ')}`
      : 'All practice balls on the table';
  }
  function setAim(radians: number) {
    direction = Math.atan2(Math.sin(radians), Math.cos(radians));
    angle.value = String((direction * 180) / Math.PI);
    element('angle-value').textContent = `${Math.round((direction * 180) / Math.PI)}°`;
  }
  function setContactPoint(horizontal: number, vertical: number) {
    const length = Math.hypot(horizontal, vertical);
    const scale = length > 0.8 ? 0.8 / length : 1;
    contactPoint = [horizontal * scale, vertical * scale];
    element('contact-marker').style.left = `${50 + contactPoint[0] * 50}%`;
    element('contact-marker').style.top = `${50 - contactPoint[1] * 50}%`;
    const labels = [
      contactPoint[1] > 0.08 ? 'Follow' : contactPoint[1] < -0.08 ? 'Draw' : '',
      contactPoint[0] > 0.08 ? 'Right' : contactPoint[0] < -0.08 ? 'Left' : ''
    ].filter(Boolean);
    const label = labels.length ? labels.join(' + ') + ' spin' : 'Center hit';
    element('spin-value').textContent = label;
    element('contact-ball').setAttribute(
      'aria-label',
      `Cue-ball contact point: ${label}. Arrow keys adjust; Home centers.`
    );
  }
  const contactBall = element('contact-ball');
  function selectContact(event: PointerEvent) {
    if (phase !== 'aiming') return;
    const rectangle = contactBall.getBoundingClientRect();
    setContactPoint(
      (2 * (event.clientX - rectangle.left)) / rectangle.width - 1,
      1 - (2 * (event.clientY - rectangle.top)) / rectangle.height
    );
  }
  contactBall.onpointerdown = event => {
    if (event.button !== 0 || phase !== 'aiming') return;
    contactBall.focus();
    contactBall.setPointerCapture(event.pointerId);
    selectContact(event);
  };
  contactBall.onpointermove = event => {
    if (contactBall.hasPointerCapture(event.pointerId)) selectContact(event);
  };
  contactBall.onkeydown = event => {
    if (phase !== 'aiming') return;
    const offsets: Record<string, [number, number]> = {
      ArrowLeft: [-0.05, 0],
      ArrowRight: [0.05, 0],
      ArrowUp: [0, 0.05],
      ArrowDown: [0, -0.05]
    };
    if (event.key === 'Home') {
      event.preventDefault();
      setContactPoint(0, 0);
    } else if (offsets[event.key]) {
      event.preventDefault();
      setContactPoint(
        contactPoint[0] + offsets[event.key][0],
        contactPoint[1] + offsets[event.key][1]
      );
    }
  };
  element('center-spin').onclick = () => setContactPoint(0, 0);
  element('cut-throw').onclick = () => {
    cutInducedThrow = !cutInducedThrow;
    world.update({cutInducedThrow});
    element('cut-throw').setAttribute('aria-pressed', String(cutInducedThrow));
  };
  element('spin-throw').onclick = () => {
    spinInducedThrow = !spinInducedThrow;
    world.update({spinInducedThrow});
    element('spin-throw').setAttribute('aria-pressed', String(spinInducedThrow));
  };
  function getExtent(): [number, number] {
    const aspect = canvas.clientWidth / canvas.clientHeight;
    return aspect >= 1.85 ? [4 * aspect, 4] : [7.4, 7.4 / aspect];
  }
  function aimAt(event: PointerEvent) {
    if (phase !== 'aiming' || !states[0].enabled) return;
    const rectangle = canvas.getBoundingClientRect();
    const extent = getExtent();
    const point = [
      ((2 * (event.clientX - rectangle.left)) / rectangle.width - 1) * extent[0],
      (1 - (2 * (event.clientY - rectangle.top)) / rectangle.height) * extent[1]
    ];
    setAim(Math.atan2(point[1] - states[0].position[1], point[0] - states[0].position[0]));
  }
  canvas.onpointerdown = event => {
    if (event.button !== 0 || phase !== 'aiming') return;
    canvas.focus();
    canvas.setPointerCapture(event.pointerId);
    aimAt(event);
    audio.unlock();
  };
  canvas.onpointerup = event => {
    if (event.button !== 0 || !canvas.hasPointerCapture(event.pointerId)) return;
    canvas.releasePointerCapture(event.pointerId);
    aimAt(event);
    startShot();
  };
  canvas.onpointermove = aimAt;
  power.oninput = () => {
    element('power-value').textContent = power.value + '%';
    power.style.setProperty('--power', power.value + '%');
  };
  angle.oninput = () => setAim((Number(angle.value) * Math.PI) / 180);
  function startShot() {
    if (phase !== 'aiming') return;
    audio.unlock();
    cueTrailPoints.length = 0;
    cueTrailPoints.push([states[0].position[0], states[0].position[1]]);
    phase = 'striking';
    strikeStart = performance.now();
    updateControls();
    status.value = 'Taking the shot…';
  }
  shoot.onclick = startShot;
  element<HTMLButtonElement>('sound').onclick = () => {
    audio.enabled = !audio.enabled;
    if (audio.enabled) audio.unlock();
    element('sound').textContent = audio.enabled ? 'Sound on' : 'Sound off';
    element('sound').setAttribute('aria-pressed', String(audio.enabled));
  };
  canvas.onkeydown = event => {
    if (phase !== 'aiming') return;
    if (event.code === 'Space') {
      event.preventDefault();
      startShot();
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      setAim(direction + ((event.key === 'ArrowLeft' ? 1 : -1) * Math.PI) / 180);
    }
  };
  async function resetTable() {
    reset.disabled = true;
    practice.disabled = true;
    generation++;
    phase = 'striking';
    updateControls();
    try {
      if (snapshot) await snapshot;
      const rack = makeRack();
      const mode = practice.value;
      objectBallCount = mode === 'rack' ? 15 : mode === 'cushion' ? 0 : 1;
      if (mode !== 'rack') {
        rack.set(
          mode === 'cushion'
            ? [2, -1, BALL_RADIUS, BALL_RADIUS]
            : [-2, 0, BALL_RADIUS, BALL_RADIUS],
          0
        );
        rack.set([0, 0, BALL_RADIUS, BALL_RADIUS], 4);
      }
      for (let index = 0; index < 16; index++) {
        world.teleportBody(
          index,
          [rack[index * 4], rack[index * 4 + 1], rack[index * 4 + 2]],
          [Math.SQRT1_2, 0, 0, Math.SQRT1_2]
        );
        world.setBodyEnabled(index, index <= objectBallCount);
      }
      states = await world.readState();
      shotCount = 0;
      potted.clear();
      cueTrailPoints.length = 0;
      scratch = false;
      settledSince = 0;
      accumulator = 0;
      setAim(mode === 'cushion' ? Math.PI / 9 : 0);
      setContactPoint(
        mode === 'cushion' ? 0.65 : 0,
        mode === 'follow' ? 0.65 : mode === 'draw' ? -0.65 : 0
      );
      power.value = mode === 'rack' ? '85' : '60';
      element('power-value').textContent = power.value + '%';
      power.style.setProperty('--power', power.value + '%');
      reset.textContent = mode === 'rack' ? 'New rack' : 'Reset shot';
      element('cue-motion').textContent = '';
      phase = 'aiming';
      status.value =
        mode === 'rack'
          ? 'Ready for the break.'
          : mode === 'cushion'
            ? 'Compare left and right spin, then try a softer or firmer shot.'
            : 'Shoot straight at the object ball. Watch the cue ball after contact.';
      updateControls();
    } catch (error) {
      failure = error instanceof Error ? error : new Error(String(error));
    } finally {
      reset.disabled = false;
      practice.disabled = false;
    }
  }
  reset.onclick = () => void resetTable();
  practice.onchange = () => void resetTable();
  async function sampleState(now: number, sampleGeneration: number) {
    const next = await world.readState();
    if (!alive || sampleGeneration !== generation) return;
    const previousStates = states;
    states = next;
    if (phase !== 'rolling') return;
    const cue = states[0];
    if (cue.enabled && !scratch) {
      const previousPoint = cueTrailPoints[cueTrailPoints.length - 1];
      if (
        !previousPoint ||
        Math.hypot(cue.position[0] - previousPoint[0], cue.position[1] - previousPoint[1]) >= 0.015
      ) {
        cueTrailPoints.push([cue.position[0], cue.position[1]]);
        if (cueTrailPoints.length > 1200) cueTrailPoints.shift();
      }
    }
    const pace = Math.hypot(cue.velocity[0], cue.velocity[1]);
    const slip = Math.hypot(
      cue.velocity[0] - BALL_RADIUS * cue.angularVelocity[1],
      cue.velocity[1] + BALL_RADIUS * cue.angularVelocity[0]
    );
    element('cue-motion').textContent = cue.enabled
      ? `Cue ball: ${pace < 0.035 ? (Math.hypot(...cue.angularVelocity) > 0.15 ? 'spinning' : 'resting') : slip > 0.03 ? 'sliding' : 'rolling'} · pace ${pace.toFixed(1)} · sidespin ${Math.abs(cue.angularVelocity[2]).toFixed(1)} rad/s`
      : '';
    audio.playContacts(previousStates, states, now);
    const captured = new Set(
      POCKETS.flatMap(center => getSphereTriggerBodies(states, center, POCKET_RADIUS)).map(
        body => body.index
      )
    );
    for (const body of states) {
      // Recover escaped balls too: a discrete prototype must never leave a shot stuck forever.
      if (
        !body.enabled ||
        (!captured.has(body.index) &&
          body.position[2] > -1 &&
          Math.abs(body.position[0]) < 6.8 &&
          Math.abs(body.position[1]) < 3.8)
      )
        continue;
      audio.playPocket();
      world.setBodyEnabled(body.index, false);
      body.enabled = false;
      if (body.index === 0) {
        scratch = true;
        status.value = 'Scratch — the cue ball returns when the shot settles.';
      } else {
        potted.add(body.index);
        status.value = `Ball ${body.index} potted.`;
      }
      updateControls();
    }
    if (now - shotStart > 300 && isShotSettled(states)) {
      settledSince ||= now;
      if (now - settledSince >= 350) {
        if (scratch) {
          const point = findCuePosition(states);
          if (!point) {
            status.value = 'No clear cue-ball position. Start a new rack.';
            phase = 'complete';
            updateControls();
            return;
          }
          world.teleportBody(0, point);
          world.setBodyEnabled(0, true);
          states[0].position = point;
          states[0].enabled = true;
          scratch = false;
        }
        phase = objectBallCount > 0 && potted.size === objectBallCount ? 'complete' : 'aiming';
        status.value =
          phase === 'complete'
            ? `Table cleared in ${shotCount} shots. Nicely done.`
            : 'Shot complete. Line up the next one.';
        updateControls();
      }
    } else settledSince = 0;
  }
  function setLine(line: SVGLineElement, start: number[], end: number[]) {
    const extent = getExtent();
    const screen = (point: number[]) => [
      ((point[0] / extent[0] + 1) * canvas.clientWidth) / 2,
      ((1 - point[1] / extent[1]) * canvas.clientHeight) / 2
    ];
    const first = screen(start);
    const second = screen(end);
    for (const [name, value] of Object.entries({
      x1: first[0],
      y1: first[1],
      x2: second[0],
      y2: second[1]
    }))
      line.setAttribute(name, String(value));
  }
  function frame(now: number) {
    if (!alive) return;
    try {
      if (failure) throw failure;
      const elapsed = Math.min((now - previous) / 1000, 0.05);
      previous = now;
      if (phase === 'striking' && !reset.disabled && now - strikeStart >= 180) {
        const speed = 0.3 + 11.7 * (Number(power.value) / 100) ** 1.6;
        audio.playCue(speed / 12);
        const forward = [Math.cos(direction), Math.sin(direction)];
        const depth = Math.sqrt(1 - contactPoint[0] ** 2 - contactPoint[1] ** 2);
        const center = states[0].position;
        world.applyImpulse(
          0,
          [forward[0] * speed, forward[1] * speed, 0],
          [
            center[0] + BALL_RADIUS * (-forward[0] * depth + forward[1] * contactPoint[0]),
            center[1] + BALL_RADIUS * (-forward[1] * depth - forward[0] * contactPoint[0]),
            center[2] + BALL_RADIUS * contactPoint[1]
          ]
        );
        phase = 'rolling';
        shotCount++;
        shotStart = now;
        settledSince = 0;
        updateControls();
        status.value = 'Balls in motion…';
      }
      if (phase === 'rolling') {
        accumulator = Math.min(accumulator + elapsed, 12 / 240);
        const steps = Math.floor(accumulator * 240);
        accumulator -= steps / 240;
        const encoder = device.createCommandEncoder();
        for (let step = 0; step < steps; step++) graph.encode(encoder, {parameters: undefined});
        device.submit(encoder.finish());
        if (!snapshot && now - lastSnapshot >= 1000 / 30) {
          lastSnapshot = now;
          snapshot = sampleState(now, generation)
            .catch(error => {
              failure = error instanceof Error ? error : new Error(String(error));
            })
            .finally(() => {
              snapshot = null;
            });
        }
      }
      const extent = getExtent();
      renderer.draw(extent);
      const trailScreenPoints = cueTrailPoints.map(
        point =>
          `${((point[0] / extent[0] + 1) * canvas.clientWidth) / 2},${((1 - point[1] / extent[1]) * canvas.clientHeight) / 2}`
      );
      cueTrail.setAttribute('points', trailScreenPoints.join(' '));
      recentCueTrail.setAttribute('points', trailScreenPoints.slice(-12).join(' '));
      const showCue = (phase === 'aiming' || phase === 'striking') && !reset.disabled;
      cueStick.style.display = showCue ? '' : 'none';
      aimLine.style.display = showCue ? '' : 'none';
      if (showCue) {
        const point = states[0].position;
        const vector = [Math.cos(direction), Math.sin(direction)];
        const pullback = 0.15 + (Number(power.value) / 100) * 0.65;
        const pull =
          phase === 'striking' ? Math.max(0, 1 - (now - strikeStart) / 180) * pullback : pullback;
        const extent = getExtent();
        const scale = canvas.clientWidth / (extent[0] * 2);
        const tip = [point[0] - vector[0] * (0.21 + pull), point[1] - vector[1] * (0.21 + pull)];
        cueStick.setAttribute(
          'transform',
          `translate(${((tip[0] / extent[0] + 1) * canvas.clientWidth) / 2},${((1 - tip[1] / extent[1]) * canvas.clientHeight) / 2}) rotate(${(-direction * 180) / Math.PI}) scale(${scale})`
        );
        setLine(
          aimLine,
          [point[0] + vector[0] * 0.3, point[1] + vector[1] * 0.3],
          [point[0] + vector[0] * 4, point[1] + vector[1] * 4]
        );
      }
      animation = requestAnimationFrame(frame);
    } catch (error) {
      status.value = `Pool stopped: ${String(error)}`;
      shoot.disabled = true;
    }
  }
  status.value = 'Ready for the break.';
  updateControls();
  animation = requestAnimationFrame(frame);
  window.addEventListener(
    'pagehide',
    () => {
      alive = false;
      cancelAnimationFrame(animation);
      void Promise.resolve(snapshot).finally(() => {
        audio.destroy();
        renderer.destroy();
        graph.destroy();
        world.destroy();
        positions.destroy();
        velocities.destroy();
        orientations.destroy();
        device.destroy();
      });
    },
    {once: true}
  );
} catch (error) {
  status.value = `Unable to start WebGPU pool: ${String(error)}`;
}
