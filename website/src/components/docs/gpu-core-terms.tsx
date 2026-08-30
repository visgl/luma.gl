import React, {type ReactNode} from 'react';
import {GPUTerm, type GPUTermName} from './gpu-terms';

export type GPUCoreTermName = Extract<
  GPUTermName,
  | 'resource'
  | 'node'
  | 'hazard'
  | 'contributor'
  | 'transient'
  | 'compilation'
  | 'chunk'
  | 'execution slice'
  | 'indirect command'
>;

/** GPU Core wrapper around the shared GPU terminology. */
export function GPUCoreTerm({
  children,
  term
}: {
  children?: ReactNode;
  term: GPUCoreTermName;
}): ReactNode {
  return <GPUTerm term={term}>{children}</GPUTerm>;
}
