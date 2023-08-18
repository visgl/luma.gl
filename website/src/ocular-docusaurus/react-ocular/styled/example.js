import styled from 'styled-components';
import {isMobile} from './body';

// example

export const MainExample = styled.main`
  width: 100%;
  height: 100%;
  position: relative;
`;

// examples

export const ExampleHeader = styled.div`
  display: inline-block;
`;

export const MainExamples = styled.main`
`;

export const ExamplesGroup = styled.main`
  display: flex;
  flex-wrap: wrap;
`;

/*
export const ExampleCard = styled(Link)`
  cursor: pointer;
  text-decoration: none;
  width: 50%;
  max-width: 240px;
  line-height: 0;
  outline: none;
  padding: ${(props) => props.theme.sizing.scale100};
  position: relative;
  img {
    transition-property: filter;
    transition-duration: ${(props) => props.theme.animation.timing400};
    transition-timing-function: ${(props) => props.theme.animation.easeInOutCurve};
  }
  &:hover {
    box-shadow: ${(props) => props.theme.lighting.shadow600};
  }
  &:hover img {
    filter: contrast(0.2);
  }
  ${isMobile} {
    width: 33%;
    min-width: 200px;
  }
  @media screen and (max-width: 632px) {
    width: 50%;
  }
`;
*/

export const ExampleTitle = styled.div`
  position: absolute;
  display: flex;
  justify-content: center;
  flex-direction: column;
  font-size: 1.5em;
  text-align: center;
  width: 90%;
  height: 90%;
  top: 5%;
  left: 5%;
  opacity: 0;
  transition-property: opacity;
  &:hover {
    opacity: 1;
  }
`;

export const PanelContainer = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  width: 344px;
  max-height: 96%;
  overflow-x: hidden;
  overflow-y: auto;
  overflow-y: overlay;
  outline: none;
  z-index: 1;

  ${isMobile} {
    width: auto;
    left: 0;
  }
`;

export const PanelExpander = styled.div`
  display: none;
  font-family: serif;
  font-size: 0.8em;
  text-align: center;
  border-radius: 50%;
  ${isMobile} {
    display: block;
  }
`;

export const PanelTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  ${isMobile} {
    cursor: pointer;
  }
`;

export const PanelContent = styled.div`
  div > * {
    vertical-align: middle;
    white-space: nowrap;
  }
  div > label {
    display: inline-block;
    width: 40%;
    margin-right: 10%;
    margin-top: 2px;
    margin-bottom: 2px;
  }
  div > input,
  div > a,
  div > button,
  div > select {
    text-transform: none;
    text-overflow: ellipsis;
    overflow: hidden;
    display: inline-block;
    width: 50%;
    text-align: left;
  }
  div > button {
    color: initial;
  }
  div > button:disabled {
    cursor: default;
  }
  div > input {
    &:disabled {
    }
    &[type='checkbox'] {
      height: auto;
    }
  }
  p {
    white-space: initial;
  }
  ${isMobile} {
  }
`;

export const SourceLink = styled.a`
  display: block;
  text-align: right;
  ${isMobile} {
  }
`;
