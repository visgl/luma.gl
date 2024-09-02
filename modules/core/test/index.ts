// general utils
import './utils/uid.spec';

// type utils
import './gpu-type-utils/decode-attribute-type.spec';
import './gpu-type-utils/decode-vertex-format.spec';
import './gpu-type-utils/vertex-format-from-attribute.spec';

import './gpu-type-utils/decode-texture-format.spec';
import './gpu-type-utils/get-texture-format-capabilities.spec';

// adapter utils
import './adapter-utils/get-attribute-from-layout.spec';
import './adapter-utils/is-uniform-value.spec';
import './adapter-utils/format-compiler-log.spec';

// adapter

// WebGLDevice, features & limits
import './adapter/device-helpers/device-info.spec';
import './adapter/device-helpers/device-features.spec';
import './adapter/device-helpers/device-limits.spec';
import './adapter/device-helpers/set-device-parameters.spec';

import './adapter/helpers/parse-shader-compiler-log.spec';
// import './adapter/helpers/get-shader-layout.spec';

import './adapter/device.spec';
import './adapter/canvas-context.spec';
import './adapter/luma.spec';

// Resources
import './adapter/texture-formats.spec';

// Resources - TODO these tests only depend on Device and could move to API...
import './adapter/resources/buffer.spec';
import './adapter/resources/command-encoder.spec';
import './adapter/resources/shader.spec';
import './adapter/resources/render-pipeline.spec';
import './adapter/resources/compute-pipeline.spec';
import './adapter/resources/sampler.spec';
import './adapter/resources/texture.spec';
import './adapter/resources/framebuffer.spec';
import './adapter/resources/vertex-array.spec';
import './adapter/resources/query-set.spec';

// portable - uniform buffers
import './portable/uniform-buffer-layout.spec';
