/**
 * Motor da rede neural do hero (v2) — canvas 2D, sem biblioteca.
 *
 * Decisões que importam:
 * - Projeção perspectiva própria (sem WebGL): rotação em Y + tilt, s = f/(f-z).
 *   Raio e opacidade acompanham `s`, então o volume aparece sem shader.
 * - Ordenação por profundidade em counting sort O(n), não `sort()` com
 *   comparador — isso roda todo frame.
 * - Sinapses pintadas em 6 faixas de opacidade: 6 chamadas de `stroke()` para
 *   ~2.800 arestas, em vez de 2.800 chamadas.
 * - Neurônios e impulsos são sprites pré-renderizados (`drawImage`). `shadowBlur`
 *   por nó derrubaria o frame rate.
 * - Impulsos são cascata de ativação real: ao chegar num neurônio ele acende e
 *   dispara nos vizinhos com probabilidade. Nunca repete o mesmo padrão.
 * - Nenhuma alocação dentro do loop: todo estado vive em arrays tipados.
 */

export type BrainData = {
  n: number;
  m: number;
  pos: number[];
  nrm: number[];
  region: number[];
  edges: number[];
};

export type Quality = "high" | "low";

type RGB = [number, number, number];

const CAM = 3.1; // distância da câmera (z do observador)
const TILT = -0.17; // inclinação fixa, em radianos
const S_MIN = CAM / (CAM + 1);
const S_MAX = CAM / (CAM - 1);

const ACT_TAU = 0.5; // s — meia-vida da ativação de um neurônio
const EDGE_LEVELS = 5;
const HOVER_R = 60; // px de tolerância do cursor
const NUDGE_YAW = 0.34; // quanto o cérebro gira seguindo o cursor
const NUDGE_PITCH = 0.2;

const REGION_COUNT = 7;

// A lateral é a vista em que um cérebro é reconhecível. Girar 360° mostra a
// frente e a nuca, que não dizem nada — então ele oscila em torno da lateral.
// A malha é desenhada no plano sagital (z = frente-trás), então a lateral está
// a 90°: sem isso a projeção mostra o cérebro de frente, que lê como bola.
const YAW_LATERAL = Math.PI / 2;
const OSC_AMP = 0.3; // rad
const OSC_SPEED = 0.17; // rad/s
const FLASH_TAU = 0.7; // s — decaimento do pulso global do clique

function parseRGB(raw: string, fallback: RGB): RGB {
  const parts = raw.trim().split(/[\s,]+/).map(Number);
  if (parts.length < 3 || parts.some((v) => !Number.isFinite(v))) return fallback;
  return [parts[0], parts[1], parts[2]];
}

/** Sprite de ponto luminoso: núcleo sólido + halo em degradê. */
function makeDot(size: number, rgb: RGB, core: number, falloff: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const r = size / 2;
  const grad = g.createRadialGradient(r, r, 0, r, r, r);
  const [cr, cg, cb] = rgb;
  grad.addColorStop(0, `rgba(${cr},${cg},${cb},1)`);
  grad.addColorStop(core, `rgba(${cr},${cg},${cb},0.92)`);
  grad.addColorStop(core + (1 - core) * falloff, `rgba(${cr},${cg},${cb},0.18)`);
  grad.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
}

export class BrainEngine {
  // geometria
  private n = 0;
  private m = 0;
  private px: Float32Array;
  private py: Float32Array;
  private pz: Float32Array;
  private nx: Float32Array;
  private ny: Float32Array;
  private nz: Float32Array;
  private cluster: Uint8Array;
  private ea: Uint32Array;
  private eb: Uint32Array;
  // adjacência (CSR)
  private adjOff: Uint32Array;
  private adjE: Uint32Array;

  // estado por frame
  private sx: Float32Array;
  private sy: Float32Array;
  private ss: Float32Array;
  private shade: Float32Array;
  private act: Float32Array;
  private order: Uint16Array;
  private bucket: Int32Array;
  private edgeLvl: Uint8Array;
  private lvlOff: Int32Array;
  private lvlIdx: Uint32Array;

  // impulsos
  private imE: Int32Array;
  private imT: Float32Array;
  private imDir: Int8Array;
  private imSpd: Float32Array;
  private imC: Uint8Array;
  private imCursor = 0;
  private imLive = 0;

