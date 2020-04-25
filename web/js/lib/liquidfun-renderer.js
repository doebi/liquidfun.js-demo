function highest2(x) {
    return Math.pow(2, Math.ceil(Math.log(x) / Math.LN2));
};

function LiquidfunSprite(particleSystem) {
    PIXI.Container.call(this);

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

LiquidfunSprite.prototype = Object.create(PIXI.Container.prototype);
LiquidfunSprite.prototype.constructor = LiquidfunSprite;

LiquidfunSprite.prototype._renderWebGL = function (renderer) {
    renderer.setObjectRenderer(renderer.plugins.liquidfun);
    renderer.plugins.liquidfun.render(this);
};

function LiquidfunRenderer(renderer) {
    PIXI.ObjectRenderer.call(this, renderer);
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

LiquidfunRenderer.prototype = Object.create(PIXI.ObjectRenderer.prototype);
LiquidfunRenderer.prototype.constructor = LiquidfunRenderer;

PIXI.WebGLRenderer.registerPlugin('liquidfun', LiquidfunRenderer);

LiquidfunRenderer.prototype.swap = function () {
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
};

LiquidfunRenderer.prototype.texScale = function() {
    return new Float32Array([highest2(this.renderer.width),
        highest2(this.renderer.height)]);
};

LiquidfunRenderer.prototype.createTexture = function(gl) {
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
};

LiquidfunRenderer.prototype.render = function (sprite) {
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

};

LiquidfunRenderer.prototype.destroy = function () {
};
