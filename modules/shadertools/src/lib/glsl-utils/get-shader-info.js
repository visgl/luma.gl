// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
/** Extracts information from shader source code */
export function getShaderInfo(source, defaultName) {
    return {
        name: getShaderName(source, defaultName),
        language: 'glsl',
        version: getShaderVersion(source)
    };
}
/** Extracts GLSLIFY style naming of shaders: `#define SHADER_NAME ...` */
function getShaderName(shader, defaultName = 'unnamed') {
    const SHADER_NAME_REGEXP = /#define[^\S\r\n]*SHADER_NAME[^\S\r\n]*([A-Za-z0-9_-]+)\s*/;
    const match = SHADER_NAME_REGEXP.exec(shader);
    return match ? match[1] : defaultName;
}
/** returns GLSL shader version of given shader string */
function getShaderVersion(source) {
    let version = 100;
    const words = source.match(/[^\s]+/g);
    if (words && words.length >= 2 && words[0] === '#version') {
        const parsedVersion = parseInt(words[1], 10);
        if (Number.isFinite(parsedVersion)) {
            version = parsedVersion;
        }
    }
    if (version !== 100 && version !== 300) {
        throw new Error(`Invalid GLSL version ${version}`);
    }
    return version;
}
