// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {glsl} from './lib/glsl-utils/highlight';

export const MODULE_INJECTORS_VS = glsl`\
#ifdef MODULE_LOGDEPTH
  logdepth_adjustPosition(gl_Position);
#endif
`;

export const MODULE_INJECTORS_FS = glsl`\
#ifdef MODULE_MATERIAL
  gl_FragColor = material_filterColor(gl_FragColor);
#endif

#ifdef MODULE_LIGHTING
  gl_FragColor = lighting_filterColor(gl_FragColor);
#endif

#ifdef MODULE_FOG
  gl_FragColor = fog_filterColor(gl_FragColor);
#endif

#ifdef MODULE_PICKING
  gl_FragColor = picking_filterHighlightColor(gl_FragColor);
  gl_FragColor = picking_filterPickingColor(gl_FragColor);
#endif

#ifdef MODULE_LOGDEPTH
  logdepth_setFragDepth();
#endif
`;
