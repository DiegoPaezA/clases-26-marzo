/* cppjs.js
 * Intérprete didáctico de un subconjunto de C++ (para Programación 1, 10 ELE).
 * Sin dependencias. Funciona en navegador y en Node.
 * Soporta: tipos básicos, string, funciones, ciclos, arreglos 1D, cout/cin,
 * ofstream/ifstream con sistema de archivos virtual, rand/srand/time.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CppJS = factory();
}(typeof self !== 'undefined' ? self : this, function () {
'use strict';

class CppError extends Error {
  constructor(msg, line, kind) { super(msg); this.line = line || 0; this.kind = kind || 'compile'; }
}
const unsupported = (what, line) => new CppError(`${what} no está disponible en este simulador. Esa parte se prueba en Dev C++.`, line);

/* ------------------------------------------------------------------ */
/* LEXER                                                               */
/* ------------------------------------------------------------------ */
const KNOWN_HEADERS = new Set(['iostream','fstream','string','cstdlib','ctime','cmath','iomanip','cstring','cctype','cstdio','stdlib.h','time.h','math.h','string.h','ctype.h','stdio.h','algorithm','climits','cfloat','sstream','vector','conio.h','windows.h']);
const HEADER_CANON = {'stdlib.h':'cstdlib','time.h':'ctime','math.h':'cmath','string.h':'cstring','ctype.h':'cctype','stdio.h':'cstdio'};
const isDigit = c => c >= '0' && c <= '9';
const isIdStart = c => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_';
const isIdChar = c => isIdStart(c) || isDigit(c);
const PUNCT3 = ['<<=','>>=','...'];
const PUNCT2 = ['<<','>>','<=','>=','==','!=','&&','||','++','--','+=','-=','*=','/=','%=','&=','|=','^=','->','::'];

function lex(src) {
  const includes = [];
  const defines = new Map();
  const out = [];

  function lexText(text, baseLine, sink, depth, top) {
    let i = 0, line = baseLine; const n = text.length;
    let lineStart = true;
    const push = (k, v, extra) => { const t = { k, v, line }; if (extra) Object.assign(t, extra); sink.push(t); };
    while (i < n) {
      const c = text[i];
      if (c === '\n') { line++; i++; lineStart = true; continue; }
      if (c === ' ' || c === '\t' || c === '\r' || c === '\f' || c === '\v') { i++; continue; }
      if (c === '/' && text[i + 1] === '/') { while (i < n && text[i] !== '\n') i++; continue; }
      if (c === '/' && text[i + 1] === '*') {
        const s = line; i += 2;
        while (i < n && !(text[i] === '*' && text[i + 1] === '/')) { if (text[i] === '\n') line++; i++; }
        if (i >= n) throw new CppError('Comentario /* sin cerrar con */', s);
        i += 2; continue;
      }
      if (c === '#') {
        if (!top) throw new CppError('Directiva # no permitida aquí', line);
        let j = i; while (j < n && text[j] !== '\n') j++;
        directive(text.slice(i + 1, j).trim(), line);
        i = j; continue;
      }
      lineStart = false;
      if (isIdStart(c)) {
        let j = i + 1; while (j < n && isIdChar(text[j])) j++;
        const w = text.slice(i, j);
        if (defines.has(w) && depth < 8) {
          const tmp = []; lexText(defines.get(w), line, tmp, depth + 1, false);
          for (const t of tmp) { t.line = line; sink.push(t); }
        } else push('id', w);
        i = j; continue;
      }
      if (isDigit(c) || (c === '.' && isDigit(text[i + 1] || ''))) {
        let j = i, isFloat = false, value;
        if (c === '0' && (text[i + 1] === 'x' || text[i + 1] === 'X')) {
          j = i + 2; while (/[0-9a-fA-F]/.test(text[j] || '')) j++;
          value = parseInt(text.slice(i + 2, j), 16);
        } else {
          while (isDigit(text[j] || '')) j++;
          if (text[j] === '.') { isFloat = true; j++; while (isDigit(text[j] || '')) j++; }
          if (text[j] === 'e' || text[j] === 'E') {
            let k = j + 1; if (text[k] === '+' || text[k] === '-') k++;
            if (isDigit(text[k] || '')) { isFloat = true; j = k; while (isDigit(text[j] || '')) j++; }
          }
          value = parseFloat(text.slice(i, j));
        }
        let suf = ''; while (/[uUlLfF]/.test(text[j] || '')) { suf += text[j].toLowerCase(); j++; }
        if (isIdChar(text[j] || '')) throw new CppError(`Número mal formado cerca de '${text.slice(i, j + 1)}'`, line);
        let t;
        if (isFloat) t = suf.includes('f') ? 'f' : 'd';
        else t = (suf.includes('l') || value > 2147483647) ? 'l' : 'i';
        push('num', value, { t });
        i = j; continue;
      }
      if (c === '"') {
        let j = i + 1, s = '';
        while (j < n && text[j] !== '"') {
          if (text[j] === '\n') throw new CppError('Texto entre comillas sin cerrar (falta ")', line);
          if (text[j] === '\\') { const r = escape(text, j); s += r.ch; j = r.next; } else { s += text[j]; j++; }
        }
        if (j >= n) throw new CppError('Texto entre comillas sin cerrar (falta ")', line);
        push('str', s); i = j + 1; continue;
      }
      if (c === "'") {
        let j = i + 1, ch;
        if (text[j] === '\\') { const r = escape(text, j); ch = r.ch; j = r.next; } else { ch = text[j]; j++; }
        if (text[j] !== "'") throw new CppError("Constante de carácter mal formada: use comillas simples con un solo carácter, por ejemplo 'a'", line);
        push('chr', ch.charCodeAt(0)); i = j + 1; continue;
      }
      let matched = null;
      for (const p of PUNCT3) if (text.startsWith(p, i)) { matched = p; break; }
      if (!matched) for (const p of PUNCT2) if (text.startsWith(p, i)) { matched = p; break; }
      if (!matched) matched = c;
      if (!'+-*/%=<>!&|^~?:;,.(){}[]'.includes(matched[0])) throw new CppError(`Carácter no válido '${c}'`, line);
      push('op', matched); i += matched.length;
    }
    if (top) push('eof', null);
  }

  function escape(text, j) {
    const e = text[j + 1];
    const map = { n: '\n', t: '\t', r: '\r', '0': '\0', '\\': '\\', '"': '"', "'": "'", a: '\x07', b: '\b', f: '\f', v: '\v' };
    if (e === 'x') { let k = j + 2, h = ''; while (/[0-9a-fA-F]/.test(text[k] || '') && h.length < 2) h += text[k++]; return { ch: String.fromCharCode(parseInt(h || '0', 16)), next: k }; }
    if (e in map) return { ch: map[e], next: j + 2 };
    return { ch: e, next: j + 2 };
  }

  function directive(text, line) {
    let m;
    if ((m = /^include\s*<([^>]+)>/.exec(text))) {
      const name = m[1].trim();
      if (!KNOWN_HEADERS.has(name)) throw new CppError(`No se encontró el archivo de encabezado <${name}>`, line);
      includes.push({ name: HEADER_CANON[name] || name, line });
    } else if ((m = /^include\s*"([^"]+)"/.exec(text))) {
      throw new CppError(`No se encontró el archivo "${m[1]}" (este simulador solo admite encabezados estándar con <>)`, line);
    } else if ((m = /^define\s+([A-Za-z_]\w*)(\(?)\s*(.*)$/.exec(text))) {
      if (m[2] === '(') throw unsupported('Un #define con parámetros (macro con argumentos)', line);
      defines.set(m[1], m[3] || '');
    } else if (/^pragma\b/.test(text)) { /* ignorar */ }
    else throw unsupported(`La directiva #${text.split(/\s/)[0]}`, line);
  }

  lexText(src, 1, out, 0, true);
  return { toks: out, includes };
}

/* ------------------------------------------------------------------ */
/* PARSER                                                              */
/* ------------------------------------------------------------------ */
const TYPE_WORDS = new Set(['int','long','short','unsigned','signed','float','double','bool','char','void','string','ofstream','ifstream','fstream','auto','size_t']);
const RESERVED = new Set(['if','else','for','while','do','return','break','continue','switch','case','default','int','long','short','unsigned','signed','float','double','bool','char','void','const','static','true','false','struct','class','enum','typedef','goto','namespace','using','new','delete','sizeof','nullptr']);
const UNSUPPORTED_TYPES = new Set(['vector','map','set','array','list','stack','queue','deque','pair','unique_ptr','shared_ptr','stringstream','istringstream','ostringstream','struct','class','enum','typedef','template','union']);
const BINPREC = { '||': 1, '&&': 2, '|': 3, '^': 4, '&': 5, '==': 6, '!=': 6, '<': 7, '>': 7, '<=': 7, '>=': 7, '<<': 8, '>>': 8, '+': 9, '-': 9, '*': 10, '/': 10, '%': 10 };
const ASSIGN_OPS = new Set(['=','+=','-=','*=','/=','%=','&=','|=','^=','<<=','>>=']);

function tokText(t) {
  if (t.k === 'eof') return 'fin del archivo';
  if (t.k === 'str') return '"' + t.v + '"';
  if (t.k === 'chr') return "'" + String.fromCharCode(t.v) + "'";
  return String(t.v);
}

class Parser {
  constructor(toks) { this.t = toks; this.p = 0; this.usingStd = false; this.usingNames = new Set(); }
  peek(o = 0) { return this.t[Math.min(this.p + o, this.t.length - 1)]; }
  next() { const t = this.t[this.p]; if (this.p < this.t.length - 1) this.p++; return t; }
  prevLine() { return this.p > 0 ? this.t[this.p - 1].line : 1; }
  isOp(v, o = 0) { const t = this.peek(o); return t.k === 'op' && t.v === v; }
  isId(v, o = 0) { const t = this.peek(o); return t.k === 'id' && t.v === v; }
  acceptOp(v) { if (this.isOp(v)) { this.next(); return true; } return false; }
  fail(v) {
    const t = this.peek();
    const near = t.k === 'eof' ? 'el final del programa' : `'${tokText(t)}'`;
    const line = (v === ';' || v === ')' || v === '}' || v === ']') ? this.prevLine() : t.line;
    if (v === ';') throw new CppError(`Falta un ';' antes de ${near}`, line);
    if (v === ')') throw new CppError(`Falta cerrar un paréntesis ')' antes de ${near}`, line);
    if (v === '}') throw new CppError(`Falta cerrar una llave '}' antes de ${near}`, line);
    throw new CppError(`Se esperaba '${v}' antes de ${near}`, line);
  }
  expectOp(v) { if (this.isOp(v)) return this.next(); this.fail(v); }
  expectSemi() { if (this.isOp(';')) return this.next(); this.fail(';'); }

  parseProgram() {
    const items = [];
    while (this.peek().k !== 'eof') {
      const t = this.peek();
      if (t.k === 'id' && t.v === 'using') { this.parseUsing(); continue; }
      if (t.k === 'op' && t.v === ';') { this.next(); continue; }
      if (t.k === 'id' && UNSUPPORTED_TYPES.has(t.v)) throw unsupported(`'${t.v}'`, t.line);
      const line = t.line;
      const ts = this.parseTypeSpec();
      if (!ts) {
        if (t.k === 'op' && t.v === '}') throw new CppError("Hay una llave '}' de más", t.line);
        throw new CppError(`Se esperaba una función o declaración, pero se encontró '${tokText(t)}'. Las instrucciones deben ir dentro de una función.`, t.line);
      }
      const nameTok = this.peek();
      if (nameTok.k !== 'id' || RESERVED.has(nameTok.v)) throw new CppError(`Se esperaba un nombre después del tipo '${ts.base}'`, nameTok.line);
      if (this.isOp('(', 1)) {
        this.next(); this.next(); this.p--; // dejar el '(' como actual
        const params = this.parseParams();
        let body = null;
        if (this.isOp('{')) body = this.parseBlock();
        else this.expectSemi();
        items.push({ k: 'func', name: nameTok.v, ret: ts, params, body, line: nameTok.line });
      } else {
        const vars = this.parseDeclarators(ts);
        this.expectSemi();
        items.push({ k: 'decl', type: ts, vars, line, global: true });
      }
    }
    return { items, usingStd: this.usingStd, usingNames: this.usingNames };
  }

  parseUsing() {
    const line = this.next().line; // using
    if (this.isId('namespace')) {
      this.next();
      const n = this.next();
      if (n.v !== 'std') throw new CppError(`Solo se admite 'using namespace std;'`, line);
      this.usingStd = true;
    } else {
      if (this.isId('std') && this.isOp('::', 1)) { this.next(); this.next(); const nm = this.next(); this.usingNames.add(nm.v); }
      else throw new CppError(`Declaración 'using' no válida`, line);
    }
    this.expectSemi();
  }

