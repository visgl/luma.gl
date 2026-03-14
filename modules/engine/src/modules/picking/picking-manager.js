// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { INVALID_INDEX } from './picking-uniforms';
/**
 * Helper class for using the new picking module
 * @todo Port to WebGPU
 * @todo Support multiple models
 * @todo Switching picking module
 */
export class PickingManager {
    device;
    props;
    /** Info from latest pick operation */
    pickInfo = { batchIndex: null, objectIndex: null };
    /** Framebuffer used for picking */
    framebuffer = null;
    static defaultProps = {
        shaderInputs: undefined,
        onObjectPicked: () => { }
    };
    constructor(device, props) {
        this.device = device;
        this.props = { ...PickingManager.defaultProps, ...props };
    }
    destroy() {
        this.framebuffer?.destroy();
    }
    // TODO - Ask for a cached framebuffer? a Framebuffer factory?
    getFramebuffer() {
        if (!this.framebuffer) {
            this.framebuffer = this.device.createFramebuffer({
                colorAttachments: ['rgba8unorm', 'rg32sint'],
                depthStencilAttachment: 'depth24plus'
            });
        }
        return this.framebuffer;
    }
    /** Clear highlighted / picked object */
    clearPickState() {
        this.props.shaderInputs.setProps({ picking: { highlightedObjectIndex: null } });
    }
    /** Prepare for rendering picking colors */
    beginRenderPass() {
        const framebuffer = this.getFramebuffer();
        framebuffer.resize(this.device.getDefaultCanvasContext().getDevicePixelSize());
        this.props.shaderInputs?.setProps({ picking: { isActive: true } });
        const pickingPass = this.device.beginRenderPass({
            framebuffer,
            clearColors: [new Float32Array([0, 0, 0, 0]), new Int32Array([-1, -1, 0, 0])],
            clearDepth: 1
        });
        return pickingPass;
    }
    async updatePickInfo(mousePosition) {
        const framebuffer = this.getFramebuffer();
        // use the center pixel location in device pixel range
        const [pickX, pickY] = this.getPickPosition(mousePosition);
        // Read back
        const pixelData = this.device.readPixelsToArrayWebGL(framebuffer, {
            sourceX: pickX,
            sourceY: pickY,
            sourceWidth: 1,
            sourceHeight: 1,
            sourceAttachment: 1
        });
        if (!pixelData) {
            return null;
        }
        const pickInfo = {
            objectIndex: pixelData[0] === INVALID_INDEX ? null : pixelData[0],
            batchIndex: pixelData[1] === INVALID_INDEX ? null : pixelData[1]
        };
        // Call callback if picked object has changed
        if (pickInfo.objectIndex !== this.pickInfo.objectIndex ||
            pickInfo.batchIndex !== this.pickInfo.batchIndex) {
            this.pickInfo = pickInfo;
            this.props.onObjectPicked(pickInfo);
            // console.log(`Object ${pickInfo.objectIndex} in batch ${pickInfo.batchIndex} was picked`)
        }
        this.props.shaderInputs?.setProps({
            picking: {
                isActive: false,
                highlightedBatchIndex: pickInfo.batchIndex,
                highlightedObjectIndex: pickInfo.objectIndex
            }
        });
        return this.pickInfo;
    }
    /**
     * Get pick position in device pixel range
     * use the center pixel location in device pixel range
     */
    getPickPosition(mousePosition) {
        const devicePixels = this.device.getDefaultCanvasContext().cssToDevicePixels(mousePosition);
        const pickX = devicePixels.x + Math.floor(devicePixels.width / 2);
        const pickY = devicePixels.y + Math.floor(devicePixels.height / 2);
        return [pickX, pickY];
    }
}
