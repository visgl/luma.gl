export function resolveModules(modules: any): any[];

// TEST EXPORTS

declare function getShaderDependencies(modules: any): any[];

declare function getDependencyGraph(options: {
  modules: any;
  level: any;
  moduleMap: any;
  moduleDepth: any;
}): void;

export const TEST_EXPORTS: {
  getShaderDependencies: typeof getShaderDependencies;
  getDependencyGraph: typeof getDependencyGraph;
};
