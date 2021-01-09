export const DRAW_MODE: {
  POINTS: number;
  LINES: number;
  LINE_LOOP: number;
  LINE_STRIP: number;
  TRIANGLES: number;
  TRIANGLE_STRIP: number;
  TRIANGLE_FAN: number;
};

export default class Geometry {
  static get DRAW_MODE(): {
    POINTS: number;
    LINES: number;
    LINE_LOOP: number;
    LINE_STRIP: number;
    TRIANGLES: number;
    TRIANGLE_STRIP: number;
    TRIANGLE_FAN: number;
  };
  constructor(props?: {});
  get mode(): any;
  getVertexCount(): any;
  getAttributes(): any;
}
