// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import React from 'react';
import { createRoot } from 'react-dom/client';
import { luma } from '@luma.gl/core';
import { webgl2Adapter } from '@luma.gl/webgl';
import { webgpuAdapter } from '@luma.gl/webgpu';
import { IMAGES_DATA } from './textures-data';
import { CompressedTexture, createModel } from './components/compressed-texture';
export default class App extends React.PureComponent {
    static defaultProps = {
        deviceType: 'webgl'
    };
    isComponentMounted = false;
    constructor(props) {
        super(props);
        this.state = {
            device: null,
            model: null,
            initializationError: null
        };
    }
    async componentDidMount() {
        this.isComponentMounted = true;
        const { deviceType = 'webgl' } = this.props;
        try {
            if (typeof OffscreenCanvas === 'undefined') {
                throw new Error('Texture tester requires OffscreenCanvas support');
            }
            const offscreenCanvas = new OffscreenCanvas(256, 256);
            const device = await luma.createDevice({
                adapters: [webgl2Adapter, webgpuAdapter],
                type: deviceType,
                createCanvasContext: {
                    canvas: offscreenCanvas,
                    width: 256,
                    height: 256,
                    autoResize: false,
                    useDevicePixels: false
                }
            });
            const model = createModel(device);
            if (!this.isComponentMounted) {
                model.destroy();
                device.destroy();
                return;
            }
            this.setState({ device, model, initializationError: null });
        }
        catch (error) {
            if (this.isComponentMounted) {
                this.setState({
                    initializationError: error instanceof Error ? error.message : String(error)
                });
            }
        }
    }
    componentWillUnmount() {
        this.isComponentMounted = false;
        this.state.model?.destroy();
        this.state.device?.destroy();
    }
    render() {
        const { device, model, initializationError } = this.state;
        if (initializationError) {
            return React.createElement("div", null, initializationError);
        }
        if (!device || !model) {
            return React.createElement("div", null);
        }
        return (React.createElement("div", null,
            React.createElement(Description, null),
            React.createElement(TextureUploaderCard, { device: device, model: model }),
            React.createElement(TexturesBlocks, { device: device, model: model })));
    }
}
function TexturesBlocks(props) {
    const { device, model } = props;
    return IMAGES_DATA.map((imagesData, index) => {
        return (React.createElement("div", { key: index },
            React.createElement(TexturesHeader, { imagesData: imagesData }),
            React.createElement(TexturesList, { device: device, model: model, images: imagesData.images }),
            React.createElement(TexturesDescription, { imagesData: imagesData })));
    });
}
function TexturesHeader(props) {
    const { formatName, link } = props.imagesData;
    return (React.createElement("div", { style: { display: 'flex', flexFlow: 'column' } },
        React.createElement("h2", { style: { borderBottom: '1px solid black', marginBottom: 0 } }, link ? (React.createElement("a", { style: { textDecoration: 'none' }, href: link }, formatName)) : (formatName))));
}
function TexturesDescription(props) {
    const { description, codeSample, availability } = props.imagesData;
    return (React.createElement("div", null,
        description && (React.createElement("p", null,
            React.createElement("b", null, 'Description: '),
            description)),
        availability && (React.createElement("p", null,
            React.createElement("b", null, 'Availability: '),
            availability)),
        codeSample && (React.createElement("div", null,
            React.createElement("p", null,
                React.createElement("code", null, codeSample))))));
}
function TexturesList(props) {
    const { device, model, images } = props;
    return (React.createElement("div", { style: { display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start' } }, images.map((image, index) => (React.createElement(CompressedTexture, { key: index, image: image, device: device, model: model })))));
}
function Description() {
    return (React.createElement("div", null,
        React.createElement("p", null,
            "This example loads images and compressed textures using ",
            React.createElement("code", null, "@loaders.gl/textures"),
            ' ',
            "and renders them using luma.gl on both WebGL and WebGPU. You can use this page to check which compressed texture formats your current browser and GPU can render."),
        React.createElement("p", { style: { marginBottom: 4, fontStyle: 'italic' } }, "Notes:"),
        React.createElement("ul", { style: { marginTop: 0, fontStyle: 'italic' } },
            React.createElement("li", null, "Some compressed texture formats are expected to be unsupported, depending on the GPU you are using to view this page."),
            React.createElement("li", null,
                "This example uses a single shared luma.gl ",
                React.createElement("code", null, "Device"),
                " rendering into multiple canvases managed by ",
                React.createElement("code", null, "PresentationContext"),
                "s."))));
}
class TextureUploaderCard extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            uploadedImage: null
        };
    }
    handleLoadFile(event) {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file) {
            this.setState({ uploadedImage: file });
        }
    }
    render() {
        const { device, model } = this.props;
        const { uploadedImage } = this.state;
        return (React.createElement("div", null,
            !uploadedImage ? (React.createElement("div", { style: { display: 'flex', flexFlow: 'column nowrap' } },
                React.createElement("div", { style: {
                        display: 'flex',
                        width: 256,
                        height: 256,
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px dashed black'
                    }, onDrop: event => this.handleLoadFile(event), onDragOver: (event) => event.preventDefault() }, "Drag&Drop texture"))) : null,
            uploadedImage ? (React.createElement("div", { style: {
                    display: 'flex',
                    flexFlow: 'column nowrap',
                    alignItems: 'center',
                    width: 270
                } },
                React.createElement(CompressedTexture, { image: uploadedImage, device: device, model: model }),
                React.createElement("button", { onClick: () => this.setState({ uploadedImage: null }) }, "Clean"))) : null));
    }
}
export function renderToDOM(container, props = {}) {
    const root = createRoot(container);
    root.render(React.createElement(App, { ...props }));
    return () => {
        queueMicrotask(() => root.unmount());
    };
}
