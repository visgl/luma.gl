import BrowserOnly from '@docusaurus/BrowserOnly';
import React, {type CSSProperties, type ReactNode, useState} from 'react';

export type ClientOnlyLiveExampleProps = {
  children: ReactNode;
  height?: CSSProperties['height'];
  activationLabel?: string;
  description?: string;
};

function ActivatedLiveExample({
  activationLabel,
  children,
  description,
  height
}: Required<Pick<ClientOnlyLiveExampleProps, 'activationLabel' | 'height'>> &
  Pick<ClientOnlyLiveExampleProps, 'children' | 'description'>): ReactNode {
  const [isActive, setIsActive] = useState(false);
  if (isActive) {
    return <>{children}</>;
  }
  return (
    <div className="docs-live-example-activation" style={{minHeight: height}}>
      <div>
        <strong>Interactive example</strong>
        {description ? <p>{description}</p> : null}
        <button type="button" onClick={() => setIsActive(true)}>
          {activationLabel}
        </button>
      </div>
    </div>
  );
}

/** Defers examples until hydration and, when requested, explicit reader activation. */
export function ClientOnlyLiveExample({
  children,
  height = 560,
  activationLabel,
  description
}: ClientOnlyLiveExampleProps): ReactNode {
  return (
    <BrowserOnly
      fallback={
        <div
          className="docs-embedded-example"
          style={{
            alignItems: 'center',
            display: 'flex',
            height,
            justifyContent: 'center'
          }}
        >
          Loading interactive example…
        </div>
      }
    >
      {() =>
        activationLabel ? (
          <ActivatedLiveExample
            activationLabel={activationLabel}
            description={description}
            height={height}
          >
            {children}
          </ActivatedLiveExample>
        ) : (
          children
        )
      }
    </BrowserOnly>
  );
}
