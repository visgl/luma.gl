const defaultProps = {
  ambient: 0.4,
  diffuse: 0.6,
  shininess: 32,
  specularColor: [255, 255, 255]
};

export default class PhongMaterial {
  constructor(props) {
    props = Object.assign({}, defaultProps, props);
    Object.assign(this, props);
  }
}
