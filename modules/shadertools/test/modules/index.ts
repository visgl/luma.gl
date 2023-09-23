// luma.gl, MIT license

import './modules.spec';

// Math modules
// TODO - these are breaking in test-browser but not in test-headless??
import './fp64/fp64-arithmetic-transform.spec';
import './fp64/fp64-utils.spec';
import './utils/random.spec';

// Light and picking
// import './dirlight/dirlight.spec';
import './lights/lights.spec';
// import './phong-lighting/phong-lighting.spec';
// import './picking/picking.spec';


// Blur Filters
import './image-blur-filters/tiltshift.spec';
import './image-blur-filters/triangleblur.spec';
import './image-blur-filters/zoomblur.spec';

import './image-adjust-filters/brightnesscontrast.spec';
import './image-adjust-filters/denoise.spec';
import './image-adjust-filters/huesaturation.spec';
import './image-adjust-filters/noise.spec';
import './image-adjust-filters/sepia.spec';
import './image-adjust-filters/vibrance.spec';
import './image-adjust-filters/vignette.spec';

import './image-fun-filters/colorhalftone.spec';
import './image-fun-filters/dotscreen.spec';
import './image-fun-filters/edgework.spec';
import './image-fun-filters/hexagonalpixelate.spec';
import './image-fun-filters/ink.spec';

import './image-warp-filters/bulgepinch.spec';
import './image-warp-filters/swirl.spec';
import './image-warp-filters/warp.spec';
