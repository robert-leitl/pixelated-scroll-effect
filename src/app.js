import { Sketch } from './sketch';
import { Pane } from 'tweakpane';

let DEBUG = false;

if (process.env.NODE_ENV !== 'production') {
    // Only runs in development and will be stripped in production builds.
    DEBUG = true;
}

let sketch;
let resizeTimeoutId;

window.addEventListener('load', () => {
    const container = document.body;

    let pane;
    if (DEBUG) {
        pane = new Pane({ title: 'Settings' });
    }

    sketch = new Sketch(container, pane);
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


