// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Log} from '@probe.gl/log';
import {registerLogImplementation} from '../utils/log';

/** Full Probe logger installed by the optional diagnostics entry. */
export const probeLog = new Log({id: 'luma.gl'});

registerLogImplementation(probeLog);
