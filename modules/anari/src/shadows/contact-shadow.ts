// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Texture} from '@luma.gl/core';
import type {ContactShadowProps as SharedContactShadowProps} from '@luma.gl/shaders';
export type ContactShadowProps = SharedContactShadowProps<Texture>;
export {
  contactShadowTrace,
  contactShadowBilateralBlur,
  contactShadowComposite
} from '@luma.gl/shaders';
export {createContactShadowCompositeShaderPass} from '@luma.gl/engine/lighting';
