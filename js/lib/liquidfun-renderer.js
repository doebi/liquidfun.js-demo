function highest2(x) {
    return Math.pow(2, Math.ceil(Math.log(x) / Math.LN2));
};

function LiquidfunRenderer(renderer) {
    PIXI.ObjectRenderer.call(this, renderer);
    var gl = this.renderer.gl;
    this.texture = PIXI.Texture.EMPTY.clone();

    this.quad = new Float32Array([
        -1, -1, 1, -1, -1, 1, 1, 1
    ]);
}

LiquidfunRenderer.prototype = Object.create(PIXI.ObjectRenderer.prototype);
LiquidfunRenderer.prototype.constructor = LiquidfunRenderer;

PIXI.WebGLRenderer.registerPlugin('liquidfun', LiquidfunRenderer);

LiquidfunRenderer.prototype.start = function () {
}

LiquidfunRenderer.prototype.render = function (sprite) {
    let renderer = this.renderer;
    let gl = this.renderer.gl;
    renderer.bindShader(sprite.ball_shader);

    var count = sprite.particleSystem.GetParticleCount();
    let radius = sprite.particleSystem.GetRadius();

    if (count == 0)
        return;

    let posVAO = new PIXI.glCore.VertexArrayObject(gl);

    renderer.bindVao(posVAO);

    posVAO.draw(gl.POINTS, count, 0);
        //sprite.ball_shader.uniforms.size = radius * PTM * 2;
        //gl.drawArrays(gl.POINTS, 0, count);
}

LiquidfunRenderer.prototype.render2 = function (sprite) {
    //if (!this.texA && !this.texB) {
    //    this.texA = this.createTexture();
    //    this.texB = this.createTexture();
    //}
    let gl = this.renderer.gl;
    var count = sprite.particleSystem.GetParticleCount();
    let radius = sprite.particleSystem.GetRadius();

    //this.renderer.bindTexture(this.texture);


    if (count > 0) {
        var w = gl.canvas.width, h = gl.canvas.height;
        fx = 0;
        fy = 0;

        // start with ball shader
        //sprite.ball_shader.bind();

        //this.renderer.bindTexture(PIXI.Texture.EMPTY, 0, true);

        /* Position Buffer */
        // get pointer
        var pos_offset = sprite.particleSystem.GetPositionBuffer();
        // read memory into JS Array
        var raw_pos = new Float32Array(Module.HEAPU8.buffer, pos_offset.e, count * 2);

        // initalize new Array for corrected values
        var position = new Float32Array(count*2);
        // transform physics engine coords to renderer coords
        for (var i = 0; i < count; i++) {
            position[i*2]   = (raw_pos[i*2]) * 2 * PTM / w;
            position[i*2+1] = (raw_pos[i*2+1]) * 2 * PTM / h;
        }
        // upload data to gpu
        //gl.bindBuffer(gl.ARRAY_BUFFER, sprite.pos_buffer);
        //gl.bufferData(gl.ARRAY_BUFFER, position, gl.DYNAMIC_DRAW);
        //var positionHandle = sprite.ball_shader.attributes.position.location;
        //gl.enableVertexAttribArray(positionHandle);
        //gl.vertexAttribPointer(positionHandle, 2, gl.FLOAT, false, 0, 0);

        /* Color Buffer */
        /*
        // get pointer
            var color_offset = sprite.particleSystem.GetColorBuffer();
        // read memory into JS Array
            var color = new Uint8Array(Module.HEAPU8.buffer, color_offset.e, count * 4);
        // upload data to gpu
            gl.bindBuffer(gl.ARRAY_BUFFER, sprite.color_buffer);
            gl.bufferData(gl.ARRAY_BUFFER, color, gl.DYNAMIC_DRAW);
            var colorHandle = sprite.ball_shader.attributes.color.location;
            gl.enableVertexAttribArray(colorHandle);
            gl.vertexAttribPointer(colorHandle, 4, gl.UNSIGNED_BYTE, false, 0, 0);
            */

        //this.swap();
        //gl.bindTexture(gl.TEXTURE_2D, this.textA);

        sprite.ball_shader.uniforms.size = radius * PTM * 2;
        gl.drawArrays(gl.POINTS, 0, count);
        ////this.swap();

        //gl.bindBuffer(gl.ARRAY_BUFFER, sprite.quadbuffer);
        //gl.bufferData(gl.ARRAY_BUFFER, this.quad, gl.DYNAMIC_DRAW);

        /*
            sprite.blur_shader.bind();
            var positionHandle = sprite.blur_shader.attributes.position.location;
            gl.enableVertexAttribArray(positionHandle);
            gl.vertexAttribPointer(positionHandle, 2, gl.FLOAT, false, 0, 0);
            sprite.blur_shader.uniforms.base = 0;
            sprite.blur_shader.uniforms.scale = this.texScale();

            sprite.blur_shader.uniforms.dir = new Float32Array([0.0, 1.0]);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            this.swap();

            sprite.blur_shader.uniforms.dir = new Float32Array([1.0, 0.0]);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            this.swap();
            */

        //gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        //sprite.threshold_shader.bind();
        //var positionHandle = sprite.threshold_shader.attributes.position.location;
        //gl.vertexAttribPointer(positionHandle, 2, gl.FLOAT, false, 0, 0);
        //sprite.threshold_shader.uniforms.base = 0;
        //sprite.threshold_shader.uniforms.scale = this.texScale();
        //sprite.threshold_shader.uniforms.threshold = 0.3;
        //sprite.threshold_shader.uniforms.color = new Float32Array([1.0, 1.0, 1.0, 0.5]);
        //gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

};

LiquidfunRenderer.prototype.swap = function () {
    /*
    var gl = this.renderer.gl;
    let temp = this.texA;
    this.texA = this.texB;
    this.texB = temp;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.bindTexture(gl.TEXTURE_2D, this.texB);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texB, 0);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindTexture(gl.TEXTURE_2D, this.texA);
    */
};

LiquidfunRenderer.prototype.texScale = function() {
    return new Float32Array([highest2(this.renderer.width), highest2(this.renderer.height)]);
};

LiquidfunRenderer.prototype.createTexture = function() {
    /*
    let gl = this.renderer.gl;
    tex = gl.createTexture();
    scale = this.texScale();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, scale[0], scale[1], 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    return tex;
    */
};

LiquidfunRenderer.prototype.flush = function () {
    return;
    /*
    var renderer = this.renderer,
        gl = renderer.gl;

    if (this.textures == null) {
        this.textures = {};
        this.fbo = gl.createFramebuffer();
        this.textures.front = this.createTexture(gl);
        this.textures.back = this.createTexture(gl);
    }

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.DEPTH_TEST);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    */
};

LiquidfunRenderer.prototype.destroy = function () {
};
