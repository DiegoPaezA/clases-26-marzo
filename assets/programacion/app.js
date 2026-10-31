/* app.js: interfaz, editores con ejecución, equipo, verificaciones y reportes. */
(function () {
'use strict';
const CJ = window.CppJS;
const { GUIDES, REPORTS, DEFAULT_DEC } = window.P1_CONTENT;
const LOGO = window.P1_LOGO || '';
const KEY = 'p1-10ele-p4-v1';
const VERSION = '1.0';
const FIXED_TIME = 1760000000;

const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
function h(tag, props, ...kids) {
  const e = document.createElement(tag);
  if (props) for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k === 'text') e.textContent = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2).toLowerCase(), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat(Infinity)) { if (c == null || c === false) continue; e.append(c.nodeType ? c : document.createTextNode(String(c))); }
  return e;
}
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const stripTags = s => String(s).replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const norm = s => String(s).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const fmtDate = d => new Date(d).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/* ------------------------------------------------------------------ */
/* Estado                                                              */
/* ------------------------------------------------------------------ */
let storageOK = true;
function emptyState() {
  return { v: 1, team: { nombre: '', grupo: '10 ELE', integrantes: [{ nombre: '', rol: '' }] }, f: {}, c: {}, r: {}, vfs: {}, lib: { dec: DEFAULT_DEC }, prefs: { fixedTime: false }, tab: 'inicio' };
}
function normalize(o) {
  const e = emptyState();
  if (!o || typeof o !== 'object') return e;
  for (const k of Object.keys(e)) if (o[k] !== undefined && o[k] !== null) e[k] = o[k];
  if (!e.team || typeof e.team !== 'object') e.team = emptyState().team;
  if (!Array.isArray(e.team.integrantes) || !e.team.integrantes.length) e.team.integrantes = [{ nombre: '', rol: '' }];
  if (!e.lib || !e.lib.dec) e.lib = { dec: DEFAULT_DEC };
  if (!e.prefs) e.prefs = { fixedTime: false };
  for (const k of ['f', 'c', 'r', 'vfs']) if (!e[k] || typeof e[k] !== 'object') e[k] = {};
  return e;
}
let S;
try { S = normalize(JSON.parse(localStorage.getItem(KEY) || 'null')); } catch (e) { S = emptyState(); }
try { localStorage.setItem(KEY + '-t', '1'); localStorage.removeItem(KEY + '-t'); } catch (e) { storageOK = false; }
let saveT = null;
function save() { clearTimeout(saveT); saveT = setTimeout(saveNow, 200); }
function saveNow() {
  if (!storageOK) return;
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { storageOK = false; const w = $('#storageWarn'); if (w) w.hidden = false; }
}
window.addEventListener('beforeunload', saveNow);

/* ------------------------------------------------------------------ */
/* Recorridos del contenido                                            */
/* ------------------------------------------------------------------ */
function eachBlock(cb) { for (const g of GUIDES) for (const c of g.classes) for (const b of c.blocks) cb(b, c.rep, g, c); }
const SPECS = {};
eachBlock(b => { if (b.t === 'code') SPECS[b.id] = b; });

const filled = (id, type) => { const v = S.f[id]; return type === 'check' ? !!v : (v != null && String(v).trim() !== ''); };
function edCompiled(id) { const r = S.r[id]; return !!(r && r.runs > 0 && r.compiled); }

function g4Cases() { const b = []; eachBlock(x => { if (x.t === 'g4tests') b.push(x); }); return b[0]; }

function reqItems(rep) {
  const items = [];
  eachBlock((b, r) => {
    if (r !== rep) return;
    if (b.t === 'code' && b.req) items.push({ id: b.id, label: 'Ejecutar sin errores de compilación: ' + b.title, done: () => edCompiled(b.id) });
    else if (b.t === 'tbl') b.rows.forEach(row => row.cells.forEach(c => { if (c && c.f && !c.opt) items.push({ id: c.f, label: c.label, done: () => filled(c.f, c.type) }); }));
    else if (b.t === 'free' && !b.opt) items.push({ id: b.id, label: stripTags(b.label), done: () => filled(b.id) });
    else if (b.t === 'chk') b.items.forEach(it => items.push({ id: it.id, label: it.label, done: () => filled(it.id, 'check') }));
    else if (b.t === 'g4tests') {
      items.push({ id: 'g4.umbral', label: 'Umbral de mi proyecto', done: () => filled('g4.umbral') });
      b.cases.forEach((c, i) => {
        items.push({ id: `g4.t.${i + 1}.v`, label: `Caso "${c}": valor elegido`, done: () => filled(`g4.t.${i + 1}.v`) });
        items.push({ id: `g4.t.${i + 1}.e`, label: `Caso "${c}": resultado esperado`, done: () => filled(`g4.t.${i + 1}.e`) });
        items.push({ id: `g4.t.${i + 1}.o`, label: `Caso "${c}": resultado obtenido (botón Probar)`, done: () => filled(`g4.t.${i + 1}.o`) });
      });
    }
  });
  return items;
}
function repStatus(rep) {
  const items = reqItems(rep); const ok = items.filter(i => i.done());
  return { total: items.length, done: ok.length, missing: items.filter(i => !i.done()) };
}
function teamOk() { return S.team.integrantes.some(m => m.nombre.trim()) && S.team.grupo.trim() !== ''; }

/* ------------------------------------------------------------------ */
/* Utilidades de C++                                                   */
/* ------------------------------------------------------------------ */
function findFunction(code, name) {
  const re = new RegExp('(^|\\n)([ \\t]*)(?:unsigned\\s+)?(?:int|string|bool|void|double|float|long|char)\\s+' + name + '\\s*\\(', 'g');
  let m;
  while ((m = re.exec(code))) {
    const afterParen = m.index + m[0].length;
    const brace = code.indexOf('{', afterParen);
    const semi = code.indexOf(';', afterParen);
    if (brace < 0) return null;
    if (semi >= 0 && semi < brace) continue; // prototipo
    let depth = 0, end = -1;
    for (let j = brace; j < code.length; j++) {
      const ch = code[j];
      if (ch === '"' || ch === "'") { const q = ch; j++; while (j < code.length && code[j] !== q) { if (code[j] === '\\') j++; j++; } continue; }
      if (ch === '/' && code[j + 1] === '/') { while (j < code.length && code[j] !== '\n') j++; continue; }
      if (ch === '/' && code[j + 1] === '*') { j = code.indexOf('*/', j + 2); if (j < 0) break; j++; continue; }
      if (ch === '{') depth++;
      else if (ch === '}') { depth--; if (depth === 0) { end = j + 1; break; } }
    }
    if (end < 0) return null;
    return { start: m.index + m[1].length, end };
  }
  return null;
}
function upsertFunction(code, name, text) {
  text = text.replace(/\s+$/, '');
  const f = findFunction(code, name);
  if (f) {
    const ind = /^[ \t]*/.exec(code.slice(code.lastIndexOf('\n', f.start - 1) + 1, f.start))[0];
    return { code: code.slice(0, f.start) + text + code.slice(f.end), mode: 'reemplazada' };
  }
  const ph = new RegExp('^[ \\t]*//[^\\n]*[Aa]grega aqu[íi][^\\n]*' + name + '[^\\n]*\\n?', 'm');
  const pm = ph.exec(code);
  if (pm) return { code: code.slice(0, pm.index) + text + '\n' + code.slice(pm.index + pm[0].length), mode: 'insertada' };
  const mi = code.search(/\n[ \t]*int\s+main\s*\(/);
  if (mi >= 0) return { code: code.slice(0, mi + 1) + text + '\n\n' + code.slice(mi + 1), mode: 'insertada' };
  return { code: code + '\n\n' + text + '\n', mode: 'insertada' };
}
const countLines = t => { if (t == null || t === '') return 0; const a = String(t).split('\n'); if (a[a.length - 1] === '') a.pop(); return a.length; };
const WRAP_HEAD = '#include <iostream>\n#include <fstream>\n#include <string>\n#include <cstdlib>\n#include <ctime>\n#include <cmath>\nusing namespace std;\nint main() {\n';
const WRAP_LINES = WRAP_HEAD.split('\n').length - 1;
const WRAP_TAIL = '\n  return 0;\n}\n';

function getCode(id) { return S.c[id] !== undefined ? S.c[id] : (SPECS[id] ? SPECS[id].code : ''); }

/* ------------------------------------------------------------------ */
/* SHA-256 (síncrono)                                                  */
/* ------------------------------------------------------------------ */
function sha256(str) {
  const bytes = new TextEncoder().encode(str);
  const K = new Uint32Array([0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2]);
  const H = new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]);
  const l = bytes.length, bitLen = l * 8;
  const padLen = ((l + 9 + 63) >> 6) << 6;
  const m = new Uint8Array(padLen); m.set(bytes); m[l] = 0x80;
  const dv = new DataView(m.buffer);
  dv.setUint32(padLen - 8, Math.floor(bitLen / 4294967296)); dv.setUint32(padLen - 4, bitLen >>> 0);
  const w = new Uint32Array(64);
  const rotr = (x, n) => (x >>> n) | (x << (32 - n));
  for (let o = 0; o < padLen; o += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(o + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, hh] = H;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (hh + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const mj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + mj) >>> 0;
      hh = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0; H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0; H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + hh) >>> 0;
  }
  return Array.from(H).map(x => x.toString(16).padStart(8, '0')).join('');
}

