import * as PIXI from 'pixi.js';

function highest2(x) {
  return Math.pow(2, Math.ceil(Math.log(x) / Math.LN2));
};

export class LiquidfunRenderer extends PIXI.ObjectRenderer {
  constructor(renderer) {
    super(renderer);
    this.renderer  = renderer;

    this.currentBatchSize = 0;
    this.sprites = [];
    this.quad = new Float32Array([
        -1, -1, 1, -1, -1, 1, 1, 1
    ]);
    this.textures = null;
    this.blurRadius = 3.2;
    this.threshold = 0.5;
  }

  swap() {
    let gl = this.renderer.gl,
        temp = this.textures.front;
    this.textures.front = this.textures.back;
    this.textures.back = temp;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.bindTexture(gl.TEXTURE_2D, this.textures.back);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D, this.textures.back, 0);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindTexture(gl.TEXTURE_2D, this.textures.front);
  }

  texScale() {
    return new Float32Array([highest2(this.renderer.width),
        highest2(this.renderer.height)]);
  }

  createTexture(gl) {
    let tex = gl.createTexture();
    let scale = this.texScale();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, scale[0], scale[1],
        0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    return tex;
  }

  render(sprite) {
    let renderer = this.renderer;
    let gl = renderer.gl;

    // some hacky magic (thanks ivan)
    renderer.bindVao(null);
    renderer._activeShader = null;
    renderer.bindTexture(null, 0, true);

    if (this.textures == null) {
        this.textures = {};
        this.fbo = gl.createFramebuffer();
        this.textures.front = this.createTexture(gl);
        this.textures.back = this.createTexture(gl);
    }

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.DEPTH_TEST);
    //gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    let count = sprite.particleSystem.GetParticleCount();
    let radius = sprite.particleSystem.GetRadius();

    if (count > 0) {
        let w = gl.canvas.width, h = gl.canvas.height;
        fx = 0;
        fy = 0;

        // start with ball shader
        sprite.ball_shader.bind();

        /* Position Buffer */
        // get pointer
        let pos_offset = sprite.particleSystem.GetPositionBuffer();
        // read memory into JS Array
        let raw_pos = new Float32Array(Module.HEAPU8.buffer, pos_offset.e, count * 2);

        // initalize new Array for corrected values
        let position = new Float32Array(count*2);
        // transform physics engine coords to renderer coords
        for (let i = 0; i < count; i++) {
            position[i*2]   = (raw_pos[i*2]   - fx) * 2 * PTM / w;
            position[i*2+1] = (raw_pos[i*2+1] - fy) * 2 * PTM / h;
        }
        // upload data to gpu
        gl.bindBuffer(gl.ARRAY_BUFFER, sprite.pos_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, position, gl.DYNAMIC_DRAW);
        let positionHandle = sprite.ball_shader.attributes.position.location;
        gl.enableVertexAttribArray(positionHandle);
        gl.vertexAttribPointer(positionHandle, 2, gl.FLOAT, false, 0, 0);

        /* Color Buffer */
        /*
        // get pointer
            let color_offset = sprite.particleSystem.GetColorBuffer();
        // read memory into JS Array
            let color = new Uint8Array(Module.HEAPU8.buffer, color_offset.e, count * 4);
        // upload data to gpu
            gl.bindBuffer(gl.ARRAY_BUFFER, sprite.color_buffer);
            gl.bufferData(gl.ARRAY_BUFFER, color, gl.DYNAMIC_DRAW);
            let colorHandle = sprite.ball_shader.attributes.color.location;
            gl.enableVertexAttribArray(colorHandle);
            gl.vertexAttribPointer(colorHandle, 4, gl.UNSIGNED_BYTE, false, 0, 0);
            */

        this.swap();
        gl.bindTexture(gl.TEXTURE_2D, this.textures.front);

        sprite.ball_shader.uniforms.size = radius * PTM * this.blurRadius;
        gl.drawArrays(gl.POINTS, 0, count);
        this.swap();

        gl.bindBuffer(gl.ARRAY_BUFFER, sprite.quadbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.quad, gl.DYNAMIC_DRAW);

        sprite.blur_shader.bind();
        let blurPositionHandle = sprite.blur_shader.attributes.position.location;
        gl.enableVertexAttribArray(blurPositionHandle);
        gl.vertexAttribPointer(positionHandle, 2, gl.FLOAT, false, 0, 0);
        sprite.blur_shader.uniforms.base = 0;
        sprite.blur_shader.uniforms.scale = this.texScale();

        sprite.blur_shader.uniforms.dir = new Float32Array([0.0, 0.5]);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        this.swap();

        sprite.blur_shader.uniforms.dir = new Float32Array([0.5, 0.0]);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        this.swap();

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        sprite.threshold_shader.bind();
        let thresholdPositionHandle = sprite.threshold_shader.attributes.position.location;
        gl.vertexAttribPointer(thresholdPositionHandle, 2, gl.FLOAT, false, 0, 0);
        sprite.threshold_shader.uniforms.base = 0;
        sprite.threshold_shader.uniforms.scale = this.texScale();
        sprite.threshold_shader.uniforms.threshold = this.threshold;
        sprite.threshold_shader.uniforms.color = new Float32Array([1.0, 1.0, 1.0, 0.5]);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    //renderer.state.pop();

  }

  destroy() {
  }
}
