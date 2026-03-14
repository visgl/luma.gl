// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import test from 'tape-promise/tape';
import { Matrix4 } from '@math.gl/core';
import { GroupNode } from '@luma.gl/engine';
import { skin } from '@luma.gl/shadertools';
test('shadertools#skin returns empty uniforms without a glTF skin', t => {
    t.deepEqual(skin.getUniforms({
        scenegraphsFromGLTF: {
            gltf: {}
        }
    }), { jointMatrix: [] }, 'Returns an empty joint matrix when no skin data is available');
    t.end();
});
test('shadertools#skin packs joint matrices from the scenegraph', t => {
    const skeletonRootNode = new GroupNode({ id: 'skeleton-root', position: [1, 0, 0] });
    const jointNode = new GroupNode({ id: 'joint-0', position: [0, 2, 0] });
    skeletonRootNode.add(jointNode);
    const expectedJointMatrix = new Matrix4(skeletonRootNode.matrix).multiplyRight(jointNode.matrix);
    const inverseBindMatrices = new Float32Array(Array.from(new Matrix4()));
    const uniforms = skin.getUniforms({
        scenegraphsFromGLTF: {
            gltf: {
                skins: [
                    {
                        inverseBindMatrices: { value: inverseBindMatrices },
                        joints: [1],
                        skeleton: 0
                    }
                ]
            },
            gltfNodeIndexToNodeMap: new Map([
                [0, skeletonRootNode],
                [1, jointNode]
            ])
        }
    });
    t.ok(uniforms.jointMatrix instanceof Float32Array, 'Returns a packed joint matrix buffer');
    t.deepEqual(Array.from(uniforms.jointMatrix.slice(0, 16)), Array.from(expectedJointMatrix), 'Writes the world matrix for the first joint');
    t.deepEqual(Array.from(uniforms.jointMatrix.slice(16, 32)), Array.from(new Float32Array(16)), 'Leaves unused joint matrix slots zeroed');
    t.end();
});