  // cena
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private host: HTMLElement;
  private dpr = 1;
  private w = 0;
  private h = 0;
  private radius = 0;
  private quality: Quality;

  private yaw = 0;
  private nudgeYaw = 0;
  private nudgePitch = 0;
  private tgtYaw = 0;
  private tgtPitch = 0;

  private cenX = new Float32Array(REGION_COUNT);
  private cenY = new Float32Array(REGION_COUNT);
  private cenW = new Float32Array(REGION_COUNT);
  private anchors: { region: number; x: number; y: number }[] = [];

  private hoverIdx = -1;
  private hoverCluster = -1;
  private forceCluster = -1;
  private hoverClock = 0;
  private sparkClock = 0;
  private intro = 0;
  private introRunning = false;
  private wakeQueue: number[] = [];
  private wakeClock = 0;

  private clock = 0;
  private flash = 0;
  private lastT = 0;
  private raf = 0;
  private running = false;
  private fpsEma = 0;
  private fpsClock = 0;

  // cores (lidas das CSS vars do container — o tema é puro CSS)
  private cInk: RGB = [120, 130, 160];
  private cNode: RGB[] = [];
  private cPulse: RGB = [255, 255, 255];
  private gain = 1;
  private dots: HTMLCanvasElement[] = [];
  private glows: HTMLCanvasElement[] = [];
  private pulses: HTMLCanvasElement[] = [];

  onHoverCluster: ((c: number | null) => void) | null = null;
  onFps: ((fps: number) => void) | null = null;

  constructor(canvas: HTMLCanvasElement, data: BrainData, quality: Quality) {
    this.canvas = canvas;
    this.host = canvas.parentElement ?? canvas;
    this.ctx = canvas.getContext("2d", { alpha: true })!;
    this.quality = quality;

    const n = (this.n = data.n);
    const m = (this.m = data.m);

    this.px = new Float32Array(n);
    this.py = new Float32Array(n);
    this.pz = new Float32Array(n);
    this.nx = new Float32Array(n);
    this.ny = new Float32Array(n);
    this.nz = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      this.px[i] = data.pos[i * 3];
      this.py[i] = data.pos[i * 3 + 1];
      this.pz[i] = data.pos[i * 3 + 2];
      this.nx[i] = data.nrm[i * 3];
      this.ny[i] = data.nrm[i * 3 + 1];
      this.nz[i] = data.nrm[i * 3 + 2];
    }
    this.cluster = new Uint8Array(data.region);

    this.ea = new Uint32Array(m);
    this.eb = new Uint32Array(m);
    for (let e = 0; e < m; e++) {
      this.ea[e] = data.edges[e * 2];
      this.eb[e] = data.edges[e * 2 + 1];
    }

    // CSR: para cada neurônio, as arestas que saem dele
    const deg = new Uint32Array(n);
    for (let e = 0; e < m; e++) {
      deg[this.ea[e]]++;
      deg[this.eb[e]]++;
    }
    this.adjOff = new Uint32Array(n + 1);
    for (let i = 0; i < n; i++) this.adjOff[i + 1] = this.adjOff[i] + deg[i];
    this.adjE = new Uint32Array(m * 2);
    const cur = this.adjOff.slice(0, n);
    for (let e = 0; e < m; e++) {
      this.adjE[cur[this.ea[e]]++] = e;
      this.adjE[cur[this.eb[e]]++] = e;
    }

    this.sx = new Float32Array(n);
    this.sy = new Float32Array(n);
    this.ss = new Float32Array(n);
    this.shade = new Float32Array(n);
    this.act = new Float32Array(n);
    this.order = new Uint16Array(n);
    this.bucket = new Int32Array(129);
    this.edgeLvl = new Uint8Array(m);
    this.lvlOff = new Int32Array(EDGE_LEVELS + 1);
    this.lvlIdx = new Uint32Array(m);

    const pool = quality === "high" ? 260 : 110;
    this.imE = new Int32Array(pool).fill(-1);
    this.imT = new Float32Array(pool);
    this.imDir = new Int8Array(pool);
    this.imSpd = new Float32Array(pool);
    this.imC = new Uint8Array(pool);

