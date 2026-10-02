import React, {useEffect, useState} from 'react';
import {
  EXAMPLE_NAVIGATION_END_EVENT,
  EXAMPLE_NAVIGATION_START_EVENT
} from '../react-luma/utils/example-lifecycle';

type RootProps = {
  children: React.ReactNode;
};

export default function Root(props: RootProps) {
  const [isExampleNavigationPending, setIsExampleNavigationPending] = useState(false);

  useEffect(() => {
    const handleNavigationStart = () => setIsExampleNavigationPending(true);
    const handleNavigationEnd = () => setIsExampleNavigationPending(false);
    window.addEventListener(EXAMPLE_NAVIGATION_START_EVENT, handleNavigationStart);
    window.addEventListener(EXAMPLE_NAVIGATION_END_EVENT, handleNavigationEnd);
    return () => {
      window.removeEventListener(EXAMPLE_NAVIGATION_START_EVENT, handleNavigationStart);
      window.removeEventListener(EXAMPLE_NAVIGATION_END_EVENT, handleNavigationEnd);
    };
  }, []);

  return (
    <>
      {props.children}
      {isExampleNavigationPending ? (
        <div
          className="luma-example-navigation-loading"
          data-luma-example-navigation-loading=""
          role="status"
          aria-live="polite"
        >
          <span className="luma-example-loading-spinner" aria-hidden="true" />
          <strong>Loading example</strong>
          <span>Stopping the previous GPU work and preparing the next scene…</span>
        </div>
      ) : null}
    </>
  );
}
