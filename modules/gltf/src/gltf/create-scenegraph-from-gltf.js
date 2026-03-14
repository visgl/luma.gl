// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { parseGLTF } from '../parsers/parse-gltf';
import { parseGLTFLights } from '../parsers/parse-gltf-lights';
import { GLTFAnimator } from './gltf-animator';
import { parseGLTFAnimations } from '../parsers/parse-gltf-animations';
export function createScenegraphsFromGLTF(device, gltf, options) {
    const { scenes, gltfMeshIdToNodeMap, gltfNodeIdToNodeMap, gltfNodeIndexToNodeMap } = parseGLTF(device, gltf, options);
    const animations = parseGLTFAnimations(gltf);
    const animator = new GLTFAnimator({ animations, gltfNodeIdToNodeMap });
    const lights = parseGLTFLights(gltf);
    return {
        scenes,
        animator,
        lights,
        gltfMeshIdToNodeMap,
        gltfNodeIdToNodeMap,
        gltfNodeIndexToNodeMap,
        gltf
    };
}
