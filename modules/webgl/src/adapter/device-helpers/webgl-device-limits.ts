// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {DeviceLimits} from '@luma.gl/core';
import {GL} from '@luma.gl/constants';

// prettier-ignore
export class WebGLDeviceLimits extends DeviceLimits {
  get maxTextureDimension1D() { return 0; } // WebGL does not support 1D textures
  get maxTextureDimension2D() { return this.getParameter(GL.MAX_TEXTURE_SIZE); }
  get maxTextureDimension3D() { return this.getParameter(GL.MAX_3D_TEXTURE_SIZE); }
  get maxTextureArrayLayers() { return this.getParameter(GL.MAX_ARRAY_TEXTURE_LAYERS); }
  get maxBindGroups() { return 0; }
  get maxDynamicUniformBuffersPerPipelineLayout() { return 0; } // TBD
  get maxDynamicStorageBuffersPerPipelineLayout() { return 0; } // TBD
  get maxSampledTexturesPerShaderStage() { return this.getParameter(GL.MAX_VERTEX_TEXTURE_IMAGE_UNITS); } // ) TBD
  get maxSamplersPerShaderStage() { return this.getParameter(GL.MAX_COMBINED_TEXTURE_IMAGE_UNITS); }
  get maxStorageBuffersPerShaderStage() { return 0; } // TBD
  get maxStorageTexturesPerShaderStage() { return 0; } // TBD
  get maxUniformBuffersPerShaderStage() { return this.getParameter(GL.MAX_UNIFORM_BUFFER_BINDINGS); }
  get maxUniformBufferBindingSize() { return this.getParameter(GL.MAX_UNIFORM_BLOCK_SIZE); }
  get maxStorageBufferBindingSize() { return 0; }
  get minUniformBufferOffsetAlignment() { return this.getParameter(GL.UNIFORM_BUFFER_OFFSET_ALIGNMENT); }
  get minStorageBufferOffsetAlignment() { return 0; } 
  get maxVertexBuffers() { return 16; } // WebGL 2 supports 16 buffers, see https://github.com/gpuweb/gpuweb/issues/4284
  get maxVertexAttributes() { return this.getParameter(GL.MAX_VERTEX_ATTRIBS); }
  get maxVertexBufferArrayStride() { return 2048; } // TBD, this is just the default value from WebGPU
  get maxInterStageShaderComponents() { return this.getParameter(GL.MAX_VARYING_COMPONENTS); }
  get maxComputeWorkgroupStorageSize() { return 0; } // WebGL does not support compute shaders
  get maxComputeInvocationsPerWorkgroup() { return 0; } // WebGL does not support compute shaders
  get maxComputeWorkgroupSizeX() { return 0; } // WebGL does not support compute shaders
  get maxComputeWorkgroupSizeY() { return 0; } // WebGL does not support compute shaders
  get maxComputeWorkgroupSizeZ() { return 0; } // WebGL does not support compute shaders
  get maxComputeWorkgroupsPerDimension() { return 0;} // WebGL does not support compute shaders

  // PRIVATE

  protected gl: WebGL2RenderingContext;
  protected limits: Partial<Record<GL, number>> = {};

  constructor(gl: WebGL2RenderingContext) {
    super();
    this.gl = gl;
  }

  protected getParameter(parameter: GL): number {
    if (this.limits[parameter] === undefined) {
      this.limits[parameter] = this.gl.getParameter(parameter);
    }
    return this.limits[parameter] || 0;
  }
}
