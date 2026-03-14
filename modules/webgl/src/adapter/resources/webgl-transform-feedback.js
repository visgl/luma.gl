import { log, TransformFeedback } from '@luma.gl/core';
import { GL } from '@luma.gl/constants';
import { WEBGLBuffer } from '../../index';
import { getGLPrimitive } from '../helpers/webgl-topology-utils';
export class WEBGLTransformFeedback extends TransformFeedback {
    device;
    gl;
    handle;
    /**
     * NOTE: The Model already has this information while drawing, but
     * TransformFeedback currently needs it internally, to look up
     * varying information outside of a draw() call.
     */
    layout;
    buffers = {};
    unusedBuffers = {};
    /**
     * Allows us to avoid a Chrome bug where a buffer that is already bound to a
     * different target cannot be bound to 'TRANSFORM_FEEDBACK_BUFFER' target.
     * This a major workaround, see: https://github.com/KhronosGroup/WebGL/issues/2346
     */
    bindOnUse = true;
    _bound = false;
    constructor(device, props) {
        super(device, props);
        this.device = device;
        this.gl = device.gl;
        this.handle = this.props.handle || this.gl.createTransformFeedback();
        this.layout = this.props.layout;
        if (props.buffers) {
            this.setBuffers(props.buffers);
        }
        Object.seal(this);
    }
    destroy() {
        this.gl.deleteTransformFeedback(this.handle);
        super.destroy();
    }
    begin(topology = 'point-list') {
        this.gl.bindTransformFeedback(GL.TRANSFORM_FEEDBACK, this.handle);
        if (this.bindOnUse) {
            this._bindBuffers();
        }
        this.gl.beginTransformFeedback(getGLPrimitive(topology));
    }
    end() {
        this.gl.endTransformFeedback();
        if (this.bindOnUse) {
            this._unbindBuffers();
        }
        this.gl.bindTransformFeedback(GL.TRANSFORM_FEEDBACK, null);
    }
    // SUBCLASS
    setBuffers(buffers) {
        this.buffers = {};
        this.unusedBuffers = {};
        this.bind(() => {
            for (const [bufferName, buffer] of Object.entries(buffers)) {
                this.setBuffer(bufferName, buffer);
            }
        });
    }
    setBuffer(locationOrName, bufferOrRange) {
        const location = this._getVaryingIndex(locationOrName);
        const { buffer, byteLength, byteOffset } = this._getBufferRange(bufferOrRange);
        if (location < 0) {
            this.unusedBuffers[locationOrName] = buffer;
            log.warn(`${this.id} unusedBuffers varying buffer ${locationOrName}`)();
            return;
        }
        this.buffers[location] = { buffer, byteLength, byteOffset };
        // Need to avoid chrome bug where buffer that is already bound to a different target
        // cannot be bound to 'TRANSFORM_FEEDBACK_BUFFER' target.
        if (!this.bindOnUse) {
            this._bindBuffer(location, buffer, byteOffset, byteLength);
        }
    }
    getBuffer(locationOrName) {
        if (isIndex(locationOrName)) {
            return this.buffers[locationOrName] || null;
        }
        const location = this._getVaryingIndex(locationOrName);
        return this.buffers[location] ?? null;
    }
    bind(funcOrHandle = this.handle) {
        if (typeof funcOrHandle !== 'function') {
            this.gl.bindTransformFeedback(GL.TRANSFORM_FEEDBACK, funcOrHandle);
            return this;
        }
        let value;
        if (!this._bound) {
            this.gl.bindTransformFeedback(GL.TRANSFORM_FEEDBACK, this.handle);
            this._bound = true;
            value = funcOrHandle();
            this._bound = false;
            this.gl.bindTransformFeedback(GL.TRANSFORM_FEEDBACK, null);
        }
        else {
            value = funcOrHandle();
        }
        return value;
    }
    unbind() {
        this.bind(null);
    }
    // PRIVATE METHODS
    /** Extract offsets for bindBufferRange */
    _getBufferRange(bufferOrRange) {
        if (bufferOrRange instanceof WEBGLBuffer) {
            return { buffer: bufferOrRange, byteOffset: 0, byteLength: bufferOrRange.byteLength };
        }
        // To use bindBufferRange either offset or size must be specified.
        // @ts-expect-error Must be a BufferRange.
        const { buffer, byteOffset = 0, byteLength = bufferOrRange.buffer.byteLength } = bufferOrRange;
        return { buffer, byteOffset, byteLength };
    }
    _getVaryingIndex(locationOrName) {
        if (isIndex(locationOrName)) {
            return Number(locationOrName);
        }
        for (const varying of this.layout.varyings || []) {
            if (locationOrName === varying.name) {
                return varying.location;
            }
        }
        return -1;
    }
    /**
     * Need to avoid chrome bug where buffer that is already bound to a different target
     * cannot be bound to 'TRANSFORM_FEEDBACK_BUFFER' target.
     */
    _bindBuffers() {
        for (const [bufferIndex, bufferEntry] of Object.entries(this.buffers)) {
            const { buffer, byteLength, byteOffset } = this._getBufferRange(bufferEntry);
            this._bindBuffer(Number(bufferIndex), buffer, byteOffset, byteLength);
        }
    }
    _unbindBuffers() {
        for (const bufferIndex in this.buffers) {
            this.gl.bindBufferBase(GL.TRANSFORM_FEEDBACK_BUFFER, Number(bufferIndex), null);
        }
    }
    _bindBuffer(index, buffer, byteOffset = 0, byteLength) {
        const handle = buffer && buffer.handle;
        if (!handle || byteLength === undefined) {
            this.gl.bindBufferBase(GL.TRANSFORM_FEEDBACK_BUFFER, index, handle);
        }
        else {
            this.gl.bindBufferRange(GL.TRANSFORM_FEEDBACK_BUFFER, index, handle, byteOffset, byteLength);
        }
    }
}
/**
 * Returns true if the given value is an integer, or a string that
 * trivially converts to an integer (only numeric characters).
 */
function isIndex(value) {
    if (typeof value === 'number') {
        return Number.isInteger(value);
    }
    return /^\d+$/.test(value);
}
