// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {persistenceEffect} from '@luma.gl/effects';
import {expect, it} from 'vitest';

it('persistenceEffect#bindings', () => {
  expect(persistenceEffect.bindingLayout, 'declares the frame-history texture binding').toEqual([
    {name: 'persistenceTexture', group: 0}
  ]);
  void 0;
});