  parseTypeSpec() {
    let cst = false, q = false, stat = false;
    while (this.isId('const') || this.isId('static')) { if (this.next().v === 'const') cst = true; else stat = true; }
    if (this.isId('std') && this.isOp('::', 1) && this.peek(2).k === 'id' && TYPE_WORDS.has(this.peek(2).v)) { this.next(); this.next(); q = true; }
    const t = this.peek();
    if (t.k !== 'id' || !TYPE_WORDS.has(t.v)) return null;
    const w = this.next().v;
    let base;
    if (w === 'unsigned' || w === 'signed') {
      base = 'int';
      if (this.isId('long')) { this.next(); if (this.isId('long')) this.next(); base = 'long'; }
      else if (this.isId('short') || this.isId('int') || this.isId('char')) { const x = this.next().v; base = x === 'char' ? 'char' : 'int'; }
    } else if (w === 'long') {
      base = 'long'; if (this.isId('long')) this.next();
      if (this.isId('int')) this.next(); else if (this.isId('double')) { this.next(); base = 'double'; }
    } else if (w === 'short') { base = 'int'; if (this.isId('int')) this.next(); }
    else if (w === 'size_t') base = 'long';
    else base = w;
    if (base === 'fstream') throw unsupported("'fstream' (use ofstream para escribir o ifstream para leer)", t.line);
    while (this.isId('const')) { this.next(); cst = true; }
    return { base, const: cst, q, static: stat, line: t.line };
  }

  parseParams() {
    const ps = [];
    this.expectOp('(');
    if (this.isId('void') && this.isOp(')', 1)) this.next();
    if (!this.isOp(')')) {
      do {
        const ts = this.parseTypeSpec();
        if (!ts) throw new CppError(`Se esperaba el tipo de un parámetro y se encontró '${tokText(this.peek())}'`, this.peek().line);
        let ref = false, name = null, arr = false, def = null;
        if (this.acceptOp('&')) ref = true;
        if (this.isOp('*')) throw unsupported('Los punteros', this.peek().line);
        if (this.peek().k === 'id' && !RESERVED.has(this.peek().v)) name = this.next().v;
        if (this.acceptOp('[')) { if (!this.isOp(']')) this.parseAssign(); this.expectOp(']'); arr = true; }
        if (this.acceptOp('=')) def = this.parseAssign();
        ps.push({ type: ts, ref, name, arr, def });
      } while (this.acceptOp(','));
    }
    this.expectOp(')');
    return ps;
  }

  parseBlock() {
    const line = this.expectOp('{').line;
    const body = [];
    while (!this.isOp('}')) {
      if (this.peek().k === 'eof') throw new CppError("Falta cerrar una llave '}' (el bloque que abre en la línea " + line + " no termina)", this.prevLine());
      body.push(this.parseStatement());
    }
    this.next();
    return { k: 'block', body, line };
  }

  isTypeStart() {
    const t = this.peek();
    if (t.k !== 'id') return false;
    if (TYPE_WORDS.has(t.v) || t.v === 'const' || t.v === 'static') return true;
    if (t.v === 'std' && this.isOp('::', 1)) { const n = this.peek(2); return n.k === 'id' && TYPE_WORDS.has(n.v); }
    if (UNSUPPORTED_TYPES.has(t.v) && (this.peek(1).k === 'id' || this.isOp('<', 1))) throw unsupported(`'${t.v}'`, t.line);
    return false;
  }

  parseDeclarators(ts) {
    const vars = [];
    do {
      const nt = this.peek();
      if (this.isOp('*')) throw unsupported('Los punteros', nt.line);
      if (this.isOp('&')) throw unsupported('Las referencias fuera de parámetros de función', nt.line);
      if (nt.k !== 'id' || RESERVED.has(nt.v)) throw new CppError(`Se esperaba el nombre de una variable después del tipo '${ts.base}' y se encontró '${tokText(nt)}'`, nt.line);
      this.next();
      const v = { name: nt.v, line: nt.line, init: null, ctor: null, arr: null, initList: null };
      if (this.acceptOp('[')) {
        v.arr = this.isOp(']') ? 'auto' : this.parseAssign();
        this.expectOp(']');
        if (this.isOp('[')) throw unsupported('Los arreglos de dos dimensiones', nt.line);
      }
      if (this.acceptOp('=')) {
        if (this.isOp('{')) v.initList = this.parseInitList(); else v.init = this.parseAssign();
      } else if (this.isOp('(')) {
        this.next(); v.ctor = [];
        if (!this.isOp(')')) { do { v.ctor.push(this.parseAssign()); } while (this.acceptOp(',')); }
        this.expectOp(')');
      } else if (this.isOp('{')) v.initList = this.parseInitList();
      vars.push(v);
    } while (this.acceptOp(','));
    return vars;
  }

  parseInitList() {
    this.expectOp('{');
    const items = [];
    if (!this.isOp('}')) { do { if (this.isOp('}')) break; items.push(this.parseAssign()); } while (this.acceptOp(',')); }
    this.expectOp('}');
    return items;
  }

  parseStatement() {
    const t = this.peek(); const line = t.line;
    if (t.k === 'op') {
      if (t.v === '{') return this.parseBlock();
      if (t.v === ';') { this.next(); return { k: 'empty', line }; }
    }
    if (t.k === 'id') {
      switch (t.v) {
        case 'if': {
          this.next(); this.expectOp('('); const c = this.parseExpr(); this.expectOp(')');
          const th = this.parseStatement(); let el = null;
          if (this.isId('else')) { this.next(); el = this.parseStatement(); }
          return { k: 'if', c, t: th, f: el, line };
        }
        case 'while': {
          this.next(); this.expectOp('('); const c = this.parseExpr(); this.expectOp(')');
          return { k: 'while', c, body: this.parseStatement(), line };
        }
        case 'do': {
          this.next(); const body = this.parseStatement();
          if (!this.isId('while')) throw new CppError("Se esperaba 'while' después del cuerpo de do", this.peek().line);
          this.next(); this.expectOp('('); const c = this.parseExpr(); this.expectOp(')'); this.expectSemi();
          return { k: 'do', c, body, line };
        }
        case 'for': {
          this.next(); this.expectOp('(');
          let init = null, cond = null, step = null;
          if (!this.isOp(';')) {
            if (this.isTypeStart()) { const ts = this.parseTypeSpec(); const vars = this.parseDeclarators(ts); init = { k: 'decl', type: ts, vars, line }; }
            else init = { k: 'expr', e: this.parseExpr(), line };
          }
          this.expectSemi();
          if (!this.isOp(';')) cond = this.parseExpr();
          this.expectSemi();
          if (!this.isOp(')')) step = this.parseExpr();
          this.expectOp(')');
          return { k: 'for', init, cond, step, body: this.parseStatement(), line };
        }
        case 'return': {
          this.next(); let e = null;
          if (!this.isOp(';')) e = this.parseExpr();
          this.expectSemi(); return { k: 'return', e, line };
        }
        case 'break': this.next(); this.expectSemi(); return { k: 'break', line };
        case 'continue': this.next(); this.expectSemi(); return { k: 'continue', line };
        case 'switch': return this.parseSwitch();
        case 'else': throw new CppError("Hay un 'else' sin su 'if' correspondiente (revise llaves y punto y coma antes del else)", line);
        case 'struct': case 'class': case 'enum': case 'typedef': case 'goto': case 'new': case 'delete':
          throw unsupported(`'${t.v}'`, line);
        case 'case': case 'default': throw new CppError(`'${t.v}' solo puede usarse dentro de un switch`, line);
      }
      if (this.isTypeStart()) {
        const ts = this.parseTypeSpec();
        const vars = this.parseDeclarators(ts);
        this.expectSemi();
        return { k: 'decl', type: ts, vars, line };
      }
    }
    const e = this.parseExpr();
    this.expectSemi();
    return { k: 'expr', e, line };
  }

  parseSwitch() {
    const line = this.next().line;
    this.expectOp('('); const e = this.parseExpr(); this.expectOp(')');
    this.expectOp('{');
    const cases = [];
    while (!this.isOp('}')) {
      if (this.peek().k === 'eof') this.fail('}');
      let test = null;
      if (this.isId('case')) { this.next(); test = this.parseTernary(); this.expectOp(':'); }
      else if (this.isId('default')) { this.next(); this.expectOp(':'); test = 'default'; }
      else throw new CppError("Dentro de un switch se esperaba 'case' o 'default'", this.peek().line);
      const body = [];
      while (!this.isOp('}') && !this.isId('case') && !this.isId('default')) {
        if (this.peek().k === 'eof') this.fail('}');
        body.push(this.parseStatement());
      }
      cases.push({ test, body });
    }
    this.next();
    return { k: 'switch', e, cases, line };
  }

  parseExpr() {
    let e = this.parseAssign();
    while (this.isOp(',')) { const line = this.next().line; const r = this.parseAssign(); e = { k: 'seq', l: e, r, line }; }
    return e;
  }

  parseAssign() {
    const l = this.parseTernary();
    const t = this.peek();
    if (t.k === 'op' && ASSIGN_OPS.has(t.v)) {
      this.next();
      const r = this.parseAssign();
      return { k: 'assign', op: t.v, l, r, line: t.line };
    }
    return l;
  }

  parseTernary() {
    const c = this.parseBinary(1);
    if (this.isOp('?')) {
      const line = this.next().line;
      const a = this.parseAssign(); this.expectOp(':'); const b = this.parseAssign();
      return { k: 'cond', c, a, b, line };
    }
    return c;
  }

  parseBinary(minPrec) {
    let l = this.parseUnary();
    for (;;) {
      const t = this.peek();
      if (t.k !== 'op') break;
      const prec = BINPREC[t.v];
      if (!prec || prec < minPrec) break;
      this.next();
      const r = this.parseBinary(prec + 1);
      l = { k: 'bin', op: t.v, l, r, line: t.line };
    }
    return l;
  }

  parseUnary() {
    const t = this.peek();
    if (t.k === 'op') {
      if (t.v === '!' || t.v === '-' || t.v === '+' || t.v === '~') { this.next(); return { k: 'un', op: t.v, e: this.parseUnary(), line: t.line }; }
      if (t.v === '++' || t.v === '--') { this.next(); return { k: 'pre', op: t.v, e: this.parseUnary(), line: t.line }; }
      if (t.v === '&' || t.v === '*') throw unsupported('Los punteros y direcciones (& y * unarios)', t.line);
      if (t.v === '(') {
        const n1 = this.peek(1);
        if (n1.k === 'id' && (TYPE_WORDS.has(n1.v) || (n1.v === 'std' && this.isOp('::', 2)))) {
          const save = this.p; this.next();
          const ts = this.parseTypeSpec();
          if (ts && this.isOp(')')) { this.next(); return { k: 'cast', type: ts, e: this.parseUnary(), line: t.line }; }
          this.p = save;
        }
      }
    }
    if (t.k === 'id' && t.v === 'sizeof') throw unsupported("'sizeof'", t.line);
    return this.parsePostfix();
  }

  parsePostfix() {
    let e = this.parsePrimary();
    for (;;) {
      const t = this.peek();
      if (t.k !== 'op') break;
      if (t.v === '(') {
        if (e.k !== 'id') throw new CppError('Solo se pueden llamar funciones por su nombre', t.line);
        this.next();
        const args = [];
        if (!this.isOp(')')) { do { args.push(this.parseAssign()); } while (this.acceptOp(',')); }
        this.expectOp(')');
        e = { k: 'call', name: e.name, std: e.std, args, line: e.line };
      } else if (t.v === '[') {
        this.next(); const i = this.parseExpr(); this.expectOp(']');
        e = { k: 'idx', a: e, i, line: t.line };
      } else if (t.v === '.') {
        this.next();
        const nm = this.peek();
        if (nm.k !== 'id') throw new CppError("Se esperaba el nombre de un método después del '.'", nm.line);
        this.next();
        if (this.isOp('(')) {
          this.next(); const args = [];
          if (!this.isOp(')')) { do { args.push(this.parseAssign()); } while (this.acceptOp(',')); }
          this.expectOp(')');
          e = { k: 'member', obj: e, name: nm.v, args, line: nm.line };
        } else throw new CppError(`'${nm.v}' no es un atributo conocido (¿faltan paréntesis de la llamada a método?)`, nm.line);
      } else if (t.v === '++' || t.v === '--') {
        this.next(); e = { k: 'post', op: t.v, e, line: t.line };
      } else if (t.v === '->') throw unsupported('El operador ->', t.line);
      else break;
    }
    return e;
  }

