export default function createTheme(primitives) {
  return {
    breakpoints: {
      small: 320,
      medium: 768,
      large: 1280
    },

    colors: {
      // Primary Palette
      primary50: primitives.primary50,
      primary100: primitives.primary100,
      primary200: primitives.primary200,
      primary300: primitives.primary300,
      primary400: primitives.primary400,
      primary: primitives.primary400,
      primary500: primitives.primary500,
      primary600: primitives.primary600,
      primary700: primitives.primary700,

      // Negative Palette
      negative50: primitives.negative50,
      negative100: primitives.negative100,
      negative200: primitives.negative200,
      negative300: primitives.negative300,
      negative400: primitives.negative400,
      negative: primitives.negative400,
      negative500: primitives.negative500,
      negative600: primitives.negative600,
      negative700: primitives.negative700,

      // Warning Palette
      warning50: primitives.warning50,
      warning100: primitives.warning100,
      warning200: primitives.warning200,
      warning300: primitives.warning300,
      warning400: primitives.warning400,
      warning: primitives.warning400,
      warning500: primitives.warning500,
      warning600: primitives.warning600,
      warning700: primitives.warning700,

      // Positive Palette
      positive50: primitives.positive50,
      positive100: primitives.positive100,
      positive200: primitives.positive200,
      positive300: primitives.positive300,
      positive400: primitives.positive400,
      positive: primitives.positive400,
      positive500: primitives.positive500,
      positive600: primitives.positive600,
      positive700: primitives.positive700,

      // Monochrome Palette
      white: primitives.mono100,
      mono100: primitives.mono100,
      mono200: primitives.mono200,
      mono300: primitives.mono300,
      mono400: primitives.mono400,
      mono500: primitives.mono500,
      mono600: primitives.mono600,
      mono700: primitives.mono700,
      mono800: primitives.mono800,
      mono900: primitives.mono900,
      mono1000: primitives.mono1000,
      black: primitives.mono1000,

      // Semantic Colors

      // Font Color
      colorPrimary: primitives.mono1000,
      colorSecondary: primitives.mono800,

      // Background
      background: primitives.mono100,
      backgroundAlt: primitives.mono100,
      backgroundInv: primitives.mono1000,

      // Foreground
      foreground: primitives.mono1000,
      foregroundAlt: primitives.mono800,
      foregroundInv: primitives.mono100,

      // Borders
      border: primitives.mono500,
      borderAlt: primitives.mono600,
      borderFocus: primitives.primary400,
      borderError: primitives.negative400,

      // Links
      linkText: primitives.primary400,
      linkVisited: primitives.primary500,
      linkHover: primitives.primary600
    },
    typography: {
      font100: `normal 11px/16px ${primitives.primaryFontFamily}`,
      font200: `normal 12px/20px ${primitives.primaryFontFamily}`,
      font250: `bold 12px/20px ${primitives.primaryFontFamily}`,
      font300: `normal 14px/20px ${primitives.primaryFontFamily}`,
      font350: `bold 14px/20px ${primitives.primaryFontFamily}`,
      font400: `normal 16px/24px ${primitives.primaryFontFamily}`,
      font450: `bold 16px/24px ${primitives.primaryFontFamily}`,
      font500: `bold 20px/28px ${primitives.primaryFontFamily}`,
      font600: `bold 24px/36px ${primitives.primaryFontFamily}`,
      font700: `bold 32px/48px ${primitives.primaryFontFamily}`,
      font800: `bold 40px/56px ${primitives.primaryFontFamily}`,
      font900: `bold 52px/68px ${primitives.primaryFontFamily}`,
      font1000: `normal 72px/96px ${primitives.primaryFontFamily}`,
      font1100: `normal 96px/116px ${primitives.primaryFontFamily}`
    },
    sizing: {
      scale0: '2px',
      scale100: '4px',
      scale200: '6px',
      scale300: '8px',
      scale400: '10px',
      scale500: '12px',
      scale550: '14px',
      scale600: '16px',
      scale700: '20px',
      scale800: '24px',
      scale900: '32px',
      scale1000: '40px',
      scale1200: '48px',
      scale1400: '56px',
      scale1600: '64px',
      scale2400: '96px',
      scale3200: '128px',
      scale4800: '192px'
    },
    lighting: {
      shadow400: '0 1px 4px hsla(0, 0%, 0%, 0.16)',
      shadow500: '0 2px 8px hsla(0, 0%, 0%, 0.16)',
      shadow600: '0 4px 16px hsla(0, 0%, 0%, 0.16)',
      shadow700: '0 8px 24px hsla(0, 0%, 0%, 0.16)',
      overlay0: 'inset 0 0 0 1000px hsla(0, 0%, 0%, 0)',
      overlay100: 'inset 0 0 0 1000px hsla(0, 0%, 0%, 0.04)',
      overlay200: 'inset 0 0 0 1000px hsla(0, 0%, 0%, 0.08)',
      overlay300: 'inset 0 0 0 1000px hsla(0, 0%, 0%, 0.12)',
      overlay400: 'inset 0 0 0 1000px hsla(0, 0%, 0%, 0.16)',
      overlay500: 'inset 0 0 0 1000px hsla(0, 0%, 0%, 0.2)',
      overlay600: 'inset 0 0 0 1000px hsla(0, 0%, 0%, 0.24)'
    },
    borders: {
      border100: 'solid 1px hsla(0, 0%, 0%, 0.04)',
      border200: 'solid 1px hsla(0, 0%, 0%, 0.08)',
      border300: 'solid 1px hsla(0, 0%, 0%, 0.12)',
      border400: 'solid 1px hsla(0, 0%, 0%, 0.16)',
      border500: 'solid 1px hsla(0, 0%, 0%, 0.2)',
      border600: 'solid 1px hsla(0, 0%, 0%, 0.24)',
      radius100: '2px',
      radius200: '4px',
      radius300: '8px',
      radius400: '12px',
      useRoundedCorners: true
    },
    animation: {
      timing100: '0.25s',
      timing400: '0.4s',
      timing700: '0.6s',
      easeOutCurve: 'cubic-bezier(.2, .8, .4, 1)',
      easeInCurve: 'cubic-bezier(.8, .2, .6, 1)',
      easeInOutCurve: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  };
}
