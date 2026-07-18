// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// WebGL has no compute shader path for byte-addressed color conversion. Reuse the CPU handler,
// which reads the source buffer when necessary and writes the converted bytes to the WebGL buffer.
export {convertColors} from '../cpu/convert-colors';
