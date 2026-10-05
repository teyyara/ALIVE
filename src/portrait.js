const SOURCE = Object.freeze({ width: 1020, height: 842 });

const STATE_MOTION = Object.freeze({
  idle: 1,
  attentive: 1.15,
  listening: .72,
  thinking: .9,
  speaking: 1.65,
  warm: 1.08,
  curious: 1.35,
  playful: 1.45
});

const VERTEX_SHADER = `#version 300 es
precision highp float;

in vec2 a_position;
in vec2 a_uv;

uniform float u_time;
uniform float u_motion;
uniform vec2 u_attention;
uniform float u_speech;

out vec2 v_uv;

void main() {
  vec2 p = a_position;
  float top = 1.0 - a_uv.y;

  float bodyMask = smoothstep(.48, .86, a_uv.y);
  float shoulderMask = smoothstep(.56, .76, a_uv.y) * (1.0 - smoothstep(.86, .98, a_uv.y));
  float headMask = 1.0 - smoothstep(.24, .58, a_uv.y);
  float faceMask = (1.0 - smoothstep(.30, .64, a_uv.y)) * (1.0 - smoothstep(.58, .72, a_uv.y));

  float breath = sin(u_time * 1.18) * 0.0048 * u_motion;
  float settle = sin(u_time * 0.72 + 1.7) * 0.0024 * u_motion;
  float shoulder = sin(u_time * 0.91 + .6) * 0.0022 * u_motion * shoulderMask;

  float orientX = u_attention.x * 0.0065 * headMask;
  float orientY = u_attention.y * 0.0038 * headMask;

  float speech = sin(u_time * 7.2) * u_speech * 0.0022 * faceMask;

  p.y += breath * bodyMask;
  p.y += settle * headMask;
  p.y += shoulder;
  p.y += orientY;
  p.y -= speech;
  p.x += orientX;

  float chestWidth = 1.0 + breath * 1.7 * bodyMask;
  float pivot = .12;
  p.x = (p.x - pivot) * chestWidth + pivot;

  gl_Position = vec4(p, 0.0, 1.0);
  v_uv = a_uv;
}
`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform sampler2D u_texture;
in vec2 v_uv;
out vec4 outColor;

void main() {
  outColor = texture(u_texture, v_uv);
}
`;

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader) || 'Unknown shader error';
    gl.deleteShader(shader);
    throw new Error(info);
  }
  return shader;
}

function createProgram(gl) {
  const program = gl.createProgram();
  const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program) || 'Unknown program error';
    gl.deleteProgram(program);
    throw new Error(info);
  }

  return program;
}

function createGrid(cols = 32, rows = 28) {
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let y = 0; y <= rows; y += 1) {
    const v = y / rows;
    for (let x = 0; x <= cols; x += 1) {
      const u = x / cols;
      positions.push(u * 2 - 1, 1 - v * 2);
      uvs.push(u, v);
    }
  }

  const stride = cols + 1;
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const a = y * stride + x;
      const b = a + 1;
      const c = a + stride;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  return {
    positions: new Float32Array(positions),
    uvs: new Float32Array(uvs),
    indices: new Uint32Array(indices)
  };
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load ALIVE portrait: ${src}`));
    image.src = src;
  });
}

export function createLivingPortrait(canvas, fallbackImage) {
  let destroyed = false;
  let gl = null;
  let program = null;
  let vao = null;
  let texture = null;
  let frameId = 0;
  let ready = false;
  let targetAttentionX = 0;
  let targetAttentionY = 0;
  let attentionX = 0;
  let attentionY = 0;
  let stateMotion = 1;
  let speech = 0;
  let width = 1;
  let height = 1;

  try {
    gl = canvas.getContext('webgl2', {
      alpha: true,
      antialias: true,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false
    });
  } catch {
    gl = null;
  }

  if (!gl) {
    canvas.hidden = true;
    fallbackImage.hidden = false;
    return {
      setState() {},
      setAttention() {},
      speechPulse() {},
      destroy() {}
    };
  }

  const setCanvasSize = () => {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, Math.round(rect.width * dpr));
    height = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    gl.viewport(0, 0, width, height);
  };

  const draw = (time) => {
    if (destroyed) return;

    setCanvasSize();
    attentionX += (targetAttentionX - attentionX) * .075;
    attentionY += (targetAttentionY - attentionY) * .075;
    speech *= .9;

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.bindVertexArray(vao);

    gl.uniform1f(gl.getUniformLocation(program, 'u_time'), time * 0.001);
    gl.uniform1f(gl.getUniformLocation(program, 'u_motion'), stateMotion);
    gl.uniform2f(gl.getUniformLocation(program, 'u_attention'), attentionX, attentionY);
    gl.uniform1f(gl.getUniformLocation(program, 'u_speech'), speech);

    gl.drawElements(gl.TRIANGLES, gridCount, gl.UNSIGNED_INT, 0);
    gl.bindVertexArray(null);

    frameId = requestAnimationFrame(draw);
  };

  const init = async () => {
    try {
      program = createProgram(gl);
      const grid = createGrid();
      gridCount = grid.indices.length;

      const positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, grid.positions, gl.STATIC_DRAW);

      const uvBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, grid.uvs, gl.STATIC_DRAW);

      const indexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, grid.indices, gl.STATIC_DRAW);

      vao = gl.createVertexArray();
      gl.bindVertexArray(vao);

      const positionLocation = gl.getAttribLocation(program, 'a_position');
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      const uvLocation = gl.getAttribLocation(program, 'a_uv');
      gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
      gl.enableVertexAttribArray(uvLocation);
      gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bindVertexArray(null);

      texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      const image = await loadImage('/assets/alive-clean-portrait.webp');
      if (destroyed) return;

      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.useProgram(program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(gl.getUniformLocation(program, 'u_texture'), 0);

      ready = true;
      fallbackImage.hidden = true;
      canvas.hidden = false;
      frameId = requestAnimationFrame(draw);
    } catch (error) {
      canvas.hidden = true;
      fallbackImage.hidden = false;
      console.error('ALIVE portrait mesh failed:', error);
    }
  };

  let gridCount = 0;

  init();

  return {
    setState(next) {
      stateMotion = STATE_MOTION[next] ?? 1;
    },
    setAttention(x, y) {
      targetAttentionX = Math.max(-1, Math.min(1, Number(x) || 0));
      targetAttentionY = Math.max(-1, Math.min(1, Number(y) || 0));
    },
    speechPulse() {
      speech = Math.min(1, speech + .82);
    },
    getDebugState() {
      return { ready, attentionX, attentionY, speech };
    },
    destroy() {
      destroyed = true;
      window.cancelAnimationFrame(frameId);
      if (texture) gl.deleteTexture(texture);
      if (vao) gl.deleteVertexArray(vao);
      if (program) gl.deleteProgram(program);
    }
  };
}
