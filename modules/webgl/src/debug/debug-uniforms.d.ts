export function getDebugTableForUniforms(options?: {
  header?: string;
  program: any;
  uniforms: any;
  undefinedOnly?: boolean;
}): {
  table: {};
  count: number;
  unusedTable: {};
  unusedCount: number;
};
