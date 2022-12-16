import styled from 'styled-components';

export const isMobile = (props) =>
  `@media screen and (max-width: 768px)`;

// top-level layoout
export const BodyContainerFull = styled.div`
  margin: 0 auto;
  ${isMobile} {
    padding: 0;
    order: 2;
  }
`;

// the problem the following is solving is what happens if the document is very long
// on a responsive device. If the user toggles the table of content, because the
// document is long, the TOC will be not visible (above the viewport).
// to address that, when the TOC is open, we are removing the document from the flow, so
// that the TOC will be visible. Now, there are several ways to do that, some of which
// introduce another problem - when closing the table of contents, we want the user to be
// back exactly where they were before they opened it, as opposed to back on the top.
// that's one way to approach this -
export const BodyContainerToC = styled.div`
  height: 100%;
  width: 100%;
  ${isMobile} {
    padding: 0;
    order: 2;
  }
`;

export const BodyContainerInner = styled.div`
  height: 100%;
  width: 100%;
  position: relative;
`;

export const Body = styled.div`
  width: 100vw;
  height: 100vh;
`;
