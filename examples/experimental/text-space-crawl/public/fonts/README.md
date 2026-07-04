# MSDF Font Asset

`oswald-msdf.json` and `oswald-msdf.png` were generated from Oswald version 4.103:

- Font source: https://github.com/google/fonts/blob/b6f0fe1740573b70ee367fbaba04b7586be85af3/ofl/oswald/Oswald%5Bwght%5D.ttf
- Font source SHA-256: `5b38c246e255a12f5712d640d56bcced0472466fc68983d2d0410ec0457c2817`
- Copyright and license: SIL Open Font License 1.1, reproduced in `OFL.txt`

The atlas contains printable ASCII characters. It was generated with
[`msdf-bmfont-xml`](https://github.com/soimy/msdf-bmfont-xml) 2.8.0, an MIT-licensed
wrapper around the MIT-licensed [`msdfgen`](https://github.com/Chlumsky/msdfgen), using these
settings:

```bash
npx msdf-bmfont-xml@2.8.0 \
  --output-type json \
  --filename oswald-msdf \
  --font-size 64 \
  --charset-file charset.txt \
  --texture-size 512,512 \
  --texture-padding 2 \
  --distance-range 4 \
  --field-type msdf \
  --pot \
  --square \
  'Oswald[wght].ttf'
mv Oswald-wght.json oswald-msdf.json
```

`charset.txt` contains one line with Unicode code points U+0020 through U+007E.
