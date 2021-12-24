import { Sketch } from './sketch';
import { Pane } from 'tweakpane';
import LocomotiveScroll from 'locomotive-scroll';

let DEBUG = false;

if (process.env.NODE_ENV !== 'production') {
    // Only runs in development and will be stripped in production builds.
    DEBUG = true;
}

let sketch;
let resizeTimeoutId;

window.addEventListener('load', () => {
    const container = document.body.querySelector('.container');

    let pane;
    if (DEBUG) {
        pane = new Pane({ title: 'Settings' });
    }

    const scroll = new LocomotiveScroll({
        el: document.querySelector('[data-scroll-container]'),
        smooth: true,
        getSpeed: true
    });

    sketch = new Sketch(container, scroll, pane);
    sketch.oninit = () => {
        sketch.run(); 
    }
});

window.addEventListener('resize', () => {
    if (sketch) {
        if (resizeTimeoutId)
            clearTimeout(resizeTimeoutId);

        resizeTimeoutId = setTimeout(() => {
            resizeTimeoutId = null;
            sketch.resize();
        }, 300);
    }
});


