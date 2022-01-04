const theme = {
  plain: {
    color: 'rgb(36, 41, 46)',
    backgroundColor: '#f6f8fa'
  },
  styles: [
    {
      types: ['prolog'],
      style: {
        color: 'rgb(0, 0, 128)'
      }
    },
    {
      types: ['comment'],
      style: {
        color: 'rgb(106, 153, 85)'
      }
    },
    {
      types: ['builtin', 'changed', 'keyword', 'property'],
      style: {
        color: '#e36c11'
      }
    },
    {
      types: ['inserted-sign', 'inserted'],
      style: {
        backgroundColor: 'rgb(240, 255, 244)',
        color: 'rgb(34, 134, 58)'
      }
    },
    {
      types: ['constant'],
      style: {
        color: 'rgb(100, 102, 149)'
      }
    },
    {
      types: ['attr-name', 'variable'],
      style: {
        color: 'rgb(156, 220, 254)'
      }
    },
    {
      types: ['deleted-sign', 'deleted'],
      style: {
        backgroundColor: 'rgb(255, 238, 240)',
        color: 'rgb(179, 29, 40)'
      }
    },
    {
      types: ['selector'],
      style: {
        color: 'rgb(215, 186, 125)'
      }
    },
    {
      // Fix tag color
      types: ['tag'],
      style: {
        color: 'rgb(78, 201, 176)'
      }
    },
    {
      // Fix tag color for HTML
      types: ['tag'],
      languages: ['markup'],
      style: {
        color: 'rgb(86, 156, 214)'
      }
    },
    {
      types: ['punctuation', 'operator'],
      style: {
        color: 'rgb(36, 41, 46)'
      }
    },
    {
      types: ['operator'],
      style: {
        color: 'rgb(0, 92, 197)'
      }
    },
    {
      types: ['boolean'],
      style: {
        color: 'rgb(0, 92, 197)'
      }
    },
    {
      // Fix punctuation color for HTML
      types: ['punctuation'],
      languages: ['markup'],
      style: {
        color: '#808080'
      }
    },
    {
      types: ['function'],
      style: {
        color: 'rgb(111, 66, 193)'
      }
    },
    {
      types: ['class-name'],
      style: {
        color: 'rgb(78, 201, 176)'
      }
    },
    {
      types: ['known-class-name', 'class-name'],
      style: {
        color: 'rgb(227, 98, 9)'
      }
    },
    {
      types: ['char'],
      style: {
        color: 'rgb(209, 105, 105)'
      }
    },
    {
      types: ['property-access'],
      style: {
        color: 'rgb(0, 92, 197)'
      }
    },
    {
      types: ['method', 'function', 'property-access'],
      style: {
        color: 'rgb(111, 66, 193)'
      }
    },
    {
      languages: ['json'],
      types: ['property'],
      style: {
        color: 'rgb(3, 47, 98)'
      }
    },
    {
      languages: ['json'],
      types: ['string'],
      style: {
        color: 'rgb(3, 47, 98)'
      }
    },
    {
      languages: ['json'],
      types: ['number'],
      style: {
        color: 'rgb(0, 92, 197)'
      }
    },
    {
      languages: ['json'],
      types: ['comment'],
      style: {
        backgroundColor: 'rgb(179, 29, 40)',
        color: 'rgb(250, 251, 252)'
      }
    }
  ]
};

export default theme;
