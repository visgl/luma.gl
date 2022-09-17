import ScenegraphNode from './scenegraph-node';

export default class GroupNode extends ScenegraphNode {
  readonly children: ScenegraphNode[];

  constructor(props?: {});
  add(...children: any[]): this;
  remove(child: any): this;
  removeAll(): this;
  delete(): void;
  traverse(
    visitor: any,
    options?: {
      worldMatrix?: any;
    }
  ): void;
}
