export function getQualifierDetails(
  line: any,
  qualifiers: any
): {
  qualifier: any;
  type: any;
  name: any;
};

export function getPassthroughFS(options: {
  version?: number;
  input?: any;
  inputType?: any;
  output?: any;
}): string;

export function typeToChannelSuffix(type: any): 'x' | 'xy' | 'xyz' | 'xyzw';

export function typeToChannelCount(type: any): 2 | 1 | 3 | 4;

export function convertToVec4(variable: any, type: any): any;