/* ------------------------------------------------------------------ */
/* Observaciones y comparaciones                                       */
/* ------------------------------------------------------------------ */
function outOf(ed) { const r = S.r[ed]; return r && r.runs > 0 ? (r.out || '') : null; }
function numsFrom(out, re) { const rx = new RegExp(re, 'g'); const a = []; let m; while ((m = rx.exec(out))) a.push(parseInt(m[1], 10)); return a; }
function computeObs(sp) {
  switch (sp.k) {
    case 'file': return Object.prototype.hasOwnProperty.call(S.vfs, sp.file) ? S.vfs[sp.file] : null;
    case 'lines': return Object.prototype.hasOwnProperty.call(S.vfs, sp.file) ? String(countLines(S.vfs[sp.file])) : null;
    case 'vuelta': {
      const o = outOf(sp.ed); if (o == null) return null;
      const L = o.split('\n'); const i = L.findIndex(l => l.startsWith('Vuelta ' + sp.n + ':'));
      if (i < 0) return 'No';
      return (L[i + 1] || '').includes('Revisar sensor') ? 'Sí' : 'No';
    }
    case 'count': { const o = outOf(sp.ed); if (o == null) return null; return String((o.match(new RegExp(sp.re, 'g')) || []).length); }
    case 'list': { const o = outOf(sp.ed); if (o == null) return null; return numsFrom(o, sp.re).join(', ') || 'ninguna'; }
    case 'both': {
      const o = outOf(sp.ed); if (o == null) return null;
      const A = numsFrom(o, sp.re), B = new Set(numsFrom(o, sp.re2));
      const r = A.filter(x => B.has(x)); return r.join(', ') || 'ninguna';
    }
    case 'num': { const o = outOf(sp.ed); if (o == null) return null; const m = new RegExp(sp.re).exec(o); return m ? m[1] : '(no aparece en la salida)'; }
    case 'compile': {
      const r = S.r[sp.ed]; if (!r || !r.runs) return null;
      let s = r.compiled ? 'La última ejecución compiló sin errores.' : 'La última ejecución tiene errores de compilación.';
      s += ' Ejecuciones con errores de compilación: ' + (r.ce || 0) + ' de ' + r.runs + '.';
      if (r.lastCE) s += ' Último error de compilación: ' + r.lastCE;
      return s;
    }
  }
  return null;
}
function sameVal(a, b) {
  const A = norm(a), B = norm(b);
  const na = A.match(/-?\d+(?:[.,]\d+)?/g), nb = B.match(/-?\d+(?:[.,]\d+)?/g);
  if (na && nb) { const f = x => x.map(v => parseFloat(v.replace(',', '.'))); const x = f(na), y = f(nb); return x.length === y.length && x.every((v, i) => v === y[i]); }
  if (!na && !nb) return A === B || (/^(ninguna|ninguno|no hay|nunca|no)$/.test(A) && /^(ninguna|ninguno|no hay|nunca|no)$/.test(B));
  return false;
}

/* ------------------------------------------------------------------ */
/* Registros de UI                                                     */
/* ------------------------------------------------------------------ */
const OBSCELLS = [], CMPCHIPS = [], FILEPANELS = [], CHIPS = [], PROGRESS = [];
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('on'), 3200);
}
function confirmClick(btn, fn, label) {
  const orig = btn.textContent;
  btn.addEventListener('click', () => {
    if (btn.dataset.armed) { clearTimeout(btn._t); delete btn.dataset.armed; btn.textContent = orig; btn.classList.remove('armed'); fn(); return; }
    btn.dataset.armed = '1'; btn.textContent = label || '¿Seguro? Clic otra vez'; btn.classList.add('armed');
    btn._t = setTimeout(() => { delete btn.dataset.armed; btn.textContent = orig; btn.classList.remove('armed'); }, 4000);
  });
}

function refreshAll() {
  for (const o of OBSCELLS) updateObs(o);
  for (const c of CMPCHIPS) updateCmp(c);
  for (const f of FILEPANELS) f();
  for (const c of CHIPS) c();
  for (const p of PROGRESS) p();
}
function updateObs(o) {
  const sp = o.spec;
  if (sp.mode === 'live') {
    const v = computeObs(sp);
    if (v !== null && S.f[o.id] !== v) { S.f[o.id] = v; save(); }
  }
  const v = S.f[o.id];
  o.val.textContent = v != null && v !== '' ? v : (sp.mode === 'live' ? '(ejecuta el programa)' : '(sin registrar)');
  o.val.classList.toggle('empty', v == null || v === '');
}
function updateCmp(c) {
  const a = S.f[c.a], b = S.f[c.b];
  if (a == null || String(a).trim() === '' || b == null || String(b).trim() === '') { c.el.textContent = ''; c.el.className = 'cmp'; return; }
  const ok = sameVal(a, b);
  c.el.textContent = ok ? '✓ coincide' : '✗ no coincide';
  c.el.className = 'cmp ' + (ok ? 'ok' : 'bad');
}

/* ------------------------------------------------------------------ */
/* Campos                                                              */
/* ------------------------------------------------------------------ */
function fieldEl(c) {
  const id = c.f;
  let el;
  const lab = c.label || id;
  if (c.type === 'select') {
    el = h('select', { 'aria-label': lab }, h('option', { value: '', text: '(elegir)' }), (c.opts || []).map(o => h('option', { value: o, text: o })));
    el.value = S.f[id] || '';
    el.addEventListener('change', () => { S.f[id] = el.value; save(); refreshAll(); });
  } else if (c.type === 'check') {
    el = h('input', { type: 'checkbox', 'aria-label': lab });
    el.checked = !!S.f[id];
    el.addEventListener('change', () => { S.f[id] = el.checked; save(); refreshAll(); });
  } else if (c.type === 'area') {
    el = h('textarea', { rows: 2, 'aria-label': lab, placeholder: c.ph || '' });
    el.value = S.f[id] || '';
    const grow = () => { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight + 2, 360) + 'px'; };
    el.addEventListener('input', () => { S.f[id] = el.value; save(); grow(); refreshAll(); });
    setTimeout(grow, 0);
    el._grow = grow;
  } else {
    el = h('input', { type: 'text', inputmode: c.type === 'num' ? 'decimal' : 'text', 'aria-label': lab, placeholder: c.ph || '' });
    el.value = S.f[id] || '';
    el.addEventListener('input', () => { S.f[id] = el.value; save(); refreshAll(); });
  }
  el.dataset.fid = id;
  return el;
}

function obsEl(c) {
  const sp = c.obs;
  const val = h('div', { class: 'obsv' + (sp.k === 'file' ? ' pre' : '') });
  const wrap = h('div', { class: 'obs' }, val);
  const rec = { id: c.id, spec: sp, val };
  OBSCELLS.push(rec);
  if (sp.mode === 'snap') {
    const btn = h('button', { class: 'btn small ghost', type: 'button', text: sp.label || 'Registrar lo observado' });
    btn.addEventListener('click', () => {
      const v = computeObs(sp);
      if (v === null) { toast('Todavía no existe ' + (sp.file || 'ese dato') + '. Ejecuta el programa primero.'); return; }
      S.f[c.id] = v; save(); refreshAll();
    });
    wrap.append(btn);
  }
  if (c.cmpWith) {
    const chip = h('span', { class: 'cmp' }); wrap.append(chip);
    CMPCHIPS.push({ el: chip, a: c.cmpWith, b: c.id });
  }
  updateObs(rec);
  return wrap;
}

/* ------------------------------------------------------------------ */
/* Editor y ejecución                                                  */
/* ------------------------------------------------------------------ */
const EDITORS = {};
function makeEditor(id, initial, onChange, onRun) {
  const gut = h('pre', { class: 'gut', 'aria-hidden': 'true' });
  const ta = h('textarea', { class: 'ta', spellcheck: 'false', autocapitalize: 'off', autocomplete: 'off', autocorrect: 'off', wrap: 'off', 'aria-label': 'Editor de código C++ (Esc y luego Tab para salir del editor)' });
  ta.value = initial;
  const box = h('div', { class: 'ed' }, gut, ta);
  let bad = new Set(), trap = true;
  function sync() {
    const n = ta.value.split('\n').length;
    gut.innerHTML = Array.from({ length: n }, (_, i) => `<span class="${bad.has(i + 1) ? 'bad' : ''}">${i + 1}</span>`).join('\n');
    ta.rows = Math.max(7, Math.min(n + 1, 30));
    gut.scrollTop = ta.scrollTop;
  }
  function insert(text) {
    ta.focus();
    if (!document.execCommand || !document.execCommand('insertText', false, text)) {
      const s = ta.selectionStart; ta.setRangeText(text, s, ta.selectionEnd, 'end'); ta.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
  ta.addEventListener('input', () => { bad = new Set(); sync(); onChange(ta.value); });
  ta.addEventListener('scroll', () => { gut.scrollTop = ta.scrollTop; });
  ta.addEventListener('blur', () => { trap = true; });
  ta.addEventListener('keydown', e => {
    if (e.key === 'Escape') { trap = false; return; }
    if (e.key === 'Tab' && trap && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) { e.preventDefault(); insert('  '); return; }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); onRun && onRun(); return; }
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
      const s = ta.selectionStart, v = ta.value;
      const ls = v.lastIndexOf('\n', s - 1) + 1;
      const ind = /^[ \t]*/.exec(v.slice(ls, s))[0];
      const prev = v.slice(ls, s).trimEnd();
      const extra = prev.endsWith('{') ? '  ' : '';
      e.preventDefault(); insert('\n' + ind + extra);
    }
  });
  sync();
  return {
    box, ta,
    get value() { return ta.value; },
    set value(v) { ta.value = v; bad = new Set(); sync(); onChange(v); },
    markErrors(lines) { bad = new Set(lines); sync(); },
    goto(line) {
      const L = ta.value.split('\n'); let pos = 0; for (let i = 0; i < line - 1 && i < L.length; i++) pos += L[i].length + 1;
      ta.focus(); ta.setSelectionRange(pos, pos + (L[line - 1] || '').length);
      const lh = parseFloat(getComputedStyle(ta).lineHeight) || 20; ta.scrollTop = Math.max(0, (line - 3) * lh);
    },
  };
}

function runProgram(src, extra) {
  return CJ.run(src, Object.assign({ files: S.vfs, fixedTime: S.prefs.fixedTime ? FIXED_TIME : null }, extra || {}));
}

