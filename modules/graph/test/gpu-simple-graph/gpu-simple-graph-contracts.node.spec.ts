// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {resolve} from 'node:path';
import typescript from 'typescript';
import {Buffer} from '@luma.gl/core';
import {GPUData} from '@luma.gl/gpgpu/gpu-data';
import {NullDevice} from '@luma.gl/test-utils';
import {GPUSimpleGraph, GPUSimpleGraphValue} from '@luma.gl/graph/gpu-simple-graph';
import {GPUProgram, GPUProgramScalarLiteral, GPUProgramVectorMADD} from '@luma.gl/graph/gpu-core';

it('checks render parameter requirements through direct, array, and composite additions', () => {
  const fixture = resolve('modules/graph/test/gpu-simple-graph/fixtures/parameters.type-test.ts');
  const configuration = typescript.readConfigFile('tsconfig.json', typescript.sys.readFile);
  const parsed = typescript.parseJsonConfigFileContent(
    configuration.config,
    typescript.sys,
    process.cwd()
  );
  const program = typescript.createProgram([fixture], {
    ...parsed.options,
    noEmit: true,
    noUnusedLocals: false
  });
  const diagnostics = typescript.getPreEmitDiagnostics(program, program.getSourceFile(fixture));
  expect(
    diagnostics.map(diagnostic =>
      typescript.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
    )
  ).toEqual([]);
});

for (const uploadFirst of [true, false]) {
  it(`rejects invalidation input-name collisions with upload first=${uploadFirst}`, () => {
    const device = new NullDevice({});
    const buffer = device.createBuffer({byteLength: 8, usage: Buffer.VERTEX | Buffer.STORAGE});
    const program = new GPUProgram();
    const input = program.vector('input', 'float32', 2, {external: true});
    const output = program.vector('output', 'float32', 2);
    const scale = program.scalar('scale', 'float32');
    const graph = new GPUSimpleGraph(device);
    const addUpload = () =>
      graph.addValue('input', GPUSimpleGraphValue.upload(new Float32Array([1, 2])));
    if (uploadFirst) addUpload();
    graph.add([
      new GPUProgramScalarLiteral({output: scale, value: 2}),
      new GPUProgramVectorMADD({input, addend: input, output, scale})
    ]);
    if (!uploadFirst) addUpload();
    try {
      expect(() =>
        graph.compile({
          bindings: {vectors: {input: new GPUData({buffer, format: 'float32', length: 2})}}
        })
      ).toThrow();
      expect(buffer.destroyed).toBe(false);
    } finally {
      buffer.destroy();
      device.destroy();
    }
  });
}
