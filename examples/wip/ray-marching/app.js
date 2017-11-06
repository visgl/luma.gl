/* global document */
import {AnimationLoop, ClipSpaceQuad, resetParameters} from 'luma.gl';

// Shader modules
import signdist from './shaderlib/signdist';
import raymarch from './shaderlib/raymarch';

const SCENE_MENGER_SPONGE = `\
vec2 raymarch_scene( in vec3 p )
{
   const int RECURSION_LEVEL = 6;

   float d = signdist_Box(p, vec3(1.0));

   float s = 1.0;
   for( int m=0; m < RECURSION_LEVEL; m++ )
   {
      vec3 a = mod( p*s, 2.0 )-1.0;
      s *= 3.0;
      vec3 r = abs(1.0 - 3.0*abs(a));

      float da = max(r.x,r.y);
      float db = max(r.y,r.z);
      float dc = max(r.z,r.x);
      float c = (min(da,min(db,dc))-1.0)/s;

      d = max(d,c);
   }

   return vec2(d,1.0);
}
`;

const SCENE_FIELD_OF_PRIMITIVES = `\
// Field of primitives
vec2 raymarch_scene( in vec3 pos ) {
  vec2 res = vec2( signdist_Plane( pos), 1.0 );
  res = signdist_union( res, vec2( signdist_Sphere(    pos - vec3( 0.0,0.25, 0.0), 0.25 ), 46.9 ) );
  res = signdist_union( res, vec2( signdist_Box(       pos - vec3( 1.0,0.25, 0.0), vec3(0.25) ), 3.0 ) );
  res = signdist_union( res, vec2( signdist_uRoundBox( pos - vec3( 1.0,0.25, 1.0), vec3(0.15), 0.1 ), 41.0 ) );
  res = signdist_union( res, vec2( signdist_Torus(     pos - vec3( 0.0,0.25, 1.0), vec2(0.20,0.05) ), 25.0 ) );
  res = signdist_union( res, vec2( signdist_Capsule(   pos, vec3(-1.3,0.10,-0.1), vec3(-0.8,0.50,0.2), 0.1  ), 31.9 ) );
  res = signdist_union( res, vec2( signdist_TriPrism(  pos - vec3(-1.0,0.25,-1.0), vec2(0.25,0.05) ),43.5 ) );
  res = signdist_union( res, vec2( signdist_Cylinder(  pos - vec3( 1.0,0.30,-1.0), vec2(0.1,0.2) ), 8.0 ) );
  res = signdist_union( res, vec2( signdist_Cone(      pos - vec3( 0.0,0.50,-1.0), vec3(0.8,0.6,0.3) ), 55.0 ) );
  res = signdist_union( res, vec2( signdist_Torus82(   pos - vec3( 0.0,0.25, 2.0), vec2(0.20,0.05) ),50.0 ) );
  res = signdist_union( res, vec2( signdist_Torus88(   pos - vec3(-1.0,0.25, 2.0), vec2(0.20,0.05) ),43.0 ) );
  res = signdist_union( res, vec2( signdist_Cylinder6( pos - vec3( 1.0,0.30, 2.0), vec2(0.1,0.2) ), 12.0 ) );
  res = signdist_union( res, vec2( signdist_HexPrism(  pos - vec3(-1.0,0.20, 1.0), vec2(0.25,0.05) ),17.0 ) );
  res = signdist_union( res, vec2( signdist_Pyramid4(  pos - vec3(-1.0,0.15,-2.0), vec3(0.8,0.6,0.25) ),37.0 ) );
  res = signdist_union( res, vec2( signdist_ConeSection(  pos - vec3( 0.0,0.35,-2.0), 0.15, 0.2, 0.1 ), 13.67 ) );
  res = signdist_union( res, vec2( signdist_Ellipsoid(    pos - vec3( 1.0,0.35,-2.0), vec3(0.15, 0.2, 0.05) ), 43.17 ) );
  res = signdist_union( res, vec2( 0.5 * signdist_Sphere( pos - vec3(-2.0,0.25,-1.0), 0.2 ) + 0.03*sin(50.0*pos.x)*sin(50.0*pos.y)*sin(50.0*pos.z), 65.0 ) );
  res = signdist_union( res, vec2( 0.5 * signdist_Torus( signdist_twist(pos - vec3(-2.0,0.25, 2.0)),vec2(0.20,0.05)), 46.7 ) );

  res = signdist_union( res, vec2( signdist_subtract(
    signdist_uRoundBox( pos - vec3(-2.0,0.2, 1.0), vec3(0.15),0.05),
    signdist_Sphere(    pos - vec3(-2.0,0.2, 1.0), 0.25)), 13.0 ));

  vec3 repeat = signdist_repeat(
    vec3(atan(pos.x + 2.0, pos.z) / 6.2831, pos.y, 0.02 + 0.5 * length(pos - vec3(-2.0, 0.2, 0.0))),
    vec3(0.05, 1.0, 0.05));
  res = signdist_union( res, vec2( signdist_subtract(
    signdist_Torus82( pos - vec3(-2.0, 0.2, 0.0), vec2(0.20,0.1) ),
    signdist_Cylinder( repeat, vec2(0.02,0.6) ) ),
    51.0 ) );

  return res;
}
`;

const FRAGMENT_SHADER = `\

${SCENE_FIELD_OF_PRIMITIVES}

void main() {
  raymarch_renderScene(gl_FragColor, gl_FragCoord.xy);
}
`;

const animationLoop = new AnimationLoop({
  useDevicePixelRatio: false,
  onInitialize: ({gl}) => {
    return {clipSpaceQuad: new ClipSpaceQuad({gl,
      fs: FRAGMENT_SHADER,
      modules: [
        signdist,
        raymarch // : {inject: {scene: SIGNDIST_SCENE_SHADER}} // signed distance field module
      ]
    })};
  },
  onRender: opts => {
    const {gl, canvas, tick, clipSpaceQuad} = opts;
    clipSpaceQuad.updateModuleSettings();
    clipSpaceQuad.updateModuleSettings(opts);
    clipSpaceQuad.render();
  }
});

animationLoop.getInfo = () => {
  return `
  <p>
  <code>Raymarching</code> rendering implemented as a GLSL fragment shader.
  <p>
  Uses a luma.gl <code>ClipSpaceQuad</code> to set up a screen spaced model
  in which the <code>fragment shader</code> can render.
  <p>
  Based on the amazing work of Inigo Quilez under MIT license.
  `;
};

export default animationLoop;

/* global window */
if (typeof window !== 'undefined') {
  window.animationLoop = animationLoop;
}