  parsePrimary() {
    const t = this.peek();
    switch (t.k) {
      case 'num': this.next(); return { k: 'num', t: t.t, v: t.v, line: t.line };
      case 'str': this.next(); return { k: 'str', v: t.v, line: t.line };
      case 'chr': this.next(); return { k: 'chr', v: t.v, line: t.line };
      case 'eof': throw new CppError('El programa termina inesperadamente (falta completar una instrucción)', this.prevLine());
      case 'op':
        if (t.v === '(') { this.next(); const e = this.parseExpr(); this.expectOp(')'); return e; }
        if (t.v === '{') throw new CppError("Llave '{' inesperada dentro de una expresión", t.line);
        throw new CppError(`Expresión no válida cerca de '${tokText(t)}'`, t.line);
    }
    // identificador
    if (t.v === 'true' || t.v === 'false') { this.next(); return { k: 'bool', v: t.v === 'true', line: t.line }; }
    if (t.v === 'nullptr') { this.next(); return { k: 'num', t: 'i', v: 0, line: t.line }; }
    if (t.v === 'static_cast') {
      this.next(); this.expectOp('<'); const ts = this.parseTypeSpec();
      if (!ts) throw new CppError('Tipo no válido en static_cast', t.line);
      this.expectOp('>'); this.expectOp('('); const e = this.parseExpr(); this.expectOp(')');
      return { k: 'cast', type: ts, e, line: t.line };
    }
    if (TYPE_WORDS.has(t.v) || (t.v === 'std' && this.isOp('::', 1) && this.peek(2).k === 'id' && TYPE_WORDS.has(this.peek(2).v))) {
      const ts = this.parseTypeSpec();
      if (ts && this.isOp('(')) { this.next(); const e = this.isOp(')') ? null : this.parseExpr(); this.expectOp(')'); return { k: 'cast', type: ts, e, line: t.line }; }
      if (ts && this.isOp('::')) { this.next(); const nm = this.next(); return { k: 'scoped', ns: ts.base, name: nm.v, std: ts.q, line: t.line }; }
      throw new CppError(`No se puede usar el tipo '${t.v}' aquí; se esperaba una expresión`, t.line);
    }
    if (RESERVED.has(t.v)) throw new CppError(`Se encontró '${t.v}' donde se esperaba una expresión`, t.line);
    // nombre posiblemente calificado
    this.next();
    const parts = [t.v];
    while (this.isOp('::') && this.peek(1).k === 'id') { this.next(); parts.push(this.next().v); }
    let std = false;
    if (parts[0] === 'std' && parts.length > 1) { parts.shift(); std = true; }
    if (parts.length === 1) return { k: 'id', name: parts[0], std, line: t.line };
    if (parts.length === 2) return { k: 'scoped', ns: parts[0], name: parts[1], std, line: t.line };
    throw unsupported('Los nombres con varios niveles de ::', t.line);
  }
}

/* ------------------------------------------------------------------ */
/* TABLAS DE BIBLIOTECA                                                */
/* ------------------------------------------------------------------ */
const NUM_T = new Set(['int', 'long', 'double', 'float', 'bool', 'char']);
const INT_T = new Set(['int', 'long', 'bool', 'char']);
const isNumT = b => NUM_T.has(b);
const isTextT = b => b === 'string' || b === 'cstr';
const promote = (a, b) => (a === 'double' || b === 'double') ? 'double' : (a === 'float' || b === 'float') ? 'float' : (a === 'long' || b === 'long') ? 'long' : 'int';

// objetos y manipuladores (requieren std::)
const STD_VALUES = { cout: 'iostream', cin: 'iostream', cerr: 'iostream', endl: 'iostream', flush: 'iostream', fixed: 'iostream', scientific: 'iostream', left: 'iostream', right: 'iostream', boolalpha: 'iostream', noboolalpha: 'iostream' };
const STD_FUNCS = {
  getline: { inc: ['iostream', 'string', 'fstream'], min: 2, max: 3, ret: () => 'istream' },
  to_string: { inc: ['string', 'iostream'], min: 1, max: 1, ret: () => 'string' },
  stoi: { inc: ['string', 'iostream'], min: 1, max: 1, ret: () => 'int' },
  stol: { inc: ['string', 'iostream'], min: 1, max: 1, ret: () => 'long' },
  stod: { inc: ['string', 'iostream'], min: 1, max: 1, ret: () => 'double' },
  stof: { inc: ['string', 'iostream'], min: 1, max: 1, ret: () => 'float' },
  setw: { inc: ['iomanip'], min: 1, max: 1, ret: () => 'manip' },
  setprecision: { inc: ['iomanip'], min: 1, max: 1, ret: () => 'manip' },
  setfill: { inc: ['iomanip'], min: 1, max: 1, ret: () => 'manip' },
  min: { inc: ['algorithm'], min: 2, max: 2, ret: a => a.length === 2 && isNumT(a[0]) && isNumT(a[1]) ? promote(a[0], a[1]) : 'unknown' },
  max: { inc: ['algorithm'], min: 2, max: 2, ret: a => a.length === 2 && isNumT(a[0]) && isNumT(a[1]) ? promote(a[0], a[1]) : 'unknown' },
  swap: { inc: ['algorithm'], min: 2, max: 2, ret: () => 'void' },
};
const MATH_INC = ['cmath'];
const GLOBAL_FUNCS = {
  rand: { min: 0, max: 0, ret: () => 'int' },
  srand: { min: 1, max: 1, ret: () => 'void' },
  time: { min: 1, max: 1, ret: () => 'long' },
  abs: { min: 1, max: 1, ret: a => a[0] === 'double' || a[0] === 'float' ? a[0] : 'int' },
  sqrt: { inc: MATH_INC, min: 1, max: 1, ret: () => 'double' },
  pow: { inc: MATH_INC, min: 2, max: 2, ret: () => 'double' },
  floor: { inc: MATH_INC, min: 1, max: 1, ret: () => 'double' },
  ceil: { inc: MATH_INC, min: 1, max: 1, ret: () => 'double' },
  round: { inc: MATH_INC, min: 1, max: 1, ret: () => 'double' },
  fabs: { inc: MATH_INC, min: 1, max: 1, ret: () => 'double' },
  fmod: { inc: MATH_INC, min: 2, max: 2, ret: () => 'double' },
  sin: { inc: MATH_INC, min: 1, max: 1, ret: () => 'double' },
  cos: { inc: MATH_INC, min: 1, max: 1, ret: () => 'double' },
  tan: { inc: MATH_INC, min: 1, max: 1, ret: () => 'double' },
  log: { inc: MATH_INC, min: 1, max: 1, ret: () => 'double' },
  log10: { inc: MATH_INC, min: 1, max: 1, ret: () => 'double' },
  exp: { inc: MATH_INC, min: 1, max: 1, ret: () => 'double' },
  atoi: { min: 1, max: 1, ret: () => 'int' },
  atof: { min: 1, max: 1, ret: () => 'double' },
  exit: { min: 1, max: 1, ret: () => 'void' },
  system: { min: 1, max: 1, ret: () => 'int' },
  isdigit: { min: 1, max: 1, ret: () => 'int' }, isalpha: { min: 1, max: 1, ret: () => 'int' },
  isalnum: { min: 1, max: 1, ret: () => 'int' }, isupper: { min: 1, max: 1, ret: () => 'int' },
  islower: { min: 1, max: 1, ret: () => 'int' }, isspace: { min: 1, max: 1, ret: () => 'int' },
  toupper: { min: 1, max: 1, ret: () => 'int' }, tolower: { min: 1, max: 1, ret: () => 'int' },
};
const GLOBAL_CONSTS = { RAND_MAX: 'int', NULL: 'int', INT_MAX: 'int', INT_MIN: 'int' };
const STRING_METHODS = {
  length: ['long', 0, 0], size: ['long', 0, 0], empty: ['bool', 0, 0], substr: ['string', 0, 2], find: ['long', 1, 2], rfind: ['long', 1, 2],
  at: ['char', 1, 1], push_back: ['void', 1, 1], pop_back: ['void', 0, 0], append: ['string', 1, 1], clear: ['void', 0, 0],
  erase: ['string', 0, 2], insert: ['string', 2, 2], c_str: ['string', 0, 0], front: ['char', 0, 0], back: ['char', 0, 0], compare: ['int', 1, 1],
};
const OSTREAM_METHODS = { open: ['void', 1, 2], close: ['void', 0, 0], is_open: ['bool', 0, 0], fail: ['bool', 0, 0], good: ['bool', 0, 0], flush: ['void', 0, 0], clear: ['void', 0, 0], eof: ['bool', 0, 0], bad: ['bool', 0, 0] };
const ISTREAM_METHODS = { open: ['void', 1, 2], close: ['void', 0, 0], is_open: ['bool', 0, 0], fail: ['bool', 0, 0], good: ['bool', 0, 0], eof: ['bool', 0, 0], clear: ['void', 0, 1], get: ['int', 0, 0], peek: ['int', 0, 0], ignore: ['void', 0, 2], bad: ['bool', 0, 0] };
const SCOPED = { ios: { app: 4, in: 1, out: 2, trunc: 8, binary: 16, ate: 32 }, string: { npos: -1 } };

/* ------------------------------------------------------------------ */
/* VERIFICADOR SEMÁNTICO                                               */
/* ------------------------------------------------------------------ */
class Scope {
  constructor(parent) { this.m = new Map(); this.parent = parent; }
  lookup(n) { for (let s = this; s; s = s.parent) { const v = s.m.get(n); if (v) return v; } return null; }
}
const catName = b => ({ int: 'int', long: 'long', double: 'double', float: 'float', bool: 'bool', char: 'char', string: 'string', cstr: 'texto entre comillas', void: 'void', ostream: 'flujo', istream: 'flujo', ofstream: 'ofstream', ifstream: 'ifstream', manip: 'manipulador' }[b] || b);

