uniform float u_scrollSpeed;
uniform sampler2D tDiffuse;
varying vec2 v_uv;


void main() {
    vec2 uv = v_uv;

    uv = (uv * 2.) - 1.;

    vec4 texel = texture2D( tDiffuse, uv );
    texel *= 0.7;
    gl_FragColor = texel;
}
