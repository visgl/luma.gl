// general utils
import './lib/utils/array-utils-flat.spec';
import './lib/utils/utils.spec';
import './lib/utils/format-value.spec';
import './lib/utils/deep-equal.spec';
import './lib/utils/uniform.spec';

// type utils
import './adapter/attribute-utils/get-attribute-from-layout.spec';

import './adapter/type-utils/decode-attribute-type.spec';

import './adapter/type-utils/decode-vertex-format.spec';
import './adapter/type-utils/decode-texture-format.spec';
import './adapter/type-utils/vertex-format-from-attribute.spec';

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

// uniforms
import './lib/uniforms/uniform-buffer-layout.spec';

// compiler logs
import './lib/compiler-log/format-compiler-log.spec';

// Resources
import './adapter/texture-formats.spec';

// Resources - TODO these tests only depend on Device and could move to API...
import './adapter/resources/buffer.spec';
import './adapter/resources/command-buffer.spec';
import './adapter/resources/shader.spec';
import './adapter/resources/render-pipeline.spec';
import './adapter/resources/compute-pipeline.spec';
import './adapter/resources/sampler.spec';
import './adapter/resources/texture.spec';
import './adapter/resources/framebuffer.spec';
import './adapter/resources/vertex-array.spec';
import './adapter/resources/query-set.spec';