function renderOutput(box, res, offset, hintCode) {
  box.innerHTML = '';
  const adj = l => (l - offset);
  const lineTxt = l => (offset && l <= offset ? 'en el encabezado automático' : (l ? 'Línea ' + adj(l) : ''));
  if (res.compileErrors.length) {
    box.append(h('div', { class: 'msg bad' }, h('b', { text: 'No se ejecutó: el programa tiene ' + res.compileErrors.length + (res.compileErrors.length === 1 ? ' error de compilación' : ' errores de compilación') + '.' }),
      h('ul', null, res.compileErrors.map(e => h('li', null, h('button', { class: 'lnk', type: 'button', 'data-line': adj(e.line), text: lineTxt(e.line) || 'Programa' }), ': ' + e.msg)))));
    if (hintCode && /TODO/.test(hintCode)) box.append(h('div', { class: 'msg warn small', text: '👉 Tu programa todavía tiene marcas /* TODO */. Cada una es un espacio que debes completar con tu propio código (un número, un valor o los argumentos de una función). Pulsa el número de línea de arriba para ir a donde falta.' }));
    else if (hintCode && /(decidirEstado|guardarEnLog|contarRegistros)/.test(res.compileErrors.map(e => e.msg).join(' ')) && box.parentNode && box.parentNode.querySelector('.tools')) box.append(h('div', { class: 'msg warn small', text: '👉 Falta una de tus funciones. Pulsa el botón «Insertar mi …()» que está sobre el editor para traerla de tu trabajo anterior.' }));
    return;
  }
  const out = h('pre', { class: 'out' });
  if (!res.out.length) out.append(h('span', { class: 'dim', text: '(el programa no mostró nada en pantalla)' }));
  for (const seg of res.out) out.append(seg.err ? h('span', { class: 'errtxt', text: seg.s }) : document.createTextNode(seg.s));
  box.append(out);
  if (res.warnings.length) box.append(h('div', { class: 'msg warn' }, h('b', { text: 'Advertencias' }), h('ul', null, res.warnings.map(w => h('li', null, (w.line ? lineTxt(w.line) + ': ' : ''), w.msg)))));
  if (res.runtimeError) box.append(h('div', { class: 'msg bad' }, h('b', { text: 'El programa se detuvo con un error en ejecución' }), h('p', null, (res.runtimeError.line ? lineTxt(res.runtimeError.line) + ': ' : ''), res.runtimeError.msg)));
  else box.append(h('div', { class: 'msg ok small', text: 'Programa finalizado correctamente (código de salida ' + res.exitCode + ').' }));
}

function filesPanel() {
  const body = h('div', { class: 'fbody' });
  const det = h('details', { class: 'files' }, h('summary', { text: 'Archivos del programa' }), body);
  const render = () => {
    const names = Object.keys(S.vfs).sort();
    det.querySelector('summary').textContent = 'Archivos del programa (' + names.length + ')';
    body.innerHTML = '';
    if (!names.length) { body.append(h('p', { class: 'dim small', text: 'Todavía no hay archivos. Cuando tu programa cree uno con ofstream aparecerá aquí. Estos archivos viven solo en esta página.' })); return; }
    const t = h('table', { class: 'ft' }, h('thead', null, h('tr', null, h('th', { text: 'Archivo' }), h('th', { class: 'num', text: 'Líneas' }), h('th', { text: 'Acciones' }))));
    const tb = h('tbody');
    for (const n of names) {
      const view = h('pre', { class: 'fview', hidden: true, text: S.vfs[n] === '' ? '(archivo vacío)' : S.vfs[n] });
      const bv = h('button', { class: 'btn small ghost', type: 'button', text: 'Ver contenido' });
      bv.addEventListener('click', () => { view.hidden = !view.hidden; bv.textContent = view.hidden ? 'Ver contenido' : 'Ocultar'; view.textContent = S.vfs[n] === '' ? '(archivo vacío)' : S.vfs[n]; });
      const bd = h('button', { class: 'btn small ghost', type: 'button', text: 'Borrar' });
      bd.addEventListener('click', () => { delete S.vfs[n]; save(); refreshAll(); });
      tb.append(h('tr', null, h('td', null, h('code', { text: n }), view), h('td', { class: 'num', text: String(countLines(S.vfs[n])) }), h('td', { class: 'acts' }, bv, bd)));
    }
    t.append(tb); body.append(t);
    const all = h('button', { class: 'btn small ghost', type: 'button', text: 'Borrar todos los archivos' });
    all.addEventListener('click', () => { S.vfs = {}; save(); refreshAll(); });
    body.append(all);
  };
  FILEPANELS.push(render); render();
  return det;
}

function renderCode(b) {
  const spec = b;
  const statusChip = h('span', { class: 'chip time', text: 'Sin ejecutar' });
  const outBox = h('div', { class: 'outbox', 'aria-live': 'polite' });
  const edr = makeEditor(b.id, getCode(b.id), v => { S.c[b.id] = v; save(); }, () => run());
  EDITORS[b.id] = edr;
  const chipUpd = () => {
    const r = S.r[b.id];
    if (!r || !r.runs) { statusChip.textContent = 'Sin ejecutar'; statusChip.className = 'chip time'; return; }
    if (!r.compiled) { statusChip.textContent = '✗ Errores de compilación'; statusChip.className = 'chip bad'; }
    else if (r.rtErr) { statusChip.textContent = '⚠ Error en ejecución'; statusChip.className = 'chip warn'; }
    else { statusChip.textContent = '✓ Compiló y se ejecutó'; statusChip.className = 'chip ok'; }
  };
  CHIPS.push(chipUpd);

  function run() {
    const code = edr.value;
    const stdin = stdinTa ? stdinTa.value : '';
    const src = b.wrap ? WRAP_HEAD + code + WRAP_TAIL : code;
    const offset = b.wrap ? WRAP_LINES : 0;
    let res;
    try { res = runProgram(src, { stdin }); }
    catch (e) { outBox.innerHTML = ''; outBox.append(h('div', { class: 'msg bad', text: 'Error interno del simulador: ' + e.message })); return; }
    const compiled = !res.compileErrors.length;
    const r = S.r[b.id] || { runs: 0, ce: 0, re: 0 };
    r.runs++; r.at = Date.now(); r.compiled = compiled; r.rtErr = !!res.runtimeError;
    if (!compiled) { r.ce++; const e0 = res.compileErrors[0]; r.lastCE = (e0.line - offset > 0 ? 'línea ' + (e0.line - offset) + ': ' : '') + e0.msg; }
    if (res.runtimeError) r.re++;
    r.out = res.out.filter(s => !s.err).map(s => s.s).join('').slice(0, 20000);
    r.errTxt = res.out.filter(s => s.err).map(s => s.s).join('').slice(0, 2000);
    r.errors = res.compileErrors.map(e => ({ line: e.line - offset, msg: e.msg }));
    r.rt = res.runtimeError ? { line: res.runtimeError.line ? res.runtimeError.line - offset : 0, msg: res.runtimeError.msg } : null;
    r.warn = res.warnings.map(w => (w.line ? 'línea ' + (w.line - offset) + ': ' : '') + w.msg);
    r.stdin = stdin;
    r.fixed = !!S.prefs.fixedTime;
    if (compiled) {
      S.vfs = res.files;
      const snap = {}; let k = 0;
      for (const n of Object.keys(res.files).sort()) { if (k++ >= 6) break; snap[n] = res.files[n].slice(0, 3000); }
      r.files = snap;
    }
    S.r[b.id] = r;
    save();
    edr.markErrors(res.compileErrors.map(e => e.line - offset).filter(l => l > 0));
    renderOutput(outBox, res, offset, code);
    $$('.lnk', outBox).forEach(a => a.addEventListener('click', () => edr.goto(parseInt(a.dataset.line, 10))));
    refreshAll();
  }

  const msg = h('span', { class: 'tmsg small dim' });
  const tools = (b.tools || []).map(t => {
    const btn = h('button', { class: 'btn small ghost', type: 'button', text: t.label });
    const act = () => {
      let text = null, from = '';
      if (t.k === 'lib') { text = S.lib.dec; from = 'tu biblioteca (pestaña Inicio)'; }
      else if (t.k === 'fromEd') {
        const src = EDITORS[t.ed] ? EDITORS[t.ed].value : getCode(t.ed);
        const f = findFunction(src, t.fn);
        if (!f) { msg.textContent = 'No encontré ' + t.fn + '() en el programa de la Guía ' + (t.ed.startsWith('g2') ? '2' : '') + '. Escríbela allí primero.'; return; }
        text = src.slice(f.start, f.end); from = 'tu programa anterior';
      } else if (t.k === 'copyEd') {
        const src = EDITORS[t.ed] ? EDITORS[t.ed].value : getCode(t.ed);
        edr.value = src; msg.textContent = 'Programa copiado.'; return;
      }
      if (t.k === 'lib' && findFunction(S.lib.dec, 'decidirEstado') === null) { msg.textContent = 'No encontré decidirEstado() en tu biblioteca (pestaña Inicio).'; return; }
      const fn = t.fn;
      const r = upsertFunction(edr.value, fn, text);
      edr.value = r.code; msg.textContent = fn + '() ' + r.mode + ' desde ' + from + '.';
    };
    if (t.k === 'copyEd') confirmClick(btn, act, '¿Reemplazar el código actual? Clic otra vez'); else btn.addEventListener('click', act);
    return btn;
  });

  const runBtn = h('button', { class: 'btn prog', type: 'button', text: '▶ Ejecutar' });
  runBtn.addEventListener('click', run);
  const resetBtn = h('button', { class: 'btn small ghost', type: 'button', text: 'Restaurar original' });
  confirmClick(resetBtn, () => { edr.value = b.code; delete S.c[b.id]; save(); msg.textContent = 'Código original restaurado.'; }, '¿Perder tus cambios? Clic otra vez');
  const copyBtn = h('button', { class: 'btn small ghost', type: 'button', text: 'Copiar código' });
  copyBtn.addEventListener('click', () => {
    const t = edr.value;
    const done = () => { msg.textContent = 'Código copiado.'; };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done).catch(() => { edr.ta.select(); document.execCommand('copy'); done(); });
    else { edr.ta.select(); try { document.execCommand('copy'); done(); } catch (e) { msg.textContent = 'Selecciona el texto y copia con Ctrl+C.'; } }
  });
  const stdinTa = h('textarea', { class: 'stdin', rows: 3, placeholder: 'Escribe aquí los datos que el programa leerá con cin, uno por línea o separados por espacios', 'aria-label': 'Entrada de datos para cin' });
  stdinTa.value = (S.r[b.id] && S.r[b.id].stdin) || '';

  const card = h('div', { class: 'card code-card', id: 'ed-' + b.id },
    h('div', { class: 'step-h' }, h('span', { class: 'id', text: 'Editor' }), h('h3', { text: b.title }), statusChip),
    b.wrap ? h('p', { class: 'xs muted', text: 'Este fragmento se ejecuta dentro de un main() preparado automáticamente (con iostream, fstream, string, cstdlib, ctime y cmath).' }) : null,
    tools.length ? h('div', { class: 'row tools' }, tools, msg) : null,
    edr.box,
    h('div', { class: 'row' }, runBtn, resetBtn, copyBtn, !tools.length ? msg : null, h('span', { class: 'xs muted', text: 'Ctrl+Enter ejecuta' })),
    h('details', { class: 'stdin-d' }, h('summary', { text: 'Entrada de datos (para programas que usan cin)' }), stdinTa),
    outBox,
    filesPanel());
  // estado inicial de la salida
  const r0 = S.r[b.id];
  if (r0 && r0.runs) {
    if (!r0.compiled) renderOutput(outBox, { compileErrors: (r0.errors || []).map(e => ({ line: e.line + (b.wrap ? WRAP_LINES : 0), msg: e.msg })), out: [], warnings: [] }, b.wrap ? WRAP_LINES : 0, getCode(b.id));
    else {
      const segs = [{ s: r0.out || '', err: false }]; if (r0.errTxt) segs.push({ s: r0.errTxt, err: true });
      renderOutput(outBox, { compileErrors: [], out: segs, warnings: (r0.warn || []).map(w => ({ line: 0, msg: w })), runtimeError: r0.rt ? { line: 0, msg: r0.rt.msg } : null, exitCode: 0 }, 0);
    }
    $$('.lnk', outBox).forEach(a => a.addEventListener('click', () => edr.goto(parseInt(a.dataset.line, 10))));
    if (!r0.compiled && r0.errors) edr.markErrors(r0.errors.map(e => e.line).filter(l => l > 0));
  }
  chipUpd();
  return card;
}

