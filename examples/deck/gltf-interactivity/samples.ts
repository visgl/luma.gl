// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const INTERACTIVITY_SAMPLE_REVISION = '926bec45dfbe052bad4013ab5852ed2f4042bff5';
const ROOT_URL = `https://raw.githubusercontent.com/KhronosGroup/glTF-Test-Assets-Interactivity/${INTERACTIVITY_SAMPLE_REVISION}`;

export const INTERACTIVITY_SAMPLES = [
  {
    id: 'traffic-light',
    title: 'Traffic Light',
    path: 'Models/TrafficLight',
    file: 'TrafficLight.glb'
  },
  {
    id: 'branch',
    title: 'Branch tests',
    path: 'Tests/Interactivity/flow/branch',
    file: 'branch.glb'
  },
  {
    id: 'sequence',
    title: 'Sequence tests',
    path: 'Tests/Interactivity/flow/sequence',
    file: 'sequence.glb'
  },
  {
    id: 'switch',
    title: 'Switch tests',
    path: 'Tests/Interactivity/flow/switch',
    file: 'switch.glb'
  }
].map(sample => ({
  ...sample,
  url: `${ROOT_URL}/${sample.path}/glTF-Binary/${sample.file}`,
  sourceUrl: `https://github.com/KhronosGroup/glTF-Test-Assets-Interactivity/tree/${INTERACTIVITY_SAMPLE_REVISION}/${sample.path}`
}));
