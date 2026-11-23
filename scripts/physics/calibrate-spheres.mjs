// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFile} from 'node:fs/promises';
import {fitSphereCalibration} from '../../modules/graph/dist/gpu-physics/index.js';

const filename = process.argv[2];
if (!filename) throw new Error('Usage: node scripts/physics/calibrate-spheres.mjs dataset.json');
const dataset = JSON.parse(await readFile(filename, 'utf8'));
console.log(JSON.stringify(fitSphereCalibration(dataset), null, 2));