/* ------------------------------------------------------------------ */
/* Bloques                                                             */
/* ------------------------------------------------------------------ */
function renderTable(b) {
  const thead = h('thead', null, h('tr', null, b.head.map(x => h('th', { text: x }))));
  const tb = h('tbody');
  for (const row of b.rows) {
    const tr = h('tr');
    row.cells.forEach((c, i) => {
      const td = h('td', { 'data-label': b.head[i] });
      if (typeof c === 'string') td.innerHTML = c;
      else if (c && c.f) { td.append(fieldEl(c)); if (c.type === 'check') td.classList.add('ck'); }
      else if (c && c.obs) td.append(obsEl(c));
      tr.append(td);
    });
    tb.append(tr);
  }
  return h('div', { class: 'tblwrap' }, h('table', { class: 'qa' }, thead, tb));
}
function renderFree(b) {
  const f = fieldEl({ f: b.id, type: 'area', label: stripTags(b.label) });
  if (b.rows) f.rows = b.rows;
  return h('div', { class: 'free' }, h('label', { html: b.label + (b.opt ? ' <span class="opt">(opcional)</span>' : '') }), f);
}
function renderChk(b) {
  return h('div', { class: 'card chk' }, h('h4', { text: b.title }), b.items.map(it => {
    const el = fieldEl({ f: it.id, type: 'check', label: it.label });
    return h('label', { class: 'check' }, el, h('span', { text: it.label }));
  }));
}

function renderG4Tests(b) {
  const wrap = h('div', { class: 'card g4t' });
  const msg = h('div', { class: 'tmsgbox', 'aria-live': 'polite' });
  const outEx = [], outCs = [];
  wrap.append(h('h4', { text: 'Ejemplo guiado (umbral 400)' }));
  const t1 = h('table', { class: 'qa' }, h('thead', null, h('tr', null, ['Valor de prueba', 'Resultado esperado', 'Resultado obtenido', ''].map(x => h('th', { text: x })))));
  const tb1 = h('tbody');
  b.ex.forEach((r, i) => {
    const oid = `g4.t.ex.${i + 1}.o`; const val = h('span', { class: 'obsv' }); const cmp = h('span', { class: 'cmp' });
    tb1.append(h('tr', null, h('td', { 'data-label': 'Valor de prueba', text: String(r[0]) }), h('td', { 'data-label': 'Esperado', text: r[1] }), h('td', { 'data-label': 'Obtenido' }, val), h('td', null, cmp)));
    outEx.push({ oid, val, cmp, exp: r[1] });
  });
  t1.append(tb1); wrap.append(h('div', { class: 'tblwrap' }, t1));
  wrap.append(h('h4', { text: 'Tus propios casos con el umbral real de tu proyecto' }));
  wrap.append(h('p', { class: 'small', text: 'Incluye al menos: un valor claramente bajo, un valor justo antes del umbral, el valor exacto del umbral, un valor justo después y un valor claramente alto.' }));
  wrap.append(h('div', { class: 'row' }, h('label', { for: 'g4umb', text: 'Umbral de mi proyecto:' }), (() => { const e = fieldEl({ f: 'g4.umbral', type: 'num', label: 'Umbral de mi proyecto', ph: 'ej. 400' }); e.id = 'g4umb'; e.style.maxWidth = '120px'; return e; })()));
  const t2 = h('table', { class: 'qa' }, h('thead', null, h('tr', null, ['Caso', 'Valor elegido', 'Resultado esperado', 'Resultado obtenido', ''].map(x => h('th', { text: x })))));
  const tb2 = h('tbody');
  b.cases.forEach((c, i) => {
    const n = i + 1; const val = h('span', { class: 'obsv' }); const cmp = h('span', { class: 'cmp' });
    const fv = fieldEl({ f: `g4.t.${n}.v`, type: 'num', label: `Caso ${c}: valor elegido` });
    const fe = fieldEl({ f: `g4.t.${n}.e`, type: 'text', label: `Caso ${c}: resultado esperado`, ph: 'ej. APAGADO' });
    tb2.append(h('tr', null, h('td', { 'data-label': 'Caso', text: c }), h('td', { 'data-label': 'Valor elegido' }, fv), h('td', { 'data-label': 'Esperado' }, fe), h('td', { 'data-label': 'Obtenido' }, val), h('td', null, cmp)));
    outCs.push({ oid: `g4.t.${n}.o`, val, cmp, eid: `g4.t.${n}.e`, n });
  });
  t2.append(tb2); wrap.append(h('div', { class: 'tblwrap' }, t2));
  const btn = h('button', { class: 'btn prog', type: 'button', text: '▶ Probar con mi decidirEstado()' });
  wrap.append(h('div', { class: 'row' }, btn, h('span', { class: 'xs muted', text: 'Usa la función de tu biblioteca (pestaña Inicio).' })), msg);

  const paint = () => {
    for (const o of outEx) {
      const v = S.f[o.oid]; o.val.textContent = v != null && v !== '' ? v : '(sin probar)'; o.val.classList.toggle('empty', !v);
      if (v) { const ok = norm(v) === norm(o.exp); o.cmp.textContent = ok ? '✓ coincide' : '✗ no coincide'; o.cmp.className = 'cmp ' + (ok ? 'ok' : 'bad'); } else { o.cmp.textContent = ''; o.cmp.className = 'cmp'; }
    }
    for (const o of outCs) {
      const v = S.f[o.oid]; o.val.textContent = v != null && v !== '' ? v : '(sin probar)'; o.val.classList.toggle('empty', !v);
      const e = S.f[o.eid];
      if (v && e && String(e).trim()) { const ok = norm(v) === norm(e); o.cmp.textContent = ok ? '✓ coincide' : '✗ no coincide'; o.cmp.className = 'cmp ' + (ok ? 'ok' : 'bad'); } else { o.cmp.textContent = ''; o.cmp.className = 'cmp'; }
    }
  };
  CHIPS.push(paint); paint();

  btn.addEventListener('click', () => {
    const umb = parseInt(String(S.f['g4.umbral'] || '').replace(',', '.'), 10);
    const calls = [];
    b.ex.forEach((r, i) => calls.push({ oid: `g4.t.ex.${i + 1}.o`, v: r[0], u: 400 }));
    let skipped = 0;
    outCs.forEach(o => {
      const v = parseInt(String(S.f[`g4.t.${o.n}.v`] || '').replace(',', '.'), 10);
      if (Number.isFinite(v) && Number.isFinite(umb)) calls.push({ oid: o.oid, v, u: umb }); else skipped++;
    });
    const head = '#include <iostream>\n#include <string>\nusing namespace std;\n';
    const src = head + S.lib.dec + '\nint main() {\n' + calls.map(c => `  cout << decidirEstado(${c.v}, ${c.u}) << "\\n";`).join('\n') + '\n  return 0;\n}\n';
    const res = CJ.run(src, {});
    msg.innerHTML = '';
    if (res.compileErrors.length) {
      const off = head.split('\n').length - 1;
      msg.append(h('div', { class: 'msg bad' }, h('b', { text: 'Tu decidirEstado() no se pudo compilar. Corrígela en la pestaña Inicio.' }), h('ul', null, res.compileErrors.slice(0, 4).map(e => h('li', { text: (e.line - off > 0 ? 'Línea ' + (e.line - off) + ' de tu función: ' : '') + e.msg })))));
      return;
    }
    if (res.runtimeError) { msg.append(h('div', { class: 'msg bad', text: 'Error al ejecutar tu función: ' + res.runtimeError.msg })); return; }
    const lines = res.out.map(s => s.s).join('').split('\n');
    calls.forEach((c, i) => { S.f[c.oid] = (lines[i] || '').trim(); });
    save(); paint(); refreshAll();
    if (skipped) msg.append(h('div', { class: 'msg warn small', text: 'Se omitieron ' + skipped + ' caso(s) sin valor o sin umbral. Completa el umbral y los valores elegidos.' }));
    else msg.append(h('div', { class: 'msg ok small', text: 'Casos probados con tu función decidirEstado().' }));
  });
  return wrap;
}

