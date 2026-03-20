// general utils
import './utils/uid.spec';

// type utils
import './shadertypes/data-type-decoder.spec';

import './shadertypes/shader-types.spec';
import './shadertypes/shader-type-decoder.spec';

import './shadertypes/texture-format-decoder.spec';
import './shadertypes/textures/texture-layout.spec';

import './shadertypes/vertex-format-decoder.spec';

// adapter utils
import './adapter-utils/get-attribute-from-layout.spec';
import './adapter-utils/is-uniform-value.browser.spec';
import './adapter-utils/format-compiler-log.spec';

// adapter

// Device, features & limits
import './adapter/device-helpers/device-info.browser.spec';
import './adapter/device-helpers/device-features.browser.spec';
import './adapter/device-helpers/device-limits.browser.spec';
import './adapter/device-helpers/set-device-parameters.browser.spec';

import './adapter/helpers/parse-shader-compiler-log.spec';
// import './adapter/helpers/get-shader-layout.spec';

import './adapter/device.browser.spec';
import './adapter/canvas-context.browser.spec';
import './adapter/luma.browser.spec';

// Resources
import './adapter/texture-formats.browser.spec';

// Resources - TODO these tests only depend on Device and could move to API...
import './adapter/resources/buffer.browser.spec';
import './adapter/resources/command-encoder.browser.spec';
import './adapter/resources/shader.browser.spec';
import './adapter/resources/render-pipeline.browser.spec';
import './adapter/resources/compute-pipeline.browser.spec';
import './adapter/resources/sampler.browser.spec';
import './adapter/resources/texture.browser.spec';
import './adapter/resources/framebuffer.browser.spec';
import './adapter/resources/webgpu-cpu-hotspots.browser.spec';
import './adapter/resources/vertex-array.browser.spec';
import './adapter/resources/query-set.browser.spec';
import './adapter/resources/fence.browser.spec';

// portable - uniform buffers
import './portable/uniform-buffer-layout.spec';
