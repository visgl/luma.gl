import Resource, {ResourceProps} from './resource';

// const GL_FRAGMENT_SHADER = 0x8b30;
// const GL_VERTEX_SHADER = 0x8b31

/** Abstract Buffer interface */
export type ShaderProps = ResourceProps & {
  source: string;
  stage?: 'vertex' | 'fragment';
  /** @deprecated use props.stage */
  shaderType?: 0x8b30 | 0x8b31;
};

/** Abstract Buffer interface */
export class Shader extends Resource<ShaderProps> {
  get [Symbol.toStringTag](): string {
    return 'Shader';
  }
};
