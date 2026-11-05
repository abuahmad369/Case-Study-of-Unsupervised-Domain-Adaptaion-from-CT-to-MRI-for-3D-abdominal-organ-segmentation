// Static Result page of the Phase 11 demo, for GitHub Pages. The demo app
// reads its numbers from the server; this page reads the same object,
// exported once, from results.json.
import { stripChart, dumbbell, fmt } from "./charts.js";

const REPO = "https://github.com/abuahmad369/Case-Study-of-Unsupervised-Domain-Adaptaion-from-CT-to-MRI-for-3D-abdominal-organ-segmentation";
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

$("#link-overview").href = REPO;
$("#link-method").href = `${REPO}/blob/main/docs/METHOD.md`;

function segGroup(el, attr, onChange) {
  el.addEventListener("click", e => {
    const b = e.target.closest("button[role=radio]");
    if (!b || b.disabled) return;
    $$("button[role=radio]", el).forEach(x => x.setAttribute("aria-checked", x === b));
    onChange(b.dataset[attr]);
  });
}

let RESULT = null;
let SET = "amos";

async function loadResult() {
  try {
    const r = await fetch("results.json");
    if (!r.ok) throw new Error(`results.json: ${r.status}`);
    RESULT = await r.json();
  } catch (e) {
    $("#chart-models").innerHTML = `<p class="err">${esc(e.message)}</p>`;
    return;
  }
  segGroup($("#set-switch"), "set", s => { SET = s; drawModels(); });
  let t = 0, lastW = 0;
  new ResizeObserver(() => {
    const w = $("#chart-models").clientWidth;
    if (!w || w === lastW) return;
    lastW = w; clearTimeout(t);
    t = setTimeout(() => { drawModels(); drawOrgans(); }, 120);
  }).observe($("#view-result"));
  drawModels();
  drawTests();
  drawOrgans();
}

function drawModels() {
  const R = RESULT;
  const runs = arm => R.runs.filter(r => r.arm === arm).map(r => ({ v: r[SET], label: `${arm === "gin600" ? "GIN" : "Plain"} run ${r.pair}` }));
  const p8 = kind => R.phase8.filter(m => m.kind === kind).map(m => ({ v: m.amos, label: `${m.name}` }));
  const rows = SET === "amos" ? [
    { label: "CT model, 100 epochs", sub: "Part A teachers", pts: p8("teacher"), tone: "muted" },
    { label: "TENT on 40 unlabelled MRI", sub: "test time adaptation", pts: p8("tent"), tone: "muted" },
    { label: "Class balanced self training", sub: "one student", pts: p8("student"), tone: "muted" },
    { label: "Plain nnU-Net, 600 epochs", sub: "three runs", pts: runs("plain600"), tone: "plain" },
    { label: "GIN nnU-Net, 600 epochs", sub: "three runs", pts: runs("gin600"), tone: "gin" },
  ] : [
    { label: "Plain nnU-Net, 600 epochs", sub: "three runs", pts: runs("plain600"), tone: "plain" },
    { label: "GIN nnU-Net, 600 epochs", sub: "three runs", pts: runs("gin600"), tone: "gin" },
  ];
  stripChart($("#chart-models"), rows, SET === "amos" ? { value: R.oracle, label: "MRI oracle, trained on MRI labels" } : null);
  $("#note-models").textContent = SET === "amos"
    ? `Mean Dice over organs 1 to 13. Bars mark the mean, dots are single training runs. On these scans GIN closes ${fmt(100 * R.amos.share_of_gap, 0)} percent of the ${fmt(R.gap, 3)} gap between the CT models and the MRI oracle.`
    : `The external set played no part in choosing GIN. Its labels follow TotalSegmentator's definitions, so only the difference between the arms is compared, not the absolute Dice with AMOS.`;
}

function drawTests() {
  const R = RESULT, k = R.rules;
  $("#tests-sub").textContent = `Written into the evaluation code before training. Three training runs per arm, Welch ${fmt(100 * k.ci_level, 0)} percent interval on run means.`;
  const row = (name, rule, value, pass) => `<tr><td>${name}<span class="rule">${rule}</span></td><td class="num">${value}</td><td class="num"><span class="${pass ? "pass" : "fail"}">${pass ? "Pass" : "Fail"}</span></td></tr>`;
  const iv = w => `+${fmt(w.diff, 3)} <span class="muted">[${fmt(w.low, 3)}, ${fmt(w.high, 3)}]</span>`;
  $("#tests-table").innerHTML = `<thead><tr><th>Test</th><th class="num">GIN against plain</th><th class="num"></th></tr></thead><tbody>
    ${row("AMOS, 60 test MRI", `gain of at least ${fmt(k.min_effect, 2)}, interval above zero`, iv(R.amos), R.amos.verdict === "GIN_HELPS")}
    ${row("TotalSegmentator, 100 MRI", `same rule, data not used to choose GIN`, iv(R.ext), R.ext.verdict === "GIN_HELPS")}
    ${row("CT, 30 held out scans", `GIN may lose at most ${fmt(k.ct_margin, 2)}`, `${fmt(-R.ct.diff, 4)} lower`, R.ct.verdict === "CT_OK")}
  </tbody>`;
  const ok = R.overall === "DG_CONFIRMED";
  $("#verdict").innerHTML = ok
    ? `<b>Confirmed on both MRI sets.</b> GIN reaches ${fmt(R.arms.gin600.amos13.mean, 3)} on AMOS, ${fmt(R.oracle - R.arms.gin600.amos13.mean, 3)} below the MRI oracle, without seeing an MRI image. <span class="mono muted">${R.overall}</span>`
    : `<b>${esc(R.overall)}</b>`;
}

function drawOrgans() {
  const o = RESULT.organs;
  dumbbell($("#chart-organs-amos"), o.map(x => ({ label: x.name, a: x.plain_amos, b: x.gin_amos })));
  dumbbell($("#chart-organs-ext"), o.map(x => ({ label: x.name, a: x.plain_ext, b: x.gin_ext })));
}

loadResult();
