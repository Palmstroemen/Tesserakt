// Gewoelbtes Uhrglas: zeichnet ein Video (Frontkamera) mit Fischaugen-Verzerrung in ein Canvas (WebGL).
// Wie bei einem Uhrglas ist die Mitte fast eben, zum Rand hin wird das Bild zusammengedrueckt und zeigt mehr
// von der Umgebung. Gespiegelt wie ein echter Spiegel; zum Rand hin leicht ausgeblendet.
// WOELBUNG: 0 = flach, 1 = deutlich, 2 = stark.
export const WOELBUNG = 0.9;
// FORM: Exponent des Profils. 2 = Kugelkappe (gleichmaessig gekruemmt), 4 = Uhrglas (flaches Ellipsoid:
// Mitte fast eben, die Kruemmung sitzt am Rand)
export const FORM = 4.0;
// ZOOM: Ausschnitt des Kamerabildes samt Woelbung (1 = ganzes Bild, kleiner = naeher heran)
export const ZOOM = 0.78;

const VERTEX = `
attribute vec2 ecke;
varying vec2 p;
void main() {
  p = ecke;
  gl_Position = vec4(ecke, 0.0, 1.0);
}`;

const FRAGMENT = `
precision mediump float;
uniform sampler2D bild;
uniform float k;
uniform float zoom;
uniform float form;
uniform vec2 deckung; // Ausschnitt des Videos (cover), je Achse <= 1
varying vec2 p;
void main() {
  float r = length(p);
  if (r > 1.0) { gl_FragColor = vec4(0.0); return; }
  // Fischauge: der Quellradius waechst zum Rand hin schneller -> Mitte vergroessert, Rand gestaucht
  // leicht aus der Mitte versetzt (Bild wandert nach links oben): eine Spiegelung sitzt selten mittig wie ein Selfie
  vec2 q = p * (1.0 + k * pow(r, form)) / (1.0 + k) * zoom + vec2(0.18, -0.12);
  vec2 uv = vec2(0.5 - q.x * 0.5 * deckung.x, 0.5 - q.y * 0.5 * deckung.y); // x gespiegelt, y Bild nach unten
  vec3 farbe = texture2D(bild, uv).rgb;
  float a = 1.0 - 0.75 * smoothstep(0.55, 1.0, r);
  gl_FragColor = vec4(farbe * a, a);
}`;

function shader(gl, typ, quelle) {
  const s = gl.createShader(typ);
  gl.shaderSource(s, quelle);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
    throw new Error(gl.getShaderInfoLog(s));
  return s;
}

// startet die Darstellung; gibt eine Stopp-Funktion zurueck oder null, wenn WebGL fehlt
export function spiegelglasStarten(canvas, video) {
  const gl = canvas.getContext("webgl", {
    premultipliedAlpha: true,
    alpha: true,
  });
  if (!gl) return null;
  const prog = gl.createProgram();
  gl.attachShader(prog, shader(gl, gl.VERTEX_SHADER, VERTEX));
  gl.attachShader(prog, shader(gl, gl.FRAGMENT_SHADER, FRAGMENT));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const puffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, puffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  );
  const ecke = gl.getAttribLocation(prog, "ecke");
  gl.enableVertexAttribArray(ecke);
  gl.vertexAttribPointer(ecke, 2, gl.FLOAT, false, 0, 0);

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1f(gl.getUniformLocation(prog, "k"), WOELBUNG);
  gl.uniform1f(gl.getUniformLocation(prog, "zoom"), ZOOM);
  gl.uniform1f(gl.getUniformLocation(prog, "form"), FORM);
  const deckung = gl.getUniformLocation(prog, "deckung");

  let laeuft = true;
  let rvfc = null;
  let raf = 0;
  const zeichnen = () => {
    if (!laeuft) return;
    if (video.readyState >= 2 && video.videoWidth) {
      // Canvas in Geraetepixeln (hoechstens doppelte Aufloesung)
      const px = Math.round(
        canvas.clientWidth * Math.min(2, window.devicePixelRatio || 1),
      );
      if (px && canvas.width !== px) {
        canvas.width = px;
        canvas.height = px;
        gl.viewport(0, 0, px, px);
      }
      const seitenverhaeltnis = video.videoWidth / video.videoHeight;
      gl.uniform2f(
        deckung,
        Math.min(1, 1 / seitenverhaeltnis),
        Math.min(1, seitenverhaeltnis),
      );
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        video,
      );
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    if (video.requestVideoFrameCallback)
      rvfc = video.requestVideoFrameCallback(zeichnen);
    else raf = requestAnimationFrame(zeichnen);
  };
  zeichnen();

  return () => {
    laeuft = false;
    if (rvfc !== null && video.cancelVideoFrameCallback)
      video.cancelVideoFrameCallback(rvfc);
    cancelAnimationFrame(raf);
  };
}
