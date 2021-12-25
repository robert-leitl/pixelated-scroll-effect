uniform float u_scrollSpeed;
uniform sampler2D tDiffuse;
uniform vec2 u_resolution;
varying vec2 v_uv;


void main() {
    vec2 uv = v_uv;

    // center uvs
    uv = (uv * 2.) - 1.;

    // init the pixel size with the scroll speed
    float pixelSize = abs(u_scrollSpeed * 0.6);
    // make the pixelation stronger at the top and bottom (offset by .5 to center each pixel)
    pixelSize *= 5. * ((floor(abs(uv.y * uv.y) * 6.) + .5) / 6.);
    // the pixel size has to be at least 1
    pixelSize += 1.;

    // pixelate the uv coords (offset by .5 to center each pixel)
    vec2 d = u_resolution / pixelSize;
	uv = (floor( uv * d ) + .5) / d;

    // uncenter the uvs
    uv = (uv + 1.) / 2.;

	vec4 texel = texture2D(tDiffuse, uv);
    gl_FragColor = texel;
}
