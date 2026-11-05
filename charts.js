// Small SVG charts. Colors come from the CSS tokens, so the two arms keep
// one color each everywhere.

export const fmt = (v, d = 3) => (v == null || Number.isNaN(v)) ? "â€“" : Number(v).toFixed(d);
const NS = "http://www.w3.org/2000/svg";
const TONE = { gin: "var(--gin)", plain: "var(--plain)", muted: "var(--ink-3)" };

function svg(w, h) {
  const s = document.createElementNS(NS, "svg");
  s.setAttribute("viewBox", `0 0 ${w} ${h}`);
  s.setAttribute("role", "img");
  return s;
}
function el(tag, attrs = {}, text) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (text != null) e.textContent = text;
  return e;
}

let tipEl = null;
function tip(evt, html) {
  if (!tipEl) { tipEl = document.createElement("div"); tipEl.className = "tip"; document.body.appendChild(tipEl); }
  if (!html) { tipEl.classList.remove("on"); return; }
  tipEl.innerHTML = html;
  tipEl.style.left = `${evt.clientX + 14}px`;
  tipEl.style.top = `${evt.clientY + 12}px`;
  tipEl.classList.add("on");
}
function hover(node, html) {
  node.addEventListener("mousemove", e => tip(e, html));
  node.addEventListener("mouseleave", e => tip(e, null));
}

function xAxis(g, x, y0, y1, ticks) {
  for (const t of ticks) {
    g.appendChild(el("line", { x1: x(t), x2: x(t), y1: y0, y2: y1, stroke: "var(--line)", "stroke-width": 1 }));
    g.appendChild(el("text", { x: x(t), y: y1 + 18, "text-anchor": "middle", fill: "var(--ink-3)", "font-size": 12 }, t.toFixed(1)));
  }
}

// rows: [{label, sub, pts: [{v, label}], tone}], ref: {value, label} | null
export function stripChart(host, rows, ref) {
  const W = Math.max(560, host.clientWidth || 820), L = Math.min(236, W * 0.3), R = 70, rowH = 52, top = 14;
  const H = top + rows.length * rowH + 34;
  const x = v => L + (W - L - R) * Math.max(0, Math.min(1, v));
  const s = svg(W, H);
  const g = el("g");
  s.appendChild(g);
  xAxis(g, x, top - 6, top + rows.length * rowH, [0, 0.2, 0.4, 0.6, 0.8, 1.0]);
  g.appendChild(el("text", { x: L, y: H - 2, fill: "var(--ink-3)", "font-size": 12 }, "Dice, mean over organs 1 to 13"));
  rows.forEach((r, i) => {
    const cy = top + i * rowH + rowH / 2;
    const col = TONE[r.tone];
    g.appendChild(el("text", { x: 0, y: cy - 2, fill: r.tone === "muted" ? "var(--ink-2)" : "var(--ink)", "font-size": 14, "font-weight": r.tone === "muted" ? 400 : 600 }, r.label));
    g.appendChild(el("text", { x: 0, y: cy + 15, fill: "var(--ink-3)", "font-size": 12 }, r.sub));
    const vals = r.pts.map(p => p.v);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    g.appendChild(el("rect", { x: x(0), y: cy - 9, width: Math.max(1, x(mean) - x(0)), height: 18, rx: 3, fill: col, opacity: r.tone === "muted" ? 0.28 : 0.30 }));
    g.appendChild(el("line", { x1: x(mean), x2: x(mean), y1: cy - 13, y2: cy + 13, stroke: col, "stroke-width": 2.5 }));
    r.pts.forEach((p, k) => {
      const dot = el("circle", { cx: x(p.v), cy: cy + (k - (r.pts.length - 1) / 2) * 3, r: 5.5, fill: col, stroke: "var(--surface)", "stroke-width": 1.5 });
      hover(dot, `${p.label}: <b>${fmt(p.v, 4)}</b>`);
      g.appendChild(dot);
    });
    g.appendChild(el("text", { x: Math.max(...vals.map(x)) + 12, y: cy + 5, fill: r.tone === "muted" ? "var(--ink-2)" : col, "font-size": 14, "font-weight": 600 }, fmt(mean, 3)));
  });
  if (ref) {
    const rx = x(ref.value);
    g.appendChild(el("line", { x1: rx, x2: rx, y1: top - 8, y2: top + rows.length * rowH, stroke: "var(--ref)", "stroke-width": 1.5, "stroke-dasharray": "5 4" }));
    g.appendChild(el("text", { x: rx - 6, y: top + 4, "text-anchor": "end", fill: "var(--ref)", "font-size": 12 }, `${ref.label} ${fmt(ref.value, 3)}`));
  }
  host.replaceChildren(s);
}

