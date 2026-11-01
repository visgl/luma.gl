// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {registerStackQualification} from './rigid-body-stack-qualification';
import {STACK_QUALIFICATION_SCENARIOS} from './rigid-body-stack-scenarios';

for (const scenario of Object.values(STACK_QUALIFICATION_SCENARIOS)) {
  registerStackQualification(scenario, {durationSeconds: 1});
}
