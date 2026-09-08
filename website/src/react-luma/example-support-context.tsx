// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import React, {createContext, useContext, type ReactNode} from 'react';
import {getExampleSupportDefinition} from '../../../examples/example-support-registry';
import type {
  ExampleBackend,
  ExampleMobileMode,
  ExampleMobileQualityProfile,
  ExampleSupportDefinition
} from '../../../examples/example-support';

const ExampleSupportContext = createContext<ExampleSupportDefinition | null>(null);

export type ExampleSupportProviderProps = {
  children: ReactNode;
  id: string;
  backends?: readonly ExampleBackend[];
  mobileMode?: ExampleMobileMode;
  mobileProfile?: ExampleMobileQualityProfile;
  unsupportedReason?: string;
};

/** Makes page-local example metadata available without importing the example application. */
export function ExampleSupportProvider({
  children,
  backends,
  id,
  mobileMode,
  mobileProfile,
  unsupportedReason
}: ExampleSupportProviderProps): React.JSX.Element {
  const registryDefinition = getExampleSupportDefinition(id);
  const definition: ExampleSupportDefinition = registryDefinition
    ? {
        ...registryDefinition,
        ...(mobileMode ? {mobileMode} : {}),
        ...(mobileProfile ? {mobileProfile} : {}),
        ...(unsupportedReason ? {unsupportedReason} : {}),
        ...(backends ? {requirements: {backends}} : {})
      }
    : {
        id,
        mobileMode: mobileMode ?? 'full',
        mobileProfile: mobileProfile ?? 'standard',
        unsupportedReason,
        requirements: backends ? {backends} : undefined
      };
  return (
    <ExampleSupportContext.Provider value={definition}>{children}</ExampleSupportContext.Provider>
  );
}

export function useExampleSupportDefinition(): ExampleSupportDefinition | null {
  return useContext(ExampleSupportContext);
}
