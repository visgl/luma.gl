// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Buffer} from '@luma.gl/core';
import {GPUData, type GPUDataView} from '@luma.gl/tables';

function checkGPUDataTypes(buffer: Buffer): void {
  const data = new GPUData({
    buffer,
    length: 2,
    format: {a: 'sint32', b: 'float32'},
    layout: 'packed'
  });
  const b: GPUDataView<'float32'> | null = data.getChild('b');
  const missing: null = data.getChild('missing');
  const layout: 'packed' | undefined = data.format?.layout;

  const explicitData = new GPUData<{a: 'sint32'; b: 'float32'}, 'packed'>({
    buffer,
    length: 2,
    format: {a: 'sint32', b: 'float32'},
    layout: 'packed'
  });
  const explicitB: GPUDataView<'float32'> | null = explicitData.getChild('b');

  // @ts-expect-error TypeScript generics do not provide the runtime field and layout metadata.
  new GPUData<{a: 'sint32'; b: 'float32'}, 'packed'>({buffer, length: 2});

  const scalarData = new GPUData({buffer, length: 2, format: 'float32'});
  const scalarFormat: 'float32' | undefined = scalarData.format;
  const broadScalarData: GPUData = scalarData;

  void b;
  void missing;
  void layout;
  void explicitB;
  void scalarFormat;
  void broadScalarData;
}

void checkGPUDataTypes;