function check(prog, includes) {
  const errors = [];
  const inc = new Set(includes.map(i => i.name));
  const hasInc = list => list.some(h => inc.has(h));
  const err = (msg, line) => { if (errors.length < 12 && !errors.some(e => e.line === line && e.msg === msg)) errors.push({ line, msg }); };
  const globalScope = new Scope(null);
  let curFn = null;

  const stdOk = (name, node) => prog.usingStd || prog.usingNames.has(name) || node.std;
  const needStd = (name, line, node) => {
    if (!stdOk(name, node)) { err(`'${name}' no fue declarado en este ámbito. Falta escribir "using namespace std;" después de los #include (o usar std::${name}).`, line); return false; }
    return true;
  };

  function declareVar(scope, name, info, line) {
    if (scope.m.has(name) && scope.m.get(name).kind === 'var') { err(`Redeclaración de '${name}' en el mismo bloque (ya existe una variable con ese nombre)`, line); return; }
    scope.m.set(name, info);
  }

  function checkType(ts, line) {
    if (ts.base === 'string' || ts.base === 'ofstream' || ts.base === 'ifstream') {
      if (!ts.q && !prog.usingStd && !prog.usingNames.has(ts.base)) err(`'${ts.base}' no fue declarado en este ámbito. Falta "using namespace std;" (o escribir std::${ts.base}).`, line);
    }
    if ((ts.base === 'ofstream' || ts.base === 'ifstream') && !inc.has('fstream')) err(`'${ts.base}' necesita #include <fstream> al inicio del programa`, line);
    if (ts.base === 'string' && !hasInc(['string', 'iostream', 'fstream', 'sstream'])) err(`'string' necesita #include <string> al inicio del programa`, line);
  }

  function assignCompat(target, src, line, ctxMsg, isInit) {
    if (!src || src === 'unknown' || target === 'unknown' || target === 'auto') return;
    if (src === 'void') { err(`${ctxMsg}: la función no devuelve ningún valor (es void)`, line); return; }
    if (isNumT(target)) {
      if (isTextT(src)) err(`${ctxMsg}: no se puede convertir ${src === 'string' ? "un 'string'" : 'un texto entre comillas'} a '${target}'`, line);
      else if (!isNumT(src)) err(`${ctxMsg}: tipos incompatibles ('${catName(src)}' hacia '${target}')`, line);
    } else if (target === 'string') {
      if (isNumT(src) && !(src === 'char' && !isInit)) err(`${ctxMsg}: no se puede convertir '${catName(src)}' a 'string'${src === 'char' ? '' : ' (use to_string para convertir un número a texto)'}`, line);
      else if (!isNumT(src) && !isTextT(src)) err(`${ctxMsg}: tipos incompatibles ('${catName(src)}' hacia 'string')`, line);
    } else if (target === 'ofstream' || target === 'ifstream') {
      err(`${ctxMsg}: un flujo de archivo no se puede asignar o copiar`, line);
    }
  }

  const isLvalue = n => n.k === 'id' || (n.k === 'idx') ;

  function selectOverload(list, argTypes) {
    let best = null, bestScore = -1;
    for (const fn of list) {
      const min = fn.params.filter(p => !p.def).length, max = fn.params.length;
      if (argTypes.length < min || argTypes.length > max) continue;
      let score = 0, ok = true;
      argTypes.forEach((a, i) => {
        const p = fn.params[i]; const pb = p.type.base;
        if (a === 'unknown' || p.arr) { score += 1; return; }
        if (a === pb) score += 3;
        else if (isNumT(a) && isNumT(pb)) score += 2;
        else if (isTextT(a) && pb === 'string') score += 2;
        else if (a === 'char' && pb === 'string') { ok = false; }
        else if ((a === 'ofstream' && pb === 'ofstream') || (a === 'ifstream' && pb === 'ifstream')) score += 3;
        else ok = false;
      });
      if (ok && score > bestScore) { best = fn; bestScore = score; }
    }
    return best;
  }

  function infer(n, scope) {
    const t = inferInner(n, scope);
    n.ty = t;
    return t;
  }

  function inferInner(n, scope) {
    switch (n.k) {
      case 'num': return { i: 'int', l: 'long', d: 'double', f: 'float' }[n.t];
      case 'str': return 'cstr';
      case 'chr': return 'char';
      case 'bool': return 'bool';
      case 'id': {
        const info = scope.lookup(n.name);
        if (info) {
          if (info.kind === 'func') { err(`'${n.name}' es una función; faltan los paréntesis de la llamada, por ejemplo ${n.name}()`, n.line); return 'unknown'; }
          n.arrInfo = info.arr;
          return info.arr ? 'array:' + info.type.base : info.type.base;
        }
        if (n.name in STD_VALUES) {
          needStd(n.name, n.line, n);
          if (!inc.has(STD_VALUES[n.name])) err(`'${n.name}' necesita #include <${STD_VALUES[n.name]}> al inicio del programa`, n.line);
          n.builtin = 'value';
          return n.name === 'cout' || n.name === 'cerr' ? 'ostream' : n.name === 'cin' ? 'istream' : 'manip';
        }
        if (n.name in GLOBAL_CONSTS) { n.builtin = 'const'; return GLOBAL_CONSTS[n.name]; }
        if (n.name in GLOBAL_FUNCS || n.name in STD_FUNCS) { err(`'${n.name}' es una función; faltan los paréntesis de la llamada`, n.line); return 'unknown'; }
        err(`'${n.name}' no fue declarado en este ámbito (¿está mal escrito el nombre o falta declarar la variable?)`, n.line);
        return 'unknown';
      }
      case 'scoped': {
        const ns = SCOPED[n.ns];
        if (!ns || !(n.name in ns)) { err(`'${n.ns}::${n.name}' no es un nombre conocido`, n.line); return 'unknown'; }
        if (n.ns === 'ios') { if (!inc.has('iostream') && !inc.has('fstream')) err(`'ios::${n.name}' necesita #include <fstream>`, n.line); needStd('ios', n.line, n); return 'int'; }
        if (n.ns === 'string') { needStd('string', n.line, n); return 'long'; }
        return 'unknown';
      }
      case 'un': {
        const a = infer(n.e, scope);
        if (n.op === '!') { if (isTextT(a)) err(`El operador ! no se puede aplicar a un texto`, n.line); return 'bool'; }
        if (isTextT(a)) { err(`El operador ${n.op} no se puede aplicar a un texto`, n.line); return 'unknown'; }
        if (a === 'bool' || a === 'char') return 'int';
        return a;
      }
      case 'pre': case 'post': {
        const a = infer(n.e, scope);
        if (!isLvalue(n.e)) err(`El operador ${n.op} necesita una variable`, n.line);
        else checkConst(n.e, scope, n.line);
        if (isTextT(a)) err(`El operador ${n.op} no se puede aplicar a un texto`, n.line);
        return a;
      }
      case 'seq': infer(n.l, scope); return infer(n.r, scope);
      case 'cond': {
        const c = infer(n.c, scope); if (isTextT(c)) err('La condición del operador ?: no puede ser un texto', n.line);
        const a = infer(n.a, scope), b = infer(n.b, scope);
        if (isNumT(a) && isNumT(b)) return promote(a, b);
        if (isTextT(a) && isTextT(b)) return 'string';
        return a === b ? a : 'unknown';
      }
      case 'cast': {
        checkType(n.type, n.line);
        if (n.e) infer(n.e, scope);
        return n.type.base;
      }
      case 'idx': {
        const a = infer(n.a, scope), i = infer(n.i, scope);
        if (isTextT(i)) err('El índice de un arreglo o string debe ser un número', n.line);
        if (a === 'string') return 'char';
        if (typeof a === 'string' && a.startsWith('array:')) return a.slice(6);
        if (a !== 'unknown') err(`Solo se puede usar [ ] con arreglos o strings`, n.line);
        return 'unknown';
      }
      case 'assign': {
        const l = infer(n.l, scope), r = infer(n.r, scope);
        if (!isLvalue(n.l)) { err('El lado izquierdo de la asignación debe ser una variable', n.line); return l; }
        checkConst(n.l, scope, n.line);
        if (typeof l === 'string' && l.startsWith('array:')) { err('No se puede asignar un arreglo completo; asigne elemento por elemento', n.line); return 'unknown'; }
        if (n.op === '=') assignCompat(l, r, n.line, 'Asignación', false);
        else {
          const op = n.op.slice(0, -1);
          if (l === 'string') { if (op !== '+') err(`El operador ${n.op} no se puede aplicar a un string`, n.line); else if (isNumT(r) && r !== 'char') err(`No se puede sumar '${catName(r)}' a un string con += (use to_string)`, n.line); }
          else if (isNumT(l)) { if (isTextT(r)) err(`El operador ${n.op} no se puede aplicar a un texto`, n.line); if ((op === '%' || op === '&' || op === '|' || op === '^' || op === '<<' || op === '>>') && (l === 'double' || l === 'float' || r === 'double' || r === 'float')) err(`El operador ${n.op} solo funciona con números enteros`, n.line); }
        }
        return l;
      }
      case 'bin': return inferBin(n, scope);
      case 'call': return inferCall(n, scope);
      case 'member': return inferMember(n, scope);
    }
    return 'unknown';
  }

  function checkConst(n, scope, line) {
    if (n.k === 'id') { const info = scope.lookup(n.name); if (info && info.kind === 'var' && info.type.const && !info.arr) err(`No se puede modificar '${n.name}' porque fue declarada como const`, line); }
  }

  function inferBin(n, scope) {
    const op = n.op;
    const l = infer(n.l, scope);
    const r = infer(n.r, scope);
    if (op === '<<' && (l === 'ostream' || l === 'ofstream')) {
      if (r === 'void') err('No se puede enviar a cout el resultado de una función void', n.line);
      if (typeof r === 'string' && r.startsWith('array:')) err('No se puede mostrar un arreglo completo; recórralo con un ciclo', n.line);
      return l;
    }
    if (op === '>>' && (l === 'istream' || l === 'ifstream')) {
      if (!(n.r.k === 'id' || n.r.k === 'idx')) err('Después de >> debe ir una variable donde guardar el dato', n.line);
      else if (n.r.ty === 'cstr') err('No se puede leer un dato sobre un texto entre comillas', n.line);
      return l;
    }
    if (l === 'ostream' || l === 'ofstream' || l === 'istream' || l === 'ifstream') { err(`Uso incorrecto del operador ${op} con un flujo (¿cuál es el sentido de << y >>?)`, n.line); return 'unknown'; }
    if (l === 'unknown' || r === 'unknown') return (op === '&&' || op === '||' || op === '==' || op === '!=' || op === '<' || op === '>' || op === '<=' || op === '>=') ? 'bool' : 'unknown';
    if (op === '&&' || op === '||') { if (isTextT(l) || isTextT(r)) err(`El operador ${op} no se puede aplicar a un texto`, n.line); return 'bool'; }
    if (['==', '!=', '<', '>', '<=', '>='].includes(op)) {
      if ((isTextT(l) && isNumT(r)) || (isNumT(l) && isTextT(r))) err(`No se puede comparar un texto con un número (${catName(l)} ${op} ${catName(r)})`, n.line);
      else if (l === 'cstr' && r === 'cstr') err(`No se pueden comparar dos textos entre comillas directamente; use un string`, n.line);
      return 'bool';
    }
    if (op === '+' && isTextT(l) && isTextT(r)) {
      if (l === 'cstr' && r === 'cstr') err(`No se pueden sumar dos textos entre comillas ("a" + "b"); guarde uno en un string primero`, n.line);
      return 'string';
    }
    if (op === '+' && ((l === 'string' && r === 'char') || (l === 'char' && r === 'string'))) return 'string';
    if (isTextT(l) || isTextT(r)) {
      err(`El operador ${op} no se puede aplicar entre '${catName(l)}' y '${catName(r)}'${op === '+' ? " (para unir un número y un texto use to_string)" : ''}`, n.line);
      return 'unknown';
    }
    if (!isNumT(l) || !isNumT(r)) { err(`Operandos no válidos para ${op}`, n.line); return 'unknown'; }
    if (op === '%' || op === '&' || op === '|' || op === '^' || op === '<<' || op === '>>') {
      if (l === 'double' || l === 'float' || r === 'double' || r === 'float') err(`El operador ${op} solo funciona con números enteros (hay un número decimal)`, n.line);
      return promote(l, r) === 'long' ? 'long' : 'int';
    }
    return promote(l, r);
  }

  function inferCall(n, scope) {
    const argTypes = n.args.map(a => infer(a, scope));
    const info = scope.lookup(n.name);
    if (info && info.kind === 'func') {
      const fn = selectOverload(info.list, argTypes);
      if (!fn) {
        const f0 = info.list[0];
        const min = f0.params.filter(p => !p.def).length, max = f0.params.length;
        if (info.list.length === 1 && (argTypes.length < min || argTypes.length > max)) err(`La función '${n.name}' espera ${min === max ? min : min + ' a ' + max} argumento(s) y se le pasaron ${argTypes.length}`, n.line);
        else err(`Los argumentos de la llamada a '${n.name}' no coinciden con sus parámetros (revise cantidad y tipos)`, n.line);
        return f0.ret.base;
      }
      n.fn = fn;
      fn.params.forEach((p, i) => {
        if (i < n.args.length && p.ref && !(n.args[i].k === 'id' || n.args[i].k === 'idx')) err(`El argumento ${i + 1} de '${n.name}' debe ser una variable porque el parámetro se recibe por referencia (&)`, n.line);
      });
      return fn.ret.base;
    }
    if (info && info.kind === 'var') { err(`'${n.name}' es una variable, no una función`, n.line); return 'unknown'; }
    if (['printf','scanf','puts','gets','getchar','getch','fopen','fprintf','fscanf','malloc','free','strcpy','strlen','strcmp','sprintf'].includes(n.name)) { err(`'${n.name}' no está disponible en este simulador; use cout, cin y string en su lugar`, n.line); return 'unknown'; }
    let spec = null;
    if (n.name in STD_FUNCS) {
      if (!needStd(n.name, n.line, n)) return 'unknown';
      spec = STD_FUNCS[n.name];
    } else if (n.name in GLOBAL_FUNCS) {
      spec = GLOBAL_FUNCS[n.name];
    }
    if (!spec) { err(`'${n.name}' no fue declarada en este ámbito (¿está mal escrito el nombre o falta definir la función antes de usarla?)`, n.line); return 'unknown'; }
    if (spec.inc && !hasInc(spec.inc)) err(`'${n.name}' necesita #include <${spec.inc[0]}> al inicio del programa`, n.line);
    if (n.args.length < spec.min || n.args.length > spec.max) {
      err(`La función '${n.name}' espera ${spec.min === spec.max ? spec.min : spec.min + ' a ' + spec.max} argumento(s) y se le pasaron ${n.args.length}`, n.line);
    }
    n.builtin = n.name;
    if (n.name === 'getline') {
      if (!(argTypes[0] === 'istream' || argTypes[0] === 'ifstream' || argTypes[0] === 'unknown')) err(`El primer argumento de getline debe ser cin o un ifstream`, n.line);
      if (n.args[1] && !(n.args[1].k === 'id' || n.args[1].k === 'idx')) err(`El segundo argumento de getline debe ser una variable string`, n.line);
      else if (argTypes[1] && argTypes[1] !== 'string' && argTypes[1] !== 'unknown') err(`El segundo argumento de getline debe ser de tipo string`, n.line);
    }
    if (['sqrt', 'pow', 'floor', 'ceil', 'round', 'fabs', 'sin', 'cos', 'tan', 'log', 'log10', 'exp', 'fmod'].includes(n.name)) {
      if (argTypes.some(a => isTextT(a))) err(`'${n.name}' necesita números, no textos`, n.line);
    }
    if (n.name === 'to_string' && !isNumT(argTypes[0]) && argTypes[0] !== 'unknown') err(`to_string necesita un número`, n.line);
    if ((n.name === 'stoi' || n.name === 'stod' || n.name === 'stol' || n.name === 'stof') && isNumT(argTypes[0])) err(`${n.name} necesita un texto (string) como argumento`, n.line);
    return spec.ret(argTypes);
  }

  function inferMember(n, scope) {
    const o = infer(n.obj, scope);
    const argTypes = n.args.map(a => infer(a, scope));
    let table = null;
    if (o === 'string') table = STRING_METHODS;
    else if (o === 'ofstream') table = OSTREAM_METHODS;
    else if (o === 'ifstream' || o === 'istream') table = ISTREAM_METHODS;
    else if (o === 'ostream') table = { flush: ['void', 0, 0] };
    else if (o === 'unknown') return 'unknown';
    else { err(`El tipo '${catName(o)}' no tiene métodos (se usó .${n.name})`, n.line); return 'unknown'; }
    const m = table[n.name];
    if (!m) { err(`'${catName(o)}' no tiene un método llamado '${n.name}'${o === 'string' && n.name === 'size' ? '' : ''}`, n.line); return 'unknown'; }
    if (n.args.length < m[1] || n.args.length > m[2]) err(`El método '${n.name}' espera ${m[1] === m[2] ? m[1] : m[1] + ' a ' + m[2]} argumento(s) y se le pasaron ${n.args.length}`, n.line);
    if (o === 'string' && (n.name === 'push_back' || n.name === 'pop_back' || n.name === 'clear' || n.name === 'append' || n.name === 'erase' || n.name === 'insert') && !(n.obj.k === 'id' || n.obj.k === 'idx')) err(`'${n.name}' necesita una variable string`, n.line);
    if ((n.name === 'find' || n.name === 'rfind') && argTypes[0] && isNumT(argTypes[0]) && argTypes[0] !== 'char') err(`find necesita un texto o un carácter para buscar`, n.line);
    if ((n.name === 'open') && (o === 'ofstream' || o === 'ifstream') && argTypes[0] && !isTextT(argTypes[0]) && argTypes[0] !== 'unknown') err(`open necesita el nombre del archivo como texto`, n.line);
    return m[0];
  }

  function checkStmt(s, scope, loopDepth, switchDepth) {
    switch (s.k) {
      case 'block': {
        const sc = new Scope(scope);
        s.body.forEach(b => checkStmt(b, sc, loopDepth, switchDepth));
        break;
      }
      case 'decl': checkDecl(s, scope); break;
      case 'expr': infer(s.e, scope); break;
      case 'if': { const c = infer(s.c, scope); condCheck(c, s.c.line || s.line); checkStmt(s.t, new Scope(scope), loopDepth, switchDepth); if (s.f) checkStmt(s.f, new Scope(scope), loopDepth, switchDepth); break; }
      case 'while': { const c = infer(s.c, scope); condCheck(c, s.line); checkStmt(s.body, new Scope(scope), loopDepth + 1, switchDepth); break; }
      case 'do': { checkStmt(s.body, new Scope(scope), loopDepth + 1, switchDepth); const c = infer(s.c, scope); condCheck(c, s.line); break; }
      case 'for': {
        const sc = new Scope(scope);
        if (s.init) checkStmt(s.init, sc, loopDepth, switchDepth);
        if (s.cond) condCheck(infer(s.cond, sc), s.line);
        if (s.step) infer(s.step, sc);
        checkStmt(s.body, new Scope(sc), loopDepth + 1, switchDepth);
        break;
      }
      case 'switch': {
        const t = infer(s.e, scope);
        if (isTextT(t) || t === 'double' || t === 'float') err('El switch solo funciona con números enteros o caracteres', s.line);
        const sc = new Scope(scope);
        s.cases.forEach(c => { if (c.test !== 'default') infer(c.test, scope); c.body.forEach(b => checkStmt(b, sc, loopDepth, switchDepth + 1)); });
        break;
      }
      case 'return': {
        const rb = curFn.ret.base;
        if (s.e) {
          const t = infer(s.e, scope);
          if (rb === 'void') err(`La función '${curFn.name}' es void y no puede devolver un valor`, s.line);
          else assignCompat(rb, t, s.line, `Return en '${curFn.name}'`, true);
        } else if (rb !== 'void' && curFn.name !== 'main') err(`La función '${curFn.name}' debe devolver un valor de tipo ${rb}`, s.line);
        break;
      }
      case 'break': if (loopDepth === 0 && switchDepth === 0) err("'break' solo puede usarse dentro de un ciclo o un switch", s.line); break;
      case 'continue': if (loopDepth === 0) err("'continue' solo puede usarse dentro de un ciclo", s.line); break;
    }
  }

  function condCheck(t, line) {
    if (isTextT(t)) err('La condición no puede ser un texto (compare con == o use una condición numérica)', line);
    if (t === 'void') err('La condición usa una función void', line);
  }

  function checkDecl(s, scope) {
    const ts = s.type;
    checkType(ts, s.line);
    if (ts.base === 'void') { err("No se puede declarar una variable de tipo void", s.line); return; }
    for (const v of s.vars) {
      v.type = ts;
      const isArr = v.arr !== null;
      if (isArr && v.arr !== 'auto') { const t = infer(v.arr, scope); if (!isNumT(t) && t !== 'unknown') err('El tamaño del arreglo debe ser un número', v.line); }
      if (isArr && (ts.base === 'ofstream' || ts.base === 'ifstream' || ts.base === 'string')) { if (ts.base !== 'string') err('No se admiten arreglos de flujos', v.line); }
      let declType = ts.base;
      if (v.init) {
        const t = infer(v.init, scope);
        if (ts.base === 'auto') declType = (t === 'cstr') ? 'string' : t;
        else if (ts.base === 'ofstream' || ts.base === 'ifstream') err(`Un ${ts.base} se crea con el nombre del archivo entre paréntesis, por ejemplo ${ts.base} f("datos.txt");`, v.line);
        else assignCompat(ts.base, t, v.line, `Inicialización de '${v.name}'`, true);
        if (isArr) err('Un arreglo se inicializa con llaves { }', v.line);
      }
      if (v.initList) {
        if (!isArr && ts.base !== 'auto') { /* int x{5} */ }
        v.initList.forEach(e => { const t = infer(e, scope); if (isArr) assignCompat(ts.base, t, v.line, `Elemento de '${v.name}'`, true); });
        if (isArr && v.arr === 'auto') v.arr = { k: 'num', t: 'i', v: v.initList.length, line: v.line };
      }
      if (isArr && v.arr === 'auto' && !v.initList) err('Un arreglo sin tamaño necesita valores iniciales entre llaves', v.line);
      if (v.ctor) {
        const ats = v.ctor.map(a => infer(a, scope));
        if (ts.base === 'ofstream' || ts.base === 'ifstream') {
          if (ats.length < 1 || ats.length > 2) err(`El constructor de ${ts.base} recibe el nombre del archivo y, opcionalmente, el modo (por ejemplo ios::app)`, v.line);
          else if (!isTextT(ats[0]) && ats[0] !== 'unknown') err(`El nombre del archivo debe ser un texto, por ejemplo "datos.txt"`, v.line);
        } else if (ts.base === 'string') {
          if (ats.length > 2) err('Constructor de string no válido', v.line);
        } else if (ats.length !== 1) err(`Inicialización no válida de '${v.name}'`, v.line);
      }
      if (v.initList && !isArr) { v.init = v.initList[0] || null; }
      declareVar(scope, v.name, { kind: 'var', type: { base: declType, const: ts.const }, arr: isArr }, v.line);
      v.declType = declType;
    }
  }

  // Funciones y globales en orden
  for (const it of prog.items) {
    if (it.k === 'func') {
      checkType(it.ret, it.line);
      it.params.forEach(p => checkType(p.type, it.line));
      if (it.name === 'main') {
        if (it.ret.base !== 'int') err("La función main debe devolver int", it.line);
      }
      let entry = globalScope.m.get(it.name);
      if (entry && entry.kind === 'var') { err(`'${it.name}' ya fue declarado como variable`, it.line); continue; }
      if (!entry) { entry = { kind: 'func', list: [] }; globalScope.m.set(it.name, entry); }
      const same = entry.list.find(f => f.params.length === it.params.length && f.params.every((p, i) => p.type.base === it.params[i].type.base));
      if (same && same.body && it.body) { err(`La función '${it.name}' ya fue definida antes`, it.line); continue; }
      if (same) { if (it.body) { same.body = it.body; same.params = it.params; } it.alias = same; }
      else entry.list.push(it);
      if (it.body) {
        const target = same || it;
        curFn = target;
        const sc = new Scope(globalScope);
        const seen = new Set();
        it.params.forEach(p => {
          if (!p.name) { return; }
          if (seen.has(p.name)) err(`El parámetro '${p.name}' está repetido`, it.line);
          seen.add(p.name);
          sc.m.set(p.name, { kind: 'var', type: { base: p.type.base, const: p.type.const }, arr: p.arr });
        });
        it.params.forEach(p => { if (p.def) infer(p.def, globalScope); });
        const bodyScope = new Scope(sc);
        it.body.body.forEach(b => checkStmt(b, bodyScope, 0, 0));
        curFn = null;
      }
    } else if (it.k === 'decl') {
      checkDecl(it, globalScope);
    }
  }
  const mainEntry = globalScope.m.get('main');
  if (!mainEntry || mainEntry.kind !== 'func' || !mainEntry.list.some(f => f.body)) err('No se encontró la función main(): todo programa en C++ debe tener int main() { ... }', 1);
  // resolver prototipos que se definen después
  return { errors, globalScope };
}

