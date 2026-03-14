// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { uid } from '../utils/uid';
export class Geometry {
    id;
    /** Determines how vertices are read from the 'vertex' attributes */
    topology;
    vertexCount;
    indices;
    attributes;
    userData = {};
    constructor(props) {
        const { attributes = {}, indices = null, vertexCount = null } = props;
        this.id = props.id || uid('geometry');
        this.topology = props.topology;
        if (indices) {
            this.indices = ArrayBuffer.isView(indices) ? { value: indices, size: 1 } : indices;
        }
        // @ts-expect-error
        this.attributes = {};
        for (const [attributeName, attributeValue] of Object.entries(attributes)) {
            // Wrap "unwrapped" arrays and try to autodetect their type
            const attribute = ArrayBuffer.isView(attributeValue)
                ? { value: attributeValue }
                : attributeValue;
            if (!ArrayBuffer.isView(attribute.value)) {
                throw new Error(`${this._print(attributeName)}: must be typed array or object with value as typed array`);
            }
            if ((attributeName === 'POSITION' || attributeName === 'positions') && !attribute.size) {
                attribute.size = 3;
            }
            // Move indices to separate field
            if (attributeName === 'indices') {
                if (this.indices) {
                    throw new Error('Multiple indices detected');
                }
                this.indices = attribute;
            }
            else {
                this.attributes[attributeName] = attribute;
            }
        }
        if (this.indices && this.indices['isIndexed'] !== undefined) {
            this.indices = Object.assign({}, this.indices);
            delete this.indices['isIndexed'];
        }
        this.vertexCount = vertexCount || this._calculateVertexCount(this.attributes, this.indices);
    }
    getVertexCount() {
        return this.vertexCount;
    }
    /**
     * Return an object with all attributes plus indices added as a field.
     * TODO Geometry types are a mess
     */
    getAttributes() {
        // @ts-ignore
        return this.indices ? { indices: this.indices, ...this.attributes } : this.attributes;
    }
    // PRIVATE
    _print(attributeName) {
        return `Geometry ${this.id} attribute ${attributeName}`;
    }
    /**
     * GeometryAttribute
     * value: typed array
     * type: indices, vertices, uvs
     * size: elements per vertex
     * target: WebGL buffer type (string or constant)
     *
     * @param attributes
     * @param indices
     * @returns
     */
    _setAttributes(attributes, indices) {
        return this;
    }
    _calculateVertexCount(attributes, indices) {
        if (indices) {
            return indices.value.length;
        }
        let vertexCount = Infinity;
        for (const attribute of Object.values(attributes)) {
            const { value, size, constant } = attribute;
            if (!constant && value && size !== undefined && size >= 1) {
                vertexCount = Math.min(vertexCount, value.length / size);
            }
        }
        // assert(Number.isFinite(vertexCount));
        return vertexCount;
    }
}
