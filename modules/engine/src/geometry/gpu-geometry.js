// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { Buffer, getVertexFormatFromAttribute } from '@luma.gl/core';
import { uid } from '../utils/uid';
export class GPUGeometry {
    id;
    userData = {};
    /** Determines how vertices are read from the 'vertex' attributes */
    topology;
    bufferLayout = [];
    vertexCount;
    indices;
    attributes;
    constructor(props) {
        this.id = props.id || uid('geometry');
        this.topology = props.topology;
        this.indices = props.indices || null;
        this.attributes = props.attributes;
        this.vertexCount = props.vertexCount;
        this.bufferLayout = props.bufferLayout || [];
        if (this.indices) {
            if (!(this.indices.usage & Buffer.INDEX)) {
                throw new Error('Index buffer must have INDEX usage');
            }
        }
    }
    destroy() {
        this.indices?.destroy();
        for (const attribute of Object.values(this.attributes)) {
            attribute.destroy();
        }
    }
    getVertexCount() {
        return this.vertexCount;
    }
    getAttributes() {
        return this.attributes;
    }
    getIndexes() {
        return this.indices || null;
    }
    _calculateVertexCount(positions) {
        // Assume that positions is a fully packed float32x3 buffer
        const vertexCount = positions.byteLength / 12;
        return vertexCount;
    }
}
export function makeGPUGeometry(device, geometry) {
    if (geometry instanceof GPUGeometry) {
        return geometry;
    }
    const indices = getIndexBufferFromGeometry(device, geometry);
    const { attributes, bufferLayout } = getAttributeBuffersFromGeometry(device, geometry);
    return new GPUGeometry({
        topology: geometry.topology || 'triangle-list',
        bufferLayout,
        vertexCount: geometry.vertexCount,
        indices,
        attributes
    });
}
export function getIndexBufferFromGeometry(device, geometry) {
    if (!geometry.indices) {
        return undefined;
    }
    const data = geometry.indices.value;
    return device.createBuffer({ usage: Buffer.INDEX, data });
}
export function getAttributeBuffersFromGeometry(device, geometry) {
    const bufferLayout = [];
    const attributes = {};
    for (const [attributeName, attribute] of Object.entries(geometry.attributes)) {
        let name = attributeName;
        // TODO Map some GLTF attribute names (is this still needed?)
        switch (attributeName) {
            case 'POSITION':
                name = 'positions';
                break;
            case 'NORMAL':
                name = 'normals';
                break;
            case 'TEXCOORD_0':
                name = 'texCoords';
                break;
            case 'COLOR_0':
                name = 'colors';
                break;
        }
        if (attribute) {
            attributes[name] = device.createBuffer({
                data: attribute.value,
                id: `${attributeName}-buffer`
            });
            const { value, size, normalized } = attribute;
            // @ts-expect-error
            bufferLayout.push({ name, format: getVertexFormatFromAttribute(value, size, normalized) });
        }
    }
    const vertexCount = geometry._calculateVertexCount(geometry.attributes, geometry.indices);
    return { attributes, bufferLayout, vertexCount };
}
