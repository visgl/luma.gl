// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {registerStackQualification} from './rigid-body-stack-qualification';

registerStackQualification({
  name: '10:1 heavy-on-light stack',
  levels: 4,
  load: 10,
  centerOffset: 0
});
