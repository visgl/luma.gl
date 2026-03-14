// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { ScenegraphNode } from './scenegraph-node';
export class ModelNode extends ScenegraphNode {
    model;
    bounds = null;
    managedResources;
    // TODO - is this used? override callbacks to make sure we call them with this
    // onBeforeRender = null;
    // onAfterRender = null;
    // AfterRender = null;
    constructor(props) {
        super(props);
        // Create new Model or used supplied Model
        this.model = props.model;
        this.managedResources = props.managedResources || [];
        this.bounds = props.bounds || null;
        this.setProps(props);
    }
    destroy() {
        if (this.model) {
            this.model.destroy();
            // @ts-expect-error
            this.model = null;
        }
        this.managedResources.forEach(resource => resource.destroy());
        this.managedResources = [];
    }
    getBounds() {
        return this.bounds;
    }
    // Expose model methods
    draw(renderPass) {
        // Return value indicates if something was actually drawn
        return this.model.draw(renderPass);
    }
}
