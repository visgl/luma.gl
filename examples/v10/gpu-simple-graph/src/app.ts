// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {initializeGPGPUShowcase, type GPGPUShowcaseProps} from '../../gpgpu/src/app';

export function initializeGPUSimpleGraphShowcase(props: GPGPUShowcaseProps = {}) {
  return initializeGPGPUShowcase({...props, useSimpleGraph: true});
}
