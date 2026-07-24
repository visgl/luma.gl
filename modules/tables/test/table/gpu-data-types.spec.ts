// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {NullDevice} from '@luma.gl/test-utils';
import {GPUData, type GPUDataView} from '@luma.gl/tables';
import {expectTypeOf, test} from 'vitest';

test('GPUData infers inline struct field types', () => {
  const device = new NullDevice({});
  const buffer = device.createBuffer({byteLength: 64});
  const data = new GPUData({
    buffer,
    length: 2,
    format: {a: 'sint32', b: 'float32'},
    layout: 'packed'
  });

  data satisfies GPUData<{a: 'sint32'; b: 'float32'}, 'packed'>;
  expectTypeOf(data.getChild('b')).toEqualTypeOf<GPUDataView<'float32'> | null>();
  expectTypeOf(data.getChild('missing')).toEqualTypeOf<null>();
  const dynamicFieldName: string = 'b';
  expectTypeOf(data.getChild(dynamicFieldName)).toEqualTypeOf<
    GPUDataView<'sint32'> | GPUDataView<'float32'> | null
  >();
  expectTypeOf(data.format?.layout).toEqualTypeOf<'packed' | undefined>();

  const scalarData = new GPUData({buffer, length: 2, format: 'float32'});
  expectTypeOf(scalarData.format).toEqualTypeOf<'float32' | undefined>();

  buffer.destroy();
});
