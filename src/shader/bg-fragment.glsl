uniform float u_scrollSpeed;
uniform sampler2D tDiffuse;
varying vec2 v_uv;


void main() {
    vec2 uv = v_uv;

    uv = (uv * 2.) - 1.;
    uv.x /= pow(uv.y * 0.3, 2.) * (abs(u_scrollSpeed) * 0.02 + 0.5) + 1.;
    uv = (uv + 1.) / 2.;

    vec4 texel = texture2D( tDiffuse, uv );
    gl_FragColor = texel;
}
