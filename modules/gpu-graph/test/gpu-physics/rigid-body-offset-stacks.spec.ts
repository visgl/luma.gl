// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {registerStackQualification} from './rigid-body-stack-qualification';

registerStackQualification({
  name: 'offset-center-of-mass stack',
  levels: 4,
  load: 1,
  centerOffset: 0.1
});
