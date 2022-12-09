import styled from 'styled-components';

import ChevronDown from '../components/chevron-down';
import {isMobile} from './body';

export const TocChevron = styled(ChevronDown)`
  height: 16px;
  width: 16px;
  position: absolute;
  left: ${(props) => props.$depth * 12 + 24}px;
  top: 20px;
  transform: ${(props) => (props.$isTocOpen ? 'none' : 'rotate(-90deg)')};
  transition: transform 0.3s;
`;

export const TocEntry = styled.div`
  font: ${(props) => props.theme.typography.font350};
  border-top: 1px solid
    ${(props) => (props.$depth || props.$index === 0 ? 'tranparent' : props.theme.colors.mono400)};
  color: ${(props) => (props.$depth ? props.theme.colors.mono800 : props.theme.colors.mono1000)};
  cursor: pointer;
  margin: -0.5px 0;
  position: relative;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
`;

export const TocHeader = styled.span`
  display: block;
  padding: 16px 16px 16px ${(props) => props.$depth * 12 + 48}px;
  &:hover {
    background: ${(props) => props.theme.colors.mono200};
  }
`;

export const TocLink = styled.div`
  a {
    display: block;
    padding: 16px 16px 16px ${(props) => props.$depth * 12 + 48}px;
    color: ${(props) =>
      props.$active
        ? props.theme.colors.primary400
        : props.$depth
        ? props.theme.colors.mono800
        : props.theme.colors.mono1000} !important;
    text-decoration: none;
  }
  &:hover {
    background: ${(props) => props.theme.colors.mono200};
  }
`;

export const TocSubpages = styled.ul`
  list-style: none;
  margin: 0;
  max-height: ${(props) => props.$height * 56}px;
  overflow: hidden;
  padding: 0;
  transition: max-height 0.3s;
`;

export const TocContainer = styled.div`
  position: fixed;
  top: 0;
  padding: ${(props) => props.theme.sizing.scale1600} 0;
  max-width: 300px;
  height: 100%;
  z-index: 2;
  border-right: 1px solid ${(props) => props.theme.colors.mono500};
  overflow-y: auto;
  overflow-x: hidden;
  width: 100%;

  ${isMobile} {
    max-width: 100%;
    height: initial;
    border-right: none;
    position: sticky;
    padding: 0;
    transition: opacity 0.3s, transform 0.3s;
    opacity: ${(props) => (props.$isTocOpen ? 1 : 0)};
    max-height: ${(props) => (props.$isTocOpen ? 'unset' : 0)};
    overflow: ${(props) => (props.$isTocOpen ? 'visible' : 'hidden')};
    transform: ${(props) => (props.$isTocOpen ? 'translateY(0)' : 'translateY(30px)')};
  }
`;
