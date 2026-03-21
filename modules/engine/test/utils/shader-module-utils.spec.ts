// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import type {ShaderLayout} from '../../../core/src';
import {lighting} from '../../../shadertools/src';
import {mergeShaderModuleBindingsIntoLayout} from '../../src/utils/shader-module-utils';

test('mergeShaderModuleBindingsIntoLayout does not create placeholder layouts', t => {
  const shaderLayout = mergeShaderModuleBindingsIntoLayout<ShaderLayout | null>(null, [lighting]);
  t.equal(shaderLayout, null, 'null shader layouts stay null until a real layout is inferred');
  t.end();
});
