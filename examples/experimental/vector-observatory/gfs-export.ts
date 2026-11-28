// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import * as arrow from 'apache-arrow';
import {encodeText} from '@loaders.gl/core';
import {CSVWriter} from '@loaders.gl/tables/csv';
import type {FlowTrajectorySnapshot} from '@luma.gl/graph/experimental-simulation';
import {GFS_FIXTURE, measureGfsError} from './gfs-data';

/** Native Arrow table with stable identities, physical units and nullable reference errors. */
export function makeGfsTrajectoryTable(frames: FlowTrajectorySnapshot[]): arrow.Table {
  const rows = frames.flatMap(frame => {
    const reference = GFS_FIXTURE.reference.frames.find(candidate => candidate.time === frame.time);
    return Array.from({length: 4}, (_, particle) => {
      const offset = particle * 4;
      const horizontal = frame.particles[offset];
      const vertical = frame.particles[offset + 1];
      return {
        // CSV has no timezone schema. Preserve the explicit ISO UTC representation as UTF-8.
        timeUtc: new Date(
          Date.parse(GFS_FIXTURE.snapshots[0].date) + frame.time * 1000
        ).toISOString(),
        elapsedSeconds: frame.time,
        particleId: particle + 1,
        longitude: -85 + 30 * horizontal,
        latitude: 20 + 30 * vertical,
        ageSeconds: frame.particles[offset + 2],
        generation: frame.particles[offset + 3],
        referenceErrorMetres: reference
          ? measureGfsError(horizontal, vertical, reference.positions[particle])
          : null
      };
    });
  });
  return new arrow.Table({
    time_utc: arrow.vectorFromArray(
      rows.map(row => row.timeUtc),
      new arrow.Utf8()
    ),
    elapsed_seconds: arrow.vectorFromArray(
      rows.map(row => row.elapsedSeconds),
      new arrow.Float64()
    ),
    particle_id: arrow.vectorFromArray(
      rows.map(row => row.particleId),
      new arrow.Uint32()
    ),
    longitude_degrees: arrow.vectorFromArray(
      rows.map(row => row.longitude),
      new arrow.Float64()
    ),
    latitude_degrees: arrow.vectorFromArray(
      rows.map(row => row.latitude),
      new arrow.Float64()
    ),
    age_seconds: arrow.vectorFromArray(
      rows.map(row => row.ageSeconds),
      new arrow.Float64()
    ),
    generation: arrow.vectorFromArray(
      rows.map(row => row.generation),
      new arrow.Uint32()
    ),
    reference_error_metres: arrow.vectorFromArray(
      rows.map(row => row.referenceErrorMetres),
      new arrow.Float64()
    )
  });
}

/** Pass a native Arrow table directly to loaders.gl's lazily loaded CSVWriter. */
export async function makeGfsCsv(frames: FlowTrajectorySnapshot[]): Promise<string> {
  return encodeText(makeGfsTrajectoryTable(frames), CSVWriter);
}
