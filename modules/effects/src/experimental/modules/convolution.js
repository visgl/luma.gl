// A convolution shader
// Based on https://webglfundamentals.org/webgl/lessons/webgl-image-processing-continued.html

/*
# Copyright 2012, Gregg Tavares.
# All rights reserved.
#
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions are
# met:
#
#     * Redistributions of source code must retain the above copyright
# notice, this list of conditions and the following disclaimer.
#     * Redistributions in binary form must reproduce the above
# copyright notice, this list of conditions and the following disclaimer
# in the documentation and/or other materials provided with the
# distribution.
#     * Neither the name of Gregg Tavares. nor the names of his
# contributors may be used to endorse or promote products derived from
# this software without specific prior written permission.
#
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
# "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
# LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
# A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
# OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
# SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
# LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
# DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
# THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
# (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
# OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

// Pre-defined convolution kernels
/* eslint-disable */
const KERNEL = {
  NORMAL: [0, 0, 0, 0, 1, 0, 0, 0, 0],
  GAUSSIAN_BLUR: [0.045, 0.122, 0.045, 0.122, 0.332, 0.122, 0.045, 0.122, 0.045],
  GAUSSIAN_BLUR_2: [1, 2, 1, 2, 4, 2, 1, 2, 1],
  GAUSSIAN_BLUR_3: [0, 1, 0, 1, 1, 1, 0, 1, 0],
  UNSHARPEN: [-1, -1, -1, -1, 9, -1, -1, -1, -1],
  SHARPNESS: [0, -1, 0, -1, 5, -1, 0, -1, 0],
  SHARPEN: [-1, -1, -1, -1, 16, -1, -1, -1, -1],
  EDGE_DETECT: [-0.125, -0.125, -0.125, -0.125, 1, -0.125, -0.125, -0.125, -0.125],
  EDGE_DETECT_2: [-1, -1, -1, -1, 8, -1, -1, -1, -1],
  EDGE_DETECT_3: [-5, 0, 0, 0, 0, 0, 0, 0, 5],
  EDGE_DETECT_4: [-1, -1, -1, 0, 0, 0, 1, 1, 1],
  EDGE_DETECT_5: [-1, -1, -1, 2, 2, 2, -1, -1, -1],
  EDGE_DETECT_6: [-5, -5, -5, -5, 39, -5, -5, -5, -5],
  SOBEL_HORIZONTAL: [1, 2, 1, 0, 0, 0, -1, -2, -1],
  SOBEL_VERTICAL: [1, 0, -1, 2, 0, -2, 1, 0, -1],
  PREVIT_HORIZONTAL: [1, 1, 1, 0, 0, 0, -1, -1, -1],
  PREVIT_VERTICAL: [1, 0, -1, 1, 0, -1, 1, 0, -1],
  BOX_BLUR: [0.111, 0.111, 0.111, 0.111, 0.111, 0.111, 0.111, 0.111, 0.111],
  TRIANGLE_BLUR: [0.0625, 0.125, 0.0625, 0.125, 0.25, 0.125, 0.0625, 0.125, 0.0625],
  EMBOSS: [-2, -1, 0, -1, 1, 1, 0, 1, 2]
};
/* eslint-enable */

const fs = `
precision highp float;

uniform float kernel[9];
uniform float kernelWeight;

vec4 convolution_sampleColor(sampler2D texture, vec2 texSize, vec2 texCoords) {
  vec2 onePixel = vec2(1.0, 1.0) / texSize;
  vec4 colorSum =
    texture2D(texture, texCoords + onePixel * vec2(-1, -1)) * kernel[0] +
    texture2D(texture, texCoords + onePixel * vec2( 0, -1)) * kernel[1] +
    texture2D(texture, texCoords + onePixel * vec2( 1, -1)) * kernel[2] +
    texture2D(texture, texCoords + onePixel * vec2(-1,  0)) * kernel[3] +
    texture2D(texture, texCoords + onePixel * vec2( 0,  0)) * kernel[4] +
    texture2D(texture, texCoords + onePixel * vec2( 1,  0)) * kernel[5] +
    texture2D(texture, texCoords + onePixel * vec2(-1,  1)) * kernel[6] +
    texture2D(texture, texCoords + onePixel * vec2( 0,  1)) * kernel[7] +
    texture2D(texture, texCoords + onePixel * vec2( 1,  1)) * kernel[8] ;

  // Divide the sum by the weight but just use rgb, set alpha to 1.0
  return vec4((colorSum / kernelWeight).rgb, colorSum.a);
}
`;

const uniforms = {
  kernel: KERNEL.NORMAL,
  kernelWeight: KERNEL.NORMAL.reduce((sum, x) => sum + x, 0)
};

export default {
  name: 'convolution',
  uniforms,
  fs,
  KERNEL,
  passes: [{sampler: true}]
};