function renderBlock(b) {
  switch (b.t) {
    case 'h': return h('h3', { class: 'phase', text: b.text });
    case 'p': return h('p', { html: b.html });
    case 'ul': return h('ul', null, b.items.map(i => h('li', { html: i })));
    case 'note': return h('div', { class: 'note ' + (b.k || ''), html: b.html });
    case 'code': return renderCode(b);
    case 'tbl': return renderTable(b);
    case 'free': return renderFree(b);
    case 'chk': return renderChk(b);
    case 'g4tests': return renderG4Tests(b);
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Pestañas de guías                                                   */
/* ------------------------------------------------------------------ */
function renderGuide(g) {
  const sec = h('section', { class: 'view', id: g.id, 'aria-labelledby': g.id + '-h' });
  sec.append(h('div', { class: 'hero' },
    h('span', { class: 'eyebrow', text: g.kicker }),
    h('h2', { id: g.id + '-h', text: g.title }),
    h('p', { class: 'muted small', text: 'Duración: ' + g.duration + ' · Docente: Diego Ricardo Páez Ardila' }),
    h('p', { html: g.intro })));
  for (const c of g.classes) {
    const rep = REPORTS[c.rep];
    const prog = h('span', { class: 'chip time' });
    const pbar = h('span');
    PROGRESS.push(() => { const st = repStatus(c.rep); prog.textContent = st.done + ' de ' + st.total + ' elementos'; pbar.style.width = (st.total ? st.done / st.total * 100 : 0) + '%'; });
    sec.append(h('div', { class: 'part' }, h('span', { class: 'badge', text: c.title }), h('h3', { text: rep.sub }), prog));
    sec.append(h('div', { class: 'progress' }, pbar));
    for (const b of c.blocks) { const el = renderBlock(b); if (el) sec.append(el); }
    sec.append(h('div', { class: 'card endcard noprint' },
      h('b', { text: 'Reporte de esta sección: ' }), rep.title + ' · ' + rep.sub + '. ',
      h('a', { class: 'btn', href: '#entrega', text: 'Ir a Mi entrega →' })));
  }
  if (g.eval) {
    sec.append(h('details', { class: 'evalbox' }, h('summary', { text: 'Evaluación de esta guía' }),
      h('p', { class: 'small', text: 'Esta guía genera nota en las siguientes categorías del periodo:' }),
      h('div', { class: 'tblwrap' }, h('table', { class: 'rub' }, h('thead', null, h('tr', null, ['Categoría', 'Qué la genera', 'Qué se observa'].map(x => h('th', { text: x })))),
        h('tbody', null, g.eval.map(r => h('tr', null, r.map(x => h('td', { text: x })))))))));
  }
  return sec;
}

/* ------------------------------------------------------------------ */
/* Inicio                                                              */
/* ------------------------------------------------------------------ */
function renderInicio() {
  const sec = $('#inicio');
  sec.innerHTML = '';
  sec.append(h('span', { class: 'eyebrow', text: 'Programación 1 · 10 ELE · Periodo 4' }),
    h('h2', { text: 'Guías 2 a 4: del archivo al banco de pruebas' }),
    h('p', { class: 'muted', text: 'Trabajas en una sola página: lees la guía, escribes y ejecutas tu código C++ aquí mismo, registras tus respuestas y descargas el reporte que entrega tu equipo.' }));

  sec.append(h('div', { class: 'card' }, h('h3', { text: 'Cómo usar esta herramienta' }),
    h('ol', { class: 'steps' },
      h('li', { html: '<b>Registra a tu equipo</b> en el siguiente cuadro. Esos datos aparecen en todos los reportes.' }),
      h('li', { html: '<b>Guarda tu función <code>decidirEstado()</code></b> de la Guía 1 en “Mi biblioteca”. Los programas de las guías la insertan con un botón.' }),
      h('li', { html: '<b>Abre la guía del día</b> (pestañas de arriba). Cada programa tiene su editor: escribe, pulsa <b>Ejecutar</b> y compara con tus predicciones.' }),
      h('li', { html: '<b>Al terminar cada clase</b> ve a <i>Mi entrega</i>, revisa qué falta y descarga el reporte. Ese archivo es lo que entrega el equipo.' }))));

  // Equipo
  const team = h('div', { class: 'card', id: 'teamcard' });
  const drawTeam = () => {
    team.innerHTML = '';
    team.append(h('h3', { text: 'Datos del equipo' }));
    const g1 = h('div', { class: 'grid2' },
      h('div', null, h('label', { for: 't-nombre', text: 'Nombre del equipo o del proyecto (opcional)' }), h('input', { id: 't-nombre', type: 'text', value: S.team.nombre || '', placeholder: 'Ej.: Estación Escolar Inteligente' })),
      h('div', null, h('label', { for: 't-grupo', text: 'Grupo' }), h('input', { id: 't-grupo', type: 'text', value: S.team.grupo || '' })));
    team.append(g1);
    $('#t-nombre', g1).addEventListener('input', e => { S.team.nombre = e.target.value; save(); refreshAll(); });
    $('#t-grupo', g1).addEventListener('input', e => { S.team.grupo = e.target.value; save(); refreshAll(); });
    team.append(h('label', { text: 'Integrantes' }));
    S.team.integrantes.forEach((m, i) => {
      const n = h('input', { type: 'text', value: m.nombre, placeholder: 'Nombre completo', 'aria-label': 'Nombre del integrante ' + (i + 1) });
      const r = h('input', { type: 'text', value: m.rol || '', placeholder: 'Rol (opcional)', 'aria-label': 'Rol del integrante ' + (i + 1) });
      n.addEventListener('input', () => { m.nombre = n.value; save(); refreshAll(); });
      r.addEventListener('input', () => { m.rol = r.value; save(); });
      const rm = h('button', { class: 'btn small ghost', type: 'button', text: 'Quitar', disabled: S.team.integrantes.length === 1 ? true : null });
      rm.addEventListener('click', () => { S.team.integrantes.splice(i, 1); save(); drawTeam(); refreshAll(); });
      team.append(h('div', { class: 'member' }, h('span', { class: 'mn', text: String(i + 1) }), n, r, rm));
    });
    if (S.team.integrantes.length < 5) {
      const add = h('button', { class: 'btn small ghost', type: 'button', text: '+ Agregar integrante' });
      add.addEventListener('click', () => { S.team.integrantes.push({ nombre: '', rol: '' }); save(); drawTeam(); });
      team.append(add);
    }
    team.append(h('p', { class: 'xs muted', text: 'Para descargar un reporte se necesita el grupo y al menos un integrante con nombre.' }));
  };
  drawTeam();
  sec.append(team);

  // Biblioteca
  const dec = makeEditor('lib.dec', S.lib.dec, v => { S.lib.dec = v; save(); refreshAll(); }, null);
  EDITORS['lib.dec'] = dec;
  const libChip = h('span', { class: 'chip time' });
  CHIPS.push(() => { const same = norm(S.lib.dec).replace(/\s+/g, '') === norm(DEFAULT_DEC).replace(/\s+/g, ''); libChip.textContent = same ? 'Función de ejemplo sin modificar' : 'Función personalizada'; libChip.className = 'chip ' + (same ? 'warn' : 'ok'); });
  const libMsg = h('div', { 'aria-live': 'polite' });
  const libTest = h('button', { class: 'btn small prog', type: 'button', text: 'Verificar que compila' });
  libTest.addEventListener('click', () => {
    const head = '#include <iostream>\n#include <string>\nusing namespace std;\n';
    const res = CJ.run(head + S.lib.dec + '\nint main() {\n  cout << decidirEstado(100, 400) << endl;\n  return 0;\n}\n', {});
    libMsg.innerHTML = '';
    const off = head.split('\n').length - 1;
    dec.markErrors(res.compileErrors.map(e => e.line - off).filter(l => l > 0));
    if (res.compileErrors.length) libMsg.append(h('div', { class: 'msg bad' }, h('b', { text: 'No compila.' }), h('ul', null, res.compileErrors.slice(0, 4).map(e => h('li', { text: (e.line - off > 0 ? 'Línea ' + (e.line - off) + ': ' : '') + e.msg })))));
    else libMsg.append(h('div', { class: 'msg ok small', text: 'Compila. Con lectura 100 y umbral 400 devuelve: ' + res.out.map(s => s.s).join('').trim() }));
  });
  const libReset = h('button', { class: 'btn small ghost', type: 'button', text: 'Restaurar ejemplo' });
  confirmClick(libReset, () => { dec.value = DEFAULT_DEC; }, '¿Perder tu función? Clic otra vez');
  sec.append(h('div', { class: 'card' }, h('div', { class: 'step-h' }, h('h3', { text: 'Mi biblioteca: decidirEstado() de la Guía 1' }), libChip),
    h('p', { class: 'small', html: 'Pega aquí la función <code>decidirEstado()</code> que construiste en la Guía 1, con la regla de tu proyecto. Debe recibir la lectura y el umbral. Se usa en los botones “Insertar mi decidirEstado()” y en las pruebas de frontera de la Guía 4.' }),
    dec.box, h('div', { class: 'row' }, libTest, libReset), libMsg));

  // Ajustes y progreso
  const fx = h('input', { type: 'checkbox', id: 'fixedtime' }); fx.checked = !!S.prefs.fixedTime;
  fx.addEventListener('change', () => { S.prefs.fixedTime = fx.checked; save(); });
  const imp = h('input', { type: 'file', accept: '.json,application/json', id: 'impfile', hidden: true });
  imp.addEventListener('change', () => {
    const f = imp.files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const o = JSON.parse(rd.result);
        if (!o || o.kind !== 'p1-10ele-progreso' || !o.state) throw new Error('formato');
        S = normalize(o.state); saveNow(); location.reload();
      } catch (e) { toast('Ese archivo no es un progreso válido de esta página.'); }
    };
    rd.readAsText(f); imp.value = '';
  });
  const expBtn = h('button', { class: 'btn small', type: 'button', text: 'Guardar mi progreso (.json)' });
  expBtn.addEventListener('click', () => {
    const name = 'Progreso_P1_10ELE_' + slug(S.team.nombre || (S.team.integrantes[0] && S.team.integrantes[0].nombre) || 'equipo') + '_' + new Date().toISOString().slice(0, 10) + '.json';
    download(name, JSON.stringify({ kind: 'p1-10ele-progreso', version: VERSION, at: new Date().toISOString(), state: S }), 'application/json');
  });
  const impBtn = h('button', { class: 'btn small ghost', type: 'button', text: 'Cargar progreso' });
  impBtn.addEventListener('click', () => imp.click());
  const wipe = h('button', { class: 'btn small ghost danger', type: 'button', text: 'Borrar todo mi trabajo' });
  confirmClick(wipe, () => { S = emptyState(); saveNow(); location.reload(); }, 'Se borrará TODO. Clic otra vez para confirmar');
  sec.append(h('div', { class: 'card' }, h('h3', { text: 'Ajustes y copia de seguridad' }),
    h('label', { class: 'check', for: 'fixedtime' }, fx, h('span', { html: '<b>Resultados reproducibles:</b> hace que <code>time(0)</code> devuelva siempre el mismo valor. Con <code>srand(time(0))</code> los números “aleatorios” serán los mismos en cada ejecución (útil para comparar resultados; el reporte lo indica).' })),
    h('p', { class: 'small', html: 'Tu trabajo se guarda automáticamente <b>en este navegador</b>. Si cambias de computador o borras los datos del navegador, se pierde. Guarda una copia cuando termines cada clase.' }),
    h('div', { class: 'row' }, expBtn, impBtn, imp, wipe)));

  // Limitaciones
  sec.append(h('details', { class: 'evalbox' }, h('summary', { text: 'Qué entiende este simulador de C++ (y qué no)' }),
    h('div', { class: 'small' },
      h('p', { html: 'Los programas se ejecutan con un <b>simulador de C++ incluido en esta página</b>, no con el compilador de Dev C++. Reproduce las reglas de g++ que más importan en estas guías: avisa si falta <code>using namespace std;</code>, si falta <code>#include &lt;fstream&gt;</code> o si llamas una función antes de declararla. Sus mensajes de error están en español.' }),
      h('p', { html: '<b>Soporta:</b> <code>int</code>, <code>long</code>, <code>float</code>, <code>double</code>, <code>bool</code>, <code>char</code>, <code>string</code>; <code>if</code>, <code>switch</code>, <code>for</code>, <code>while</code>, <code>do-while</code>; funciones propias (parámetros por valor y por referencia, valores por defecto, recursión); arreglos de una dimensión; <code>cout</code>, <code>cin</code>, <code>endl</code>, <code>setw</code>, <code>setprecision</code>, <code>fixed</code>; <code>ofstream</code> e <code>ifstream</code> con <code>ios::app</code>, <code>is_open</code>, <code>close</code>, <code>getline</code>, <code>eof</code> y <code>fail</code>; métodos de <code>string</code> (<code>length</code>, <code>substr</code>, <code>find</code>, <code>at</code>, <code>push_back</code>…); <code>rand</code>, <code>srand</code>, <code>time</code>; funciones de <code>&lt;cmath&gt;</code>.' }),
      h('p', { html: '<b>No soporta:</b> punteros, <code>struct</code> y <code>class</code>, <code>vector</code> y otras plantillas, arreglos de dos dimensiones, <code>printf</code> y <code>scanf</code>, varios archivos de código. Si usas algo de esa lista, el simulador te lo indica.' }),
      h('p', { html: '<b>Números aleatorios:</b> <code>rand()</code> genera la misma secuencia que Dev C++ en Windows para una misma semilla. Con <code>srand(time(0))</code> cambia en cada ejecución, como en el programa real.' }),
      h('p', { html: '<b>Archivos:</b> los archivos que crea tu programa son virtuales: existen solo dentro de esta página (panel “Archivos del programa”) y se conservan entre ejecuciones, igual que una carpeta. Un programa que lee un archivo debe encontrarlo allí.' }))));
  return sec;
}
const slug = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40) || 'equipo';
function download(name, text, mime) {
  const blob = new Blob([text], { type: (mime || 'text/html') + ';charset=utf-8' });
  const u = URL.createObjectURL(blob);
  const a = h('a', { href: u, download: name }); document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 3000);
}

