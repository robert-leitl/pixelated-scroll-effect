varying vec2 v_uv;
uniform float u_scrollSpeed;

void main() {
    v_uv = uv;

    vec3 pos = position;

    // stretch on scroll
    pos.y *= 1. + abs(u_scrollSpeed) * 0.005;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.);
}
