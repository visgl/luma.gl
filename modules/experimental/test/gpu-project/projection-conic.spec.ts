// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Projection} from '@math.gl/projection';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {planCRSProjection, planProjectionPipeline} from '@luma.gl/experimental/gpu-project/crs';
import {runProjectionProgramBenchmark} from '@luma.gl/experimental/gpu-project/benchmarks';
import {
  invertProjectionProgram,
  type ProjectionCoordinates
} from '@luma.gl/experimental/gpu-project';
import {geographicCRS, makeConicCRS, getConicOracleDefinition} from './projection-crs-fixtures';

for (const method of ['lambert-1sp', 'lambert-2sp', 'albers'] as const) {
  for (const southern of [false, true]) {
    for (const inverse of [false, true]) {
      it(`runs native ${method}/${southern ? 'south' : 'north'}/${inverse ? 'inverse' : 'forward'} inline and materialized`, async context => {
        const device = await getWebGPUTestDevice();
        if (
          !device ||
          device.info.gpu === 'software' ||
          device.info.gpuType === 'cpu' ||
          device.info.fallback
        )
          context.skip();
        const provider = new Projection({
          from: 'EPSG:4326',
          to: getConicOracleDefinition(method, southern)
        });
        const result = planCRSProjection({
          from: geographicCRS,
          to: makeConicCRS(method, southern),
          projectionArithmetic: 'float32',
          allowAdaptive: false
        });
        if (result.status !== 'ready') throw new Error(JSON.stringify(result.reasons));
        const pipeline = planProjectionPipeline({
          projectionArithmetic: 'float32',
          pipeline: `+proj=pipeline +step +proj=unitconvert +xy_in=deg +xy_out=rad +step ${getConicOracleDefinition(method, southern).replace(' +units=m', '')}`
        });
        if (pipeline.status !== 'ready') throw new Error(JSON.stringify(pipeline.reasons));
        const geographic: ProjectionCoordinates[] = [
          -130, -71.500000001, -71.5, -71.499999999, -10
        ].flatMap(longitude =>
          [-70, -41.8, -1e-9, 0, 1e-9, 41.8, 70].map(latitude => [longitude, latitude])
        );
        const coordinates: ProjectionCoordinates[] = inverse
          ? geographic.map(position => {
              const projected = provider.project([...position]);
              return [projected[0], projected[1]];
            })
          : geographic;
        const invalid: ProjectionCoordinates[] = inverse
          ? [
              [0, 1e20],
              ...[
                [18.500000001, 0],
                [-161.500000001, 0],
                [-71.5, 80.000000001],
                [-71.5, -80.000000001]
              ].map(position => {
                const projected = provider.project(position);
                return [projected[0], projected[1]] as const;
              })
            ]
          : [
              [180, 0],
              [-71.5, 80.000000001],
              [-71.5, -80.000000001],
              [18.500000001, 0],
              [-161.500000001, 0]
            ];
        coordinates.push(...invalid, [NaN, 0]);
        const report = await runProjectionProgramBenchmark(device, {
          coordinates,
          oracle: position => {
            if (
              !position.every(Number.isFinite) ||
              invalid.some(
                candidate => candidate[0] === position[0] && candidate[1] === position[1]
              )
            )
              return {position: [0, 0], valid: false};
            const projected = inverse
              ? provider.unproject([...position])
              : provider.project([...position]);
            return {position: [projected[0], projected[1]], valid: true};
          },
          variants: [result, pipeline].map((planned, index) => ({
            id: `native-float32-${index}`,
            maximumError: inverse ? 0.0002 : 20,
            createProgram: () =>
              inverse ? invertProjectionProgram(planned.program) : planned.program
          })),
          gpuTiming: false,
          warmupIterations: 0,
          measuredIterations: 1
        });
        expect(report.paths).toHaveLength(4);
        for (const path of report.paths) {
          expect(path.validRows).toBe(35);
          expect(path.metadata.arithmetic).toBe('mixed');
          expect(path.adaptiveStages).toHaveLength(0);
        }
        expect(report.paths[0].maximumObservedError).toBe(report.paths[1].maximumObservedError);
      });
    }
  }
}
