// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
function getMinLocation(attributeNames, shaderLayoutMap) {
    let minLocation = Infinity;
    for (const name of attributeNames) {
        const location = shaderLayoutMap[name];
        if (location !== undefined) {
            minLocation = Math.min(minLocation, location);
        }
    }
    return minLocation;
}
export function sortedBufferLayoutByShaderSourceLocations(shaderLayout, bufferLayout) {
    const shaderLayoutMap = Object.fromEntries(shaderLayout.attributes.map(attr => [attr.name, attr.location]));
    const sortedLayout = bufferLayout.slice();
    sortedLayout.sort((a, b) => {
        const attributeNamesA = a.attributes ? a.attributes.map(attr => attr.attribute) : [a.name];
        const attributeNamesB = b.attributes ? b.attributes.map(attr => attr.attribute) : [b.name];
        const minLocationA = getMinLocation(attributeNamesA, shaderLayoutMap);
        const minLocationB = getMinLocation(attributeNamesB, shaderLayoutMap);
        return minLocationA - minLocationB;
    });
    return sortedLayout;
}
