// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// TODO - replace with Promise.withResolvers once we upgrade TS baseline
export function withResolvers() {
    let resolve;
    let reject;
    const promise = new Promise((_resolve, _reject) => {
        resolve = _resolve;
        reject = _reject;
    });
    // @ts-expect-error - in fact these are no used before initialized
    return { promise, resolve, reject };
}
