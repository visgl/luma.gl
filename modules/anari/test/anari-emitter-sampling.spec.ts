// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {it} from 'vitest';
import {checkEmitterSampling} from './anari-emitter-sampling-fixture';

it(
  'explicit emitter sampling illuminates the receiver and respects occlusion',
  () => checkEmitterSampling('smoke'),
  180_000
);
