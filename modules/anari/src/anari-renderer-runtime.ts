import type {ANARIFrame} from './anari-objects';
import type {ANARIFrameStatistics} from './anari-types';

/** Backend contract used by ANARI renderer subtypes. */
export interface ANARIRendererRuntime {
  render(frame: ANARIFrame): ANARIFrameStatistics;
  destroyFrame(frame: ANARIFrame): void;
  destroy(): void;
}