/* ------------------------------------------------------------------ */
/* EVALUADOR                                                           */
/* ------------------------------------------------------------------ */
class Cell { constructor(type, val) { this.type = type; this.val = val; this.uninit = false; this.name = ''; } }
class Env {
  constructor(parent) { this.vars = new Map(); this.parent = parent; this.streams = null; }
  find(n) { for (let e = this; e; e = e.parent) { const c = e.vars.get(n); if (c) return c; } return null; }
}
const BRK = { sig: 'break' }, CNT = { sig: 'continue' };
class Ret { constructor(v) { this.sig = 'return'; this.v = v; } }
class ExitSignal { constructor(code) { this.code = code; } }

const V = (t, v) => ({ t, v });
const TRUE = V('b', 1), FALSE = V('b', 0);
const B = x => x ? V('b', 1) : V('b', 0);
const wrap32 = x => x | 0;

function stripZeros(s) { if (s.indexOf('.') < 0) return s; s = s.replace(/0+$/, ''); if (s.endsWith('.')) s = s.slice(0, -1); return s; }
function fmtG(v, prec) {
  if (v === 0) return (1 / v < 0) ? '-0' : '0';
  if (prec === 0) prec = 1;
  const e = v.toExponential(prec - 1);
  let [mant, ex] = e.split('e');
  const exp = parseInt(ex, 10);
  if (exp < -4 || exp >= prec) {
    mant = stripZeros(mant);
    const ae = Math.abs(exp);
    return mant + 'e' + (exp < 0 ? '-' : '+') + (ae < 10 ? '0' + ae : ae);
  }
  return stripZeros(v.toFixed(Math.max(0, prec - 1 - exp)));
}

class Interp {
  constructor(prog, check, opts) {
    this.prog = prog; this.globalScope = check.globalScope;
    this.opts = opts || {};
    this.files = new Map(Object.entries(this.opts.files || {}));
    this.out = []; this.outLen = 0;
    this.warnings = []; this.warnedKeys = new Set();
    this.steps = 0; this.maxSteps = this.opts.maxSteps || 4000000;
    this.depth = 0;
    this.randSeed = 1;
    this.stdinText = this.opts.stdin || '';
    this.cin = { t: 'is', file: false, open: true, text: this.stdinText, pos: 0, fail: false, eof: false, kind: 'cin' };
    this.cout = { t: 'os', kind: 'cout', prec: 6, fixed: false, sci: false, width: 0, fill: ' ', left: false, boolalpha: false };
    this.cerr = { t: 'os', kind: 'cerr', prec: 6, fixed: false, sci: false, width: 0, fill: ' ', left: false, boolalpha: false };
    this.openStreams = new Set();
    this.funcs = new Map();
    this.globals = new Env(null);
    this.exitCode = 0;
  }

  warn(msg, line, key) {
    const k = key || (msg + line);
    if (this.warnedKeys.has(k) || this.warnings.length >= 8) return;
    this.warnedKeys.add(k); this.warnings.push({ line, msg });
  }
  tick(line) {
    if (++this.steps > this.maxSteps) throw new CppError('El programa se detuvo porque parece no terminar (¿ciclo infinito?). Revise la condición del ciclo y que la variable que lo controla cambie.', line, 'runtime');
  }
  rt(msg, line) { return new CppError(msg, line, 'runtime'); }

