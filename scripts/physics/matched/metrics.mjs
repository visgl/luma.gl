// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

const dot = (first, second) => first.reduce((sum, value, axis) => sum + value * second[axis], 0);
const subtract = (first, second) => first.map((value, axis) => value - second[axis]);
const cross = (first, second) => [
  first[1] * second[2] - first[2] * second[1],
  first[2] * second[0] - first[0] * second[2],
  first[0] * second[1] - first[1] * second[0]
];
export function axesForQuaternion([x, y, z, w]) {
  return [
    [1 - 2 * (y * y + z * z), 2 * (x * y + z * w), 2 * (x * z - y * w)],
    [2 * (x * y - z * w), 1 - 2 * (x * x + z * z), 2 * (y * z + x * w)],
    [2 * (x * z + y * w), 2 * (y * z - x * w), 1 - 2 * (x * x + y * y)]
  ];
}
/** Separating-axis minimum translation depth of two sharp OBBs, in meters. */
export function boxPenetration(first, firstState, second, secondState) {
  const firstAxes = axesForQuaternion(firstState.orientation),
    secondAxes = axesForQuaternion(secondState.orientation);
  const distance = subtract(secondState.position, firstState.position);
  let minimum = Infinity;
  for (const axis of [
    ...firstAxes,
    ...secondAxes,
    ...firstAxes.flatMap(firstAxis => secondAxes.map(secondAxis => cross(firstAxis, secondAxis)))
  ]) {
    const length = Math.hypot(...axis);
    if (length < 1e-8) continue;
    const normal = axis.map(value => value / length);
    const radius = (body, axes) =>
      body.halfExtents.reduce(
        (sum, extent, index) => sum + extent * Math.abs(dot(axes[index], normal)),
        0
      );
    const overlap =
      radius(first, firstAxes) + radius(second, secondAxes) - Math.abs(dot(distance, normal));
    if (overlap <= 0) return 0;
    minimum = Math.min(minimum, overlap);
  }
  return minimum;
}
export function summarize(values) {
  const sorted = [...values].sort((first, second) => first - second);
  if (!sorted.length || sorted.some(value => !Number.isFinite(value) || value < 0)) return null;
  return {
    count: sorted.length,
    median: sorted[Math.floor(sorted.length / 2)],
    p95: sorted[Math.ceil(sorted.length * 0.95) - 1],
    maximum: sorted.at(-1)
  };
}
export function initialStates(fixture) {
  return fixture.bodies.map(body => ({
    position: body.position,
    orientation: body.orientation,
    velocity: body.velocity,
    angularVelocity: body.angularVelocity
  }));
}
export function mechanicalEnergy(fixture, states) {
  return fixture.bodies.reduce((energy, body, index) => {
    if (!body.mass) return energy;
    const state = states[index],
      axes = axesForQuaternion(state.orientation);
    const inertia = body.halfExtents.map(
      (_, axis) =>
        (body.mass / 3) *
        body.halfExtents.reduce((sum, extent, index) => sum + (index === axis ? 0 : extent ** 2), 0)
    );
    return (
      energy +
      body.mass * (dot(state.velocity, state.velocity) / 2 - dot(fixture.gravity, state.position)) +
      axes.reduce(
        (sum, axis, index) => sum + (inertia[index] * dot(axis, state.angularVelocity) ** 2) / 2,
        0
      )
    );
  }, 0);
}
/** Quality replay only: state reads and independent CPU geometry checks never enter timing. */
export function measureQuality(fixture, frames, timeStep) {
  const expected = fixture.bodies.length;
  if (
    !frames.length ||
    frames.some(
      frame =>
        frame.states.length !== expected ||
        frame.states.some(state =>
          ['position', 'velocity', 'angularVelocity', 'orientation'].some(
            field =>
              state[field]?.length !== (field === 'orientation' ? 4 : 3) ||
              !state[field].every(Number.isFinite)
          )
        )
    )
  )
    return {finiteState: false, valid: false};
  const excluded = new Set(
    fixture.joints.map(
      joint => `${Math.min(joint.first, joint.second)}:${Math.max(joint.first, joint.second)}`
    )
  );
  const initialEnergy = mechanicalEnergy(fixture, initialStates(fixture));
  let maximumPenetration = 0,
    maximumJointError = 0,
    maximumBallisticError = 0,
    maximumEnergyGain = 0,
    maximumQuaternionError = 0,
    maximumConservativeEnergyError = 0;
  const escaped = new Set();
  const penetrationSamples = [];
  for (const frame of frames) {
    const entries = fixture.bodies
      .map((body, index) => {
        const state = frame.states[index],
          axes = axesForQuaternion(state.orientation);
        const extent = [0, 1, 2].map(axis =>
          body.halfExtents.reduce(
            (sum, value, local) => sum + value * Math.abs(axes[local][axis]),
            0
          )
        );
        maximumQuaternionError = Math.max(
          maximumQuaternionError,
          Math.abs(Math.hypot(...state.orientation) - 1)
        );
        if (
          fixture.scene === 'matchedFast' &&
          body.mass &&
          Math.abs(state.position[0]) > 5.03 + extent[0]
        )
          escaped.add(index);
        if (fixture.scene === 'matchedBallistic') {
          const time = frame.step * timeStep;
          const error = state.position.map(
            (value, axis) =>
              value -
              (body.position[axis] +
                body.velocity[axis] * time +
                (fixture.gravity[axis] * time ** 2) / 2)
          );
          maximumBallisticError = Math.max(maximumBallisticError, Math.hypot(...error));
        }
        return {
          index,
          body,
          state,
          minimum: state.position.map((value, axis) => value - extent[axis]),
          maximum: state.position.map((value, axis) => value + extent[axis])
        };
      })
      .sort((first, second) => first.minimum[0] - second.minimum[0]);
    let penetration = 0;
    for (let first = 0; first < entries.length; first++)
      for (let second = first + 1; second < entries.length; second++) {
        const left = entries[first],
          right = entries[second];
        if (right.minimum[0] > left.maximum[0]) break;
        if (
          (!left.body.mass && !right.body.mass) ||
          excluded.has(
            `${Math.min(left.index, right.index)}:${Math.max(left.index, right.index)}`
          ) ||
          [1, 2].some(
            axis =>
              left.maximum[axis] < right.minimum[axis] || right.maximum[axis] < left.minimum[axis]
          )
        )
          continue;
        penetration = Math.max(
          penetration,
          boxPenetration(left.body, left.state, right.body, right.state)
        );
      }
    maximumPenetration = Math.max(maximumPenetration, penetration);
    penetrationSamples.push(penetration);
    for (const joint of fixture.joints)
      maximumJointError = Math.max(
        maximumJointError,
        Math.abs(
          Math.hypot(
            ...subtract(frame.states[joint.first].position, frame.states[joint.second].position)
          ) - joint.distance
        )
      );
    const relativeEnergyChange =
      (mechanicalEnergy(fixture, frame.states) - initialEnergy) /
      Math.max(1, Math.abs(initialEnergy));
    maximumEnergyGain = Math.max(maximumEnergyGain, relativeEnergyChange);
    if (['matchedFast', 'matchedChain', 'matchedBallistic'].includes(fixture.scene))
      maximumConservativeEnergyError = Math.max(
        maximumConservativeEnergyError,
        Math.abs(relativeEnergyChange)
      );
  }
  const final = frames.at(-1).states;
  return {
    valid: true,
    finiteState: true,
    sampledFrames: frames.length,
    maximumPenetration,
    penetration: summarize(penetrationSamples),
    maximumJointError,
    maximumBallisticError,
    maximumQuaternionError,
    escapedBodies: escaped.size,
    initialEnergy,
    finalEnergy: mechanicalEnergy(fixture, final),
    maximumEnergyGain,
    maximumConservativeEnergyError,
    finalMovingBodies: fixture.bodies.filter(
      (body, index) =>
        body.mass &&
        (Math.hypot(...final[index].velocity) > 0.05 ||
          Math.hypot(...final[index].angularVelocity) > 0.05)
    ).length
  };
}

export const QUALITY_BUDGETS = {
  maximumPenetration: 0.03,
  maximumJointError: 0.02,
  maximumBallisticError: 0.2,
  maximumQuaternionError: 0.001,
  maximumEnergyGain: 0.05,
  maximumConservativeEnergyError: 0.1,
  escapedBodies: 0
};
export function assessQuality(quality, budgets = QUALITY_BUDGETS) {
  const failures = Object.entries(budgets)
    .filter(([metric, limit]) => !Number.isFinite(quality[metric]) || quality[metric] > limit)
    .map(([metric]) => metric);
  if (!quality.valid || !quality.finiteState) failures.unshift('finiteState');
  return {passed: failures.length === 0, failures};
}