/* ------------------------------------------------------------------ */
/* Reportes                                                            */
/* ------------------------------------------------------------------ */
function valueOfCell(c) {
  if (typeof c === 'string') return { kind: 'static', html: c };
  if (c.f) {
    const v = S.f[c.f];
    if (c.type === 'check') return { kind: 'val', text: v ? '☑ Sí' : '☐ No', raw: v ? 'Sí' : 'No', id: c.f, label: c.label };
    return { kind: 'val', text: v == null || String(v).trim() === '' ? '' : String(v), raw: v == null ? '' : String(v), id: c.f, label: c.label };
  }
  if (c.obs) { const v = S.f[c.id]; return { kind: 'obs', text: v == null ? '' : String(v), raw: v == null ? '' : String(v), id: c.id, label: c.label, cmpWith: c.cmpWith }; }
  return { kind: 'static', html: '' };
}

function collectReport(repId) {
  const items = []; const editors = []; const parts = [];
  const addItem = (id, label, value) => items.push({ id, label, value: value == null ? '' : String(value) });
  eachBlock((b, rep) => {
    if (rep !== repId) return;
    switch (b.t) {
      case 'h': parts.push(`<h2>${esc(b.text)}</h2>`); break;
      case 'code': {
        const r = S.r[b.id]; const code = getCode(b.id);
        editors.push({ id: b.id, title: b.title, code, runs: r ? r.runs : 0, ce: r ? r.ce : 0, re: r ? r.re : 0, at: r ? r.at : null, compiled: r ? r.compiled : null, out: r ? r.out : '', errTxt: r ? r.errTxt : '', errors: r ? r.errors : [], rt: r ? r.rt : null, warn: r ? r.warn : [], files: r ? r.files : {}, stdin: r ? r.stdin : '', fixed: r ? r.fixed : false, wrap: !!b.wrap });
        let s = `<div class="code-block"><div class="cb-head">Programa: ${esc(b.title)}${b.wrap ? ' <span class="tag">fragmento dentro de main()</span>' : ''}</div><pre class="code">${esc(code)}</pre>`;
        if (!r || !r.runs) s += `<div class="cb-meta bad">Este programa no fue ejecutado.</div>`;
        else {
          s += `<div class="cb-meta">Ejecuciones: <b>${r.runs}</b> · con errores de compilación: <b>${r.ce}</b> · con error en ejecución: <b>${r.re}</b> · última: ${esc(fmtDate(r.at))} · estado: <b>${r.compiled ? (r.rtErr ? 'compiló, error en ejecución' : 'compiló y se ejecutó') : 'errores de compilación'}</b>${r.fixed ? ' · time(0) fijo' : ''}</div>`;
          if (!r.compiled) s += `<div class="cb-err">${(r.errors || []).map(e => esc((e.line > 0 ? 'Línea ' + e.line + ': ' : '') + e.msg)).join('<br>')}</div>`;
          else {
            s += `<div class="cb-sub">Salida de la última ejecución</div><pre class="out">${esc(r.out || '(sin salida)')}${r.errTxt ? '<span class="e">' + esc(r.errTxt) + '</span>' : ''}</pre>`;
            if (r.rt) s += `<div class="cb-err">Error en ejecución: ${esc(r.rt.msg)}</div>`;
            if (r.warn && r.warn.length) s += `<div class="cb-warn">Advertencias: ${r.warn.map(esc).join(' · ')}</div>`;
            if (r.stdin) s += `<div class="cb-sub">Entrada (cin)</div><pre class="out">${esc(r.stdin)}</pre>`;
            const fn = Object.keys(r.files || {});
            if (fn.length) s += `<div class="cb-sub">Archivos al terminar la última ejecución</div>` + fn.map(n => `<div class="fileblock"><b>${esc(n)}</b> (${countLines(r.files[n])} líneas)<pre class="out">${esc(r.files[n].split('\n').slice(0, 40).join('\n'))}${r.files[n].split('\n').length > 41 ? '\n…' : ''}</pre></div>`).join('');
          }
        }
        s += '</div>'; parts.push(s);
        addItem(b.id + '#codigo', 'Código: ' + b.title, code);
        break;
      }
      case 'tbl': {
        let s = '<table class="qa"><thead><tr>' + b.head.map(x => `<th>${esc(x)}</th>`).join('') + '</tr></thead><tbody>';
        for (const row of b.rows) {
          s += '<tr>';
          row.cells.forEach(c => {
            const v = valueOfCell(c);
            if (v.kind === 'static') s += `<td>${v.html}</td>`;
            else {
              let t = esc(v.text).replace(/\n/g, '<br>');
              if (v.kind === 'obs' && v.cmpWith && v.text && S.f[v.cmpWith] != null && String(S.f[v.cmpWith]).trim() !== '') t += ` <span class="${sameVal(S.f[v.cmpWith], v.text) ? 'okc' : 'badc'}">${sameVal(S.f[v.cmpWith], v.text) ? '✓ coincide' : '✗ no coincide'}</span>`;
              s += `<td>${t || '<span class="empty">(sin respuesta)</span>'}</td>`;
              addItem(v.id, v.label || v.id, v.raw);
            }
          });
          s += '</tr>';
        }
        parts.push(s + '</tbody></table>');
        break;
      }
      case 'free': {
        const v = S.f[b.id];
        parts.push(`<div class="qa-free"><div class="q">${b.label}</div><div class="a">${v && String(v).trim() ? esc(v).replace(/\n/g, '<br>') : '<span class="empty">(sin respuesta)</span>'}</div></div>`);
        addItem(b.id, stripTags(b.label), v);
        break;
      }
      case 'chk': {
        parts.push(`<div class="qa-free"><div class="q">${esc(b.title)}</div><ul class="chk">${b.items.map(it => `<li>${S.f[it.id] ? '☑' : '☐'} ${esc(it.label)}</li>`).join('')}</ul></div>`);
        b.items.forEach(it => addItem(it.id, it.label, S.f[it.id] ? 'Sí' : 'No'));
        break;
      }
      case 'g4tests': {
        const libSame = norm(S.lib.dec).replace(/\s+/g, '') === norm(DEFAULT_DEC).replace(/\s+/g, '');
        let s = `<h3>Función decidirEstado() usada en las pruebas</h3>${libSame ? '<div class="cb-warn">Es la función de ejemplo sin modificar.</div>' : ''}<pre class="code">${esc(S.lib.dec)}</pre>`;
        s += '<h3>Ejemplo guiado (umbral 400)</h3><table class="qa"><thead><tr><th>Valor</th><th>Esperado</th><th>Obtenido</th><th></th></tr></thead><tbody>';
        b.ex.forEach((r, i) => { const o = S.f[`g4.t.ex.${i + 1}.o`] || ''; s += `<tr><td>${r[0]}</td><td>${esc(r[1])}</td><td>${esc(o) || '<span class="empty">(sin probar)</span>'}</td><td>${o ? (norm(o) === norm(r[1]) ? '<span class="okc">✓ coincide</span>' : '<span class="badc">✗ no coincide</span>') : ''}</td></tr>`; addItem(`g4.t.ex.${i + 1}.o`, `Ejemplo ${r[0]}: obtenido`, o); });
        s += `</tbody></table><h3>Casos de frontera del proyecto (umbral ${esc(S.f['g4.umbral'] || '?')})</h3><table class="qa"><thead><tr><th>Caso</th><th>Valor elegido</th><th>Esperado</th><th>Obtenido</th><th></th></tr></thead><tbody>`;
        addItem('g4.umbral', 'Umbral de mi proyecto', S.f['g4.umbral']);
        b.cases.forEach((c, i) => {
          const n = i + 1; const v = S.f[`g4.t.${n}.v`] || '', e = S.f[`g4.t.${n}.e`] || '', o = S.f[`g4.t.${n}.o`] || '';
          s += `<tr><td>${esc(c)}</td><td>${esc(v)}</td><td>${esc(e)}</td><td>${esc(o) || '<span class="empty">(sin probar)</span>'}</td><td>${o && e ? (norm(o) === norm(e) ? '<span class="okc">✓ coincide</span>' : '<span class="badc">✗ no coincide</span>') : ''}</td></tr>`;
          addItem(`g4.t.${n}.v`, `Caso ${c}: valor`, v); addItem(`g4.t.${n}.e`, `Caso ${c}: esperado`, e); addItem(`g4.t.${n}.o`, `Caso ${c}: obtenido`, o);
        });
        parts.push(s + '</tbody></table>');
        break;
      }
    }
  });
  return { items, editors, html: parts.join('\n') };
}

