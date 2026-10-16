/**
 * Gera a geometria do cérebro do hero da v2 → public/lab/brain.json
 *
 * POR QUE NÃO METABALLS
 * A primeira versão somava bolhas por lobo. Bolha somada dá batata: não produz
 * polo frontal, chanfro de Sylvius, lobo temporal projetado nem polo occipital.
 * E como a nuvem é transparente, a superfície de trás se soma à da frente até a
 * silhueta sumir — e silhueta é exatamente o que o olho usa para reconhecer um
 * cérebro.
 *
 * O QUE ESTA VERSÃO FAZ
 *  1. O contorno lateral é desenhado à mão, ponto a ponto, a partir da vista
 *     lateral clássica: polo frontal, vértice, polo occipital, borda inferior,
 *     chanfro onde a fissura de Sylvius abre, e o polo temporal projetado.
 *  2. Esse contorno é varrido no eixo esquerda-direita, encolhendo em direção
 *     ao centroide por uma superelipse — dá os flancos chatos do cérebro real,
 *     em vez das pontas de um elipsoide.
 *  3. Cada ponto carrega a NORMAL da superfície. É ela que permite ao motor
 *     acender a borda e apagar a face de trás, o truque que faz uma nuvem
 *     transparente parecer sólida.
 *  4. Sulcos: Sylvius e central como curvas explícitas na face lateral, os
 *     secundários como faixas estreitas de ruído enrugado. Sulco é AUSÊNCIA de
 *     ponto — o vazio desenha o vinco melhor que qualquer sombreamento.
 *  5. Cerebelo e tronco são estruturas próprias, com textura própria.
 *
 * Uso: node scripts/gen-brain.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const OUT = resolve(process.cwd(), "public/lab/brain.json");

const N_CEREBRUM = 2050;
const N_CEREBELLUM = 330;
const N_STEM = 130;
const K_NEIGHBORS = 2;
const EDGE_CAP = 2.1;

// ---------------------------------------------------------------------------
// utilidades
// ---------------------------------------------------------------------------
let seed = 20261013;
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

const smooth = (e0, e1, x) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

function hash3(x, y, z) {
  let h = (x * 374761393 + y * 668265263 + z * 1442695040) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function vnoise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const L = (a, b, t) => a + (b - a) * t;
  const c = (i, j, k) => hash3(xi + i, yi + j, zi + k);
  return L(
    L(L(c(0, 0, 0), c(1, 0, 0), u), L(c(0, 1, 0), c(1, 1, 0), u), v),
    L(L(c(0, 0, 1), c(1, 0, 1), u), L(c(0, 1, 1), c(1, 1, 1), u), v),
    w,
  );
}

/**
 * Faixas estreitas: o vinco acontece onde o ruído cruza o meio. Alongado em z
 * porque os giros reais correm no eixo frente-trás (os temporais são faixas
 * longas). Somar oitavas aqui borra as faixas e o córtex vira confete.
 */
function gyralBand(x, y, z) {
  const n = vnoise(x * 7.4 + 11.3, y * 6.6 + 5.1, z * 3.6 + 23.7);
  return 1 - Math.abs(2 * n - 1);
}

// ---------------------------------------------------------------------------
// 1. contorno lateral do cérebro, desenhado à mão — (z, y)
//    z: +1 = frente (polo frontal) · y: +1 = topo
// ---------------------------------------------------------------------------
const OUTLINE = [
  // convexidade superior, da frente para trás
  [1.0, 0.08], [0.98, 0.25], [0.9, 0.42], [0.76, 0.55], [0.58, 0.64],
  [0.36, 0.69], [0.12, 0.7], [-0.12, 0.68], [-0.35, 0.62], [-0.56, 0.52],
  [-0.74, 0.37], [-0.88, 0.19],
  // polo occipital
  [-0.96, 0.01], [-0.98, -0.15], [-0.92, -0.29],
  // borda inferior, de trás para a frente (sob ela mora o cerebelo)
  [-0.82, -0.38], [-0.68, -0.45], [-0.5, -0.5], [-0.3, -0.54],
  [-0.1, -0.56], [0.1, -0.56], [0.28, -0.53], [0.43, -0.47],
  // polo temporal, projetado para a frente e para baixo
  [0.54, -0.38], [0.59, -0.28],
  // chanfro: aqui a fissura de Sylvius abre na silhueta
  [0.56, -0.19], [0.65, -0.22],
  // superfície orbital do frontal, voltando ao polo
  [0.78, -0.27], [0.89, -0.22], [0.97, -0.08],
];

