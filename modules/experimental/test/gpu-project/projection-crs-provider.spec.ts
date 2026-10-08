// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {Projection} from '@math.gl/projection';
import {planCRSProjection} from '@luma.gl/experimental/gpu-project/crs';
import {runProjectionProgramBenchmark} from '@luma.gl/experimental/gpu-project/benchmarks';
import type {ProjectionCoordinates} from '@luma.gl/experimental/gpu-project';
import {geographicCRS, makeConicCRS, getConicOracleDefinition} from './projection-crs-fixtures';

for (const method of ['lambert-1sp', 'lambert-2sp', 'albers'] as const) {
  for (const zeroParallel of method === 'lambert-1sp' ? [undefined] : [undefined, 8823, 8824]) {
    for (const inverse of [false, true]) {
      it(`executes identifier-only ${method}/zero=${zeroParallel}/${inverse ? 'inverse' : 'forward'} through adaptive inline and graph paths`, async context => {
        const device = await getWebGPUTestDevice();
        if (!device) return;
        if (device.info.gpu === 'software' || device.info.gpuType === 'cpu' || device.info.fallback)
          context.skip();
        const original = makeConicCRS(method);
        const target = {
          ...original,
          conversion: {
            ...original.conversion,
            method: {...original.conversion.method, name: ''},
            parameters: original.conversion.parameters.map(parameter => ({
              ...parameter,
              name: '',
              value: parameter.id.code === zeroParallel ? 0 : parameter.value
            }))
          }
        };
        const serialized =
          zeroParallel === undefined
            ? getConicOracleDefinition(method)
            : getConicOracleDefinition(method).replace(
                new RegExp(`\\+lat_${zeroParallel === 8823 ? 1 : 2}=[^ ]+`),
                `+lat_${zeroParallel === 8823 ? 1 : 2}=0`
              );
        const oracle = new Projection({from: 'EPSG:4326', to: serialized});
        const coordinates: ProjectionCoordinates[] = inverse
          ? [
              [200000.000001, 837500.000001],
              [200000.000002, 837500.000002],
              [200100.25, 837600.5],
              [NaN, 0],
              [0, 0]
            ]
          : [
              [-71.500000001, 41.800000001],
              [-71.500000002, 41.800000002],
              [-71.51, 41.81],
              [NaN, 0],
              [0, 0]
            ];
        const report = await runProjectionProgramBenchmark(device, {
          coordinates,
          oracle: position => {
            if (!Number.isFinite(position[0]) || position[0] === 0)
              return {position: [0, 0], valid: false};
            const projected = inverse
              ? oracle.unproject([...position])
              : oracle.project([...position]);
            return {position: [projected[0], projected[1]], valid: true};
          },
          variants: ['projjson', 'serialized'].map(id => ({
            id,
            maximumError: inverse ? 1e-9 : 1e-5,
            createProgram: () => {
              const projected = id === 'projjson' ? target : serialized;
              const result = planCRSProjection({
                from: inverse ? projected : geographicCRS,
                to: inverse ? geographicCRS : projected,
                bounds: inverse ? [190000, 825000, 210000, 850000] : [-71.6, 41.7, -71.4, 41.9],
                tolerance: inverse ? 1e-9 : 1e-5
              });
              if (result.status !== 'ready') throw new Error(JSON.stringify(result.reasons));
              expect(result.strategy).toBe('adaptive');
              expect(result.compiled.precision).toBe('double-single');
              return result.program;
            }
          })),
          warmupIterations: 0,
          measuredIterations: 1
        });
        expect(
          report.paths.every(
            path => path.validRows === 3 && path.metadata.arithmetic === 'double-single'
          )
        ).toBe(true);
        expect(report.paths[0].maximumObservedError).toBe(report.paths[1].maximumObservedError);
      });
    }
  }
}
