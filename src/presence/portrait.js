const VERTEX_SHADER = `
attribute vec2 a_position;
attribute vec2 a_uv;

varying vec2 v_uv;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_uv = a_uv;
}
`;

const FRAGMENT_SHADER = `
precision mediump float;

uniform sampler2D u_texture;
uniform float u_time;
uniform vec2 u_gaze;
uniform float u_blink;
uniform float u_breathe;
uniform float u_speech;
uniform float u_ready;

varying vec2 v_uv;

vec2 eyeWarp(vec2 uv, vec2 center, vec2 radius, vec2 shift, float blink) {
  vec2 q = (uv - center) / radius;
  float weight = exp(-dot(q, q) * 2.25);

  vec2 warped = uv + shift * weight;

  float blinkWeight = exp(
    -(q.x * q.x * 1.7 + q.y * q.y * 4.4)
  );

  warped.y = mix(
    warped.y,
    center.y + (warped.y - center.y) * (1.0 - blink * 0.92 * blinkWeight),
    blinkWeight
  );

  return warped;
}

vec2 globalBreath(vec2 uv, float breath) {
  float torsoWeight = smoothstep(0.74, 0.22, uv.y);
  float centerY = 0.55;

  uv.x += sin(u_time * 0.78) * 0.0014 * torsoWeight;
  uv.y = centerY + (uv.y - centerY) * (1.0 - breath * 0.0042 * torsoWeight);

  return uv;
}

vec2 subtleHeadMotion(vec2 uv, vec2 gaze) {
  float faceWeight =
    exp(-pow((uv.x - 0.5) / 0.34, 2.0) - pow((uv.y - 0.40) / 0.34, 2.0));

  uv += vec2(
    gaze.x * 0.0014 * faceWeight,
    gaze.y * 0.0010 * faceWeight
  );

  return uv;
}

void main() {
  vec2 uv = v_uv;

  float breath = 0.5 + 0.5 * sin(u_time * 0.78);
  uv = globalBreath(uv, breath);
  uv = subtleHeadMotion(uv, u_gaze);

  vec2 leftEye = vec2(0.375, 0.34);
  vec2 rightEye = vec2(0.625, 0.34);

  vec2 eyeRadius = vec2(0.105, 0.065);
  vec2 eyeShift = vec2(u_gaze.x * 0.010, u_gaze.y * 0.006);

  float blinkAmount = smoothstep(0.0, 1.0, u_blink);

  uv = eyeWarp(uv, leftEye, eyeRadius, eyeShift, blinkAmount);
  uv = eyeWarp(uv, rightEye, eyeRadius, eyeShift, blinkAmount);

  vec2 mouthCenter = vec2(0.50, 0.565);
  vec2 mouthQ = (uv - mouthCenter) / vec2(0.115, 0.060);
  float mouthWeight = exp(-dot(mouthQ, mouthQ) * 2.8);
  uv.y += u_speech * 0.0035 * mouthWeight * sin(u_time * 14.0);

  vec4 color = texture2D(u_texture, uv);

  float vignette = smoothstep(0.95, 0.18, length(v_uv - 0.5));
  color.rgb *= mix(0.90, 1.0, vignette);

  float detail = 0.5 + 0.5 * sin((v_uv.x + v_uv.y) * 1800.0);
  color.rgb += (detail - 0.5) * 0.006 * u_ready;

  gl_FragColor = color;
}
`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Could not create portrait shader.');

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const error = gl.getShaderInfoLog(shader) || 'Portrait shader compilation failed.';
    gl.deleteShader(shader);
    throw new Error(error);
  }

  return shader;
}

function createProgram(gl) {
  const vertex = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = gl.createProgram();

  if (!program) throw new Error('Could not create portrait program.');

  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);

  gl.deleteShader(vertex);
  gl.deleteShader(fragment);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const error = gl.getProgramInfoLog(program) || 'Portrait program linking failed.';
    gl.deleteProgram(program);
    throw new Error(error);
  }

  return program;
}

export function createLivingPortrait(canvas, src) {
  let destroyed = false;
  let raf = 0;
  let blinkTarget = 0;
  let blinkCurrent = 0;
  let gazeX = 0;
  let gazeY = 0;
  let speech = 0;
  let ready = 0;
  let gl = null;
  let program = null;
  let texture = null;
  let fallbackContext = null;
  let image = null;

  const render = (timeMs) => {
    if (destroyed) return;

    const time = timeMs * 0.001;
    blinkCurrent += (blinkTarget - blinkCurrent) * 0.26;
    speech *= 0.91;

    if (gl && program && texture) {
      resizeCanvas();
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);

      gl.uniform1f(gl.getUniformLocation(program, 'u_time'), time);
      gl.uniform2f(gl.getUniformLocation(program, 'u_gaze'), gazeX, gazeY);
      gl.uniform1f(gl.getUniformLocation(program, 'u_blink'), blinkCurrent);
      gl.uniform1f(gl.getUniformLocation(program, 'u_breathe'), 0.5 + 0.5 * Math.sin(time * 0.78));
      gl.uniform1f(gl.getUniformLocation(program, 'u_speech'), speech);
      gl.uniform1f(gl.getUniformLocation(program, 'u_ready'), ready);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    } else if (fallbackContext && image?.complete) {
      resizeCanvas();
      fallbackContext.clearRect(0, 0, canvas.width, canvas.height);
      fallbackContext.drawImage(image, 0, 0, canvas.width, canvas.height);
    }

    raf = window.requestAnimationFrame(render);
  };

  const resizeCanvas = () => {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  };

  const loadImage = () => {
    image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      if (destroyed) return;

      try {
        gl = canvas.getContext('webgl', {
          alpha: true,
          antialias: true,
          premultipliedAlpha: false,
          preserveDrawingBuffer: false
        });

        if (!gl) throw new Error('WebGL unavailable.');

        program = createProgram(gl);

        const positions = new Float32Array([
          -1, -1,
           1, -1,
          -1,  1,
           1,  1
        ]);

        const uvs = new Float32Array([
          0, 1,
          1, 1,
          0, 0,
          1, 0
        ]);

        const positionBuffer = gl.createBuffer();
        const uvBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

        const positionLocation = gl.getAttribLocation(program, 'a_position');
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);

        const uvLocation = gl.getAttribLocation(program, 'a_uv');
        gl.enableVertexAttribArray(uvLocation);
        gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, 0, 0);

        texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          image
        );

        ready = 1;
        canvas.classList.add('portrait-ready');
      } catch {
        gl = null;
        program = null;
        texture = null;
        fallbackContext = canvas.getContext('2d');
        canvas.classList.add('portrait-fallback');
      }
    };

    image.onerror = () => {
      canvas.classList.add('portrait-fallback');
    };

    image.src = src;
  };

  loadImage();
  raf = window.requestAnimationFrame(render);

  return {
    setAttention(x, y) {
      gazeX = Math.max(-1, Math.min(1, Number(x) || 0));
      gazeY = Math.max(-1, Math.min(1, Number(y) || 0));
    },

    blink() {
      blinkTarget = 1;
      window.setTimeout(() => {
        blinkTarget = 0;
      }, 145);
    },

    speakBeat() {
      speech = Math.min(1, speech + 0.72);
    },

    destroy() {
      destroyed = true;
      window.cancelAnimationFrame(raf);

      if (gl && texture) gl.deleteTexture(texture);
      if (gl && program) gl.deleteProgram(program);

      gl = null;
      program = null;
      texture = null;
    }
  };
}