const REPORT_CSS = `
:root{--navy:#1F4E79;--ink:#1b2733;--sub:#55636f;--line:#d5dde6;--ok:#2b7a52;--bad:#b3343f;--warn:#9a6a14}
*{box-sizing:border-box}body{margin:0;background:#eef1f5;color:var(--ink);font:15px/1.5 system-ui,"Segoe UI",Calibri,Arial,sans-serif}
.page{max-width:900px;margin:18px auto;background:#fff;padding:28px 34px;border:1px solid var(--line);border-radius:10px}
header.rh{display:flex;gap:16px;align-items:center;border-bottom:3px solid var(--navy);padding-bottom:12px;margin-bottom:14px}
header.rh img{width:64px;height:64px;object-fit:contain}
.inst{font-size:12px;letter-spacing:.04em;color:var(--sub)}h1{font-size:21px;margin:2px 0;color:var(--navy)}.sub{color:var(--sub);font-size:14px}
h2{font-size:17px;margin:24px 0 8px;color:var(--navy);border-bottom:1px solid var(--line);padding-bottom:3px}h3{font-size:14.5px;margin:14px 0 6px}
table{border-collapse:collapse;width:100%;margin:8px 0;font-size:14px}th,td{border:1px solid var(--line);padding:6px 9px;text-align:left;vertical-align:top}th{background:#e9f0f7}
table.team th{width:26%}td code{font-family:ui-monospace,Consolas,monospace;font-size:13px}
.empty{color:#9aa6b2;font-style:italic}.okc{color:var(--ok);font-weight:700}.badc{color:var(--bad);font-weight:700}
.qa-free{margin:10px 0}.qa-free .q{font-weight:650}.qa-free .a{border-left:3px solid var(--line);padding:4px 10px;margin-top:3px;background:#fafbfc}
ul.chk{list-style:none;padding-left:0;margin:4px 0}
.code-block{border:1px solid var(--line);border-radius:8px;margin:12px 0;overflow:hidden}.cb-head{background:#e9f0f7;padding:6px 10px;font-weight:700;font-size:14px}.tag{font-weight:400;font-size:12px;color:var(--sub)}
pre{margin:0;white-space:pre-wrap;word-break:break-word;font:12.5px/1.5 ui-monospace,Consolas,"DejaVu Sans Mono",monospace}
pre.code{background:#f6f8fa;padding:10px 12px}pre.out{background:#14212d;color:#e6edf3;padding:8px 12px}pre.out .e{color:#ff9aa1}
.cb-meta{padding:6px 10px;font-size:13px;color:var(--sub)}.cb-meta.bad,.cb-err{color:var(--bad)}.cb-err{padding:6px 10px;font-size:13px}.cb-warn{padding:6px 10px;font-size:13px;color:var(--warn)}
.cb-sub{padding:4px 10px 2px;font-size:12.5px;font-weight:700;color:var(--sub)}.fileblock{padding:2px 10px 8px;font-size:13px}
.hash{font:12px ui-monospace,Consolas,monospace;word-break:break-all;background:#f6f8fa;border:1px solid var(--line);padding:8px 10px;border-radius:6px;margin-top:6px}
.foot{margin-top:22px;font-size:12px;color:var(--sub)}.warnbox{background:#fdf5e6;border-left:4px solid #b7791f;padding:8px 12px;margin:10px 0;border-radius:6px;font-size:13.5px}
button.pr{border:0;background:var(--navy);color:#fff;border-radius:8px;padding:8px 14px;font-weight:650;cursor:pointer;float:right}
@media print{body{background:#fff}.page{border:0;margin:0;padding:0;max-width:none}button.pr{display:none}.code-block,tr,.qa-free{break-inside:avoid}pre.out{background:#f1f1f1;color:#000;border:1px solid #bbb}pre.out .e{color:#900}}
@media (max-width:640px){.page{padding:16px}header.rh{flex-direction:column;align-items:flex-start}}
`;

function buildReport(repId) {
  const rep = REPORTS[repId];
  const data = collectReport(repId);
  const st = repStatus(repId);
  const generatedAt = new Date().toISOString();
  const team = { nombre: S.team.nombre, grupo: S.team.grupo, integrantes: S.team.integrantes.filter(m => m.nombre.trim()) };
  const libSame = norm(S.lib.dec).replace(/\s+/g, '') === norm(DEFAULT_DEC).replace(/\s+/g, '');
  const payload = { v: 1, app: 'p1-10ele-p4', version: VERSION, rep: repId, title: rep.title, sub: rep.sub, generatedAt, team, completion: { done: st.done, total: st.total, missing: st.missing.map(m => m.label) }, items: data.items, editors: data.editors, libDefault: libSame, fixedTime: !!S.prefs.fixedTime };
  const json = JSON.stringify(payload);
  const hash = sha256(json);
  const hashShow = hash.slice(0, 32).match(/.{8}/g).join('-');
  const missingHtml = st.missing.length ? `<div class="warnbox"><b>Elementos sin completar (${st.missing.length}):</b> ${st.missing.slice(0, 12).map(m => esc(m.label)).join('; ')}${st.missing.length > 12 ? '; …' : ''}</div>` : '';
  const mk = (bodyHash) => `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(rep.title)} · ${esc(rep.sub.split(':')[0])} · ${esc(S.team.nombre || (team.integrantes[0] && team.integrantes[0].nombre) || 'Equipo')}</title><meta name="p1-hash" content="${hash}"><meta name="p1-body" content="${bodyHash}"><style>${REPORT_CSS}</style></head><body><div class="page">
<!--BODY--><button class="pr" onclick="window.print()">Imprimir / Guardar PDF</button>
<header class="rh">${LOGO ? `<img src="${LOGO}" alt="Escudo institucional">` : ''}<div><div class="inst">INSTITUTO TÉCNICO VEINTISÉIS DE MARZO · BARRANCABERMEJA</div><h1>${esc(rep.title)}</h1><div class="sub">${esc(rep.sub)}</div></div></header>
<table class="team"><tr><th>Asignatura y periodo</th><td>Programación 1 · Periodo 4 · Estación Escolar Inteligente</td></tr>
<tr><th>Docente</th><td>Diego Ricardo Páez Ardila</td></tr>
<tr><th>Grupo</th><td>${esc(team.grupo)}</td></tr>
${team.nombre ? `<tr><th>Equipo o proyecto</th><td>${esc(team.nombre)}</td></tr>` : ''}
<tr><th>Integrantes</th><td>${team.integrantes.map(m => esc(m.nombre) + (m.rol ? ' (' + esc(m.rol) + ')' : '')).join('<br>') || '<span class="empty">(sin registrar)</span>'}</td></tr>
<tr><th>Generado</th><td>${esc(fmtDate(generatedAt))}</td></tr>
<tr><th>Elementos completos</th><td>${st.done} de ${st.total}</td></tr>
${S.prefs.fixedTime ? '<tr><th>Ejecución</th><td>time(0) fijo (resultados reproducibles)</td></tr>' : ''}</table>
${missingHtml}${libSame && repId === 'g4' ? '<div class="warnbox">La función decidirEstado() de la biblioteca es la función de ejemplo sin modificar.</div>' : ''}
${data.html}
<!--/BODY-->
<div class="foot"><b>Verificación de integridad</b><div class="hash">SHA-256 de los datos: ${hash}<br>SHA-256 del contenido visible: ${bodyHash}</div>Este reporte fue generado por la página “Programación 1 · Guías 2 a 4” (versión ${VERSION}). El docente puede comprobar que el contenido no fue modificado después de generarse.</div>
</div><script type="application/json" id="p1-payload">${json.replace(/</g, '\\u003c')}<\/script></body></html>`;
  const bodyOf = t => { const i = t.indexOf('<!--BODY-->'), j = t.indexOf('<!--/BODY-->'); return t.slice(i, j); };
  const bodyHash = sha256(bodyOf(mk('')));
  const html = mk(bodyHash);
  return { html, hash, hashShow };
}

function reportName(repId) {
  const who = S.team.nombre.trim() || (S.team.integrantes[0] && S.team.integrantes[0].nombre) || 'equipo';
  return 'Reporte_' + repId.toUpperCase() + '_10ELE_' + slug(who) + '.html';
}