  /* ---------- salida ---------- */
  emit(s, err) {
    if (!s) return;
    this.outLen += s.length;
    if (this.outLen > 300000) throw this.rt('La salida del programa es demasiado larga (más de 300000 caracteres). Probablemente hay un ciclo que imprime sin parar.', 0);
    const last = this.out[this.out.length - 1];
    if (last && !!last.err === !!err) last.s += s; else this.out.push({ s, err: !!err });
  }

  /* ---------- tipos y coerción ---------- */
  defaultVal(base) {
    switch (base) {
      case 'int': case 'short': return V('i', 0);
      case 'long': return V('l', 0);
      case 'double': return V('d', 0);
      case 'float': return V('f', 0);
      case 'bool': return V('b', 0);
      case 'char': return V('c', 0);
      case 'string': return V('s', '');
      case 'ofstream': return { t: 'ofs', open: false, name: '', buf: '', mode: 0, fail: false, prec: 6, fixed: false, sci: false, width: 0, fill: ' ', left: false, boolalpha: false };
      case 'ifstream': return { t: 'is', file: true, open: false, text: '', pos: 0, fail: false, eof: false, name: '' };
    }
    return V('i', 0);
  }
  coerce(base, v, line) {
    if (v.t === 'os' || v.t === 'ofs' || v.t === 'is') {
      if ((base === 'ofstream' && v.t === 'ofs') || (base === 'ifstream' && v.t === 'is') || base === 'auto') return v;
      throw this.rt('Tipo de dato incompatible en la asignación', line);
    }
    switch (base) {
      case 'int': case 'short': {
        if (v.t === 's' || v.t === 'v') throw this.rt('No se puede convertir un texto a número', line);
        return V('i', v.t === 'd' || v.t === 'f' ? (Number.isFinite(v.v) ? wrap32(Math.trunc(v.v)) : 0) : wrap32(v.v));
      }
      case 'long': return V('l', v.t === 'd' || v.t === 'f' ? Math.trunc(v.v) || 0 : v.v);
      case 'double': return V('d', +v.v);
      case 'float': return V('f', Math.fround(+v.v));
      case 'bool': return V('b', v.v !== 0 ? 1 : 0);
      case 'char': return V('c', ((v.t === 'd' || v.t === 'f' ? Math.trunc(v.v) : v.v) << 24) >> 24);
      case 'string': if (v.t === 'c') return V('s', String.fromCharCode(v.v)); return V('s', v.v);
      case 'auto': return v.t === 's' ? V('s', v.v) : v;
    }
    return v;
  }
  baseOfVal(v) { return { i: 'int', u: 'long', l: 'long', d: 'double', f: 'float', b: 'bool', c: 'char', s: 'string' }[v.t] || 'int'; }
  truthy(v) {
    if (v.t === 'is' || v.t === 'ofs') return !v.fail;
    if (v.t === 's') return v.v.length > 0;
    return v.v !== 0;
  }

  /* ---------- ejecución de programa ---------- */
  run() {
    for (const it of this.prog.items) {
      if (it.k === 'func') {
        const target = it.alias || it;
        let list = this.funcs.get(it.name); if (!list) { list = []; this.funcs.set(it.name, list); }
        if (!list.includes(target)) list.push(target);
      }
    }
    try {
      for (const it of this.prog.items) if (it.k === 'decl') this.execDecl(it, this.globals);
      const mainFn = (this.funcs.get('main') || []).find(f => f.body);
      const r = this.callFn(mainFn, [], null, 0);
      this.exitCode = r && r.t === 'i' ? r.v : 0;
    } catch (e) {
      if (e instanceof ExitSignal) this.exitCode = e.code;
      else if (e instanceof RangeError && /call stack/i.test(e.message)) {
        this.closeAllStreams();
        throw this.rt('Desbordamiento de pila: la función se llama a sí misma demasiadas veces sin detenerse (revise el caso base de la recursión).', 0);
      } else { this.closeAllStreams(); throw e; }
    }
    this.closeAllStreams();
  }
  closeAllStreams() { for (const s of this.openStreams) this.flushStream(s); this.openStreams.clear(); }

  callFn(fn, argNodes, callerEnv, line, preArgs) {
    if (++this.depth > 450) { this.depth = 0; throw this.rt('Desbordamiento de pila: la función se llama a sí misma demasiadas veces sin detenerse (revise el caso base de la recursión).', line); }
    this.tick(line);
    const env = new Env(this.globals);
    for (let i = 0; i < fn.params.length; i++) {
      const p = fn.params[i];
      let cell;
      if (i < argNodes.length) {
        if (p.ref) { cell = this.lvalCell(argNodes[i], callerEnv); }
        else if (p.arr) { const c0 = this.lvalCell(argNodes[i], callerEnv); cell = c0; }
        else { const v = this.ev(argNodes[i], callerEnv); cell = new Cell(p.type, this.coerce(p.type.base, v, line)); }
      } else if (p.def) {
        const v = this.ev(p.def, this.globals); cell = new Cell(p.type, this.coerce(p.type.base, v, line));
      } else cell = new Cell(p.type, this.defaultVal(p.type.base));
      if (p.name) env.vars.set(p.name, cell);
    }
    let result = { t: 'v', v: 0 };
    let r;
    try { r = this.execBlock(fn.body, env, true); }
    finally { this.closeEnvStreams(env); this.depth--; }
    if (r instanceof Ret) result = r.v;
    if (fn.ret.base !== 'void') {
      if (result.t === 'v') result = this.defaultVal(fn.ret.base);
      else result = this.coerce(fn.ret.base, result, line);
    } else result = { t: 'v', v: 0 };
    return result;
  }
  closeEnvStreams(env) {
    if (env.streams) for (const s of env.streams) { this.flushStream(s); this.openStreams.delete(s); }
  }

  execBlock(b, env, sameEnv) {
    const e = sameEnv ? env : new Env(env);
    try {
      for (const s of b.body) { const r = this.exec(s, e); if (r) return r; }
    } finally { if (!sameEnv) this.closeEnvStreams(e); }
    return null;
  }

  exec(s, env) {
    this.tick(s.line);
    switch (s.k) {
      case 'block': return this.execBlock(s, env, false);
      case 'decl': this.execDecl(s, env); return null;
      case 'expr': this.ev(s.e, env); return null;
      case 'empty': return null;
      case 'if': {
        if (this.truthy(this.ev(s.c, env))) return this.execScoped(s.t, env);
        if (s.f) return this.execScoped(s.f, env);
        return null;
      }
      case 'while': {
        while (this.truthy(this.ev(s.c, env))) {
          this.tick(s.line);
          const r = this.execScoped(s.body, env);
          if (r) { if (r === BRK) break; if (r === CNT) continue; return r; }
        }
        return null;
      }
      case 'do': {
        do {
          this.tick(s.line);
          const r = this.execScoped(s.body, env);
          if (r) { if (r === BRK) break; if (r === CNT) continue; return r; }
        } while (this.truthy(this.ev(s.c, env)));
        return null;
      }
      case 'for': {
        const e = new Env(env);
        try {
          if (s.init) this.exec(s.init, e);
          while (!s.cond || this.truthy(this.ev(s.cond, e))) {
            this.tick(s.line);
            const r = this.execScoped(s.body, e);
            if (r) { if (r === BRK) break; if (r !== CNT) return r; }
            if (s.step) this.ev(s.step, e);
          }
        } finally { this.closeEnvStreams(e); }
        return null;
      }
      case 'switch': {
        const v = this.ev(s.e, env).v;
        let start = -1;
        for (let i = 0; i < s.cases.length; i++) {
          const c = s.cases[i];
          if (c.test !== 'default' && this.ev(c.test, env).v === v) { start = i; break; }
        }
        if (start < 0) start = s.cases.findIndex(c => c.test === 'default');
        if (start < 0) return null;
        const e = new Env(env);
        for (let i = start; i < s.cases.length; i++) {
          for (const st of s.cases[i].body) {
            const r = this.exec(st, e);
            if (r) { if (r === BRK) return null; return r; }
          }
        }
        return null;
      }
      case 'return': return new Ret(s.e ? this.ev(s.e, env) : { t: 'v', v: 0 });
      case 'break': return BRK;
      case 'continue': return CNT;
    }
    throw this.rt('Instrucción desconocida', s.line);
  }
  execScoped(s, env) {
    if (s.k === 'block') return this.execBlock(s, env, false);
    const e = new Env(env);
    try { return this.exec(s, e); } finally { this.closeEnvStreams(e); }
  }

  execDecl(s, env) {
    for (const v of s.vars) {
      const base = v.declType || s.type.base;
      const type = { base, const: s.type.const };
      if (s.type.static && !s.global && v._cell) { env.vars.set(v.name, v._cell); continue; }
      if (v.arr !== null) {
        const n = this.ev(v.arr, env).v;
        if (n < 0 || n > 1000000) throw this.rt('Tamaño de arreglo no válido', v.line);
        const a = [];
        for (let i = 0; i < n; i++) a.push(this.defaultVal(base));
        if (v.initList) {
          if (v.initList.length > n) throw this.rt('Hay más valores iniciales que posiciones en el arreglo', v.line);
          v.initList.forEach((e, i) => { a[i] = this.coerce(base, this.ev(e, env), v.line); });
        }
        const cell = new Cell({ base, const: s.type.const }, { t: 'arr', a, base });
        env.vars.set(v.name, cell); if (s.type.static) v._cell = cell;
        continue;
      }
      let val;
      if (base === 'ofstream' || base === 'ifstream') {
        val = this.defaultVal(base);
        if (v.ctor) { const args = v.ctor.map(a => this.ev(a, env)); this.openFile(val, args[0].v, args[1] ? args[1].v : null, v.line); }
        const cell = new Cell(type, val); env.vars.set(v.name, cell);
        if (base === 'ofstream') { (env.streams || (env.streams = [])).push(val); this.openStreams.add(val); }
        continue;
      }
      let uninit = false;
      if (v.init) val = this.coerce(base, this.ev(v.init, env), v.line);
      else if (v.ctor) {
        const a = v.ctor.map(x => this.ev(x, env));
        if (base === 'string' && a.length === 2) val = V('s', String(a[1].t === 'c' ? String.fromCharCode(a[1].v) : a[1].v).repeat(a[0].v));
        else val = this.coerce(base, a[0], v.line);
      }
      else { val = this.defaultVal(base); uninit = base !== 'string'; }
      if (base === 'auto') { const nb = this.baseOfVal(val); type.base = nb; val = this.coerce(nb, val, v.line); }
      const cell = new Cell(type, val); cell.uninit = uninit; cell.name = v.name;
      env.vars.set(v.name, cell); if (s.type.static) v._cell = cell;
    }
  }

  /* ---------- lvalues ---------- */
  lvalCell(n, env) {
    if (n.k === 'id') {
      const c = env.find(n.name) || this.globals.vars.get(n.name);
      if (!c) throw this.rt(`Variable '${n.name}' no encontrada`, n.line);
      return c;
    }
    if (n.k === 'idx') {
      const lv = this.lval(n, env);
      // celda virtual para referencia a elemento
      return { get type() { return { base: lv.base }; }, get val() { return lv.get(); }, set val(x) { lv.set(x); }, uninit: false };
    }
    throw this.rt('Se esperaba una variable', n.line);
  }
  lval(n, env) {
    if (n.k === 'id') {
      const c = this.lvalCell(n, env);
      const self = this;
      return {
        base: c.type.base, cell: c,
        get: () => c.val,
        set: v => { c.val = self.coerce(c.type.base, v, n.line); c.uninit = false; return c.val; },
      };
    }
    if (n.k === 'idx') {
      const cell = n.a.k === 'id' ? this.lvalCell(n.a, env) : null;
      const base = this.ev(n.a, env);
      const i = this.ev(n.i, env).v;
      const self = this;
      if (base.t === 'arr') {
        if (i < 0 || i >= base.a.length) {
          this.warn(`Acceso fuera del arreglo: posición ${i} en un arreglo de ${base.a.length} elementos (en C++ esto es comportamiento indefinido)`, n.line, 'oob' + n.line);
        }
        return {
          base: base.base,
          get: () => (i >= 0 && i < base.a.length) ? base.a[i] : self.defaultVal(base.base),
          set: v => { const cv = self.coerce(base.base, v, n.line); if (i >= 0 && i < base.a.length) base.a[i] = cv; return cv; },
        };
      }
      if (base.t === 's' && cell) {
        return {
          base: 'char',
          get: () => V('c', i >= 0 && i < cell.val.v.length ? cell.val.v.charCodeAt(i) : 0),
          set: v => { const s = cell.val.v; const ch = String.fromCharCode(v.v); if (i < 0 || i >= s.length) throw self.rt('Posición fuera del string', n.line); cell.val = V('s', s.slice(0, i) + ch + s.slice(i + 1)); return V('c', v.v); },
        };
      }
      throw this.rt('Solo se puede usar [ ] con arreglos o strings', n.line);
    }
    throw this.rt('Se esperaba una variable', n.line);
  }

