uniform sampler2D u_texture;
uniform vec2 u_coverScale;
uniform float u_scrollSpeed;

varying vec2 v_uv;

void main() {
    // center uv
    vec2 uv = ((2. * v_uv) - 1.);

    // object fit cover
    uv *= u_coverScale;

    // channel shift
    vec2 rUV = (uv + 1.) / 2.;
    vec4 textureR = texture2D(u_texture, rUV);
    vec2 gUV = (uv + 1.) / 2.;
    gUV.y += u_scrollSpeed * 0.0002;
    vec4 textureG = texture2D(u_texture, gUV);
    vec2 bUV = (uv + 1.) / 2.;
    bUV.y += u_scrollSpeed * 0.0004;
    vec4 textureB = texture2D(u_texture, bUV);

    // normalize uv
    uv = (uv + 1.) / 2.;

    gl_FragColor = vec4(textureR.r, textureG.g, textureB.b, 1.);
    //gl_FragColor = vec4(pointerDistance);
}
