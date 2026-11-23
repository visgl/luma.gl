import React, {useRef} from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import CodeBlock from '@theme/CodeBlock';
import {InfoBoxPanelContainer, type InfoBoxProps} from '../../../../examples/example-info-box';

export {InfoBoxPanelContainer} from '../../../../examples/example-info-box';
export type {ExampleInfoProps, InfoBoxAppearance, InfoBoxProps} from '../../../../examples/example-info-box';

/** Website adapter for the shared example infobox. */
export const InfoBox: React.FC<InfoBoxProps> = props => {
  const {siteConfig} = useDocusaurusContext();
  const websiteBaseUrl = siteConfig.baseUrl.endsWith('/') ? siteConfig.baseUrl : siteConfig.baseUrl + '/';
  const containerRef = useRef<InfoBoxPanelContainer | null>(null);
  const infoBoxProps = {
    ...props,
    websiteBaseUrl,
    renderSource: (source: string, language: string) => <CodeBlock language={language}>{source}</CodeBlock>
  };
  containerRef.current ||= new InfoBoxPanelContainer(infoBoxProps);
  containerRef.current.setInfoBoxProps(infoBoxProps);
  return containerRef.current.renderReact();
};
