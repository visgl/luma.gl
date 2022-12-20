/* global luma */
export function getResourceCounts() {
  // @ts-ignore
  const resourceStats = luma.stats.get('Resource Counts');
  return {
    Texture2D: resourceStats.get('Texture2Ds Active').count,
    Buffer: resourceStats.get('Buffers Active').count
  };
}

export function getLeakedResources(startCounts: Record<string, number>, endCounts: Record<string, number>): number | null {
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
