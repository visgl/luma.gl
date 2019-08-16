export function getResourceCounts() {
  /* global luma */
  const resourceStats = luma.stats.get('Resource Counts');
  return {
    Texture2D: resourceStats.get('Texture2Ds Active').count,
    Buffer: resourceStats.get('Buffers Active').count
  };
}

export function getLeakedResources(startCounts, endCounts) {
  let leakedResources = null;
  const info = 'leaking: ';
  for (const resourceName in endCounts) {
    const leakCount = endCounts[resourceName] - startCounts[resourceName];
    if (leakCount !== 0) {
      leakedResources = Object.assign({}, leakedResources, {
        [resourceName]: leakCount,
        info: `${info} ${resourceName}: ${leakCount}, `
      });
    }
  }
  return leakedResources;
}