  /* ---------- expresiones ---------- */
  ev(n, env) {
    switch (n.k) {
      case 'num': return V(n.t === 'f' ? 'f' : n.t, n.v);
      case 'str': return V('s', n.v);
      case 'chr': return V('c', n.v);
      case 'bool': return n.v ? TRUE : FALSE;
      case 'id': {
        if (n.builtin === 'value') return this.builtinValue(n.name);
        if (n.builtin === 'const') return this.builtinConst(n.name);
        const c = env.find(n.name) || this.globals.vars.get(n.name);
        if (!c) throw this.rt(`Variable '${n.name}' no encontrada`, n.line);
        if (c.uninit) { this.warn(`La variable '${n.name}' se usa sin haberle asignado un valor antes (en C++ contendría un valor impredecible)`, n.line, 'un' + n.name); }
        return c.val;
      }
      case 'scoped': return V(n.ns === 'string' ? 'u' : 'i', SCOPED[n.ns][n.name]);
      case 'seq': this.ev(n.l, env); return this.ev(n.r, env);
      case 'cond': return this.truthy(this.ev(n.c, env)) ? this.ev(n.a, env) : this.ev(n.b, env);
      case 'cast': {
        if (!n.e) return this.defaultVal(n.type.base);
        const v = this.ev(n.e, env);
        if (n.type.base === 'string' && v.t === 'c') return V('s', String.fromCharCode(v.v));
        return this.coerce(n.type.base, v, n.line);
      }
      case 'un': {
        const v = this.ev(n.e, env);
        switch (n.op) {
          case '!': return B(!this.truthy(v));
          case '-': return v.t === 'd' || v.t === 'f' ? V(v.t, -v.v) : V(v.t === 'l' ? 'l' : 'i', v.t === 'l' ? -v.v : wrap32(-v.v));
          case '+': return v.t === 'b' || v.t === 'c' ? V('i', v.v) : v;
          case '~': return V('i', ~v.v);
        }
        break;
      }
      case 'pre': case 'post': {
        const lv = this.lval(n.e, env);
        const old = lv.get();
        if (lv.cell && lv.cell.uninit) this.warn(`La variable '${n.e.name}' se usa sin haberle asignado un valor antes`, n.line, 'un' + n.e.name);
        const nv = this.binop(n.op === '++' ? '+' : '-', old, V('i', 1), n);
        const stored = lv.set(nv);
        return n.k === 'pre' ? stored : old;
      }
      case 'assign': {
        if (n.op === '=') {
          const r = this.ev(n.r, env);
          const lv = this.lval(n.l, env);
          return lv.set(r);
        }
        const lv = this.lval(n.l, env);
        const old = lv.get();
        if (lv.cell && lv.cell.uninit) this.warn(`La variable '${n.l.name}' se usa sin haberle asignado un valor antes`, n.line, 'un' + n.l.name);
        const r = this.ev(n.r, env);
        return lv.set(this.binop(n.op.slice(0, -1), old, r, n));
      }
      case 'bin': {
        const op = n.op;
        if (op === '&&') { return this.truthy(this.ev(n.l, env)) ? B(this.truthy(this.ev(n.r, env))) : FALSE; }
        if (op === '||') { return this.truthy(this.ev(n.l, env)) ? TRUE : B(this.truthy(this.ev(n.r, env))); }
        const l = this.ev(n.l, env);
        if (op === '<<' && (l.t === 'os' || l.t === 'ofs')) { const r = this.ev(n.r, env); this.streamWrite(l, r, n); return l; }
        if (op === '>>' && l.t === 'is') { const lv = this.lval(n.r, env); this.streamRead(l, lv, n); return l; }
        const r = this.ev(n.r, env);
        return this.binop(op, l, r, n);
      }
      case 'idx': return this.lval(n, env).get();
      case 'call': return this.evCall(n, env);
      case 'member': return this.evMember(n, env);
    }
    throw this.rt('Expresión no soportada', n.line);
  }

  builtinValue(name) {
    switch (name) {
      case 'cout': return this.cout;
      case 'cerr': return this.cerr;
      case 'cin': return this.cin;
      case 'endl': return { t: 'manip', f: 'endl' };
      case 'flush': return { t: 'manip', f: 'flush' };
      case 'fixed': return { t: 'manip', f: 'fixed' };
      case 'scientific': return { t: 'manip', f: 'sci' };
      case 'left': return { t: 'manip', f: 'left' };
      case 'right': return { t: 'manip', f: 'right' };
      case 'boolalpha': return { t: 'manip', f: 'boolalpha' };
      case 'noboolalpha': return { t: 'manip', f: 'noboolalpha' };
    }
  }
  builtinConst(name) {
    switch (name) {
      case 'RAND_MAX': return V('i', 32767);
      case 'NULL': return V('i', 0);
      case 'INT_MAX': return V('i', 2147483647);
      case 'INT_MIN': return V('i', -2147483648);
    }
  }

  binop(op, l, r, n) {
    const line = n.line;
    if (l.t === 'u') l = V('l', l.v);
    if (r.t === 'u') r = V('l', r.v);
    // strings
    if (l.t === 's' || r.t === 's') {
      if (l.t === 's' && r.t === 's' || (l.t === 's' && r.t === 'c') || (l.t === 'c' && r.t === 's')) {
        const a = l.t === 'c' ? String.fromCharCode(l.v) : l.v, b = r.t === 'c' ? String.fromCharCode(r.v) : r.v;
        switch (op) {
          case '+': return V('s', a + b);
          case '==': return B(a === b); case '!=': return B(a !== b);
          case '<': return B(a < b); case '>': return B(a > b); case '<=': return B(a <= b); case '>=': return B(a >= b);
        }
      }
      throw this.rt(`Operación ${op} no válida con texto`, line);
    }
    const fl = l.t === 'd' || l.t === 'f' || r.t === 'd' || r.t === 'f';
    const a = l.v, b = r.v;
    switch (op) {
      case '+': case '-': case '*': {
        const x = op === '+' ? a + b : op === '-' ? a - b : (fl ? a * b : (l.t === 'l' || r.t === 'l') ? a * b : Math.imul(a, b));
        if (fl) return V(l.t === 'd' || r.t === 'd' ? 'd' : 'f', (l.t === 'f' && r.t !== 'd' || r.t === 'f' && l.t !== 'd') ? Math.fround(x) : x);
        if (l.t === 'l' || r.t === 'l') return V('l', x);
        return V('i', wrap32(x));
      }
      case '/': {
        if (fl) return V(l.t === 'd' || r.t === 'd' ? 'd' : 'f', a / b);
        if (b === 0) throw this.rt('División entera entre cero: el programa se detendría con un error (la división por 0 no está definida en enteros).', line);
        const q = Math.trunc(a / b);
        return (l.t === 'l' || r.t === 'l') ? V('l', q) : V('i', wrap32(q));
      }
      case '%': {
        if (b === 0) throw this.rt('Módulo (%) entre cero: el programa se detendría con un error.', line);
        const m = a % b;
        return (l.t === 'l' || r.t === 'l') ? V('l', m) : V('i', wrap32(m));
      }
      case '==': return B(a === b); case '!=': return B(a !== b);
      case '<': return B(a < b); case '>': return B(a > b); case '<=': return B(a <= b); case '>=': return B(a >= b);
      case '&': return V(l.t === 'l' || r.t === 'l' ? 'l' : 'i', a & b);
      case '|': return V(l.t === 'l' || r.t === 'l' ? 'l' : 'i', a | b);
      case '^': return V(l.t === 'l' || r.t === 'l' ? 'l' : 'i', a ^ b);
      case '<<': return V('i', a << b);
      case '>>': return V('i', a >> b);
    }
    throw this.rt(`Operador ${op} no soportado`, line);
  }

  /* ---------- formato de salida ---------- */
  fmtDouble(v, st) {
    if (Number.isNaN(v)) return 'nan';
    if (!Number.isFinite(v)) return v < 0 ? '-inf' : 'inf';
    if (st.fixed) return v.toFixed(st.prec);
    if (st.sci) { let e = v.toExponential(st.prec); const [m, x] = e.split('e'); const ex = parseInt(x, 10); const ae = Math.abs(ex); return m + 'e' + (ex < 0 ? '-' : '+') + (ae < 10 ? '0' + ae : ae); }
    return fmtG(v, st.prec);
  }
  fmtVal(v, st) {
    switch (v.t) {
      case 'i': case 'l': return String(v.v);
      case 'u': return v.v < 0 ? (2n ** 64n + BigInt(v.v)).toString() : String(v.v);
      case 'b': return st.boolalpha ? (v.v ? 'true' : 'false') : String(v.v);
      case 'c': return String.fromCharCode(v.v);
      case 's': return v.v;
      case 'd': case 'f': return this.fmtDouble(v.v, st);
      case 'v': throw this.rt('No se puede mostrar el resultado de una función void', 0);
      case 'arr': throw this.rt('No se puede mostrar un arreglo completo', 0);
    }
    return '';
  }
  streamWrite(st, val, n) {
    if (val.t === 'manip') { this.applyManip(st, val); return; }
    if (st.t === 'ofs' && (!st.open || st.fail)) { st.fail = true; return; }
    let s = this.fmtVal(val, st);
    if (st.width > 0) {
      if (s.length < st.width) s = st.left ? s + st.fill.repeat(st.width - s.length) : st.fill.repeat(st.width - s.length) + s;
      st.width = 0;
    }
    if (st.t === 'ofs') { st.buf += s; return; }
    this.emit(s, st.kind === 'cerr');
  }
  applyManip(st, m) {
    switch (m.f) {
      case 'endl': if (st.t === 'ofs') { if (st.open) { st.buf += '\n'; this.flushStream(st); } else st.fail = true; } else this.emit('\n', st.kind === 'cerr'); break;
      case 'flush': if (st.t === 'ofs') this.flushStream(st); break;
      case 'fixed': st.fixed = true; st.sci = false; break;
      case 'sci': st.sci = true; st.fixed = false; break;
      case 'left': st.left = true; break;
      case 'right': st.left = false; break;
      case 'boolalpha': st.boolalpha = true; break;
      case 'noboolalpha': st.boolalpha = false; break;
      case 'setw': st.width = m.n; break;
      case 'setprecision': st.prec = m.n; break;
      case 'setfill': st.fill = m.c; break;
    }
  }

