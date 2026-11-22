// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {PerspectiveCamera, Plane, Quaternion, Raycaster, Vector2, Vector3} from 'three';
import type {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import './table-controls.css';

/** Use the same small-angle snap and gravity magnitude for both control modes. */
const GRAVITY = 9.81;
/** Keep the collision plane within the supported range of the original demo. */
const MAXIMUM_SLOPE = Math.tan(Math.PI / 4);
/** A nearly horizontal table may snap to level after a gesture. */
const SNAP_RADIANS = Math.PI / 60;
/** Conversion used by the horizon and table telemetry. */
const DEGREES = 180 / Math.PI;

/** Screen directions and the starting slope retained for one captured gesture. */
type TableDrag = {
  /** Captured pointer that owns this gesture. */
  pointerId: number;
  /** Initial horizontal position in CSS pixels. */
  startX: number;
  /** Initial vertical position in CSS pixels. */
  startY: number;
  /** Scene direction corresponding to screen right at pointer down. */
  horizontal: Vector2;
  /** Scene direction corresponding to screen down at pointer down. */
  vertical: Vector2;
  /** Starting slope before this gesture. */
  slope: Vector2;
};

/** Derive attitude directly from the gravity vector used by the sphere solver. */
export function getTableAttitude(gravity: readonly [number, number, number]) {
  /** Gravity components along the two table axes and through its surface. */
  const [horizontal, vertical, normal] = gravity;
  /** Positive roll and pitch are downhill along the table's positive X and Y axes. */
  const roll = Math.atan2(horizontal, -normal) * DEGREES;
  const pitch = Math.atan2(vertical, -normal) * DEGREES;
  /** Total tilt is the angle from vertical, independent of the camera view. */
  const tilt = Math.atan2(Math.hypot(horizontal, vertical), -normal) * DEGREES;
  return {roll, pitch, tilt};
}

/** Own table interaction and publish its instrument readings without a GPU readback. */
export function createTableControls(
  canvas: HTMLCanvasElement,
  camera: PerspectiveCamera,
  orbit: OrbitControls,
  getHalfExtent: () => number
) {
  /** Table pose and its inverse map the simulated plane into the presentation scene. */
  const rotation = new Quaternion();
  /** Inverse transform also keeps sphere impostors facing the orbital camera. */
  const inverseRotation = new Quaternion();
  /** Tangent-plane slope in the scene axes. */
  const slope = new Vector2();
  /** Unchanging scene up axis and reusable temporary direction. */
  const up = new Vector3(0, 0, 1);
  /** Reused for camera-relative and table-relative gravity. */
  const direction = new Vector3();
  /** Reuse picking objects across pointer events. */
  const raycaster = new Raycaster();
  /** Collision surface through the origin in presentation coordinates. */
  const plane = new Plane();
  /** Reused world hit for the current pointer ray. */
  const hit = new Vector3();
  /** Normalized device coordinates used by the Three camera. */
  const pointer = new Vector2();
  /** Camera reference pose retained for the optional coupled mode. */
  const initialDirection = new Vector3();
  /** Rotate the calibrated orbital direction onto world up. */
  const viewToGravity = new Quaternion();
  /** Record listeners for disposal without sharing event state across examples. */
  const listeners = new AbortController();

  /** Compact instrument remains visible while the example InfoBox is collapsed. */
  const hud = document.createElement('section');
  hud.className = 'sphere-table-hud';
  hud.setAttribute('aria-label', 'Table tilt');
  hud.innerHTML = `
    <div class="sphere-table-heading"><span>Table</span><strong data-tilt>Level · 0.0°</strong></div>
    <div class="sphere-table-line">
      <div class="sphere-table-bubble-dial" role="img" aria-label="Bubble centered: table level">
        <span class="sphere-table-bubble"></span>
      </div>
      <div class="sphere-table-attitude">
        <span>Pitch <b data-pitch>0.0°</b></span>
        <span>Roll <b data-roll>0.0°</b></span>
      </div>
    </div>
    <small data-control-mode>Drag table to tilt</small>
  `;
  document.body.append(hud);

  /** The Table tab contains the attitude instrument and input settings. */
  const panel = document.createElement('div');
  panel.className = 'sphere-table-panel';
  panel.innerHTML = `
    <div class="sphere-table-horizon" aria-hidden="true">
      <div class="sphere-table-sky"></div>
      <span class="sphere-table-reference"></span>
    </div>
    <div class="sphere-table-heading"><span>Table attitude</span><strong data-tilt>Level · 0.0°</strong></div>
    <div class="sphere-table-line sphere-table-axes">
      <span>Pitch <b data-pitch>0.0°</b></span><span>Roll <b data-roll>0.0°</b></span>
    </div>
    <label>Tilt mode <select id="table-tilt-mode">
      <option value="grab" selected>Grab table</option><option value="orbit">Tilt with view</option>
    </select></label>
    <p id="table-tilt-hint">Drag the table to tilt. Drag the background or hold Alt to orbit.</p>
    <label>Drag sensitivity <span id="sensitivity-value">0.25</span>
      <input id="sensitivity" type="range" min="0.1" max="1" step="0.05" value="0.25">
    </label>
    <label class="checkbox"><input id="snap" type="checkbox" checked> Snap level within 3°</label>
    <button id="level" type="button">Level table</button>
  `;
  /** Cache all instrument elements even while the Table tab is not mounted. */
  const instruments = [
    ...hud.querySelectorAll<HTMLElement>('[data-tilt], [data-pitch], [data-roll]'),
    ...panel.querySelectorAll<HTMLElement>('[data-tilt], [data-pitch], [data-roll]')
  ];
  /** Bubble position uses the opposite of local downhill. */
  const bubble = hud.querySelector<HTMLElement>('.sphere-table-bubble')!;
  /** Accessible description of the compact bubble indicator. */
  const dial = hud.querySelector<HTMLElement>('.sphere-table-bubble-dial')!;
  /** Tell the user which interaction is active while the InfoBox is collapsed. */
  const controlMode = hud.querySelector<HTMLElement>('[data-control-mode]')!;
  /** Moving horizon surface inside its fixed mask and reference marker. */
  const horizon = panel.querySelector<HTMLElement>('.sphere-table-sky')!;
  /** Switch between a direct table drag and the original coupled camera control. */
  const mode = panel.querySelector<HTMLSelectElement>('#table-tilt-mode')!;
  /** One gain control for the two mutually exclusive modes. */
  const sensitivity = panel.querySelector<HTMLInputElement>('#sensitivity')!;
  /** Display the current pointer gain beside its range. */
  const sensitivityValue = panel.querySelector<HTMLElement>('#sensitivity-value')!;
  /** Optional dead zone applied after a gesture ends. */
  const snap = panel.querySelector<HTMLInputElement>('#snap')!;
  /** Describe the pointer behavior for the chosen mode. */
  const hint = panel.querySelector<HTMLElement>('#table-tilt-hint')!;
  /** One pointer controls a direct table drag at a time. */
  let drag: TableDrag | undefined;
  /** Suppress level snapping during an orbital gesture. */
  let orbitDragging = false;
  /** Input is suspended during deterministic benchmark playback. */
  let inputEnabled = true;
  /** Skip DOM updates when the gravity vector is unchanged. */
  let lastAttitude = '';

  /** Flush camera damping before restoring the original view. */
  function resetOrbit(): void {
    /** Restore the caller’s damping preference after flushing orbit state. */
    const damping = orbit.enableDamping;
    orbit.enableDamping = false;
    orbit.update();
    orbit.reset();
    orbit.enableDamping = damping;
  }

  /** Level only the table in direct mode, or the coupled view in orbit mode. */
  function level(): void {
    slope.set(0, 0);
    rotation.identity();
    inverseRotation.identity();
    if (mode.value === 'orbit') resetOrbit();
  }

  /** Recalibrate the coupled reference after replacing the current physics scene. */
  function calibrate(): void {
    initialDirection.copy(camera.position).sub(orbit.target).normalize();
    viewToGravity.setFromUnitVectors(initialDirection, up);
    level();
  }

  /** Project the pointer into the currently tilted square, matching the draw camera. */
  function hitsTable(event: PointerEvent): boolean {
    /** Use CSS pixels for stable ray picking at any device pixel ratio. */
    const rectangle = canvas.getBoundingClientRect();
    if (!rectangle.width || !rectangle.height) return false;
    pointer.set(
      (2 * (event.clientX - rectangle.left)) / rectangle.width - 1,
      1 - (2 * (event.clientY - rectangle.top)) / rectangle.height
    );
    camera.updateMatrixWorld();
    raycaster.setFromCamera(pointer, camera);
    plane.normal.copy(up).applyQuaternion(rotation);
    if (!raycaster.ray.intersectPlane(plane, hit)) return false;
    hit.applyQuaternion(inverseRotation);
    /** Read the active platform extent after any body-count rebuild. */
    const halfExtent = getHalfExtent();
    return Math.abs(hit.x) <= halfExtent && Math.abs(hit.y) <= halfExtent;
  }

  /** Map one table drag to camera-relative downhill directions in the horizontal plane. */
  function startDrag(event: PointerEvent): void {
    if (
      !inputEnabled ||
      mode.value !== 'grab' ||
      !orbit.enabled ||
      drag ||
      !event.isPrimary ||
      event.button !== 0 ||
      event.altKey ||
      !hitsTable(event)
    )
      return;
    event.stopImmediatePropagation();
    event.preventDefault();
    /** The projected camera right vector sets the gesture’s horizontal axis. */
    const elements = camera.matrixWorld.elements;
    drag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      horizontal: new Vector2(elements[0], elements[1]).normalize(),
      vertical: new Vector2(
        camera.position.x - orbit.target.x,
        camera.position.y - orbit.target.y
      ).normalize(),
      slope: slope.clone()
    };
    orbit.enabled = false;
    canvas.setPointerCapture(event.pointerId);
    canvas.dataset['tableDragging'] = 'true';
  }

  /** Clamp the radial slope, so diagonals are subject to the same maximum tilt. */
  function moveDrag(event: PointerEvent): void {
    if (!drag || drag.pointerId !== event.pointerId) return;
    /** Normalize by viewport height so the slope feels similar on different screens. */
    const gain = (0.8 + 8 * Number(sensitivity.value)) / Math.max(1, canvas.clientHeight);
    slope
      .copy(drag.slope)
      .addScaledVector(drag.horizontal, (event.clientX - drag.startX) * gain)
      .addScaledVector(drag.vertical, (event.clientY - drag.startY) * gain)
      .clampLength(0, MAXIMUM_SLOPE);
  }

  /** Release pointer capture and return background drags to the orbit controller. */
  function stopDrag(): void {
    if (!drag) return;
    /** Release exactly the pointer that owns the current gesture. */
    const pointerId = drag.pointerId;
    drag = undefined;
    if (canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId);
    orbit.enabled = inputEnabled;
    delete canvas.dataset['tableDragging'];
  }

  /** Finish only the gesture that owns the pointer. */
  function finishDrag(event: PointerEvent): void {
    if (drag?.pointerId === event.pointerId) stopDrag();
  }

  /** Reflect the physics attitude in both the mini instrument and the Table tab. */
  function showAttitude(gravity: [number, number, number]): void {
    const {roll, pitch, tilt} = getTableAttitude(gravity);
    /** Round numerical noise around the neutral axes to a readable zero. */
    const format = (angle: number) => `${(Math.abs(angle) < 0.05 ? 0 : angle).toFixed(1)}°`;
    /** Update compact and expanded instruments from a single formatted reading. */
    const readings = {
      pitch: format(pitch),
      roll: format(roll),
      tilt: `${tilt < 0.5 ? 'Level' : 'Tilted'} · ${tilt.toFixed(1)}°`
    };
    /** Quantize noisy orientation updates before touching the DOM. */
    const key = gravity.map(component => component.toFixed(4)).join();
    if (key === lastAttitude) return;
    lastAttitude = key;
    for (const element of instruments) {
      element.textContent = element.hasAttribute('data-tilt')
        ? readings.tilt
        : element.hasAttribute('data-pitch')
          ? readings.pitch
          : readings.roll;
    }
    hud.dataset['level'] = String(tilt < 0.5);
    /** A physical bubble moves uphill in table-local coordinates. */
    const bubbleDistance = Math.hypot(gravity[0], gravity[1]);
    /** Map a fully tilted table to the visible edge of the dial. */
    const bubbleScale = Math.min(
      17 / (GRAVITY * Math.sin(Math.PI / 4)),
      17 / Math.max(bubbleDistance, 0.001)
    );
    bubble.style.transform = `translate(${-gravity[0] * bubbleScale}px, ${gravity[1] * bubbleScale}px)`;
    dial.setAttribute(
      'aria-label',
      tilt < 0.5 ? 'Bubble centered: table level' : 'Bubble indicates uphill'
    );
    horizon.style.transform = `rotate(${-roll}deg) translateY(${pitch * 0.38}px)`;
  }

  /** Return the exact local gravity used by this frame's physics step. */
  function update(): [number, number, number] {
    if (!drag) orbit.update();
    if (mode.value === 'orbit') {
      direction.copy(camera.position).sub(orbit.target).normalize();
      /** Measure snap distance from the calibrated level pose. */
      const angle = direction.angleTo(initialDirection);
      if (!orbitDragging && snap.checked && angle > 0.00001 && angle < SNAP_RADIANS) {
        resetOrbit();
        direction.copy(initialDirection);
      }
      direction.applyQuaternion(viewToGravity).multiplyScalar(-GRAVITY);
    } else {
      if (!drag && snap.checked && slope.length() < Math.tan(SNAP_RADIANS)) slope.set(0, 0);
      direction.set(slope.x, slope.y, 1).normalize();
      rotation.setFromUnitVectors(up, direction);
      inverseRotation.copy(rotation).invert();
      direction.set(0, 0, -GRAVITY).applyQuaternion(inverseRotation);
    }
    /** Use the exact same vector for instrumentation and the physics dispatch. */
    const gravity: [number, number, number] = [direction.x, direction.y, direction.z];
    showAttitude(gravity);
    return gravity;
  }

  /** Benchmarking temporarily owns both the pointer and the orbit controller. */
  function setInputEnabled(enabled: boolean): void {
    inputEnabled = enabled;
    stopDrag();
    orbit.enabled = enabled;
    mode.disabled = !enabled;
    sensitivity.disabled = !enabled;
    snap.disabled = !enabled;
    panel.querySelector<HTMLButtonElement>('#level')!.disabled = !enabled;
  }

  /** Record view gestures so snap cannot fight active dragging. */
  const startOrbit = () => {
    orbitDragging = true;
  };
  /** Allow coupled tilt to snap once orbit input has ended. */
  const stopOrbit = () => {
    orbitDragging = false;
  };
  orbit.addEventListener('start', startOrbit);
  orbit.addEventListener('end', stopOrbit);
  canvas.addEventListener('pointerdown', startDrag, {capture: true, signal: listeners.signal});
  canvas.addEventListener('pointermove', moveDrag, {signal: listeners.signal});
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) {
    canvas.addEventListener(event, finishDrag, {signal: listeners.signal});
  }
  canvas.addEventListener(
    'dblclick',
    () => {
      if (inputEnabled) level();
    },
    {signal: listeners.signal}
  );
  panel.querySelector<HTMLButtonElement>('#level')!.onclick = level;
  sensitivity.oninput = () => {
    orbit.rotateSpeed = Number(sensitivity.value);
    sensitivityValue.textContent = orbit.rotateSpeed.toFixed(2);
  };
  mode.onchange = () => {
    stopDrag();
    level();
    controlMode.textContent = mode.value === 'grab' ? 'Drag table to tilt' : 'Tilt follows view';
    hint.textContent =
      mode.value === 'grab'
        ? 'Drag the table to tilt. Drag the background or hold Alt to orbit.'
        : 'Orbit the view to tilt the table.';
  };

  calibrate();
  return {
    panel,
    rotation,
    inverseRotation,
    update,
    calibrate,
    resetOrbit,
    setInputEnabled,
    /** Remove the mounted instrument and release listeners before orbit disposal. */
    destroy() {
      stopDrag();
      listeners.abort();
      orbit.removeEventListener('start', startOrbit);
      orbit.removeEventListener('end', stopOrbit);
      hud.remove();
    }
  };
}
