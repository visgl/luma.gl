import {type ReactNode} from 'react';

const adapterLanes = [
  {
    adapter: 'webgpuAdapter',
    adapterPackage: '@luma.gl/webgpu',
    device: 'WebGPUDevice',
    deviceDetail: 'WebGPU backend',
    variant: 'webgpu'
  },
  {
    adapter: 'webgl2Adapter',
    adapterPackage: '@luma.gl/webgl',
    device: 'WebGLDevice',
    deviceDetail: 'WebGL 2 backend',
    variant: 'webgl'
  },
  {
    adapter: 'nullAdapter',
    adapterPackage: '@luma.gl/test-utils',
    device: 'NullDevice',
    deviceDetail: 'test-only device',
    variant: 'null'
  }
] as const;

/**
 * Renders the relationship between luma.gl adapters, backend devices, and app code.
 */
export function AdapterBackendGraphic(): ReactNode {
  return (
    <figure
      className="docs-adapter-backend"
      aria-label="luma.gl adapters create concrete backend devices that share the Device portable API used by app code."
    >
      <div className="docs-adapter-backend__headers" aria-hidden="true">
        <span>Adapter</span>
        <span>Concrete device</span>
        <span>Portable API</span>
        <span>Application</span>
      </div>
      <div className="docs-adapter-backend__body">
        {adapterLanes.map(({adapter, adapterPackage, device, deviceDetail, variant}) => (
          <div className={`docs-adapter-backend__lane docs-adapter-backend__lane--${variant}`} key={adapter}>
            <DiagramNode className="docs-adapter-backend__node--adapter">
              <code>{adapter}</code>
              <span>{adapterPackage}</span>
              {variant === 'null' && <Tag>test-only</Tag>}
            </DiagramNode>
            <DiagramNode className="docs-adapter-backend__node--device">
              <code>{device}</code>
              <span>{deviceDetail}</span>
            </DiagramNode>
          </div>
        ))}
        <DiagramMerge />
        <DiagramNode className="docs-adapter-backend__node--portable">
          <strong>
            <code>Device</code> portable API
          </strong>
          <span>same resource and command surface</span>
        </DiagramNode>
        <DiagramNode className="docs-adapter-backend__node--app">
          <strong>app</strong>
          <code>device.createBuffer(...)</code>
          <code>device.createTexture(...)</code>
        </DiagramNode>
      </div>
      <figcaption className="docs-adapter-backend__caption">
        Adapters create backend-specific <code>Device</code> implementations; application code stays on the shared
        portable API.
      </figcaption>
    </figure>
  );
}

function DiagramNode({
  className = '',
  children
}: {
  className?: string;
  children: ReactNode;
}): ReactNode {
  return <div className={`docs-adapter-backend__node ${className}`}>{children}</div>;
}

function DiagramMerge(): ReactNode {
  return (
    <div className="docs-adapter-backend__merge" aria-hidden="true">
      <span />
    </div>
  );
}

function Tag({children}: {children: ReactNode}): ReactNode {
  return <span className="docs-adapter-backend__tag">{children}</span>;
}
