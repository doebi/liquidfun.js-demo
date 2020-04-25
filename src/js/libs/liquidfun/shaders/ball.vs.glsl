attribute vec2 position;
    attribute vec4 color;
    varying vec4 vColor;
    uniform float size;

    void main() {
        vColor = vec4(color.x/ 255.0, color.y / 255.0, color.z / 255.0, 1);
        gl_Position = vec4(position, 0.0, 1.0);
        gl_PointSize = size;
    }