    this.refreshTheme();
    this.resize();
  }

  // --- tema -----------------------------------------------------------------

  refreshTheme(): void {
    const cs = getComputedStyle(this.host);
    this.cInk = parseRGB(cs.getPropertyValue("--brain-ink"), [120, 130, 160]);
    this.cPulse = parseRGB(cs.getPropertyValue("--brain-pulse"), [255, 255, 255]);
    const g = parseFloat(cs.getPropertyValue("--brain-gain"));
    this.gain = Number.isFinite(g) && g > 0 ? g : 1;
    this.cNode = [];
    for (let c = 0; c < REGION_COUNT; c++) {
      this.cNode.push(parseRGB(cs.getPropertyValue(`--brain-c${c}`), [90, 120, 230]));
    }
    this.buildSprites();
  }

  private buildSprites(): void {
    const S = 48;
    this.dots = this.cNode.map((rgb) => makeDot(S, rgb, 0.18, 0.4));
    this.glows = this.cNode.map((rgb) => makeDot(S, rgb, 0.1, 0.22));
    this.pulses = this.cNode.map((rgb) =>
      makeDot(
        S,
        [
          Math.round((rgb[0] + this.cPulse[0] * 2) / 3),
          Math.round((rgb[1] + this.cPulse[1] * 2) / 3),
          Math.round((rgb[2] + this.cPulse[2] * 2) / 3),
        ],
        0.12,
        0.25,
      ),
    );
  }

  // --- layout ---------------------------------------------------------------

  resize(): void {
    const cap = this.quality === "high" ? 2 : 1.5;
    const dpr = Math.min(cap, window.devicePixelRatio || 1);
    const w = Math.max(1, this.canvas.clientWidth);
    const h = Math.max(1, this.canvas.clientHeight);
    const bw = Math.round(w * dpr);
    const bh = Math.round(h * dpr);
    if (this.canvas.width !== bw || this.canvas.height !== bh) {
      this.canvas.width = bw;
      this.canvas.height = bh;
    }
    this.dpr = dpr;
    this.w = w;
    this.h = h;
    // Extensões da malha: z .97 na horizontal, y .74 na vertical (com o
    // tronco). O canvas agora é a coluna da direita, então as duas contam.
    this.radius = Math.min(w * 0.46, h * 0.6);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // --- interação ------------------------------------------------------------

  pointerMove(x: number, y: number): void {
    this.tgtYaw = ((x / this.w) * 2 - 1) * NUDGE_YAW;
    this.tgtPitch = ((y / this.h) * 2 - 1) * NUDGE_PITCH;

    const idx = this.nearest(x, y);
    if (idx !== this.hoverIdx) {
      this.hoverIdx = idx;
      if (idx >= 0) {
        this.excite(idx, 2);
        this.fireFrom(idx, 2);
      }
      const c = idx >= 0 ? this.cluster[idx] : -1;
      if (c !== this.hoverCluster) {
        this.hoverCluster = c;
        this.onHoverCluster?.(c >= 0 ? c : null);
      }
    }
  }

  pointerLeave(): void {
    this.tgtYaw = 0;
    this.tgtPitch = 0;
    this.hoverIdx = -1;
    if (this.hoverCluster !== -1) {
      this.hoverCluster = -1;
      this.onHoverCluster?.(null);
    }
  }

  /**
   * Acende uma região inteira a partir de fora do canvas — é o caminho de volta
   * da interação: o cursor no chip do pilar ilumina a área do cérebro.
   */
  highlightCluster(c: number | null): void {
    const next = c == null ? -1 : c;
    if (next === this.forceCluster) return;
    this.forceCluster = next;
    if (next < 0) return;
    let fired = 0;
    for (let i = 0; i < this.n && fired < 16; i++) {
      if (this.cluster[i] === next && Math.random() < 0.08) {
        this.excite(i, 1);
        this.fireFrom(i, 1);
        fired++;
      }
    }
  }

  /**
   * Clique: além da cascata local, a rede inteira dá um pulso — é a leitura
   * que o olho espera de um cérebro reagindo, e não de um ponto isolado.
   */
  tap(x: number, y: number): void {
    this.flash = 1;
    const idx = this.nearest(x, y, 160);
    if (idx < 0) {
      for (let k = 0; k < 6; k++) this.fireFrom((Math.random() * this.n) | 0, 2);
      return;
    }
    this.excite(idx, 3);
    this.fireFrom(idx, 6);
  }

  /** Neurônio mais próximo do cursor, em espaço de tela. Só roda no pointermove. */
  private nearest(x: number, y: number, reach = HOVER_R): number {
    let best = -1;
    let bd = reach * reach;
    for (let i = 0; i < this.n; i++) {
      const dx = this.sx[i] - x;
      const dy = this.sy[i] - y;
      const d = dx * dx + dy * dy;
      if (d < bd) {
        bd = d;
        best = i;
      }
    }
    return best;
  }

  /** Acende um neurônio e propaga pelos vizinhos com decaimento. */
  private excite(i: number, depth: number, level = 1): void {
    if (this.act[i] < level) this.act[i] = level;
    if (depth <= 0) return;
    const from = this.adjOff[i];
    const to = this.adjOff[i + 1];
    for (let k = from; k < to; k++) {
      const e = this.adjE[k];
      const other = this.ea[e] === i ? this.eb[e] : this.ea[e];
      const next = level * 0.55;
      if (this.act[other] < next) this.act[other] = next;
      if (depth > 1) this.excite(other, depth - 2, next);
    }
  }

  // --- impulsos -------------------------------------------------------------

  private spawn(edge: number, dir: 1 | -1, cluster: number): void {
    const pool = this.imE.length;
    for (let tries = 0; tries < pool; tries++) {
      const p = this.imCursor;
      this.imCursor = (this.imCursor + 1) % pool;
      if (this.imE[p] === -1) {
        this.imE[p] = edge;
        this.imT[p] = 0;
        this.imDir[p] = dir;
        this.imSpd[p] = 1.5 + Math.random() * 1.7;
        this.imC[p] = cluster;
        this.imLive++;
        return;
      }
    }
  }

  /** Dispara `count` impulsos saindo de um neurônio. */
  private fireFrom(i: number, count: number, exclude = -1): void {
    const from = this.adjOff[i];
    const to = this.adjOff[i + 1];
    const deg = to - from;
    if (deg === 0) return;
    for (let k = 0; k < count; k++) {
      const e = this.adjE[from + ((Math.random() * deg) | 0)];
      if (e === exclude) continue;
      this.spawn(e, this.ea[e] === i ? 1 : -1, this.cluster[i]);
    }
  }

  private stepImpulses(dt: number): void {
    const pool = this.imE.length;
    for (let p = 0; p < pool; p++) {
      const e = this.imE[p];
      if (e === -1) continue;
      this.imT[p] += this.imSpd[p] * dt;
      if (this.imT[p] < 1) continue;

      // chegou: acende o destino e, com sorte, continua a cascata
      const target = this.imDir[p] === 1 ? this.eb[e] : this.ea[e];
      this.imE[p] = -1;
      this.imLive--;
      this.act[target] = 1;
      const r = Math.random();
      if (r < 0.52) this.fireFrom(target, 1, e);
      else if (r < 0.62) this.fireFrom(target, 2, e);
    }
  }

  // --- abertura: a rede acordando ------------------------------------------

  wake(): void {
    if (this.introRunning || this.intro >= 1) return;
    this.introRunning = true;
    this.intro = 0;
    this.wakeClock = 0;
    this.wakeQueue = [];
    // um foco por cluster, em sequência, mais alguns aleatórios
    for (let c = 0; c < REGION_COUNT; c++) {
      for (let i = 0; i < this.n; i++) {
        if (this.cluster[i] === c) {
          this.wakeQueue.push(i);
          break;
        }
      }
    }
    for (let k = 0; k < 6; k++) this.wakeQueue.push((Math.random() * this.n) | 0);
  }

  private stepWake(dt: number): void {
    if (!this.introRunning) return;
    this.wakeClock += dt;
    this.intro = Math.min(1, this.wakeClock / 1.15);
    const due = Math.floor(this.wakeClock / 0.11);
    while (this.wakeQueue.length && this.wakeQueue.length > Math.max(0, 10 - due)) {
      const i = this.wakeQueue.shift()!;
      this.excite(i, 2);
      this.fireFrom(i, 3);
    }
    if (this.intro >= 1) this.introRunning = false;
  }

  /** Onde cada rótulo se conecta, em px de CSS relativos ao canvas. */
  setAnchors(anchors: { region: number; x: number; y: number }[]): void {
    this.anchors = anchors;
  }

  /** Região em destaque: a do cursor, ou a forçada de fora. */
  private get activeRegion(): number {
    if (this.forceCluster >= 0) return this.forceCluster;
    return this.hoverIdx >= 0 ? this.cluster[this.hoverIdx] : -1;
  }

  // --- projeção + render ----------------------------------------------------

  private project(dt: number): void {
    const ease = dt > 0 ? 1 - Math.exp(-dt * 4.5) : 1;
    this.nudgeYaw += (this.tgtYaw - this.nudgeYaw) * ease;
    this.nudgePitch += (this.tgtPitch - this.nudgePitch) * ease;

    const a = this.yaw + this.nudgeYaw;
    const t = TILT + this.nudgePitch;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const ct = Math.cos(t);
    const st = Math.sin(t);
    const cx = this.w / 2;
    const cy = this.h * 0.46;
    const R = this.radius;
    const decay = dt > 0 ? Math.exp(-dt / ACT_TAU) : 1;

    this.bucket.fill(0);
    this.cenX.fill(0); this.cenY.fill(0); this.cenW.fill(0);
    for (let i = 0; i < this.n; i++) {
      const x = this.px[i];
      const y = this.py[i];
      const z = this.pz[i];
      const rx = x * ca + z * sa;
      let rz = z * ca - x * sa;
      const ry = y * ct - rz * st;
      rz = y * st + rz * ct;
      const s = CAM / (CAM - rz);
      this.sx[i] = cx + rx * s * R;
      this.sy[i] = cy - ry * s * R;
      this.ss[i] = s;

      // A normal passa pela mesma rotação. `fz` é o quanto ela aponta para a
      // câmera: ~1 de frente, 0 na silhueta, negativo de costas. Acender a
      // borda e apagar a face de trás é o que faz a nuvem virar sólido —
      // sem isso as duas superfícies se somam e a silhueta some.
      const mx = this.nx[i], my = this.ny[i], mz = this.nz[i];
      const mrz0 = mz * ca - mx * sa;
      const fz = my * st + mrz0 * ct;
      const rim = 1 - Math.abs(fz);
      this.shade[i] = fz > 0 ? 0.46 + 0.54 * rim * rim : 0.09 + 0.16 * rim;

      // Centroide da região, ponderado pelo quanto o ponto está visível. Sem o
      // peso, a marca da linha-guia cairia no meio geométrico e ficaria atrás
      // do cérebro; com ele, ela gruda na face que o usuário está vendo.
      if (fz > 0) {
        const r = this.cluster[i];
        const wgt = fz * s;
        this.cenX[r] += this.sx[i] * wgt;
        this.cenY[r] += this.sy[i] * wgt;
        this.cenW[r] += wgt;
      }
      this.act[i] *= decay;
      // histograma do counting sort (128 faixas de profundidade)
      const b = ((s - S_MIN) / (S_MAX - S_MIN)) * 127;
      this.bucket[(b < 0 ? 0 : b > 127 ? 127 : b | 0) + 1]++;
    }

    // mantém o neurônio sob o cursor aceso
    if (this.hoverIdx >= 0 && this.act[this.hoverIdx] < 0.85) this.act[this.hoverIdx] = 0.85;
    // ...e a região inteira, quando o realce vem de fora do canvas
    if (this.forceCluster >= 0) {
      for (let i = 0; i < this.n; i++) {
        if (this.cluster[i] === this.forceCluster && this.act[i] < 0.42) this.act[i] = 0.42;
      }
    }

    for (let b = 0; b < 128; b++) this.bucket[b + 1] += this.bucket[b];
    for (let i = 0; i < this.n; i++) {
      const b = ((this.ss[i] - S_MIN) / (S_MAX - S_MIN)) * 127;
      this.order[this.bucket[b < 0 ? 0 : b > 127 ? 127 : b | 0]++] = i;
    }
  }

  private drawEdges(): void {
    const ctx = this.ctx;
    const m = this.m;
    const span = S_MAX - S_MIN;

    this.lvlOff.fill(0);
    for (let e = 0; e < m; e++) {
      const a = this.ea[e];
      const b = this.eb[e];
      const dn = ((this.ss[a] + this.ss[b]) / 2 - S_MIN) / span;
      const hot = this.act[a] > this.act[b] ? this.act[a] : this.act[b];
      const sh = (this.shade[a] + this.shade[b]) * 0.5;
      let v = (0.2 + 0.66 * dn * dn) * sh + hot * 0.66 + this.flash * 0.4 * sh;
      if (v > 1) v = 1;
      const l = (v * (EDGE_LEVELS - 1) + 0.5) | 0;
      this.edgeLvl[e] = l;
      this.lvlOff[l + 1]++;
    }
    for (let l = 0; l < EDGE_LEVELS; l++) this.lvlOff[l + 1] += this.lvlOff[l];
    const cursor = this.lvlOff.slice(0, EDGE_LEVELS);
    for (let e = 0; e < m; e++) this.lvlIdx[cursor[this.edgeLvl[e]]++] = e;

    const [r, g, b] = this.cInk;
    ctx.lineWidth = 1;
    for (let l = 0; l < EDGE_LEVELS; l++) {
      const start = this.lvlOff[l];
      const end = this.lvlOff[l + 1];
      if (start === end) continue;
      const alpha = (0.03 + (l / (EDGE_LEVELS - 1)) * 0.34) * this.intro * this.gain;
      if (alpha < 0.038) continue; // faixa mais funda não paga o custo
      ctx.strokeStyle = `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
      ctx.beginPath();
      for (let k = start; k < end; k++) {
        const e = this.lvlIdx[k];
        const i = this.ea[e];
        const j = this.eb[e];
        ctx.moveTo(this.sx[i], this.sy[i]);
        ctx.lineTo(this.sx[j], this.sy[j]);
      }
      ctx.stroke();
    }
  }

  private drawNodes(): void {
    const ctx = this.ctx;
    const span = S_MAX - S_MIN;
    for (let k = 0; k < this.n; k++) {
      const i = this.order[k];
      const dn = (this.ss[i] - S_MIN) / span;
      const a = this.act[i];
      const c = this.cluster[i];
      const sh = this.shade[i];
      const base = (0.85 + dn * dn * 2.0) * (1 + a * 1.05) * (0.6 + sh * 0.7);
      const alpha =
        ((0.26 + dn * dn * 0.62) * sh + a * 0.55 + this.flash * 0.4 * sh) * this.intro * this.gain;
      if (alpha <= 0.055) continue; // face de trás quase invisível não paga drawImage
      ctx.globalAlpha = alpha > 1 ? 1 : alpha;
      const d = base * 3.2;
      ctx.drawImage(this.dots[c], this.sx[i] - d / 2, this.sy[i] - d / 2, d, d);
      if (a > 0.12) {
        const gd = d * (2.1 + a * 1.6);
        ctx.globalAlpha = a * 0.5 * this.intro;
        ctx.drawImage(this.glows[c], this.sx[i] - gd / 2, this.sy[i] - gd / 2, gd, gd);
      }
    }
    ctx.globalAlpha = 1;
  }

  private drawImpulses(): void {
    const ctx = this.ctx;
    const span = S_MAX - S_MIN;
    const pool = this.imE.length;
    for (let p = 0; p < pool; p++) {
      const e = this.imE[p];
      if (e === -1) continue;
      const i = this.ea[e];
      const j = this.eb[e];
      const u = this.imDir[p] === 1 ? this.imT[p] : 1 - this.imT[p];
      const x = this.sx[i] + (this.sx[j] - this.sx[i]) * u;
      const y = this.sy[i] + (this.sy[j] - this.sy[i]) * u;
      const dn = ((this.ss[i] + this.ss[j]) / 2 - S_MIN) / span;
      // some nas pontas: o impulso nasce e morre sem piscar
      const fade = Math.sin(Math.PI * Math.min(1, this.imT[p]));
      const d = (3.4 + dn * 4.6) * (0.6 + fade * 0.4);
      ctx.globalAlpha = Math.min(1, (0.25 + dn * 0.6) * fade * this.intro * this.gain);
      ctx.drawImage(this.pulses[this.imC[p]], x - d / 2, y - d / 2, d, d);
    }
    ctx.globalAlpha = 1;
  }

  /**
   * Linhas-guia dos rótulos: diagrama anatômico, mas vivo — a ponta segue o
   * centroide visível da região enquanto o cérebro oscila.
   */
  private drawLeaders(): void {
    if (!this.anchors.length) return;
    const ctx = this.ctx;
    const active = this.activeRegion;
    ctx.lineWidth = 1;
    if (active < 0) return; // só a região em destaque ganha fio
    for (const a of this.anchors) {
      if (a.region !== active) continue;
      const w = this.cenW[a.region];
      if (w <= 0) continue;
      const tx = this.cenX[a.region] / w;
      const ty = this.cenY[a.region] / w;
      const on = true;
      const [r, g, b] = this.cNode[a.region] ?? [120, 140, 200];
      const alpha = (on ? 0.85 : 0.26) * this.intro;

      ctx.strokeStyle = `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
      ctx.beginPath();
      // cotovelo: sai reto do rótulo e só então vira para o cérebro
      const mx = a.x + (tx - a.x) * 0.38;
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(mx, a.y);
      ctx.lineTo(tx, ty);
      ctx.stroke();

      ctx.fillStyle = `rgba(${r},${g},${b},${(alpha * 1.1).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(tx, ty, on ? 3.4 : 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private paint(dt: number): void {
    this.ctx.clearRect(0, 0, this.w, this.h);
    this.project(dt);
    this.drawEdges();
    this.drawNodes();
    this.drawImpulses();
    this.drawLeaders();
  }

  // --- loop -----------------------------------------------------------------

  private tick = (now: number): void => {
    if (!this.running) return;
    const dt = this.lastT ? Math.min(0.05, (now - this.lastT) / 1000) : 0.016;
    this.lastT = now;

    this.clock += dt;
    this.yaw = YAW_LATERAL + OSC_AMP * Math.sin(this.clock * OSC_SPEED);
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt / FLASH_TAU);
    this.stepWake(dt);

    // fagulhas espontâneas: a rede nunca fica parada
    const rate = this.quality === "high" ? 7 : 4;
    this.sparkClock += dt;
    while (this.sparkClock > 1 / rate) {
      this.sparkClock -= 1 / rate;
      const i = (Math.random() * this.n) | 0;
      this.act[i] = 1;
      this.fireFrom(i, 1);
    }
    // enquanto o cursor fica parado sobre uma região, ela continua viva
    if (this.hoverIdx >= 0) {
      this.hoverClock += dt;
      if (this.hoverClock > 0.18) {
        this.hoverClock = 0;
        this.fireFrom(this.hoverIdx, 1);
      }
    }

    this.stepImpulses(dt);
    this.paint(dt);

    if (this.onFps) {
      const fps = 1 / Math.max(dt, 0.0001);
      this.fpsEma = this.fpsEma ? this.fpsEma * 0.9 + fps * 0.1 : fps;
      this.fpsClock += dt;
      if (this.fpsClock > 0.4) {
        this.fpsClock = 0;
        this.onFps(Math.round(this.fpsEma));
      }
    }

    this.raf = requestAnimationFrame(this.tick);
  };

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastT = 0;
    if (this.intro < 1 && !this.introRunning) this.wake();
    this.raf = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  /**
   * Redesenha um frame agora, sem mexer no estado.
   *
   * Serve à troca de tema: a View Transition fotografa a página logo depois da
   * mudança de classe, e o canvas só repintaria no próximo quadro. Sem isto a
   * foto do "depois" sairia com as cores antigas e o cérebro pularia de cor no
   * fim da animação.
   */
  repaint(): void {
    this.paint(0);
  }

  /** Um frame só, sem movimento. É o que `prefers-reduced-motion` recebe. */
  renderStatic(): void {
    this.intro = 1;
    this.yaw = YAW_LATERAL + 0.22;
    this.nudgeYaw = 0;
    this.nudgePitch = 0;
    this.act.fill(0);
    for (let k = 0; k < 90; k++) this.act[(Math.random() * this.n) | 0] = 0.75;
    this.paint(0);
  }

  get counts() {
    return { n: this.n, m: this.m, impulses: this.imLive };
  }

  dispose(): void {
    this.stop();
    this.onHoverCluster = null;
    this.onFps = null;
  }
}
