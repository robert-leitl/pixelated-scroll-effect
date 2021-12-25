import {
    Mesh,
    PerspectiveCamera,
    PlaneBufferGeometry,
    Scene,
    ShaderMaterial,
    Texture,
    Vector2,
    WebGLRenderer
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';

import imagesLoaded from 'imagesloaded';

import bgFragmentShader from './shader/bg-fragment.glsl';
import bgVertexShader from './shader/bg-vertex.glsl';
import mediaFragmentShader from './shader/media-fragment.glsl';
import mediaVertexShader from './shader/media-vertex.glsl';

const mediaBgShader = {
    uniforms: {
        tDiffuse: { value: null },
        u_scrollSpeed: { value: 0 },
        u_resolution: { value: new Vector2(0, 0) }
    },
    vertexShader: bgVertexShader,
    fragmentShader: bgFragmentShader
};


export class Sketch {
    oninit;

    #isDestroyed = false;

    constructor(container, scroll, pane) {
        this.container = container;
        this.pane = pane;
        this.scroll = scroll;
        this.viewportSize = new Vector2();

        imagesLoaded(this.container, () => this.#init());
    }

    resize() {
        this.viewportSize.set(document.body.offsetWidth, document.body.offsetHeight);
        this.renderer.domElement.width = this.container.offsetWidth;
        this.renderer.domElement.height = this.container.offsetHeight;
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;

        this.items.forEach((item) => this.#updateMediaRect(item));

        if (this.bgShaderPass) {
            this.bgShaderPass.uniforms.u_resolution.value.set(this.width, this.height);
            this.bgShaderPass.uniforms.u_resolution.value.multiplyScalar(Math.min(window.devicePixelRatio, 2));
        }
        
        if (this.renderer) {
            this.renderer.setSize(this.width, this.height);
            this.#updateCamera();
        }

        if (this.composer) {
            this.composer.setSize(this.width, this.height);
        }
    }

    run() {
        this.#animate();
    }

    #render() {
        this.renderer.render(this.scene, this.camera);
    }

    destroy() {
        this.#isDestroyed = true;
    }

    #init() {
        this.#initScroll();
        this.#initScene();
        this.#initPostEffects();
        this.#initObjects();
        this.resize();
        this.#initTweakpane();

        this.oninit();
    }

    #initScroll() {
        this.scrollSpeedTarget = 0;
        this.scrollSpeed = 0;
        this.scrollY = 0;

        this.scroll.on('scroll', data => {
            this.scrollSpeedTarget = data.speed;
            this.scrollY = data.scroll.y;

            // force animation to keep scroll and webgl in sync
            this.#animate();
        });
    }

    #initScene() {
        this.camera = new PerspectiveCamera(45, this.width / this.height, 200, 1000);
        this.camera.position.z = 300;
        this.scene = new Scene();
        this.renderer = new WebGLRenderer({ alpha: false });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.domElement.style.position = 'fixed';
        this.renderer.domElement.style.zIndex = -1;
        this.renderer.domElement.style.top = 0;
        this.renderer.domElement.style.left = 0;
        this.composer = new EffectComposer(this.renderer);
        this.composer.setSize(this.width, this.height);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);
    }

    #initPostEffects() {
        if (this.composer) {
            this.bgShaderPass = new ShaderPass(mediaBgShader);
            this.composer.addPass(this.bgShaderPass);
        }
    }

    #initObjects() {
        // get all media elements from the container
        const imgElements = Array.from(
            this.container.querySelectorAll('img')
        );

        this.items = imgElements.map((element) => {
            element.style.visibility = 'hidden';

            const geometry = new PlaneBufferGeometry(1, 1, 10, 10);
            const texture = new Texture(element);
            texture.needsUpdate = true;
            const planeMaterial = new ShaderMaterial({
                uniforms: {
                    u_time: { value: 1.0 },
                    u_resolution: { value: new Vector2() },
                    u_mouse: { value: new Vector2() },
                    u_texture: { value: texture },
                    u_coverScale: { value: new Vector2(1, 1) },
                    u_scrollSpeed: { value: 0 }
                },
                vertexShader: mediaVertexShader,
                fragmentShader: mediaFragmentShader
            });

            const mesh = new Mesh(geometry, planeMaterial);
            const item = {
                mesh,
                originalVertices: Array.from(geometry.attributes.position.array),
                element,
                x: 0,
                y: 0,
                width: 0,
                height: 0,
                hoverProgress: 0,
                hoverTarget: 0,
                pointer: new Vector2()
            };
            this.#updateMediaRect(item);

            if (this.scene) this.scene.add(mesh);
            return item;
        });
    }

    #updateMediaRect(item) {
        const scrollY = this.scrollDirective ? this.scrollDirective.scroll.y : 0;
        const rect = item.element.getBoundingClientRect();
        item.width = rect.width;
        item.height = rect.height;
        item.x = -this.viewportSize.x / 2 + rect.left + item.width / 2;
        item.y = this.viewportSize.y / 2 - rect.top - item.height / 2 - scrollY;

        if (item.mesh) {
            const mesh = item.mesh;
            mesh.userData = { item };
            const material = mesh.material;
            const geometry = mesh.geometry;

            // scale the geometry
            const positions = geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i] = item.originalVertices[i] * item.width;
                positions[i + 1] = item.originalVertices[i + 1] * item.height;
            }
            geometry.attributes.position.needsUpdate = true;

            // calculate the image scaling to apply object-fit cover in fragment shader
            const containerAspect = item.element.offsetWidth / item.element.offsetHeight;
            const imgElm = item.element;
            const imgAspect = imgElm.naturalWidth / imgElm.naturalHeight;
            if (containerAspect > imgAspect) {
                material.uniforms.u_coverScale.value.set(1, imgAspect / containerAspect);
            } else {
                material.uniforms.u_coverScale.value.set(containerAspect / imgAspect, 1);
            }
        }
    }

    #updateCamera() {
        if (this.camera) {
            // let one three.js unit appear as one pixel on the screen
            let fov = 2 * Math.atan(this.height / 2 / this.camera.position.z);
            fov *= 180 / Math.PI;
            this.camera.fov = fov;
            this.camera.aspect = this.width / this.height;
            this.camera.updateProjectionMatrix();
        }
    }

    #animate() {
        if (this.#isDestroyed) return;

        if (this.scene && this.camera) {
            this.time += 0.05;

            this.scrollSpeed += (this.scrollSpeedTarget - this.scrollSpeed) / 3

            // update the items
            this.items.forEach((item) => {
                item.mesh.position.x = item.x;
                item.mesh.position.y = item.y + this.scrollY;

                const itemMaterial = item.mesh.material;
                itemMaterial.uniforms.u_time.value = this.time;
                itemMaterial.uniforms.u_scrollSpeed.value = this.scrollSpeed;
            });

            if (this.bgShaderPass) {
                this.bgShaderPass.uniforms.u_scrollSpeed.value = this.scrollSpeed;
            }

            this.#render();
        }

        if (this._animationRAF) {
            cancelAnimationFrame(this._animationRAF);
            this._animationRAF = null;
        }

        this._animationRAF = requestAnimationFrame(() => this.#animate());
    }

    #render() {
        if (this.scene && this.renderer && this.camera && this.composer) {
            this.composer.render();
        }
    }

    #initTweakpane() {
        if (this.pane) {
            // init tweakpane folders and inputs
        }
    }
}
