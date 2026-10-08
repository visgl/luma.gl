// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it, vi} from 'vitest';
import {
  ProjectionRenderTransform,
  ProjectionTableError
} from '@luma.gl/experimental/gpu-project/crs';
import {makeTableTransform} from './projection-table-fixtures';

it('shares the retained provider and applies explicit origin, axes and signed units', () => {
  const {prepared} = makeTableTransform('local-f32');
  const source = [-122.4, 37.8] as const;
  const destination = prepared.projection.projectSync([...source]);
  const origin: [number, number] = [destination[0] - 0.001, destination[1] + 0.002];
  const scale: [number, number] = [-1000, 1000];
  const transform = new ProjectionRenderTransform(prepared, {origin, axes: [1, 0], scale});
  const project = vi.spyOn(prepared.projection, 'projectToSync');
  const position = transform.projectPosition(source)!;
  expect(project).toHaveBeenCalledOnce();
  expect(position.source).toEqual(source);
  expect(position.destination).toEqual(destination);
  expect(position.common[0]).toBeCloseTo(2, 5);
  expect(position.common[1]).toBeCloseTo(1, 5);
  expect(transform.compiled.inputFormat).toBe('uint32x4');
  expect(transform.compiled.precision).toBe('local-f32');
  expect(transform.compiled.destinationOrigin).toEqual([0, 0]);
  // Caller edits cannot desynchronize CPU frame metadata from packed GPU parameters.
  origin.fill(0);
  scale.fill(1);
  expect(transform.projectPosition(source)).toEqual(position);
  expect(Object.isFrozen(transform.frame.axes)).toBe(true);
  project.mockRestore();
});

it('does not narrow large absolute coordinates before subtracting the render origin', () => {
  const {prepared} = makeTableTransform();
  const first = prepared.projection.projectSync([-122.4, 37.8]);
  const transform = new ProjectionRenderTransform(prepared, {
    origin: [first[0], first[1]],
    scale: [1, 1]
  });
  const second = transform.projectPosition([-122.4 + 1e-8, 37.8])!;
  expect(Math.fround(first[0])).toBe(Math.fround(second.destination[0]));
  expect(second.common[0]).toBeGreaterThan(0.0005);
  expect(transform.projectPosition([-122.4, 37.8])!.common).toEqual([0, 0]);
});

it('rejects invalid frames, altitude, out-of-domain coordinates and provider failures explicitly', () => {
  const {prepared} = makeTableTransform();
  for (const scale of [
    [0, 1],
    [1, Infinity]
  ] as const) {
    expect(() => new ProjectionRenderTransform(prepared, {origin: [0, 0], scale})).toThrow();
  }
  const transform = new ProjectionRenderTransform(prepared, {origin: [0, 0], scale: [1, 1]});
  expect(transform.projectPosition([-122.2, 37.8])).toBeNull();
  expect(transform.projectPosition([NaN, 37.8])).toBeNull();
  expect(() => transform.projectPosition([-122.4, 37.8, 100] as never)).toThrow('2D');
  const project = vi.spyOn(prepared.projection, 'projectToSync').mockImplementation(() => {
    throw new Error('provider failure');
  });
  expect(() => transform.projectPosition([-122.4, 37.8])).toThrow(ProjectionTableError);
  project.mockRestore();
});
