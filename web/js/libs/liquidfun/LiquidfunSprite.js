export class LiquidfunSprite extends PIXI.Container {
  constructor(particleSystem) {
    super();

    this.particleSystem = particleSystem;

    let ball_vert = `
    attribute vec2 position;
    attribute vec4 color;
    varying vec4 vColor;
    uniform float size;

    void main() {
      vColor = vec4(color.x/ 255.0, color.y / 255.0, color.z / 255.0, 1);
      gl_Position = vec4(position, 0.0, 1.0);
      gl_PointSize = size;
    }`;

    let ball_frag = `
    precision mediump float;
    varying vec4 vColor;

    void main() {
      if (distance(vec2(0.0, 0.0), gl_PointCoord.xy - 0.5) < 0.5) {
        //gl_FragColor = vColor;
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
      } else {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
      }
    }`;

    let identity_vert = `
    attribute vec2 position;

    void main() {
      gl_Position = vec4(position, 0.0, 1.0);
    }`;

    let blur_frag = `
    precision mediump float;

    uniform sampler2D base;
    uniform vec2 scale;
    uniform vec2 dir;

    void main() {
      vec2 p = gl_FragCoord.xy / scale;
      gl_FragColor =
        texture2D(base, p + dir * vec2(-9.0, -9.0) / scale) * 0.02433 +
        texture2D(base, p + dir * vec2(-8.0, -8.0) / scale) * 0.03081 +
        texture2D(base, p + dir * vec2(-7.0, -7.0) / scale) * 0.03795 +
        texture2D(base, p + dir * vec2(-6.0, -6.0) / scale) * 0.04546 +
        texture2D(base, p + dir * vec2(-5.0, -5.0) / scale) * 0.05297 +
        texture2D(base, p + dir * vec2(-4.0, -4.0) / scale) * 0.06002 +
        texture2D(base, p + dir * vec2(-3.0, -3.0) / scale) * 0.06615 +
        texture2D(base, p + dir * vec2(-2.0, -2.0) / scale) * 0.07090 +
        texture2D(base, p + dir * vec2(-1.0, -1.0) / scale) * 0.07392 +
        texture2D(base, p + dir * vec2( 0.0,  0.0) / scale) * 0.07495 +
        texture2D(base, p + dir * vec2( 1.0,  1.0) / scale) * 0.07392 +
        texture2D(base, p + dir * vec2( 2.0,  2.0) / scale) * 0.07090 +
        texture2D(base, p + dir * vec2( 3.0,  3.0) / scale) * 0.06615 +
        texture2D(base, p + dir * vec2( 4.0,  4.0) / scale) * 0.06002 +
        texture2D(base, p + dir * vec2( 5.0,  5.0) / scale) * 0.05297 +
        texture2D(base, p + dir * vec2( 6.0,  6.0) / scale) * 0.04546 +
        texture2D(base, p + dir * vec2( 7.0,  7.0) / scale) * 0.03795 +
        texture2D(base, p + dir * vec2( 8.0,  8.0) / scale) * 0.03081 +
        texture2D(base, p + dir * vec2( 9.0,  9.0) / scale) * 0.02433;
    }`;

    let threshold_frag = `
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
    }`;

    this.ball_shader = new PIXI.glCore.GLShader(renderer.renderer.gl, ball_vert, ball_frag);
    this.blur_shader = new PIXI.glCore.GLShader(renderer.renderer.gl, identity_vert, blur_frag);
    this.threshold_shader = new PIXI.glCore.GLShader(renderer.renderer.gl, identity_vert, threshold_frag);
    this.pos_buffer = renderer.renderer.gl.createBuffer();
    this.color_buffer = renderer.renderer.gl.createBuffer();
    this.quadbuffer = renderer.renderer.gl.createBuffer();
  }

  _renderWebGL = function (renderer) {
    renderer.setObjectRenderer(renderer.plugins.liquidfun);
    renderer.plugins.liquidfun.render(this);
  }
}