// rows: [{label, a (plain), b (gin)}]
export function dumbbell(host, rows) {
  const W = Math.max(360, host.clientWidth || 560), L = 150, R = 54, rowH = 27, top = 8;
  const H = top + rows.length * rowH + 30;
  const x = v => L + (W - L - R) * Math.max(0, Math.min(1, v));
  const s = svg(W, H);
  const g = el("g");
  s.appendChild(g);
  xAxis(g, x, top - 4, top + rows.length * rowH, [0, 0.2, 0.4, 0.6, 0.8, 1.0]);
  rows.forEach((r, i) => {
    const cy = top + i * rowH + rowH / 2;
    g.appendChild(el("text", { x: 0, y: cy + 4.5, fill: "var(--ink-2)", "font-size": 13 }, r.label));
    g.appendChild(el("line", { x1: x(r.a), x2: x(r.b), y1: cy, y2: cy, stroke: "var(--line-2)", "stroke-width": 3, "stroke-linecap": "round" }));
    const a = el("circle", { cx: x(r.a), cy, r: 5, fill: "var(--plain)" });
    const b = el("circle", { cx: x(r.b), cy, r: 6, fill: "var(--gin)" });
    hover(a, `${r.label}, plain: <b>${fmt(r.a, 3)}</b>`);
    hover(b, `${r.label}, GIN: <b>${fmt(r.b, 3)}</b>`);
    g.append(a, b);
    g.appendChild(el("text", { x: W - R + 10, y: cy + 4.5, fill: "var(--gin)", "font-size": 13, "font-weight": 600 }, fmt(r.b, 2)));
  });
  host.replaceChildren(s);
}

// runs: [{run, arm, pair, ct, sessions: [{time, before, after, minutes}]}]
export function timelineChart(host, runs) {
  const parse = t => new Date(t.replace(" ", "T") + "Z").getTime();
  const spans = runs.flatMap(r => r.sessions.map(s => [parse(s.time) - (s.minutes || 0) * 60000, parse(s.time)]));
  const t0 = Math.min(...spans.map(s => s[0])), t1 = Math.max(...spans.map(s => s[1]));
  const day0 = new Date(t0); day0.setUTCHours(0, 0, 0, 0);
  const W = Math.max(640, host.clientWidth || 920), L = 150, R = 80, rowH = 38, top = 30;
  const H = top + runs.length * rowH + 14;
  const x = t => L + (W - L - R) * (t - day0.getTime()) / (t1 - day0.getTime());
  const s = svg(W, H);
  const g = el("g");
  s.appendChild(g);
  for (let d = day0.getTime(); d <= t1; d += 86400000) {
    g.appendChild(el("line", { x1: x(d), x2: x(d), y1: top - 8, y2: H - 10, stroke: "var(--line)" }));
    const dt = new Date(d);
    g.appendChild(el("text", { x: x(d) + 4, y: top - 14, fill: "var(--ink-3)", "font-size": 12 }, dt.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })));
  }
  runs.sort((a, b) => a.pair - b.pair || (a.arm > b.arm ? -1 : 1)).forEach((r, i) => {
    const cy = top + i * rowH + rowH / 2;
    const col = r.arm === "gin600" ? "var(--gin)" : "var(--plain)";
    g.appendChild(el("text", { x: 0, y: cy + 5, fill: "var(--ink)", "font-size": 13, "font-family": "var(--f-mono)" }, r.run));
    r.sessions.forEach(ss => {
      const e = parse(ss.time), b = e - (ss.minutes || 0) * 60000;
      const rect = el("rect", { x: x(b), y: cy - 10, width: Math.max(3, x(e) - x(b)), height: 20, rx: 3, fill: col, opacity: 0.85 });
      hover(rect, `${r.run}: epochs ${ss.before} to ${ss.after}<br>${fmt((ss.minutes || 0) / 60, 1)} h on a ${ss.gpu || "T4"}, ended ${ss.time} UTC`);
      g.appendChild(rect);
      if (x(e) - x(b) > 26) g.appendChild(el("text", { x: x(e) - 4, y: cy + 4.5, "text-anchor": "end", fill: "oklch(0.18 0.02 250)", "font-size": 11, "font-weight": 600 }, ss.after));
    });
    g.appendChild(el("text", { x: W - R + 12, y: cy + 5, fill: col, "font-size": 13, "font-weight": 600 }, r.ct != null ? fmt(r.ct, 4) : ""));
  });
  g.appendChild(el("text", { x: W - R + 12, y: top - 14, fill: "var(--ink-3)", "font-size": 12 }, "CT Dice"));
  host.replaceChildren(s);
}
