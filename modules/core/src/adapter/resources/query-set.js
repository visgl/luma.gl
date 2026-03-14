// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { Resource } from './resource';
/** Immutable QuerySet object */
export class QuerySet extends Resource {
    get [Symbol.toStringTag]() {
        return 'QuerySet';
    }
    constructor(device, props) {
        super(device, props, QuerySet.defaultProps);
    }
    static defaultProps = {
        ...Resource.defaultProps,
        type: undefined,
        count: undefined
    };
}
