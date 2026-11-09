// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const STACK_QUALIFICATION_SCENARIOS = {
  difficult: {name: 'eight-box stack', levels: 8, load: 1, centerOffset: 0},
  massRatio: {name: '10:1 heavy-on-light stack', levels: 4, load: 10, centerOffset: 0},
  offset: {name: 'offset-center-of-mass stack', levels: 4, load: 1, centerOffset: 0.1}
} as const;