  /* ---------- archivos ---------- */
  openFile(st, name, mode, line) {
    if (st.open) { st.fail = true; return; }
    if (st.t === 'ofs') {
      if (!name || /[\\/:*?"<>|]/.test(name)) { st.fail = true; st.open = false; return; }
      st.name = name; st.open = true; st.fail = false; st.buf = '';
      const app = mode !== null && (mode & 4);
      if (!app) this.files.set(name, ''); else if (!this.files.has(name)) this.files.set(name, '');
      st.mode = mode || 0;
      this.openStreams.add(st);
    } else {
      st.name = name; st.pos = 0; st.eof = false;
      if (name && this.files.has(name)) { st.open = true; st.fail = false; st.text = this.files.get(name); }
      else { st.open = false; st.fail = true; st.text = ''; }
    }
  }
  flushStream(st) {
    if (st.t === 'ofs' && st.open && st.buf) { this.files.set(st.name, (this.files.get(st.name) || '') + st.buf); st.buf = ''; }
  }
  closeFile(st) {
    if (st.t === 'ofs') { if (!st.open) { st.fail = true; return; } this.flushStream(st); st.open = false; this.openStreams.delete(st); }
    else { if (!st.open && st.kind !== 'cin') { st.fail = true; return; } st.open = false; }
  }

  streamRead(st, lv, n) {
    if (st.fail) return;
    const base = lv.base;
    const text = st.text; const len = text.length;
    if (st.kind === 'cin' && len === 0) this.warn('El programa pidió datos con cin, pero el cuadro "Entrada" está vacío. Escriba los datos de entrada antes de ejecutar.', n.line, 'cin-empty');
    if (base === 'char') {
      while (st.pos < len && /\s/.test(text[st.pos])) st.pos++;
      if (st.pos >= len) { st.fail = true; st.eof = true; return; }
      lv.set(V('c', text.charCodeAt(st.pos++))); return;
    }
    while (st.pos < len && /\s/.test(text[st.pos])) st.pos++;
    if (st.pos >= len) { st.fail = true; st.eof = true; if (base !== 'string') lv.set(this.defaultVal(base)); return; }
    let j = st.pos;
    if (base === 'string') {
      while (j < len && !/\s/.test(text[j])) j++;
      lv.set(V('s', text.slice(st.pos, j))); st.pos = j; if (j >= len) st.eof = true; return;
    }
    const m = (base === 'int' || base === 'long' || base === 'bool' || base === 'short' ? /^[+-]?\d+/ : /^[+-]?(\d+\.?\d*([eE][+-]?\d+)?|\.\d+([eE][+-]?\d+)?)/).exec(text.slice(st.pos));
    if (!m) { st.fail = true; lv.set(this.defaultVal(base)); return; }
    j = st.pos + m[0].length;
    st.pos = j; if (j >= len) st.eof = true;
    lv.set(V(base === 'double' || base === 'float' ? 'd' : 'l', parseFloat(m[0])));
  }
  getlineImpl(st, lv, delim, n) {
    if (st.fail) return false;
    if (st.kind === 'cin' && st.text.length === 0) this.warn('El programa pidió datos con cin, pero el cuadro "Entrada" está vacío. Escriba los datos de entrada antes de ejecutar.', n.line, 'cin-empty');
    const text = st.text, len = text.length;
    if (st.pos >= len) { lv.set(V('s', '')); st.fail = true; st.eof = true; return false; }
    let j = st.pos;
    while (j < len && text[j] !== delim) j++;
    let line = text.slice(st.pos, j);
    if (j < len) j++; else st.eof = true;
    st.pos = j;
    lv.set(V('s', line));
    return true;
  }

  /* ---------- llamadas ---------- */
  evCall(n, env) {
    if (n.fn) {
      const fn = n.fn.body ? n.fn : (this.funcs.get(n.fn.name) || []).find(f => f.body && f.params.length === n.fn.params.length) || n.fn;
      return this.callFn(fn, n.args, env, n.line);
    }
    const name = n.builtin || n.name;
    const args = n.args;
    switch (name) {
      case 'getline': {
        const st = this.ev(args[0], env);
        const lv = this.lval(args[1], env);
        const d = args[2] ? this.ev(args[2], env).v : '\n';
        const delim = typeof d === 'number' ? String.fromCharCode(d) : d;
        this.getlineImpl(st, lv, delim, n);
        return st;
      }
      case 'swap': {
        const a = this.lval(args[0], env), b = this.lval(args[1], env);
        const t = a.get(); a.set(b.get()); b.set(t); return { t: 'v', v: 0 };
      }
    }
    const a = args.map(x => this.ev(x, env));
    const num = i => a[i].v;
    switch (name) {
      case 'rand': this.randSeed = (Math.imul(this.randSeed, 214013) + 2531011) >>> 0; return V('i', (this.randSeed >>> 16) & 0x7fff);
      case 'srand': this.randSeed = num(0) >>> 0; return { t: 'v', v: 0 };
      case 'time': return V('l', this.opts.fixedTime != null ? this.opts.fixedTime : Math.floor(Date.now() / 1000));
      case 'abs': return a[0].t === 'd' || a[0].t === 'f' ? V(a[0].t, Math.abs(num(0))) : V('i', wrap32(Math.abs(num(0))));
      case 'sqrt': return V('d', Math.sqrt(num(0)));
      case 'pow': return V('d', Math.pow(num(0), num(1)));
      case 'floor': return V('d', Math.floor(num(0)));
      case 'ceil': return V('d', Math.ceil(num(0)));
      case 'round': return V('d', num(0) < 0 ? -Math.round(-num(0)) : Math.round(num(0)));
      case 'fabs': return V('d', Math.abs(num(0)));
      case 'fmod': return V('d', num(0) % num(1));
      case 'sin': return V('d', Math.sin(num(0))); case 'cos': return V('d', Math.cos(num(0))); case 'tan': return V('d', Math.tan(num(0)));
      case 'log': return V('d', Math.log(num(0))); case 'log10': return V('d', Math.log10(num(0))); case 'exp': return V('d', Math.exp(num(0)));
      case 'atoi': return V('i', wrap32(parseInt(a[0].v, 10) || 0));
      case 'atof': return V('d', parseFloat(a[0].v) || 0);
      case 'exit': throw new ExitSignal(num(0));
      case 'system': return V('i', 0);
      case 'isdigit': return V('i', /[0-9]/.test(String.fromCharCode(num(0))) ? 1 : 0);
      case 'isalpha': return V('i', /[A-Za-z]/.test(String.fromCharCode(num(0))) ? 1 : 0);
      case 'isalnum': return V('i', /[A-Za-z0-9]/.test(String.fromCharCode(num(0))) ? 1 : 0);
      case 'isupper': return V('i', /[A-Z]/.test(String.fromCharCode(num(0))) ? 1 : 0);
      case 'islower': return V('i', /[a-z]/.test(String.fromCharCode(num(0))) ? 1 : 0);
      case 'isspace': return V('i', /\s/.test(String.fromCharCode(num(0))) ? 1 : 0);
      case 'toupper': return V('i', String.fromCharCode(num(0)).toUpperCase().charCodeAt(0));
      case 'tolower': return V('i', String.fromCharCode(num(0)).toLowerCase().charCodeAt(0));
      case 'to_string': return V('s', a[0].t === 'd' || a[0].t === 'f' ? a[0].v.toFixed(6) : a[0].t === 'c' ? String(a[0].v) : String(a[0].v));
      case 'stoi': case 'stol': {
        const m = /^\s*[+-]?\d+/.exec(a[0].v);
        if (!m) throw this.rt(`stoi no pudo convertir "${a[0].v}" a número (el programa terminaría con una excepción)`, n.line);
        return name === 'stoi' ? V('i', wrap32(parseInt(m[0], 10))) : V('l', parseInt(m[0], 10));
      }
      case 'stod': case 'stof': {
        const m = /^\s*[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/.exec(a[0].v);
        if (!m) throw this.rt(`${name} no pudo convertir "${a[0].v}" a número (el programa terminaría con una excepción)`, n.line);
        return name === 'stod' ? V('d', parseFloat(m[0])) : V('f', Math.fround(parseFloat(m[0])));
      }
      case 'setw': return { t: 'manip', f: 'setw', n: num(0) };
      case 'setprecision': return { t: 'manip', f: 'setprecision', n: num(0) };
      case 'setfill': return { t: 'manip', f: 'setfill', c: String.fromCharCode(num(0)) };
      case 'min': { const r = this.binop('<', a[1], a[0], n).v ? a[1] : a[0]; return this.coerce(this.baseOfVal(this.binopType(a[0], a[1])), r, n.line); }
      case 'max': { const r = this.binop('<', a[0], a[1], n).v ? a[1] : a[0]; return this.coerce(this.baseOfVal(this.binopType(a[0], a[1])), r, n.line); }
    }
    throw this.rt(`La función '${name}' no está disponible en este simulador`, n.line);
  }
  binopType(a, b) { return (a.t === 'd' || b.t === 'd') ? V('d', 0) : (a.t === 'f' || b.t === 'f') ? V('f', 0) : (a.t === 'l' || b.t === 'l') ? V('l', 0) : V('i', 0); }

  evMember(n, env) {
    const name = n.name;
    const o = this.ev(n.obj, env);
    if (o.t === 's') {
      const lvOk = n.obj.k === 'id' || n.obj.k === 'idx';
      const s = o.v;
      const a = n.args.map(x => this.ev(x, env));
      const txt = v => v.t === 'c' ? String.fromCharCode(v.v) : v.v;
      const set = ns => { if (!lvOk) throw this.rt(`${name} necesita una variable string`, n.line); this.lval(n.obj, env).set(V('s', ns)); };
      switch (name) {
        case 'length': case 'size': return V('u', s.length);
        case 'empty': return B(s.length === 0);
        case 'c_str': return V('s', s);
        case 'substr': {
          const p = a.length ? a[0].v : 0;
          if (p > s.length) throw this.rt(`substr: la posición ${p} está fuera del string (longitud ${s.length}); en C++ esto lanza una excepción`, n.line);
          return V('s', a.length > 1 ? s.substr(p, a[1].v) : s.substr(p));
        }
        case 'find': { const i = s.indexOf(txt(a[0]), a[1] ? a[1].v : 0); return V('u', i); }
        case 'rfind': { const i = a[1] ? s.lastIndexOf(txt(a[0]), a[1].v) : s.lastIndexOf(txt(a[0])); return V('u', i); }
        case 'at': { const i = a[0].v; if (i < 0 || i >= s.length) throw this.rt(`at(${i}): posición fuera del string (longitud ${s.length}); en C++ esto lanza una excepción`, n.line); return V('c', s.charCodeAt(i)); }
        case 'front': return V('c', s.length ? s.charCodeAt(0) : 0);
        case 'back': return V('c', s.length ? s.charCodeAt(s.length - 1) : 0);
        case 'push_back': set(s + txt(a[0])); return { t: 'v', v: 0 };
        case 'pop_back': set(s.slice(0, -1)); return { t: 'v', v: 0 };
        case 'append': set(s + txt(a[0])); return V('s', s + txt(a[0]));
        case 'clear': set(''); return { t: 'v', v: 0 };
        case 'erase': { const p = a.length ? a[0].v : 0; const l = a.length > 1 ? a[1].v : s.length - p; const ns = s.slice(0, p) + s.slice(p + l); set(ns); return V('s', ns); }
        case 'insert': { const ns = s.slice(0, a[0].v) + txt(a[1]) + s.slice(a[0].v); set(ns); return V('s', ns); }
        case 'compare': { const t = txt(a[0]); return V('i', s < t ? -1 : s > t ? 1 : 0); }
      }
    } else if (o.t === 'ofs') {
      switch (name) {
        case 'open': { const a = n.args.map(x => this.ev(x, env)); this.openFile(o, a[0].v, a[1] ? a[1].v : null, n.line); return { t: 'v', v: 0 }; }
        case 'close': this.closeFile(o); return { t: 'v', v: 0 };
        case 'is_open': return B(o.open);
        case 'fail': case 'bad': return B(o.fail);
        case 'good': return B(!o.fail);
        case 'eof': return FALSE;
        case 'flush': this.flushStream(o); return o;
        case 'clear': o.fail = false; return { t: 'v', v: 0 };
      }
    } else if (o.t === 'is') {
      switch (name) {
        case 'open': { const a = n.args.map(x => this.ev(x, env)); this.openFile(o, a[0].v, null, n.line); return { t: 'v', v: 0 }; }
        case 'close': this.closeFile(o); return { t: 'v', v: 0 };
        case 'is_open': return B(o.open);
        case 'fail': case 'bad': return B(o.fail);
        case 'good': return B(!o.fail && !o.eof);
        case 'eof': return B(o.eof);
        case 'clear': o.fail = false; o.eof = false; return { t: 'v', v: 0 };
        case 'get': { if (o.pos >= o.text.length) { o.eof = true; o.fail = true; return V('i', -1); } return V('i', o.text.charCodeAt(o.pos++)); }
        case 'peek': return V('i', o.pos < o.text.length ? o.text.charCodeAt(o.pos) : -1);
        case 'ignore': { const a = n.args.map(x => this.ev(x, env)); const cnt = a.length ? a[0].v : 1; const d = a.length > 1 ? String.fromCharCode(a[1].v) : null; let k = 0; while (o.pos < o.text.length && k < cnt) { const ch = o.text[o.pos++]; k++; if (d && ch === d) break; } return { t: 'v', v: 0 }; }
      }
    } else if (o.t === 'os') {
      if (name === 'flush') return o;
    }
    throw this.rt(`Método '${name}' no disponible en este simulador`, n.line);
  }
}

/* ------------------------------------------------------------------ */
/* API                                                                 */
/* ------------------------------------------------------------------ */
function compile(source) {
  const { toks, includes } = lex(source);
  const parser = new Parser(toks);
  const prog = parser.parseProgram();
  const res = check(prog, includes);
  return { prog, includes, errors: res.errors, check: res };
}

function run(source, opts) {
  opts = opts || {};
  const t0 = Date.now();
  const result = { ok: false, compileErrors: [], runtimeError: null, warnings: [], out: [], files: {}, exitCode: 0, steps: 0, ms: 0 };
  let comp;
  try {
    comp = compile(source);
  } catch (e) {
    if (e instanceof CppError) { result.compileErrors = [{ line: e.line, msg: e.message }]; result.files = Object.assign({}, opts.files || {}); return result; }
    throw e;
  }
  if (comp.errors.length) { result.compileErrors = comp.errors.slice().sort((a, b) => a.line - b.line); result.files = Object.assign({}, opts.files || {}); return result; }
  const it = new Interp(comp.prog, comp.check, opts);
  try {
    it.run();
    result.ok = true;
  } catch (e) {
    if (e instanceof CppError) result.runtimeError = { line: e.line, msg: e.message };
    else throw e;
  }
  result.out = it.out; result.warnings = it.warnings; result.exitCode = it.exitCode; result.steps = it.steps;
  const files = {}; it.files.forEach((v, k) => { files[k] = v; });
  result.files = files;
  result.ms = Date.now() - t0;
  return result;
}

return { run, compile, CppError, version: '1.0' };
}));
