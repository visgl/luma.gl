// logdepth module
import assert from 'assert';

export const name = 'logdepth';

/* eslint-disable camelcase */
export function getUniforms({
  logdepthEnable = false,
  farZ,
  C = 1
} = {}) {
  assert(farZ > 0 && C > 0);
  return {
    logdepth_uEnable: logdepthEnable,
    // logdepth_uFcoef_half: 0.5 / Math.log(farZ * C + 1)
    logdepth_uFC: 2.0 / (Math.log(farZ * C + 1.0) / Math.LN2)
  };
}

export const vs = `\
uniform float logdepth_FC;
#ifdef FRAG_DEPTH
varying float logdepth_vFragDepth;
#endif

void logdepth_adjustPosition(position) {
  if (logdepth_uEnable) {
    position.z = log2(max(EPSILON, position.w + 1.0)) * logdepth_uFC;
#ifdef FRAG_DEPTH
    logdepth_vFragDepth = 1.0 + position.w;
#else
    position.z = (position.z - 1.0) * position.w;
#endif
  }
}
`;

export const fs = `\
uniform float logdepth_FC;

void logdepth_setFragDepth()
#ifdef FRAG_DEPTH
  if (logdepth_uEnable) {
    gl_FragDepth = log2(logdepth_vFragDepth) * logdepth_uFC * 0.5;
  }
#endif
`;

export default {
  name: 'logdepth',
  vs,
  fs,
  getUniforms
};

/*
// VERTEX SHADER

export const vs2 = `\
varying vec4 logdepth_vflogz;

void logdepth_setProjectedPosition(vec4 gl_Position) {
  logdepth_vflogz = 1.0 + gl_Position.w;
}
`;

// FRAGMENT SHADER

export const fs2 = `\
uniform bool logdepth_uEnable;
uniform float logdepth_uFcoef_half;
varying float logdepth_vflogz;

const float Fcoef;
const float Fcoef_half = 0.5 * Fcoef;

float logdepth_filterFragDepth(gl_FragDepth) {
  gl_FragDepth = logdepth_uEnable ?
    log2(logdepth_vflogz) * Fcoef_half,
    gl_FragDepth;
  );
}
`;
*/
