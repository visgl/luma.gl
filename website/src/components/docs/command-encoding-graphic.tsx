import {type ReactNode} from 'react';

/**
 * Renders the command-recording flow exposed by the core command resources.
 */
export function CommandEncodingGraphic(): ReactNode {
  return (
    <figure
      className="docs-command-encoding"
      aria-label="luma.gl GPU command flow from Device through CommandEncoder, passes, CommandBuffer, and reusable render bundles."
    >
      <div className="docs-command-encoding__stream">
        <DiagramNode variant="device">
          <code>Device</code>
          <span>starts or submits work</span>
        </DiagramNode>
        <DiagramArrow />
        <DiagramNode variant="encoder">
          <code>CommandEncoder</code>
          <span>records one ordered stream</span>
        </DiagramNode>
        <DiagramArrow />
        <DiagramNode variant="buffer">
          <code>CommandBuffer</code>
          <span>finished stream</span>
        </DiagramNode>
        <DiagramArrow />
        <DiagramNode variant="device">
          <code>device.submit()</code>
          <span>sends work to the GPU</span>
        </DiagramNode>
      </div>

      <div className="docs-command-encoding__lanes">
        <CommandLane label="draw">
          <DiagramNode compact variant="pass">
            <code>beginRenderPass()</code>
          </DiagramNode>
          <DiagramArrow />
          <DiagramNode compact variant="pass">
            <code>RenderPass</code>
            <span>draw calls</span>
          </DiagramNode>
        </CommandLane>

        <CommandLane label="compute">
          <DiagramNode compact variant="pass">
            <code>beginComputePass()</code>
          </DiagramNode>
          <DiagramArrow />
          <DiagramNode compact variant="pass">
            <code>ComputePass</code>
            <span>dispatch calls</span>
          </DiagramNode>
        </CommandLane>

        <CommandLane label="reuse">
          <DiagramNode compact variant="bundle">
            <code>RenderBundleEncoder</code>
          </DiagramNode>
          <DiagramArrow />
          <DiagramNode compact variant="bundle">
            <code>RenderBundle</code>
          </DiagramNode>
          <DiagramArrow />
          <DiagramNode compact variant="pass">
            <code>RenderPass.executeBundles()</code>
          </DiagramNode>
        </CommandLane>
      </div>

      <figcaption className="docs-command-encoding__caption">
        <code>CommandEncoder</code> owns pass creation. <code>RenderBundleEncoder</code> is a WebGPU-only
        side path for recording reusable draw commands that a normal <code>RenderPass</code> later replays.
      </figcaption>
    </figure>
  );
}

function CommandLane({
  label,
  children
}: {
  label: string;
  children: ReactNode;
}): ReactNode {
  return (
    <div className="docs-command-encoding__lane">
      <strong>{label}</strong>
      <div className="docs-command-encoding__lane-flow">{children}</div>
    </div>
  );
}

function DiagramNode({
  compact = false,
  variant,
  children
}: {
  compact?: boolean;
  variant: 'buffer' | 'bundle' | 'device' | 'encoder' | 'pass';
  children: ReactNode;
}): ReactNode {
  return (
    <div
      className={`docs-command-encoding__node docs-command-encoding__node--${variant}${
        compact ? ' docs-command-encoding__node--compact' : ''
      }`}
    >
      {children}
    </div>
  );
}

function DiagramArrow(): ReactNode {
  return (
    <span className="docs-command-encoding__arrow" aria-hidden="true">
      -&gt;
    </span>
  );
}
