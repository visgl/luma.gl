import React from 'react';

type RootProps = {
  children: React.ReactNode;
};

export default function Root(props: RootProps) {
  return <React.StrictMode>{props.children}</React.StrictMode>;
}
