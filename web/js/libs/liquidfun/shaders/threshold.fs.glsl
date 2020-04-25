precision mediump float;

    uniform sampler2D base;
    uniform vec2 scale;
    uniform float threshold;
    uniform vec4 color;

    void main() {
        vec4 value = texture2D(base, gl_FragCoord.xy / scale);
        if (value.r > threshold) {
            gl_FragColor = color;
            //gl_FragColor = vec4(value.rgb, alpha);
        } else {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
        }
    }