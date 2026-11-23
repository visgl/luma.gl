// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {it} from 'vitest';
import {checkEmitterSampling} from './anari-emitter-sampling-fixture';

it(
  'explicit emissive connections preserve energy, reject masked occluders and track committed emitters',
  () => checkEmitterSampling('full'),
  180_000
);