// contorno do cerebelo, em coordenadas próprias
const CEREBELLUM_OUTLINE = [
  [0.46, 0.1], [0.34, 0.3], [0.12, 0.4], [-0.12, 0.36], [-0.34, 0.22],
  [-0.48, 0.02], [-0.5, -0.18], [-0.38, -0.34], [-0.16, -0.42],
  [0.1, -0.4], [0.32, -0.28], [0.45, -0.1],
];
const CB_ORIGIN = [-0.64, -0.52]; // (z, y) do centro do cerebelo
const CB_SCALE = [0.5, 0.46];
const CB_WIDTH = 0.52;

const CEREBRUM_WIDTH = 0.78; // meia-largura máxima
const SUPER = 2.7; // expoente da superelipse: flanco chato, não pontudo

// ---------------------------------------------------------------------------
// contorno → curva suave reamostrada por comprimento de arco
// ---------------------------------------------------------------------------
function catmullRom(p0, p1, p2, p3, t) {
  const t2 = t * t, t3 = t2 * t;
  return [0, 1].map(
    (k) =>
      0.5 *
      (2 * p1[k] +
        (-p0[k] + p2[k]) * t +
        (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 +
        (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3),
  );
}

function resample(points, count) {
  const n = points.length;
  const dense = [];
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n], p1 = points[i];
    const p2 = points[(i + 1) % n], p3 = points[(i + 2) % n];
    for (let s = 0; s < 24; s++) dense.push(catmullRom(p0, p1, p2, p3, s / 24));
  }
  const cum = [0];
  for (let i = 1; i <= dense.length; i++) {
    const a = dense[i - 1], b = dense[i % dense.length];
    cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  const total = cum[dense.length];
  const out = [];
  let j = 0;
  for (let i = 0; i < count; i++) {
    const target = (i / count) * total;
    while (j < dense.length - 1 && cum[j + 1] < target) j++;
    const seg = cum[j + 1] - cum[j] || 1;
    const t = (target - cum[j]) / seg;
    const a = dense[j], b = dense[(j + 1) % dense.length];
    out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  return out;
}

const RING = 600;
const cerebrumRing = resample(OUTLINE, RING);
const cerebellumRing = resample(CEREBELLUM_OUTLINE, RING);

function centroidOf(ring) {
  let z = 0, y = 0;
  for (const p of ring) { z += p[0]; y += p[1]; }
  return [z / ring.length, y / ring.length];
}
const C_CEREBRUM = centroidOf(cerebrumRing);
const C_CEREBELLUM = centroidOf(cerebellumRing);

/** Ponto do anel por parâmetro contínuo u ∈ [0,1). */
function ringAt(ring, u) {
  const f = ((((u % 1) + 1) % 1) * ring.length);
  const i = Math.floor(f), t = f - i;
  const a = ring[i % ring.length], b = ring[(i + 1) % ring.length];
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

/**
 * Superfície varrida: o contorno encolhe em direção ao centroide conforme se
 * afasta do plano médio. A superelipse (expoente > 2) é o que dá o flanco
 * achatado — com expoente 2 sairia um elipsoide de laterais pontudas.
 */
function makeSurface(ring, centroid, width, originZ = 0, originY = 0, scaleZ = 1, scaleY = 1) {
  return (u, v) => {
    const s = Math.pow(Math.max(0, 1 - Math.pow(Math.abs(v), SUPER)), 1 / SUPER);
    const p = ringAt(ring, u);
    const z = centroid[0] + (p[0] - centroid[0]) * s;
    const y = centroid[1] + (p[1] - centroid[1]) * s;
    return [width * v, originY + y * scaleY, originZ + z * scaleZ];
  };
}

const surfCerebrum = makeSurface(cerebrumRing, C_CEREBRUM, CEREBRUM_WIDTH);
const surfCerebellum = makeSurface(
  cerebellumRing, C_CEREBELLUM, CB_WIDTH,
  CB_ORIGIN[0], CB_ORIGIN[1], CB_SCALE[0], CB_SCALE[1],
);

/**
 * O ponto está DENTRO do sólido do cérebro?
 *
 * O cerebelo era gerado como um elipsoide fechado e completo, então a parte
 * dele que ocupa o mesmo espaço do cérebro aparecia através da malha
 * translúcida: via-se um redondo atrás do cérebro, que não existe em crânio
 * nenhum. No corpo real o cerebelo fica encaixado SOB o lobo occipital, e só
 * espia por baixo e por trás.
 *
 * O teste é exato: a fatia do cérebro naquele x é o contorno lateral reduzido
 * pela superelipse, e aí basta um ponto-em-polígono contra ela.
 */
function insideCerebrum(x, y, z) {
  const v = x / CEREBRUM_WIDTH;
  if (Math.abs(v) >= 1) return false;
  const s = Math.pow(Math.max(0, 1 - Math.pow(Math.abs(v), SUPER)), 1 / SUPER);
  if (s <= 0) return false;
  let inside = false;
  const ring = cerebrumRing;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const zi = C_CEREBRUM[0] + (ring[i][0] - C_CEREBRUM[0]) * s;
    const yi = C_CEREBRUM[1] + (ring[i][1] - C_CEREBRUM[1]) * s;
    const zj = C_CEREBRUM[0] + (ring[j][0] - C_CEREBRUM[0]) * s;
    const yj = C_CEREBRUM[1] + (ring[j][1] - C_CEREBRUM[1]) * s;
    if (yi > y !== yj > y && z < ((zj - zi) * (y - yi)) / (yj - yi) + zi) inside = !inside;
  }
  return inside;
}

/** Normal e elemento de área, por diferenças finitas na parametrização. */
function differentials(surf, u, v) {
  const e = 0.0015;
  const P = surf(u, v);
  const Pu = surf(u + e, v);
  const Pv = surf(u, v + (v > 0.995 ? -e : e));
  const du = [Pu[0] - P[0], Pu[1] - P[1], Pu[2] - P[2]];
  const dv = [Pv[0] - P[0], Pv[1] - P[1], Pv[2] - P[2]];
  let nx = du[1] * dv[2] - du[2] * dv[1];
  let ny = du[2] * dv[0] - du[0] * dv[2];
  let nz = du[0] * dv[1] - du[1] * dv[0];
  const len = Math.hypot(nx, ny, nz) || 1e-9;
  nx /= len; ny /= len; nz /= len;
  // garante que aponta para fora: compara com o vetor centro→ponto
  const ox = P[0];
  const oy = P[1] - (originYOf(surf) + C_of(surf)[1] * scaleYOf(surf));
  const oz = P[2] - (originZOf(surf) + C_of(surf)[0] * scaleZOf(surf));
  if (nx * ox + ny * oy + nz * oz < 0) { nx = -nx; ny = -ny; nz = -nz; }
  return { P, n: [nx, ny, nz], area: len };
}

// pequenos auxiliares para o teste de orientação acima
const SURF_META = new Map();
SURF_META.set(surfCerebrum, { c: C_CEREBRUM, oz: 0, oy: 0, sz: 1, sy: 1 });
SURF_META.set(surfCerebellum, {
  c: C_CEREBELLUM, oz: CB_ORIGIN[0], oy: CB_ORIGIN[1], sz: CB_SCALE[0], sy: CB_SCALE[1],
});
const C_of = (s) => SURF_META.get(s).c;
const originZOf = (s) => SURF_META.get(s).oz;
const originYOf = (s) => SURF_META.get(s).oy;
const scaleZOf = (s) => SURF_META.get(s).sz;
const scaleYOf = (s) => SURF_META.get(s).sy;

// ---------------------------------------------------------------------------
// sulcos primários, na face lateral
// ---------------------------------------------------------------------------
function sylvianDepth(x, y, z) {
  if (z < -0.45 || z > 0.62) return 0;
  const ySyl = -0.02 - 0.26 * z;
  return smooth(0.07, 0.0, Math.abs(y - ySyl)) * smooth(0.18, 0.42, Math.abs(x));
}

function centralDepth(x, y, z) {
  if (y < -0.08 || y > 0.7) return 0;
  const zC = 0.26 - 0.62 * y;
  return smooth(0.055, 0.0, Math.abs(z - zC)) * smooth(0.1, 0.38, Math.abs(x));
}

// ---------------------------------------------------------------------------
// regiões
// ---------------------------------------------------------------------------
const R_PREFRONTAL = 0, R_FRONTAL = 1, R_PARIETAL = 2, R_TEMPORAL = 3;
const R_OCCIPITAL = 4, R_CEREBELO = 5, R_TRONCO = 6;

function regionOf(x, y, z) {
  const ySyl = -0.02 - 0.26 * z;
  if (y < ySyl - 0.03 && z > -0.42 && z < 0.68) return R_TEMPORAL;
  if (z < -0.6) return R_OCCIPITAL;
  const zC = 0.26 - 0.62 * Math.max(0, y);
  if (z > zC) return z > 0.66 ? R_PREFRONTAL : R_FRONTAL;
  return R_PARIETAL;
}

// ---------------------------------------------------------------------------
// amostragem
// ---------------------------------------------------------------------------
const pts = [];
const nrm = [];
const region = [];

// sequência R2: baixa discrepância, cobre (u,v) sem aglomerar como o aleatório
const G = 1.32471795724474602596;
const A1 = 1 / G, A2 = 1 / (G * G);

function sampleStructure(surf, target, kind) {
  // maior elemento de área, para normalizar a aceitação
  let maxArea = 0;
  for (let i = 0; i < 600; i++) {
    const { area } = differentials(surf, rnd(), rnd() * 2 - 1);
    if (area > maxArea) maxArea = area;
  }

  let made = 0;
  for (let i = 1; made < target && i < target * 160; i++) {
    const u = (0.5 + A1 * i) % 1;
    const v = ((0.5 + A2 * i) % 1) * 2 - 1;

    const { P, n, area } = differentials(surf, u, v);
    // densidade uniforme na superfície: aceita proporcional ao elemento de área
    if (rnd() > area / maxArea) continue;

    let [x, y, z] = P;

    if (kind === "cerebrum") {
      const groove = smooth(0.8, 0.97, gyralBand(x, y, z));
      const primary = Math.max(sylvianDepth(x, y, z), centralDepth(x, y, z));
      if (rnd() < groove * 0.92) continue;
      if (rnd() < primary * 0.96) continue;
      if (Math.abs(x) < 0.055 && y > 0.05) continue; // fissura longitudinal
      const sink = 0.03 * groove + 0.075 * primary;
      x -= n[0] * sink; y -= n[1] * sink; z -= n[2] * sink;
    } else {
      // o que cai dentro do cérebro não existe: o cerebelo encaixa por baixo
      if (insideCerebrum(x, y, z)) continue;
      // folhas horizontais finas, a assinatura visual do cerebelo
      const folia = Math.abs(Math.sin(y * 70));
      if (rnd() > 0.2 + 0.8 * folia) continue;
      if (Math.abs(x) < 0.035) continue;
    }

    // casca com espessura: parte dos pontos recua ao longo da normal
    if (rnd() < 0.28) {
      const d = 0.03 + rnd() * 0.07;
      x -= n[0] * d; y -= n[1] * d; z -= n[2] * d;
      if (kind !== "cerebrum" && insideCerebrum(x, y, z)) continue;
    }

    pts.push([x, y, z]);
    nrm.push(n);
    region.push(kind === "cerebrum" ? regionOf(x, y, z) : R_CEREBELO);
    made++;
  }
  return made;
}

sampleStructure(surfCerebrum, N_CEREBRUM, "cerebrum");
sampleStructure(surfCerebellum, N_CEREBELLUM, "cerebellum");

// tronco encefálico: tubo afilado descendo
for (let i = 0; i < N_STEM; i++) {
  const t = i / (N_STEM - 1);
  const cy = -0.46 - t * 0.46;
  const cz = -0.26 + t * 0.1;
  const rr = 0.115 - t * 0.05;
  const a = Math.PI * 2 * ((i * A1) % 1);
  pts.push([Math.cos(a) * rr, cy + (rnd() - 0.5) * 0.015, cz + Math.sin(a) * rr * 0.85]);
  nrm.push([Math.cos(a), 0, Math.sin(a) * 0.85]);
  region.push(R_TRONCO);
}

// --- normaliza -------------------------------------------------------------
let cx = 0, cy = 0, cz = 0;
for (const p of pts) { cx += p[0]; cy += p[1]; cz += p[2]; }
cx /= pts.length; cy /= pts.length; cz /= pts.length;
let maxR = 0;
for (const p of pts) {
  p[0] -= cx; p[1] -= cy; p[2] -= cz;
  maxR = Math.max(maxR, Math.hypot(p[0], p[1], p[2]));
}
for (const p of pts) { p[0] /= maxR; p[1] /= maxR; p[2] /= maxR; }

// --- sinapses --------------------------------------------------------------
const n = pts.length;
const seen = new Set();
const edges = [];
for (let i = 0; i < n; i++) {
  const near = new Array(K_NEIGHBORS).fill(-1);
  const bd = new Array(K_NEIGHBORS).fill(Infinity);
  for (let j = 0; j < n; j++) {
    if (j === i) continue;
    const d =
      (pts[i][0] - pts[j][0]) ** 2 + (pts[i][1] - pts[j][1]) ** 2 + (pts[i][2] - pts[j][2]) ** 2;
    for (let k = 0; k < K_NEIGHBORS; k++) {
      if (d < bd[k]) { bd.splice(k, 0, d); bd.pop(); near.splice(k, 0, j); near.pop(); break; }
    }
  }
  for (const j of near) {
    if (j < 0) continue;
    const key = i < j ? i * n + j : j * n + i;
    if (seen.has(key)) continue;
    seen.add(key);
    edges.push(Math.min(i, j), Math.max(i, j));
  }
}

// Sem o corte, o kNN costura os sulcos de volta e o vinco desaparece.
const lens = [];
for (let e = 0; e < edges.length; e += 2) {
  const a = pts[edges[e]], b = pts[edges[e + 1]];
  lens.push(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]));
}
const median = [...lens].sort((p, q) => p - q)[lens.length >> 1];
const maxLen = median * EDGE_CAP;
const kept = [];
for (let e = 0; e < edges.length; e += 2) {
  if (lens[e / 2] <= maxLen) kept.push(edges[e], edges[e + 1]);
}

const r3 = (v) => Math.round(v * 1000) / 1000;
const out = {
  generated: new Date().toISOString().slice(0, 10),
  n,
  m: kept.length / 2,
  pos: pts.flat().map(r3),
  nrm: nrm.flat().map(r3),
  region,
  edges: kept,
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(out));

const names = ["pré-frontal", "frontal", "parietal", "temporal", "occipital", "cerebelo", "tronco"];
console.log(`cérebro: ${n} neurônios, ${out.m} sinapses (corte ${maxLen.toFixed(3)})`);
console.log(names.map((nm, i) => `${nm}:${region.filter((r) => r === i).length}`).join("  "));
