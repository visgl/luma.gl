// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// ADAPTER

// WebGLDevice, features & limits
import './adapter/device-helpers/device-info.spec';
import './adapter/device-helpers/device-features.spec';
import './adapter/device-helpers/device-limits.spec';
import './adapter/device-helpers/set-device-parameters.spec';

import './adapter/helpers/parse-shader-compiler-log.spec';
// import './adapter/helpers/get-shader-layout.spec';

import './adapter/device.spec';
import './adapter/canvas-context.spec';

// Resources
import './adapter/texture-formats.spec';

// Resources - TODO these tests only depend on Device and could move to API...
import './adapter/resources/buffer.spec';
import './adapter/resources/command-buffer.spec';
import './adapter/resources/framebuffer.spec';
import './adapter/resources/render-pipeline.spec';
import './adapter/resources/shader.spec';
import './adapter/resources/sampler.spec';
import './adapter/resources/texture.spec';
import './adapter/resources/vertex-array.spec';
import './adapter/resources/query-set.spec';
