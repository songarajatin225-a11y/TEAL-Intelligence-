/*
 * PROCESS PATHS (3D master prompt §24, §26). SYMBOLIC scan / weld / cut paths drawn inside the
 * configured process area so the 3D view can show where and how the beam moves. They are not the
 * customer's job file, and their length is not used for the cycle time — the canonical laser time
 * comes from the station's process inputs (services/sim/model.laserTime).
 */

export type ProcessKind = 'marking' | 'welding' | 'cutting' | 'cleaning' | 'drilling' | 'scribing';

export interface ScanPath {
  kind: ProcessKind;
  /** polylines in part coordinates (mm, centred on the process-area centre, x along length, y along width) */
  strokes: [number, number][][];
  length: number;
  note: string;
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 1000) / 1000;
  };
}

const len = (p: [number, number][]) => p.reduce((n, q, i) => (i ? n + Math.hypot(q[0] - p[i - 1][0], q[1] - p[i - 1][1]) : 0), 0);

export function scanPath(kind: ProcessKind, ax: number, ay: number, seed = 'teal'): ScanPath {
  const strokes: [number, number][][] = [];
  if (kind === 'marking') {
    // a 2D-code-like module grid (symbolic) filled with hatch lines, plus a text line
    const side = Math.min(ay, ax / 2);
    const n = 14;
    const cell = side / n;
    const r = hash(seed);
    const x0 = -ax / 2 + cell;
    const y0 = -side / 2;
    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        const finder = col === 0 || row === n - 1 || (row === 0 && col % 2 === 0) || (col === n - 1 && row % 2 === 1);
        if (!finder && r() < 0.5) continue;
        const cx = x0 + col * cell;
        const cy = y0 + row * cell;
        for (let k = 0; k < 3; k++) strokes.push([[cx, cy + ((k + 0.5) * cell) / 3], [cx + cell * 0.95, cy + ((k + 0.5) * cell) / 3]]);
      }
    }
    // text line: short strokes to the right of the code
    const tx = x0 + side + cell * 2;
    for (let ch = 0; ch < 6; ch++) {
      const cx = tx + ch * cell * 2.4;
      if (cx + cell * 2 > ax / 2) break;
      strokes.push([[cx, -cell * 2], [cx, cell * 2], [cx + cell * 1.6, cell * 2], [cx + cell * 1.6, 0], [cx, 0]]);
    }
  } else if (kind === 'welding') {
    const n = Math.max(2, Math.round(ax / 30));
    for (let i = 0; i < n; i++) {
      const x = -ax / 2 + ((i + 0.5) * ax) / n;
      const seam: [number, number][] = [];
      for (let k = 0; k <= 24; k++) seam.push([x + Math.sin(k * 1.3) * 1.2, -ay / 2 + (k * ay) / 24]);
      strokes.push(seam);
    }
  } else if (kind === 'cutting') {
    const r = Math.min(ax, ay) * 0.12;
    const p: [number, number][] = [];
    const cs: [number, number, number][] = [
      [ax / 2 - r, ay / 2 - r, 0],
      [-ax / 2 + r, ay / 2 - r, Math.PI / 2],
      [-ax / 2 + r, -ay / 2 + r, Math.PI],
      [ax / 2 - r, -ay / 2 + r, (3 * Math.PI) / 2],
    ];
    for (const [cx, cy, a0] of cs) for (let k = 0; k <= 6; k++) p.push([cx + r * Math.cos(a0 + (k * Math.PI) / 12), cy + r * Math.sin(a0 + (k * Math.PI) / 12)]);
    p.push(p[0]);
    strokes.push(p);
  } else if (kind === 'cleaning') {
    const lines = 16;
    for (let i = 0; i <= lines; i++) {
      const y = -ay / 2 + (i * ay) / lines;
      strokes.push(i % 2 ? [[ax / 2, y], [-ax / 2, y]] : [[-ax / 2, y], [ax / 2, y]]);
    }
  } else if (kind === 'drilling') {
    const nx = 8;
    const ny = 4;
    for (let i = 0; i < nx; i++)
      for (let j = 0; j < ny; j++) {
        const x = -ax / 2 + ((i + 0.5) * ax) / nx;
        const y = -ay / 2 + ((j + 0.5) * ay) / ny;
        strokes.push([[x - 0.4, y], [x + 0.4, y]]);
      }
  } else {
    const n = 5;
    for (let i = 0; i < n; i++) {
      const y = -ay / 2 + ((i + 0.5) * ay) / n;
      strokes.push([[-ax / 2, y], [ax / 2, y]]);
    }
  }
  return { kind, strokes, length: strokes.reduce((n, s) => n + len(s), 0), note: 'Symbolic path inside the process area — not the production job file; cycle time uses the station process inputs.' };
}

/** Point along the path at progress u (0–1) by stroke length; `on` = beam firing (false while jumping). */
export function pointAt(path: ScanPath, u: number): { p: [number, number]; on: boolean; done: number } {
  const target = Math.max(0, Math.min(1, u)) * path.length;
  let acc = 0;
  for (let s = 0; s < path.strokes.length; s++) {
    const st = path.strokes[s];
    for (let i = 1; i < st.length; i++) {
      const a = st[i - 1];
      const b = st[i];
      const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (acc + d >= target) {
        const k = d ? (target - acc) / d : 0;
        return { p: [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k], on: true, done: s };
      }
      acc += d;
    }
  }
  const last = path.strokes[path.strokes.length - 1];
  return { p: last ? last[last.length - 1] : [0, 0], on: false, done: path.strokes.length };
}