/* ------------------------------------------------------------------ */
/* Mi entrega                                                          */
/* ------------------------------------------------------------------ */
function renderEntrega() {
  const sec = $('#entrega'); sec.innerHTML = '';
  sec.append(h('span', { class: 'eyebrow', text: 'Entrega por clase' }), h('h2', { text: 'Mi entrega' }),
    h('p', { class: 'muted', text: 'Cada reporte reúne tus respuestas, tu código, la salida de la última ejecución y los resultados de las verificaciones. Descarga el reporte de cada clase y entrégalo como indique tu docente. No necesitas entregar archivos .cpp aparte.' }));
  const teamBox = h('div', { class: 'card' });
  const teamUpd = () => {
    teamBox.innerHTML = '';
    if (teamOk()) teamBox.append(h('div', { class: 'msg ok small', html: '<b>Equipo:</b> ' + esc(S.team.nombre || '(sin nombre de equipo)') + ' · ' + esc(S.team.grupo) + ' · ' + esc(S.team.integrantes.filter(m => m.nombre.trim()).map(m => m.nombre.trim()).join(', ')) }));
    else teamBox.append(h('div', { class: 'msg bad' }, h('b', { text: 'Faltan los datos del equipo. ' }), 'Escribe el grupo y al menos un integrante en la pestaña Inicio antes de descargar los reportes. ', h('a', { class: 'btn small', href: '#inicio', text: 'Ir a Inicio' })));
  };
  CHIPS.push(teamUpd); teamUpd();
  sec.append(teamBox);

  const grid = h('div', { class: 'repgrid' });
  for (const [id, rep] of Object.entries(REPORTS)) {
    const prog = h('span'); const lab = h('p', { class: 'small' }); const miss = h('ul', { class: 'small miss' });
    const dl = h('button', { class: 'btn', type: 'button', text: 'Descargar reporte (.html)' });
    const view = h('button', { class: 'btn ghost', type: 'button', text: 'Ver / imprimir' });
    const note = h('p', { class: 'xs muted' });
    const upd = () => {
      const st = repStatus(id);
      prog.style.width = (st.total ? st.done / st.total * 100 : 0) + '%';
      lab.textContent = st.done + ' de ' + st.total + ' elementos completos';
      miss.innerHTML = ''; st.missing.slice(0, 5).forEach(m => miss.append(h('li', { text: 'Falta: ' + m.label })));
      if (st.missing.length > 5) miss.append(h('li', { text: '… y ' + (st.missing.length - 5) + ' más' }));
      const ok = teamOk(); dl.disabled = !ok; view.disabled = !ok;
      note.textContent = ok ? (st.missing.length ? 'Puedes descargarlo incompleto; el reporte indicará lo que falta.' : 'Listo para entregar.') : 'Completa los datos del equipo en Inicio.';
    };
    PROGRESS.push(upd); upd();
    dl.addEventListener('click', () => { const r = buildReport(id); download(reportName(id), r.html, 'text/html'); toast('Reporte descargado. Huella ' + r.hashShow.slice(0, 17) + '…'); });
    view.addEventListener('click', () => { const r = buildReport(id); const u = URL.createObjectURL(new Blob([r.html], { type: 'text/html;charset=utf-8' })); window.open(u, '_blank'); setTimeout(() => URL.revokeObjectURL(u), 60000); });
    grid.append(h('div', { class: 'card repcard' }, h('span', { class: 'eyebrow', text: rep.title }), h('h3', { text: rep.sub }), h('div', { class: 'progress' }, prog), lab, miss, h('div', { class: 'row' }, dl, view), note));
  }
  sec.append(grid);

  // Verificación (docente)
  const vres = h('div', { class: 'vres' });
  const vf = h('input', { type: 'file', accept: '.html,text/html', multiple: true, id: 'vfile', 'aria-label': 'Seleccionar reportes para verificar' });
  vf.addEventListener('change', async () => {
    vres.innerHTML = '';
    for (const f of Array.from(vf.files)) {
      const text = await f.text();
      const card = h('div', { class: 'card vcard' });
      const m = /<script type="application\/json" id="p1-payload">([\s\S]*?)<\/script>/.exec(text);
      const hm = /<meta name="p1-hash" content="([0-9a-f]{64})"/.exec(text);
      if (!m || !hm) { card.append(h('b', { text: f.name }), h('div', { class: 'msg bad', text: 'No es un reporte de esta página.' })); vres.append(card); continue; }
      let p; try { p = JSON.parse(m[1]); } catch (e) { card.append(h('b', { text: f.name }), h('div', { class: 'msg bad', text: 'El contenido del reporte está dañado.' })); vres.append(card); continue; }
      const calc = sha256(JSON.stringify(p));
      const bm = /<meta name="p1-body" content="([0-9a-f]{64})"/.exec(text);
      const bi = text.indexOf('<!--BODY-->'), bj = text.indexOf('<!--/BODY-->');
      const bodyOk = !!bm && bi >= 0 && bj > bi && sha256(text.slice(bi, bj)) === bm[1];
      const intact = calc === hm[1] && bodyOk;
      card.append(h('div', { class: 'step-h' }, h('b', { text: f.name }), h('span', { class: 'chip ' + (intact ? 'ok' : 'bad'), text: intact ? '✓ Íntegro' : '✗ Alterado' })));
      card.append(h('p', { class: 'small', html: `<b>${esc(p.title)}</b> · ${esc(p.sub)}<br>Grupo ${esc(p.team.grupo)} · ${esc((p.team.integrantes || []).map(x => x.nombre).join(', '))}${p.team.nombre ? ' · Equipo: ' + esc(p.team.nombre) : ''}<br>Generado: ${esc(fmtDate(p.generatedAt))} · Completos: ${p.completion.done} de ${p.completion.total}${p.libDefault && p.rep === 'g4' ? ' · <b>decidirEstado() es el ejemplo sin modificar</b>' : ''}` }));
      if (!intact) card.append(h('div', { class: 'msg bad small', text: 'La huella calculada no coincide con la del archivo: el contenido fue modificado después de generarse.' }));
      (p.editors || []).filter(e => e.runs > 0).forEach(e => {
        const out = h('pre', { class: 'out vout', hidden: true });
        const btn = h('button', { class: 'btn small ghost', type: 'button', text: 'Ejecutar de nuevo: ' + e.title });
        btn.addEventListener('click', () => {
          const src = e.wrap ? WRAP_HEAD + e.code + WRAP_TAIL : e.code;
          const res = CJ.run(src, { files: {}, stdin: e.stdin || '', fixedTime: e.fixed ? FIXED_TIME : null });
          out.hidden = false;
          out.textContent = res.compileErrors.length ? 'ERRORES DE COMPILACIÓN:\n' + res.compileErrors.map(x => 'Línea ' + (x.line - (e.wrap ? WRAP_LINES : 0)) + ': ' + x.msg).join('\n') : res.out.map(s => s.s).join('') + (res.runtimeError ? '\n[Error en ejecución: ' + res.runtimeError.msg + ']' : '');
          const same = !res.compileErrors.length && res.out.filter(s => !s.err).map(s => s.s).join('') === (e.out || '');
          out.textContent += '\n\n' + (same ? 'La salida coincide con la del reporte.' : 'La salida difiere de la del reporte (normal si el programa usa srand(time(0)) sin tiempo fijo).');
        });
        card.append(h('div', { class: 'row' }, btn), out);
      });
      vres.append(card);
    }
  });
  sec.append(h('details', { class: 'evalbox' }, h('summary', { text: 'Verificar reportes (uso del docente)' }),
    h('p', { class: 'small', text: 'Selecciona uno o varios reportes descargados. La página recalcula su huella para detectar cambios posteriores y permite ejecutar de nuevo el código de cada programa.' }), vf, vres));
  return sec;
}

/* ------------------------------------------------------------------ */
/* Navegación e inicio                                                 */
/* ------------------------------------------------------------------ */
const TABS = [['inicio', 'inicio', 'Inicio']].concat(GUIDES.map(g => [g.id, 'guia' + g.n, 'Guía ' + g.n])).concat([['entrega', 'entrega', 'Mi entrega']]);
const byHash = h0 => TABS.find(t => t[1] === h0);
function pageTitle(id) {
  const g = GUIDES.find(x => x.id === id);
  if (g) return 'Guía ' + g.n + ' · ' + g.title.split(':')[0] + ' · Programación 1 10 ELE';
  return (id === 'entrega' ? 'Mi entrega' : 'Inicio') + ' · Programación 1 10 ELE · Periodo 4';
}
function go(t, noScroll) {
  $$('.view').forEach(v => { v.hidden = v.id !== t; });
  $$('.tab').forEach(b => { const on = b.dataset.tab === t; b.setAttribute('aria-selected', on ? 'true' : 'false'); if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  S.tab = t; save(); document.title = pageTitle(t);
  refreshAll();
  const sec = $('#' + t);
  $$('textarea', sec).forEach(x => { if (x._grow) x._grow(); });
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  const hd = $('h2', sec); if (hd && !noScroll) { hd.setAttribute('tabindex', '-1'); hd.focus({ preventScroll: true }); }
  const cur = $('.tab[aria-current]'); if (cur && cur.scrollIntoView) { const nav = $('#tabs'); nav.scrollLeft = Math.max(0, cur.offsetLeft - 20); }
}
function fromHash(noFocus) {
  const k = byHash(location.hash.replace('#', ''));
  go(k ? k[0] : 'inicio', noFocus);
}
function init() {
  if (!storageOK) $('#storageWarn').hidden = false;
  const tabs = $('#tabs');
  TABS.forEach(([id, hs, label], i) => tabs.append(h('a', { class: 'tab', href: '#' + hs, 'data-tab': id, 'aria-selected': 'false', text: i > 0 && i < TABS.length - 1 ? label + ' · ' + GUIDES[i - 1].title.split(':')[0] : label })));
  renderInicio();
  const main = $('#main');
  GUIDES.forEach(g => main.insertBefore(renderGuide(g), $('#entrega')));
  renderEntrega();
  TABS.forEach(([id], i) => {
    const sec = $('#' + id); const pv = TABS[i - 1], nx = TABS[i + 1];
    sec.append(h('div', { class: 'pager noprint' },
      pv ? h('a', { class: 'btn ghost', href: '#' + pv[1], text: '← ' + pv[2] }) : h('span'),
      nx ? h('a', { class: 'btn', href: '#' + nx[1], text: nx[2] + ' →' }) : null));
  });
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]'); if (!a || e.defaultPrevented || e.button || e.ctrlKey || e.metaKey || e.shiftKey) return;
    const k = byHash(a.getAttribute('href').slice(1)); if (!k) return;
    e.preventDefault();
    if (location.hash !== '#' + k[1]) history.pushState(null, '', '#' + k[1]);
    go(k[0], false);
  });
  window.addEventListener('hashchange', () => { fromHash(false); requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })); });
  fromHash(true);
  refreshAll();
}
window.P1 = { S: () => S, buildReport, sha256, repStatus, findFunction, upsertFunction, computeObs, sameVal, go };
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
}());
