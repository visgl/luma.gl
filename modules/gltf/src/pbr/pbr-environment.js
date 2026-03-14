// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { DynamicTexture } from '@luma.gl/engine';
import { loadImageTexture } from '@loaders.gl/textures';
/** Loads textures for PBR environment */
export function loadPBREnvironment(device, props) {
    const brdfLutTexture = new DynamicTexture(device, {
        id: 'brdfLUT',
        sampler: {
            addressModeU: 'clamp-to-edge',
            addressModeV: 'clamp-to-edge',
            minFilter: 'linear',
            magFilter: 'linear'
        },
        // Texture accepts a promise that returns an image as data (Async Textures)
        data: loadImageTexture(props.brdfLutUrl)
    });
    const diffuseEnvSampler = makeCube(device, {
        id: 'DiffuseEnvSampler',
        getTextureForFace: dir => loadImageTexture(props.getTexUrl('diffuse', dir, 0)),
        sampler: {
            addressModeU: 'clamp-to-edge',
            addressModeV: 'clamp-to-edge',
            minFilter: 'linear',
            magFilter: 'linear'
        }
    });
    const specularEnvSampler = makeCube(device, {
        id: 'SpecularEnvSampler',
        getTextureForFace: (dir) => {
            const imageArray = [];
            // @ts-ignore
            for (let lod = 0; lod <= props.specularMipLevels - 1; lod++) {
                imageArray.push(loadImageTexture(props.getTexUrl('specular', dir, lod)));
            }
            return imageArray;
        },
        sampler: {
            addressModeU: 'clamp-to-edge',
            addressModeV: 'clamp-to-edge',
            minFilter: 'linear', // [GL.TEXTURE_MIN_FILTER]: GL.LINEAR_MIPMAP_LINEAR,
            magFilter: 'linear'
        }
    });
    return {
        brdfLutTexture,
        diffuseEnvSampler,
        specularEnvSampler
    };
}
// TODO put somewhere common
const FACES = [0, 1, 2, 3, 4, 5];
function makeCube(device, { id, getTextureForFace, sampler }) {
    const data = {};
    FACES.forEach(face => {
        // @ts-ignore TODO
        data[String(face)] = getTextureForFace(face);
    });
    return new DynamicTexture(device, {
        id,
        dimension: 'cube',
        mipmaps: false,
        sampler,
        // @ts-expect-error
        data
    });
}
