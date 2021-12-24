import {
    Mesh,
    PerspectiveCamera,
    PlaneBufferGeometry,
    Scene,
    ShaderMaterial,
    TextureLoader,
    Vector2,
    WebGLRenderer
} from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import fragmentShader from './shader/fragment.glsl';
import vertexShader from './shader/vertex.glsl';

export class Sketch {
    oninit;

    #isDestroyed = false;

    constructor(container, pane) {
        this.container = container;
        this.pane = pane;

        const assets = [
            new TextureLoader().loadAsync(new URL('./assets/test.png', import.meta.url))
        ];

        Promise.all(assets).then((res) => {
            this.texture = res[0];
            this.#init();
        });
    }

    resize() {
        this.renderer.setSize(
            this.container.offsetWidth,
            this.container.offsetHeight
        );
        this.shaderMaterial.uniforms.uResolution.value.x = this.renderer.domElement.width;
        this.shaderMaterial.uniforms.uResolution.value.y = this.renderer.domElement.height;
        this.camera.aspect =
            this.container.offsetWidth / this.container.offsetHeight;
        this.camera.updateProjectionMatrix();
    }

    run() {
        if (this.#isDestroyed) return;

        this.controls.update();
        this.#render();

        requestAnimationFrame(() => this.run());
    }

    #render() {
        this.shaderMaterial.uniforms.uTime.value += 0.05;
        this.renderer.render(this.scene, this.camera);
    }

    destroy() {
        this.#isDestroyed = true;
    }

    #init() {
        this.camera = new PerspectiveCamera(
            45,
            this.container.offsetWidth / this.container.offsetHeight,
            0.1,
            100
        );
        this.camera.position.z = 2;
        this.scene = new Scene();
        this.#initObject();
        this.renderer = new WebGLRenderer();
        this.renderer.setPixelRatio(window.devicePixelRatio);

        this.container.appendChild(this.renderer.domElement);

        this.resize();

        this.controls = new OrbitControls(
            this.camera,
            this.renderer.domElement
        );
        this.controls.update();

        document.onpointermove = (e) => {
            this.shaderMaterial.uniforms.uMouse.value.x = e.pageX;
            this.shaderMaterial.uniforms.uMouse.value.y = e.pageY;
        };

        this.#initTweakpane();

        if (this.oninit) this.oninit();
    }

    #initObject() {
        const geometry = new PlaneBufferGeometry(2, 2);
        this.shaderMaterial = new ShaderMaterial({
            uniforms: {
                uTime: { value: 1.0 },
                uResolution: { value: new Vector2() },
                uMouse: { value: new Vector2() },
                uTexture: { value: this.texture }
            },
            vertexShader,
            fragmentShader
        });

        const mesh = new Mesh(geometry, this.shaderMaterial);
        this.scene.add(mesh);
    }

    #initTweakpane() {
        if (this.pane) {
            // init tweakpane folders and inputs
        }
    }
}
