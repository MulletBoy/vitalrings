var j = globalThis, ot = j.ShadowRoot && (j.ShadyCSS === void 0 || j.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, lt = /* @__PURE__ */ Symbol(), _t = /* @__PURE__ */ new WeakMap(), Dt = class {
  constructor(t, e, r) {
    if (this._$cssResult$ = !0, r !== lt) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = e;
  }
  get styleSheet() {
    let t = this.o;
    const e = this.t;
    if (ot && t === void 0) {
      const r = e !== void 0 && e.length === 1;
      r && (t = _t.get(e)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), r && _t.set(e, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
}, Qt = (t) => new Dt(typeof t == "string" ? t : t + "", void 0, lt), te = (t, ...e) => {
  const r = t.length === 1 ? t[0] : e.reduce((s, i, a) => s + ((o) => {
    if (o._$cssResult$ === !0) return o.cssText;
    if (typeof o == "number") return o;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + o + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(i) + t[a + 1], t[0]);
  return new Dt(r, t, lt);
}, ee = (t, e) => {
  if (ot) t.adoptedStyleSheets = e.map((r) => r instanceof CSSStyleSheet ? r : r.styleSheet);
  else for (const r of e) {
    const s = document.createElement("style"), i = j.litNonce;
    i !== void 0 && s.setAttribute("nonce", i), s.textContent = r.cssText, t.appendChild(s);
  }
}, mt = ot ? (t) => t : (t) => t instanceof CSSStyleSheet ? ((e) => {
  let r = "";
  for (const s of e.cssRules) r += s.cssText;
  return Qt(r);
})(t) : t, { is: re, defineProperty: se, getOwnPropertyDescriptor: ie, getOwnPropertyNames: ae, getOwnPropertySymbols: ne, getPrototypeOf: oe } = Object, G = globalThis, bt = G.trustedTypes, le = bt ? bt.emptyScript : "", he = G.reactiveElementPolyfillSupport, L = (t, e) => t, st = {
  toAttribute(t, e) {
    switch (e) {
      case Boolean:
        t = t ? le : null;
        break;
      case Object:
      case Array:
        t = t == null ? t : JSON.stringify(t);
    }
    return t;
  },
  fromAttribute(t, e) {
    let r = t;
    switch (e) {
      case Boolean:
        r = t !== null;
        break;
      case Number:
        r = t === null ? null : Number(t);
        break;
      case Object:
      case Array:
        try {
          r = JSON.parse(t);
        } catch {
          r = null;
        }
    }
    return r;
  }
}, Ut = (t, e) => !re(t, e), yt = {
  attribute: !0,
  type: String,
  converter: st,
  reflect: !1,
  useDefault: !1,
  hasChanged: Ut
};
Symbol.metadata ??= /* @__PURE__ */ Symbol("metadata"), G.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
var T = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ??= []).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, e = yt) {
    if (e.state && (e.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((e = Object.create(e)).wrapped = !0), this.elementProperties.set(t, e), !e.noAccessor) {
      const r = /* @__PURE__ */ Symbol(), s = this.getPropertyDescriptor(t, r, e);
      s !== void 0 && se(this.prototype, t, s);
    }
  }
  static getPropertyDescriptor(t, e, r) {
    const { get: s, set: i } = ie(this.prototype, t) ?? {
      get() {
        return this[e];
      },
      set(a) {
        this[e] = a;
      }
    };
    return {
      get: s,
      set(a) {
        const o = s?.call(this);
        i?.call(this, a), this.requestUpdate(t, o, r);
      },
      configurable: !0,
      enumerable: !0
    };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? yt;
  }
  static _$Ei() {
    if (this.hasOwnProperty(L("elementProperties"))) return;
    const t = oe(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(L("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(L("properties"))) {
      const e = this.properties, r = [...ae(e), ...ne(e)];
      for (const s of r) this.createProperty(s, e[s]);
    }
    const t = this[Symbol.metadata];
    if (t !== null) {
      const e = litPropertyMetadata.get(t);
      if (e !== void 0) for (const [r, s] of e) this.elementProperties.set(r, s);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [e, r] of this.elementProperties) {
      const s = this._$Eu(e, r);
      s !== void 0 && this._$Eh.set(s, e);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(t) {
    const e = [];
    if (Array.isArray(t)) {
      const r = new Set(t.flat(1 / 0).reverse());
      for (const s of r) e.unshift(mt(s));
    } else t !== void 0 && e.push(mt(t));
    return e;
  }
  static _$Eu(t, e) {
    const r = e.attribute;
    return r === !1 ? void 0 : typeof r == "string" ? r : typeof t == "string" ? t.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    this._$ES = new Promise((t) => this.enableUpdating = t), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((t) => t(this));
  }
  addController(t) {
    (this._$EO ??= /* @__PURE__ */ new Set()).add(t), this.renderRoot !== void 0 && this.isConnected && t.hostConnected?.();
  }
  removeController(t) {
    this._$EO?.delete(t);
  }
  _$E_() {
    const t = /* @__PURE__ */ new Map(), e = this.constructor.elementProperties;
    for (const r of e.keys()) this.hasOwnProperty(r) && (t.set(r, this[r]), delete this[r]);
    t.size > 0 && (this._$Ep = t);
  }
  createRenderRoot() {
    const t = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return ee(t, this.constructor.elementStyles), t;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((t) => t.hostConnected?.());
  }
  enableUpdating(t) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((t) => t.hostDisconnected?.());
  }
  attributeChangedCallback(t, e, r) {
    this._$AK(t, r);
  }
  _$ET(t, e) {
    const r = this.constructor.elementProperties.get(t), s = this.constructor._$Eu(t, r);
    if (s !== void 0 && r.reflect === !0) {
      const i = (r.converter?.toAttribute !== void 0 ? r.converter : st).toAttribute(e, r.type);
      this._$Em = t, i == null ? this.removeAttribute(s) : this.setAttribute(s, i), this._$Em = null;
    }
  }
  _$AK(t, e) {
    const r = this.constructor, s = r._$Eh.get(t);
    if (s !== void 0 && this._$Em !== s) {
      const i = r.getPropertyOptions(s), a = typeof i.converter == "function" ? { fromAttribute: i.converter } : i.converter?.fromAttribute !== void 0 ? i.converter : st;
      this._$Em = s;
      const o = a.fromAttribute(e, i.type);
      this[s] = o ?? this._$Ej?.get(s) ?? o, this._$Em = null;
    }
  }
  requestUpdate(t, e, r, s = !1, i) {
    if (t !== void 0) {
      const a = this.constructor;
      if (s === !1 && (i = this[t]), r ??= a.getPropertyOptions(t), !((r.hasChanged ?? Ut)(i, e) || r.useDefault && r.reflect && i === this._$Ej?.get(t) && !this.hasAttribute(a._$Eu(t, r)))) return;
      this.C(t, e, r);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, e, { useDefault: r, reflect: s, wrapped: i }, a) {
    r && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t) && (this._$Ej.set(t, a ?? e ?? this[t]), i !== !0 || a !== void 0) || (this._$AL.has(t) || (this.hasUpdated || r || (e = void 0), this._$AL.set(t, e)), s === !0 && this._$Em !== t && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (e) {
      Promise.reject(e);
    }
    const t = this.scheduleUpdate();
    return t != null && await t, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
        for (const [s, i] of this._$Ep) this[s] = i;
        this._$Ep = void 0;
      }
      const r = this.constructor.elementProperties;
      if (r.size > 0) for (const [s, i] of r) {
        const { wrapped: a } = i, o = this[s];
        a !== !0 || this._$AL.has(s) || o === void 0 || this.C(s, void 0, i, o);
      }
    }
    let t = !1;
    const e = this._$AL;
    try {
      t = this.shouldUpdate(e), t ? (this.willUpdate(e), this._$EO?.forEach((r) => r.hostUpdate?.()), this.update(e)) : this._$EM();
    } catch (r) {
      throw t = !1, this._$EM(), r;
    }
    t && this._$AE(e);
  }
  willUpdate(t) {
  }
  _$AE(t) {
    this._$EO?.forEach((e) => e.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(t)), this.updated(t);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(t) {
    return !0;
  }
  update(t) {
    this._$Eq &&= this._$Eq.forEach((e) => this._$ET(e, this[e])), this._$EM();
  }
  updated(t) {
  }
  firstUpdated(t) {
  }
};
T.elementStyles = [], T.shadowRootOptions = { mode: "open" }, T[L("elementProperties")] = /* @__PURE__ */ new Map(), T[L("finalized")] = /* @__PURE__ */ new Map(), he?.({ ReactiveElement: T }), (G.reactiveElementVersions ??= []).push("2.1.2");
var ht = globalThis, $t = (t) => t, W = ht.trustedTypes, wt = W ? W.createPolicy("lit-html", { createHTML: (t) => t }) : void 0, Lt = "$lit$", k = `lit$${Math.random().toFixed(9).slice(2)}$`, Bt = "?" + k, ce = `<${Bt}>`, E = document, B = () => E.createComment(""), F = (t) => t === null || typeof t != "object" && typeof t != "function", ct = Array.isArray, de = (t) => ct(t) || typeof t?.[Symbol.iterator] == "function", Q = `[ 	
\f\r]`, z = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, xt = /-->/g, kt = />/g, A = RegExp(`>|${Q}(?:([^\\s"'>=/]+)(${Q}*=${Q}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), At = /'/g, St = /"/g, Ft = /^(?:script|style|textarea|title)$/i, dt = (t) => (e, ...r) => ({
  _$litType$: t,
  strings: e,
  values: r
}), d = dt(1), Y = dt(2), qe = dt(3), C = /* @__PURE__ */ Symbol.for("lit-noChange"), l = /* @__PURE__ */ Symbol.for("lit-nothing"), Et = /* @__PURE__ */ new WeakMap(), S = E.createTreeWalker(E, 129);
function Vt(t, e) {
  if (!ct(t) || !t.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return wt !== void 0 ? wt.createHTML(e) : e;
}
var ue = (t, e) => {
  const r = t.length - 1, s = [];
  let i, a = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", o = z;
  for (let n = 0; n < r; n++) {
    const h = t[n];
    let p, g, u = -1, m = 0;
    for (; m < h.length && (o.lastIndex = m, g = o.exec(h), g !== null); ) m = o.lastIndex, o === z ? g[1] === "!--" ? o = xt : g[1] !== void 0 ? o = kt : g[2] !== void 0 ? (Ft.test(g[2]) && (i = RegExp("</" + g[2], "g")), o = A) : g[3] !== void 0 && (o = A) : o === A ? g[0] === ">" ? (o = i ?? z, u = -1) : g[1] === void 0 ? u = -2 : (u = o.lastIndex - g[2].length, p = g[1], o = g[3] === void 0 ? A : g[3] === '"' ? St : At) : o === St || o === At ? o = A : o === xt || o === kt ? o = z : (o = A, i = void 0);
    const b = o === A && t[n + 1].startsWith("/>") ? " " : "";
    a += o === z ? h + ce : u >= 0 ? (s.push(p), h.slice(0, u) + Lt + h.slice(u) + k + b) : h + k + (u === -2 ? n : b);
  }
  return [Vt(t, a + (t[r] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), s];
}, it = class It {
  constructor({ strings: e, _$litType$: r }, s) {
    let i;
    this.parts = [];
    let a = 0, o = 0;
    const n = e.length - 1, h = this.parts, [p, g] = ue(e, r);
    if (this.el = It.createElement(p, s), S.currentNode = this.el.content, r === 2 || r === 3) {
      const u = this.el.content.firstChild;
      u.replaceWith(...u.childNodes);
    }
    for (; (i = S.nextNode()) !== null && h.length < n; ) {
      if (i.nodeType === 1) {
        if (i.hasAttributes()) for (const u of i.getAttributeNames()) if (u.endsWith(Lt)) {
          const m = g[o++], b = i.getAttribute(u).split(k), y = /([.?@])?(.*)/.exec(m);
          h.push({
            type: 1,
            index: a,
            name: y[2],
            strings: b,
            ctor: y[1] === "." ? ge : y[1] === "?" ? ve : y[1] === "@" ? fe : K
          }), i.removeAttribute(u);
        } else u.startsWith(k) && (h.push({
          type: 6,
          index: a
        }), i.removeAttribute(u));
        if (Ft.test(i.tagName)) {
          const u = i.textContent.split(k), m = u.length - 1;
          if (m > 0) {
            i.textContent = W ? W.emptyScript : "";
            for (let b = 0; b < m; b++) i.append(u[b], B()), S.nextNode(), h.push({
              type: 2,
              index: ++a
            });
            i.append(u[m], B());
          }
        }
      } else if (i.nodeType === 8) if (i.data === Bt) h.push({
        type: 2,
        index: a
      });
      else {
        let u = -1;
        for (; (u = i.data.indexOf(k, u + 1)) !== -1; ) h.push({
          type: 7,
          index: a
        }), u += k.length - 1;
      }
      a++;
    }
  }
  static createElement(e, r) {
    const s = E.createElement("template");
    return s.innerHTML = e, s;
  }
};
function O(t, e, r = t, s) {
  if (e === C) return e;
  let i = s !== void 0 ? r._$Co?.[s] : r._$Cl;
  const a = F(e) ? void 0 : e._$litDirective$;
  return i?.constructor !== a && (i?._$AO?.(!1), a === void 0 ? i = void 0 : (i = new a(t), i._$AT(t, r, s)), s !== void 0 ? (r._$Co ??= [])[s] = i : r._$Cl = i), i !== void 0 && (e = O(t, i._$AS(t, e.values), i, s)), e;
}
var pe = class {
  constructor(t, e) {
    this._$AV = [], this._$AN = void 0, this._$AD = t, this._$AM = e;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t) {
    const { el: { content: e }, parts: r } = this._$AD, s = (t?.creationScope ?? E).importNode(e, !0);
    S.currentNode = s;
    let i = S.nextNode(), a = 0, o = 0, n = r[0];
    for (; n !== void 0; ) {
      if (a === n.index) {
        let h;
        n.type === 2 ? h = new ut(i, i.nextSibling, this, t) : n.type === 1 ? h = new n.ctor(i, n.name, n.strings, this, t) : n.type === 6 && (h = new _e(i, this, t)), this._$AV.push(h), n = r[++o];
      }
      a !== n?.index && (i = S.nextNode(), a++);
    }
    return S.currentNode = E, s;
  }
  p(t) {
    let e = 0;
    for (const r of this._$AV) r !== void 0 && (r.strings !== void 0 ? (r._$AI(t, r, e), e += r.strings.length - 2) : r._$AI(t[e])), e++;
  }
}, ut = class jt {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(e, r, s, i) {
    this.type = 2, this._$AH = l, this._$AN = void 0, this._$AA = e, this._$AB = r, this._$AM = s, this.options = i, this._$Cv = i?.isConnected ?? !0;
  }
  get parentNode() {
    let e = this._$AA.parentNode;
    const r = this._$AM;
    return r !== void 0 && e?.nodeType === 11 && (e = r.parentNode), e;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(e, r = this) {
    e = O(this, e, r), F(e) ? e === l || e == null || e === "" ? (this._$AH !== l && this._$AR(), this._$AH = l) : e !== this._$AH && e !== C && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : de(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== l && F(this._$AH) ? this._$AA.nextSibling.data = e : this.T(E.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    const { values: r, _$litType$: s } = e, i = typeof s == "number" ? this._$AC(e) : (s.el === void 0 && (s.el = it.createElement(Vt(s.h, s.h[0]), this.options)), s);
    if (this._$AH?._$AD === i) this._$AH.p(r);
    else {
      const a = new pe(i, this), o = a.u(this.options);
      a.p(r), this.T(o), this._$AH = a;
    }
  }
  _$AC(e) {
    let r = Et.get(e.strings);
    return r === void 0 && Et.set(e.strings, r = new it(e)), r;
  }
  k(e) {
    ct(this._$AH) || (this._$AH = [], this._$AR());
    const r = this._$AH;
    let s, i = 0;
    for (const a of e) i === r.length ? r.push(s = new jt(this.O(B()), this.O(B()), this, this.options)) : s = r[i], s._$AI(a), i++;
    i < r.length && (this._$AR(s && s._$AB.nextSibling, i), r.length = i);
  }
  _$AR(e = this._$AA.nextSibling, r) {
    for (this._$AP?.(!1, !0, r); e !== this._$AB; ) {
      const s = $t(e).nextSibling;
      $t(e).remove(), e = s;
    }
  }
  setConnected(e) {
    this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
  }
}, K = class {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, e, r, s, i) {
    this.type = 1, this._$AH = l, this._$AN = void 0, this.element = t, this.name = e, this._$AM = s, this.options = i, r.length > 2 || r[0] !== "" || r[1] !== "" ? (this._$AH = Array(r.length - 1).fill(/* @__PURE__ */ new String()), this.strings = r) : this._$AH = l;
  }
  _$AI(t, e = this, r, s) {
    const i = this.strings;
    let a = !1;
    if (i === void 0) t = O(this, t, e, 0), a = !F(t) || t !== this._$AH && t !== C, a && (this._$AH = t);
    else {
      const o = t;
      let n, h;
      for (t = i[0], n = 0; n < i.length - 1; n++) h = O(this, o[r + n], e, n), h === C && (h = this._$AH[n]), a ||= !F(h) || h !== this._$AH[n], h === l ? t = l : t !== l && (t += (h ?? "") + i[n + 1]), this._$AH[n] = h;
    }
    a && !s && this.j(t);
  }
  j(t) {
    t === l ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}, ge = class extends K {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === l ? void 0 : t;
  }
}, ve = class extends K {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== l);
  }
}, fe = class extends K {
  constructor(t, e, r, s, i) {
    super(t, e, r, s, i), this.type = 5;
  }
  _$AI(t, e = this) {
    if ((t = O(this, t, e, 0) ?? l) === C) return;
    const r = this._$AH, s = t === l && r !== l || t.capture !== r.capture || t.once !== r.once || t.passive !== r.passive, i = t !== l && (r === l || s);
    s && this.element.removeEventListener(this.name, this, r), i && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, t) : this._$AH.handleEvent(t);
  }
}, _e = class {
  constructor(t, e, r) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = e, this.options = r;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    O(this, t);
  }
}, me = ht.litHtmlPolyfillSupport;
me?.(it, ut), (ht.litHtmlVersions ??= []).push("3.3.3");
var be = (t, e, r) => {
  const s = r?.renderBefore ?? e;
  let i = s._$litPart$;
  if (i === void 0) {
    const a = r?.renderBefore ?? null;
    s._$litPart$ = i = new ut(e.insertBefore(B(), a), a, void 0, r ?? {});
  }
  return i._$AI(t), i;
}, pt = globalThis, H = class extends T {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const t = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= t.firstChild, t;
  }
  update(t) {
    const e = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = be(e, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return C;
  }
};
H._$litElement$ = !0, H.finalized = !0, pt.litElementHydrateSupport?.({ LitElement: H });
var ye = pt.litElementPolyfillSupport;
ye?.({ LitElement: H });
(pt.litElementVersions ??= []).push("4.2.2");
var $e = {
  ATTRIBUTE: 1,
  CHILD: 2,
  PROPERTY: 3,
  BOOLEAN_ATTRIBUTE: 4,
  EVENT: 5,
  ELEMENT: 6
}, we = (t) => (...e) => ({
  _$litDirective$: t,
  values: e
}), xe = class {
  constructor(t) {
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AT(t, e, r) {
    this._$Ct = t, this._$AM = e, this._$Ci = r;
  }
  _$AS(t, e) {
    return this.update(t, e);
  }
  update(t, e) {
    return this.render(...e);
  }
}, Wt = "important", ke = " !" + Wt, Ae = we(class extends xe {
  constructor(t) {
    if (super(t), t.type !== $e.ATTRIBUTE || t.name !== "style" || t.strings?.length > 2) throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.");
  }
  render(t) {
    return Object.keys(t).reduce((e, r) => {
      const s = t[r];
      return s == null ? e : e + `${r = r.includes("-") ? r : r.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g, "-$&").toLowerCase()}:${s};`;
    }, "");
  }
  update(t, [e]) {
    const { style: r } = t.element;
    if (this.ft === void 0) return this.ft = new Set(Object.keys(e)), this.render(e);
    for (const s of this.ft) e[s] ?? (this.ft.delete(s), s.includes("-") ? r.removeProperty(s) : r[s] = null);
    for (const s in e) {
      const i = e[s];
      if (i != null) {
        this.ft.add(s);
        const a = typeof i == "string" && i.endsWith(ke);
        s.includes("-") || a ? r.setProperty(s, a ? i.slice(0, -11) : i, a ? Wt : "") : r[s] = i;
      }
    }
    return C;
  }
}), Se = 2.2046226218;
function at(t) {
  if (t == null || t === "") return null;
  const e = Number(t);
  return Number.isFinite(e) ? e : null;
}
function v(t, e = "value") {
  return t ? at(t[e]) : null;
}
function _(t, e = 0) {
  return t === null ? "--" : t.toFixed(e);
}
function Ct(t, e) {
  const r = t ? Date.parse(t) : NaN;
  if (!Number.isFinite(r)) return null;
  const s = Math.max(0, Math.round((e - r) / 6e4));
  return s < 1 ? "now" : s < 60 ? `${s}m` : s < 2880 ? `${Math.round(s / 60)}h` : `${Math.round(s / 1440)}d`;
}
function Ee(t, e) {
  const r = t ? Date.parse(t) : NaN;
  return Number.isFinite(r) ? Math.max(0, (e - r) / 6e4) : null;
}
function X(t, e, r, s) {
  try {
    return t.toLocaleString(e, {
      ...r,
      timeZone: s
    });
  } catch {
    return t.toLocaleString(e, r);
  }
}
function V(t, e, r) {
  return X(new Date(t), e, {
    hour: "numeric",
    minute: "2-digit"
  }, r);
}
function Rt(t, e, r) {
  return X(new Date(t), e, { weekday: "short" }, r);
}
function Mt(t, e, r) {
  return X(new Date(t), e, {
    day: "numeric",
    month: "short",
    year: "numeric"
  }, r);
}
function Tt(t, e, r) {
  return X(new Date(t), e, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit"
  }, r);
}
function Ce(t, e) {
  try {
    const r = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      hourCycle: "h23",
      timeZone: e
    }).format(new Date(t));
    return Number(r) % 24;
  } catch {
    return new Date(t).getHours();
  }
}
function Re(t) {
  const e = (typeof t == "string" ? t : "").replace(/[_-]+/g, " ").trim().slice(0, 40);
  return e ? e.charAt(0).toUpperCase() + e.slice(1) : "Workout";
}
function Me(t) {
  const e = Math.round(Math.abs(t));
  return e < 60 ? `${e} min` : `${Math.floor(e / 60)}h ${String(e % 60).padStart(2, "0")}m`;
}
function Te(t, e) {
  if (!e) return `${Math.round(t * 100)} cm`;
  const r = Math.round(t / 0.0254);
  return `${Math.floor(r / 12)} ft ${r % 12} in`;
}
var He = [
  1,
  2,
  2.5,
  5
];
function Oe(t, e, r = 1) {
  if (!Number.isFinite(t) || !Number.isFinite(e) || e < t) return {
    bottom: 0,
    top: 1
  };
  if (e - t < r) {
    const a = (t + e) / 2;
    t = a - r / 2, e = a + r / 2;
  }
  const s = e - t, i = 10 ** Math.floor(Math.log10(s / 8));
  for (const a of [i, i * 10]) for (const o of He) {
    const n = o * a, h = Math.floor(t / n + 1e-9) * n;
    let p = Math.ceil((e - h) / n - 1e-9);
    if (p % 2 && (p += 1), p <= 8) return {
      bottom: h,
      top: h + p * n
    };
  }
  return {
    bottom: Math.floor(t),
    top: Math.ceil(e)
  };
}
function U(t) {
  return Math.abs(t - Math.round(t)) < 1e-6 ? String(Math.round(t)) : t.toFixed(1);
}
var Z = (t, e = 0, r = 100) => Math.min(r, Math.max(e, t)), $ = (t) => t.toFixed(2);
function Ht(t, e) {
  if (t.length === 1) return `M${$(t[0][0])},${$(t[0][1])} l0.01,0`;
  let r = `M${$(t[0][0])},${$(t[0][1])}`;
  for (let s = 0; s < t.length - 1; s++) {
    if (!e) {
      r += ` L${$(t[s + 1][0])},${$(t[s + 1][1])}`;
      continue;
    }
    const i = t[Math.max(0, s - 1)], a = t[Math.min(t.length - 1, s + 2)], o = [t[s][0] + (t[s + 1][0] - i[0]) / 6, Z(t[s][1] + (t[s + 1][1] - i[1]) / 6)], n = [t[s + 1][0] - (a[0] - t[s][0]) / 6, Z(t[s + 1][1] - (a[1] - t[s][1]) / 6)];
    r += ` C${$(o[0])},${$(o[1])} ${$(n[0])},${$(n[1])} ${$(t[s + 1][0])},${$(t[s + 1][1])}`;
  }
  return r;
}
function Ot(t) {
  const [e, r] = t.domain, s = t.points.filter((c) => Number.isFinite(c.at) && Number.isFinite(c.value) && c.at >= e && c.at <= r).slice(-400);
  if (s.length < 2 || !(r > e)) return d`<div class="chart-empty">Not enough readings in this period yet.</div>`;
  const i = (c) => t.band ? c.low ?? c.value : c.value, a = (c) => t.band ? c.high ?? c.value : c.value, { bottom: o, top: n } = Oe(Math.min(...s.map(i)), Math.max(...s.map(a)), t.minSpan ?? 2), h = n - o, p = (c) => Z((c - e) / (r - e) * 100), g = (c) => Z((1 - (c - o) / h) * 100), u = [];
  for (const c of s) {
    const f = u[u.length - 1];
    f && (!t.gapMs || c.at - f[f.length - 1].at <= t.gapMs) ? f.push(c) : u.push([c]);
  }
  const m = t.smooth !== !1, b = (c) => u.map((f) => Ht(f.map((ft) => [p(ft.at), g(c(ft))]), m)).join(" "), y = u.filter((c) => c.length > 1).map((c) => `${Ht(c.map((f) => [p(f.at), g(f.value)]), m)} L${$(p(c[c.length - 1].at))},100 L${$(p(c[0].at))},100 Z`).join(" "), N = s.map((c) => p(c.at)), J = (c) => c <= 0 ? 0 : c >= s.length ? 100 : (N[c - 1] + N[c]) / 2, w = t.hover !== null ? s[t.hover] : void 0, R = w ? p(w.at) : 0, P = (c) => `${_(c, t.digits)}${t.unit ? ` ${t.unit}` : ""}`, vt = [
    n,
    o + h / 2,
    o
  ];
  return d`
    <div class="chart ${t.kind}">
      <div class="yaxis">${vt.map((c) => d`<span>${U(c)}</span>`)}</div>
      <div class="plot" role="img" aria-label=${t.description} @pointerleave=${() => t.onHover(null)}>
        ${vt.map((c, f) => d`<div class="grid" style="top:${f * 50}%"></div>`)}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          ${y ? Y`<path class="area" d=${y}></path>` : l}
          ${t.band ? Y`<path class="line high" d=${b(a)}></path><path class="line low" d=${b(i)}></path>` : l}
          <path class="line avg" d=${b((c) => c.value)}></path>
        </svg>
        ${t.markers ? s.map((c) => d`<i class="mark" style="left:${p(c.at)}%;top:${g(c.value)}%"></i>`) : l}
        ${w ? d`
              <div class="guide" style="left:${R}%"></div>
              ${t.band ? d`<i class="dot high" style="left:${R}%;top:${g(a(w))}%"></i
                    ><i class="dot low" style="left:${R}%;top:${g(i(w))}%"></i>` : l}
              <i class="dot avg" style="left:${R}%;top:${g(w.value)}%"></i>
              <div class="tip ${R > 55 ? "left" : ""}" style="left:${R}%">
                <b>${w.title}</b>
                ${t.band ? d`<span class="high"><i></i>High<u>${P(a(w))}</u></span>
                      <span class="avg"><i></i>${t.label}<u>${P(w.value)}</u></span>
                      <span class="low"><i></i>Low<u>${P(i(w))}</u></span>` : d`<span class="avg"><i></i>${t.label}<u>${P(w.value)}</u></span>`}
              </div>
            ` : l}
        ${s.map((c, f) => d`<button
            class="hit"
            style="left:${J(f)}%;width:${J(f + 1) - J(f)}%"
            aria-label="${c.title}: ${t.label} ${P(c.value)}"
            @pointerenter=${() => t.onHover(f)}
            @focus=${() => t.onHover(f)}
            @blur=${() => t.onHover(null)}
            @click=${() => t.onHover(f)}
          ></button>`)}
      </div>
      <div class="xaxis">
        ${t.ticks.filter((c) => c.at >= e && c.at <= r).map((c) => {
    const f = p(c.at);
    return d`<span class=${f < 6 ? "" : f > 94 ? "end" : "centered"} style="left:${f}%">${c.label}</span>`;
  })}
      </div>
    </div>
  `;
}
var Yt = [
  "resting",
  "recovery",
  "breathing",
  "sleeping",
  "oxygen",
  "vo2",
  "resting_end",
  "recovery_end",
  "breathing_end",
  "sleeping_end",
  "oxygen_end",
  "vo2_end",
  "heart",
  "heart_low",
  "awake",
  "workout",
  "weight",
  "bmi",
  "height",
  "fresh",
  "recent",
  "stale"
], Ne = [
  24,
  48,
  168
], Nt = [
  "3m",
  "6m",
  "1y",
  "all"
], nt = "synthwave", tt = {
  theme: {
    colors: {
      resting_end: "#a78bfa",
      recovery_end: "#38bdf8",
      breathing_end: "#f97316",
      sleeping_end: "#8b5cf6",
      oxygen_end: "#f43f5e",
      vo2_end: "#14b8a6"
    },
    tiles: !0
  },
  synthwave: {
    colors: {
      resting: "#ff2fd6",
      recovery: "#5df0a8",
      breathing: "#ffb224",
      sleeping: "#4df3ff",
      oxygen: "#ff5c8a",
      vo2: "#c8f55a",
      resting_end: "#a46bff",
      recovery_end: "#4df3ff",
      breathing_end: "#ff7a3d",
      sleeping_end: "#3d7bff",
      oxygen_end: "#ff2fd6",
      vo2_end: "#5df0a8",
      heart: "#ff2fd6",
      heart_low: "#a46bff",
      awake: "#ffb224",
      workout: "#ffb224",
      weight: "#a46bff",
      bmi: "#5df0a8",
      height: "#6d8bff",
      fresh: "#5df0a8",
      recent: "#ffb224",
      stale: "#ff2fd6"
    },
    vars: {
      "--vr-text": "#f1e8ff",
      "--vr-secondary-text": "#b9a6d6",
      "--vr-divider": "#3b1c66",
      "--vr-track": "rgba(185,166,214,0.10)",
      "--vr-track-opacity": "1",
      "--vr-accent-text": "currentColor",
      "--vr-glow": "6px",
      "--vr-tile-fill": "12%",
      "--vr-tile-border": "45%",
      "--vr-tile-glow": "18%",
      "--vr-tile-inset": "7%",
      "--vr-title-tint": "100%",
      "--vr-halo": "13%",
      "--vr-score-glow": "45%",
      "--vr-heart-tint": "#ff2fd6",
      "--vr-vitals-tint": "#5df0a8",
      "--vr-body-tint": "#a46bff"
    },
    tiles: !0,
    background: {
      "--ha-card-background": "#16082b",
      "--ha-card-border-color": "#3b1c66"
    }
  },
  health: {
    colors: {
      resting: "#ff375f",
      recovery: "#30d158",
      breathing: "#ff9f0a",
      sleeping: "#32ade6",
      oxygen: "#ff6482",
      vo2: "#a4e03a",
      resting_end: "#bf5af2",
      recovery_end: "#64d2ff",
      breathing_end: "#ff6b5e",
      sleeping_end: "#5e5ce6",
      oxygen_end: "#ff375f",
      vo2_end: "#30d158",
      heart: "#ff375f",
      heart_low: "#bf5af2",
      awake: "#ff9f0a",
      workout: "#ff9f0a",
      weight: "#bf5af2",
      bmi: "#30d158",
      height: "#5e5ce6",
      fresh: "#30d158",
      recent: "#ff9f0a",
      stale: "#ff453a"
    },
    tiles: !0
  }
}, Pe = /^(#[0-9a-f]{3,8}|[a-z]+|(rgb|rgba|hsl|hsla)\([0-9.,%\s/deg-]+\)|var\(--[a-z0-9-]+\))$/i;
function ze(t) {
  if (typeof t != "string") return;
  const e = t.trim();
  return Pe.test(e) ? e : void 0;
}
function Zt(t) {
  const e = typeof t == "string" ? t : nt;
  return Object.prototype.hasOwnProperty.call(tt, e) ? tt[e] : tt[nt];
}
function qt(t) {
  return Zt(t).tiles ?? !1;
}
function De(t, e, r = !1) {
  const s = Zt(t), i = {
    ...s.vars ?? {},
    ...r ? {} : s.background ?? {}
  };
  for (const a of Yt) {
    const o = ze(e?.[a]) ?? s.colors[a];
    o && (i[`--vr-${a.replace("_", "-")}`] = o);
  }
  return i;
}
var Gt, Pt = "vital-rings-card-editor", Kt = {
  entity: "VitalRings entity",
  name: "Title",
  preset: "Colour preset",
  show_rows: "A row for each ring",
  show_heart: "Heart rate chart, awake averages and workout",
  show_vitals: "VO\u2082 max chart",
  show_body: "Body and weight",
  tiles: "Tinted boxes",
  theme_background: "Use the theme's card background",
  heart_hours: "Heart rate chart opens on",
  trend_range: "VO\u2082 max and weight charts open on",
  weight_unit: "Weight unit",
  colors: "Colours",
  resting: "Ring: Heart",
  resting_end: "Ring: Heart (gradient end)",
  recovery: "Ring: Recovery",
  recovery_end: "Ring: Recovery (gradient end)",
  breathing: "Ring: Breathing",
  breathing_end: "Ring: Breathing (gradient end)",
  sleeping: "Ring: Sleeping",
  sleeping_end: "Ring: Sleeping (gradient end)",
  oxygen: "Ring: Blood oxygen",
  oxygen_end: "Ring: Blood oxygen (gradient end)",
  vo2: "Ring and chart: VO\u2082 max",
  vo2_end: "Ring: VO\u2082 max (gradient end)",
  heart: "Heart rate (average and high)",
  heart_low: "Heart rate (low)",
  awake: "Awake heart rate",
  workout: "Workout",
  weight: "Weight",
  bmi: "Body mass index",
  height: "Height",
  fresh: "Good: synced recently, high score",
  recent: "Fair: synced hours ago, middling score",
  stale: "Poor: synced long ago, low score"
}, Ue = {
  entity: "Any entity of the VitalRings device. The card reads all its figures from the integration.",
  colors: "Any CSS colour, for example #ff2fd6. Leave a field empty to use the preset.",
  theme_background: "Off: the Synthwave preset paints its own dark card.",
  weight_unit: "Empty: follows Home Assistant's unit system."
}, M = (t) => ({
  name: t,
  selector: { boolean: {} }
}), I = (t, e) => ({
  name: t,
  selector: { select: {
    mode: "dropdown",
    options: e
  } }
}), Le = [
  {
    name: "entity",
    required: !0,
    selector: { entity: { filter: {
      integration: "vital_rings",
      domain: "sensor"
    } } }
  },
  {
    name: "name",
    selector: { text: {} }
  },
  I("preset", [
    {
      value: "synthwave",
      label: "Synthwave"
    },
    {
      value: "theme",
      label: "Follow the theme (light or dark)"
    },
    {
      value: "health",
      label: "Health"
    }
  ]),
  {
    type: "grid",
    name: "",
    schema: [
      M("show_rows"),
      M("show_heart"),
      M("show_vitals"),
      M("show_body"),
      M("tiles"),
      M("theme_background")
    ]
  },
  {
    type: "grid",
    name: "",
    schema: [I("heart_hours", [
      {
        value: "24",
        label: "24 hours"
      },
      {
        value: "48",
        label: "48 hours"
      },
      {
        value: "168",
        label: "7 days"
      }
    ]), I("trend_range", [
      {
        value: "3m",
        label: "3 months"
      },
      {
        value: "6m",
        label: "6 months"
      },
      {
        value: "1y",
        label: "1 year"
      },
      {
        value: "all",
        label: "Everything"
      }
    ])]
  },
  I("weight_unit", [{
    value: "kg",
    label: "Kilograms"
  }, {
    value: "lb",
    label: "Pounds"
  }]),
  {
    type: "expandable",
    name: "colors",
    title: Kt.colors,
    schema: Yt.map((t) => ({
      name: t,
      selector: { text: {} }
    }))
  }
], Xt = class extends H {
  setConfig(t) {
    this._config = t;
  }
  render() {
    if (!this._config) return l;
    const t = {
      preset: nt,
      show_rows: !0,
      show_heart: !0,
      show_vitals: !0,
      show_body: !0,
      trend_range: "6m",
      theme_background: !1,
      tiles: qt(this._config.preset),
      ...this._config,
      heart_hours: String(this._config.heart_hours ?? 48)
    };
    return d`
      <ha-form
        .hass=${this.hass}
        .data=${t}
        .schema=${Le}
        .computeLabel=${(e) => Kt[e.name] ?? e.name}
        .computeHelper=${(e) => Ue[e.name]}
        @value-changed=${this._valueChanged}
      ></ha-form>
    `;
  }
  _valueChanged(t) {
    t.stopPropagation();
    const e = { ...t.detail.value }, r = Number(e.heart_hours);
    if (Number.isFinite(r) && r > 0 ? e.heart_hours = r : delete e.heart_hours, e.weight_unit || delete e.weight_unit, e.colors) {
      const s = Object.fromEntries(Object.entries(e.colors).filter(([, i]) => typeof i == "string" && i.trim()));
      Object.keys(s).length ? e.colors = s : delete e.colors;
    }
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: e },
      bubbles: !0,
      composed: !0
    }));
  }
};
Gt = Xt;
Gt.properties = {
  hass: { attribute: !1 },
  _config: { state: !0 }
};
customElements.get(Pt) || customElements.define(Pt, Xt);
var Be = te`
  :host {
    display: block;
    container-type: inline-size;
  }

  /* Colour tokens live on ha-card, where the preset's --vr-* values are set inline. */
  ha-card {
    --_resting: var(--vr-resting, var(--vital-rings-resting-color, #e5484d));
    --_recovery: var(--vr-recovery, var(--vital-rings-recovery-color, #14b8a6));
    --_breathing: var(--vr-breathing, var(--vital-rings-breathing-color, #f59e0b));
    --_sleeping: var(--vr-sleeping, var(--vital-rings-sleeping-color, #6366f1));
    --_oxygen: var(--vr-oxygen, var(--vital-rings-oxygen-color, #ec4899));
    --_vo2: var(--vr-vo2, var(--vital-rings-vo2-color, #22c55e));
    --_heart: var(--vr-heart, var(--vital-rings-heart-color, #e5484d));
    --_heart-low: var(--vr-heart-low, var(--vital-rings-heart-low-color, #8b5cf6));
    --_awake: var(--vr-awake, var(--vital-rings-awake-color, #f59e0b));
    --_workout: var(--vr-workout, var(--vital-rings-workout-color, #f59e0b));
    --_weight: var(--vr-weight, var(--vital-rings-weight-color, #8b5cf6));
    --_bmi: var(--vr-bmi, var(--vital-rings-bmi-color, #14b8a6));
    --_height: var(--vr-height, var(--vital-rings-height-color, #6366f1));
    --_fresh: var(--vr-fresh, var(--vital-rings-fresh-color, #22c55e));
    --_recent: var(--vr-recent, var(--vital-rings-recent-color, #f59e0b));
    --_stale: var(--vr-stale, var(--vital-rings-stale-color, #ef4444));
    --_text: var(--vr-text, var(--primary-text-color, #1c1c1e));
    --_text2: var(--vr-secondary-text, var(--secondary-text-color, #6b6b70));
    --_divider: var(--vr-divider, var(--divider-color, rgba(127, 127, 127, 0.25)));
    --_accent-text: var(--vr-accent-text, var(--_text));
    --_glow: var(--vr-glow, 0px);
    --_surface: var(--ha-card-background, var(--card-background-color, #fff));
  }

  ha-card {
    display: block;
    padding: 16px;
    color: var(--_text);
    overflow: hidden;
  }

  .header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 12px;
  }
  .title {
    font-size: 16px;
    font-weight: 600;
  }

  /* Marker beside the title: how long ago the health data last arrived */
  .age {
    display: inline-block;
    padding: 1px 8px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
    border: 1px solid color-mix(in srgb, currentColor 45%, transparent);
    background: color-mix(in srgb, currentColor 12%, transparent);
  }
  .age.fresh {
    color: var(--_fresh);
  }
  .age.recent {
    color: var(--_recent);
  }
  .age.stale {
    color: var(--_stale);
  }

  /* Two sets of rings; in each, the rings sit beside a row per ring */
  .sets {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  .set {
    display: flex;
    align-items: center;
    gap: 20px;
    min-width: 0;
  }
  .rings {
    position: relative;
    flex: 0 0 164px;
    width: 164px;
    height: 164px;
  }
  .rings svg {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
    overflow: visible;
  }
  .track,
  .fill {
    fill: none;
    stroke: currentColor;
    stroke-linecap: round;
  }
  .track {
    stroke: var(--vr-track, currentColor);
    opacity: var(--vr-track-opacity, 0.16);
  }
  .fill {
    transition:
      stroke-dashoffset 0.7s ease,
      stroke-dasharray 0.7s ease;
    filter: drop-shadow(0 0 calc(var(--_glow) * 0.5) color-mix(in srgb, currentColor 55%, transparent));
  }
  .fill.empty {
    opacity: 0;
  }
  .c-resting {
    color: var(--_resting);
    --end: var(--vr-resting-end, var(--_resting));
  }
  .c-recovery {
    color: var(--_recovery);
    --end: var(--vr-recovery-end, var(--_recovery));
  }
  .c-breathing {
    color: var(--_breathing);
    --end: var(--vr-breathing-end, var(--_breathing));
  }
  .c-sleeping {
    color: var(--_sleeping);
    --end: var(--vr-sleeping-end, var(--_sleeping));
  }
  .c-oxygen {
    color: var(--_oxygen);
    --end: var(--vr-oxygen-end, var(--_oxygen));
  }
  .c-vo2 {
    color: var(--_vo2);
    --end: var(--vr-vo2-end, var(--_vo2));
  }

  .center {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    pointer-events: none;
    color: var(--_text);
  }
  .score {
    font-size: 30px;
    font-weight: 800;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
  }
  .band {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-top: 4px;
    font-size: 10px;
    font-weight: 600;
    white-space: nowrap;
    color: var(--_text2);
  }
  .band-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--band, var(--_text2));
    box-shadow: 0 0 var(--_glow) var(--band, transparent);
  }
  /* How the set scores overall: the colour of the dot and of the glow */
  .b-excellent,
  .b-good {
    --band: var(--_fresh);
  }
  .b-fair {
    --band: var(--_recent);
  }
  .b-low {
    --band: var(--_stale);
  }

  .rows {
    flex: 1 1 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .row-head {
    display: flex;
    align-items: baseline;
    gap: 6px;
    font-size: 13px;
  }
  .dot {
    align-self: center;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
    flex: none;
  }
  .row-name {
    flex: 1;
    font-weight: 600;
    color: var(--_accent-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .row-value {
    color: var(--_text2);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .row-value b {
    color: var(--_text);
    font-size: 15px;
    font-weight: 700;
  }
  .bar {
    height: 5px;
    margin: 5px 0 4px;
    border-radius: 3px;
    background: var(--vr-track, color-mix(in srgb, currentColor 16%, transparent));
    overflow: hidden;
  }
  .bar-fill {
    height: 100%;
    border-radius: 3px;
    background: linear-gradient(90deg, currentColor, var(--end, currentColor));
    box-shadow: 0 0 var(--_glow) color-mix(in srgb, currentColor 60%, transparent);
    transition: width 0.7s ease;
  }
  .row-detail {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    font-size: 12px;
    color: var(--_text2);
  }
  .row-detail span:last-child {
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }

  /* Information box of a ring: floats under its row, or above it near the card's bottom edge */
  .row {
    position: relative;
    cursor: help;
  }
  .row:focus-visible {
    outline: 2px solid var(--_text2);
    outline-offset: 2px;
    border-radius: 14px;
  }
  .info {
    position: absolute;
    z-index: 5;
    top: calc(100% + 6px);
    right: 0;
    width: max(100%, 250px);
    max-width: 340px;
    box-sizing: border-box;
    padding: 9px 11px;
    border-radius: 10px;
    font-size: 12px;
    line-height: 1.4;
    color: #f4f1fa;
    background: #120e1c;
    border: 1px solid color-mix(in srgb, currentColor 55%, rgba(255, 255, 255, 0.14));
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.45);
    pointer-events: none;
  }
  .info.above {
    top: auto;
    bottom: calc(100% + 6px);
  }
  .info b {
    display: block;
    font-size: 13px;
    font-weight: 600;
  }
  .info p {
    margin: 5px 0 0;
    color: #d9d2ea;
  }
  .info i {
    font-style: normal;
    font-weight: 600;
    color: #f4f1fa;
    margin-right: 6px;
  }

  /* Sections under the hero */
  .section {
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid var(--_divider);
  }
  .section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 24px;
    font-size: 12px;
    color: var(--_text2);
    margin-bottom: 8px;
  }
  .section-head > span:first-child {
    font-weight: 600;
    color: var(--_text);
  }
  .section.heart {
    --tint: var(--vr-heart-tint, var(--_heart));
  }
  .section.vitals {
    --tint: var(--vr-vitals-tint, var(--_vo2));
  }
  .section.body {
    --tint: var(--vr-body-tint, var(--_weight));
  }
  .sub-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin: 14px 0 8px;
    font-size: 12px;
    color: var(--_text2);
  }
  .sub-head > span:first-child {
    font-weight: 600;
    color: var(--_text);
  }

  /* Small switch for a chart's period */
  .seg {
    display: inline-flex;
    border: 1px solid var(--_divider);
    border-radius: 8px;
    overflow: hidden;
  }
  .seg button {
    font: inherit;
    font-size: 11px;
    font-weight: 600;
    line-height: 1;
    padding: 5px 8px;
    border: 0;
    background: none;
    color: var(--_text2);
    cursor: pointer;
  }
  .seg button + button {
    border-left: 1px solid var(--_divider);
  }
  .seg button:hover {
    color: var(--_text);
  }
  .seg button[aria-pressed="true"] {
    color: var(--_text);
    background: color-mix(in srgb, var(--tint, var(--_text)) 22%, transparent);
  }
  .seg button:focus-visible {
    outline: 2px solid var(--_text2);
    outline-offset: -2px;
  }

  /* Colour of a tile or chart */
  .k-heart {
    --k: var(--_heart);
    --k2: var(--_heart-low);
  }
  .k-awake {
    --k: var(--_awake);
  }
  .k-workout {
    --k: var(--_workout);
  }
  .k-vo2 {
    --k: var(--_vo2);
  }
  .k-weight {
    --k: var(--_weight);
  }
  .k-bmi {
    --k: var(--_bmi);
  }
  .k-height {
    --k: var(--_height);
  }

  /* Figures: name, value, and where the value sits in the usual range */
  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(128px, 1fr));
    gap: 12px 16px;
  }
  .stat {
    min-width: 0;
    color: var(--k, currentColor);
  }
  .stat.wide {
    grid-column: 1 / -1;
  }
  .stat-head {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
  }
  .stat-name {
    color: var(--_text2);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .stat-value {
    margin-top: 2px;
    font-size: 12px;
    color: var(--_text2);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .stat-value b {
    color: var(--_text);
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.01em;
  }
  .stat-note {
    margin-top: 3px;
    font-size: 11px;
    color: var(--_text2);
    font-variant-numeric: tabular-nums;
  }
  .range {
    position: relative;
    height: 6px;
    margin: 7px 5px 0;
    border-radius: 3px;
    background: var(--vr-track, color-mix(in srgb, currentColor 16%, transparent));
  }
  .range-band {
    position: absolute;
    top: 0;
    bottom: 0;
    border-radius: 3px;
    background: color-mix(in srgb, currentColor 45%, transparent);
  }
  .range-avg {
    position: absolute;
    top: -2px;
    bottom: -2px;
    width: 2px;
    margin-left: -1px;
    border-radius: 1px;
    background: var(--_text2);
    opacity: 0.7;
  }
  .range-dot {
    position: absolute;
    top: 50%;
    width: 10px;
    height: 10px;
    margin: -5px 0 0 -5px;
    border-radius: 50%;
    background: currentColor;
    box-shadow:
      0 0 0 2px var(--_surface),
      0 0 calc(var(--_glow) + 2px) currentColor;
    transition: left 0.7s ease;
  }
  /* Body mass index: the four classes side by side */
  .zones {
    display: flex;
    gap: 2px;
    background: none;
  }
  .zones > span:not(.range-dot) {
    height: 100%;
    border-radius: 3px;
    opacity: 0.55;
  }
  .zones .z-low,
  .zones .z-over {
    background: var(--_recent);
  }
  .zones .z-healthy {
    background: var(--_fresh);
  }
  .zones .z-obese {
    background: var(--_stale);
  }

  /* Charts */
  .chart {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    column-gap: 6px;
  }
  .yaxis {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 112px;
    margin: -5px 0;
    font-size: 10px;
    line-height: 10px;
    text-align: right;
    color: var(--_text2);
    font-variant-numeric: tabular-nums;
  }
  .plot {
    position: relative;
    height: 102px;
  }
  .plot svg {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
  }
  .grid {
    position: absolute;
    left: 0;
    right: 0;
    border-top: 1px dashed var(--_divider);
  }
  .line {
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
  }
  .line.avg {
    stroke: var(--k);
    stroke-width: 2.5;
    filter: drop-shadow(0 0 var(--_glow) color-mix(in srgb, var(--k) 55%, transparent));
  }
  .line.high {
    stroke: var(--k);
    stroke-width: 1;
    stroke-dasharray: 4 4;
    opacity: 0.55;
  }
  .line.low {
    stroke: var(--k2, var(--k));
    stroke-width: 1;
    stroke-dasharray: 4 4;
    opacity: 0.8;
  }
  .area {
    fill: color-mix(in srgb, var(--k) 18%, transparent);
    stroke: none;
  }
  .mark {
    position: absolute;
    width: 6px;
    height: 6px;
    margin: -3px 0 0 -3px;
    border-radius: 50%;
    background: var(--k2, var(--k));
    box-shadow: 0 0 var(--_glow) var(--k2, var(--k));
    pointer-events: none;
  }
  /* Hover: one invisible column per point, a guide line, dots and a floating box */
  .hit {
    position: absolute;
    top: 0;
    bottom: 0;
    background: none;
    border: 0;
    padding: 0;
    cursor: crosshair;
  }
  .hit:focus-visible {
    outline: 1px solid var(--_text2);
    outline-offset: -1px;
  }
  .guide,
  .plot .dot,
  .tip {
    position: absolute;
    pointer-events: none;
  }
  .guide {
    top: 0;
    bottom: 0;
    width: 1px;
    background: var(--_text2);
    opacity: 0.45;
  }
  .plot .dot {
    width: 8px;
    height: 8px;
    margin: -4px 0 0 -4px;
    border-radius: 50%;
    background: var(--k);
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.35);
  }
  .plot .dot.low {
    background: var(--k2, var(--k));
  }
  /* The box floats over the chart, so showing it never moves the layout. */
  .tip {
    top: 4px;
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-left: 10px;
    padding: 6px 9px;
    border-radius: 8px;
    font-size: 11px;
    white-space: nowrap;
    color: #f4f1fa;
    background: rgba(18, 14, 28, 0.94);
    border: 1px solid rgba(255, 255, 255, 0.14);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
  }
  .tip.left {
    margin-left: -10px;
    transform: translateX(-100%);
  }
  .tip b {
    font-weight: 600;
  }
  .tip span {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .tip u {
    margin-left: auto;
    padding-left: 12px;
    text-decoration: none;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  .tip i,
  .legend i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--k);
  }
  .tip .high i,
  .legend .high i {
    opacity: 0.55;
  }
  .tip .low i,
  .legend .low i {
    background: var(--k2, var(--k));
  }
  .xaxis {
    position: relative;
    grid-column: 2;
    height: 14px;
    margin-top: 3px;
    font-size: 10px;
    color: var(--_text2);
  }
  .xaxis span {
    position: absolute;
    white-space: nowrap;
  }
  .xaxis span.centered {
    transform: translateX(-50%);
  }
  .xaxis span.end {
    transform: translateX(-100%);
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 4px 14px;
    margin-top: 6px;
    font-size: 11px;
    color: var(--_text2);
  }
  .legend span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
  .chart-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 119px;
    font-size: 12px;
    color: var(--_text2);
    text-align: center;
  }

  /* Tiles: every part in its own tinted, softly glowing box */
  ha-card.tiles {
    --_glow: var(--vr-glow, 3px);
  }
  .tiles .rows {
    gap: 8px;
  }
  .tiles .row,
  .tiles .section {
    padding: 10px 12px;
    border-radius: 14px;
    border: 1px solid color-mix(in srgb, var(--tint, currentColor) var(--vr-tile-border, 24%), transparent);
    background: color-mix(in srgb, var(--tint, currentColor) var(--vr-tile-fill, 7%), transparent);
    box-shadow:
      0 0 16px color-mix(in srgb, var(--tint, currentColor) var(--vr-tile-glow, 9%), transparent),
      inset 0 0 20px color-mix(in srgb, var(--tint, currentColor) var(--vr-tile-inset, 0%), transparent);
  }
  .tiles .section {
    margin-top: 12px;
  }
  .tiles .section-head > span:first-child {
    color: color-mix(in srgb, var(--tint) var(--vr-title-tint, 0%), var(--_text));
  }
  .tiles .bar {
    margin-bottom: 5px;
  }
  .tiles .rings {
    isolation: isolate;
  }
  .tiles .rings::before {
    content: "";
    position: absolute;
    inset: -14px;
    z-index: -1;
    border-radius: 50%;
    background: radial-gradient(
      circle,
      color-mix(in srgb, var(--band, transparent) var(--vr-halo, 7%), transparent) 0%,
      transparent 68%
    );
    pointer-events: none;
  }
  .tiles .score {
    text-shadow: 0 0 12px color-mix(in srgb, var(--band, transparent) var(--vr-score-glow, 0%), transparent);
  }

  .message {
    font-size: 13px;
    color: var(--_text2);
    padding: 8px 0;
  }

  /* A slim card: rings above their rows */
  @container (max-width: 419px) {
    .set {
      flex-direction: column;
      align-items: stretch;
      gap: 14px;
    }
    .rings {
      align-self: center;
    }
  }

  /* Two dashboard columns and wider: the two sets side by side, the heart
     rate chart across the card, then VO2 max and body side by side. */
  @container (min-width: 640px) {
    .sets {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: 12px 28px;
      align-items: start;
    }
    .panels {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      column-gap: 28px;
      align-items: stretch;
    }
    .tiles .panels {
      column-gap: 12px;
    }
    .panels > .section.heart,
    .panels.n1 > .section {
      grid-column: 1 / -1;
    }
  }

  /* Between two and three columns each set is slim: rings above the rows */
  @container (min-width: 640px) and (max-width: 959px) {
    .set {
      flex-direction: column;
      align-items: stretch;
      gap: 14px;
    }
    .rings {
      align-self: center;
    }
  }

  /* Three columns: heart rate, VO2 max and body side by side */
  @container (min-width: 960px) {
    .panels.n3 {
      grid-template-columns: minmax(0, 6fr) minmax(0, 5fr) minmax(0, 5fr);
    }
    .panels.n3 > .section.heart {
      grid-column: auto;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .fill,
    .bar-fill,
    .range-dot {
      transition: none;
    }
  }
`, gt, Fe = "1.0.0", q = "vital-rings-card", x = 36e5, D = 24 * x, Ve = [{
  key: "vitals",
  label: "Vitals",
  score: "vitals_score",
  rings: [
    {
      key: "resting",
      label: "Heart",
      metric: "resting_heart_rate"
    },
    {
      key: "recovery",
      label: "Recovery",
      metric: "heart_rate_variability"
    },
    {
      key: "breathing",
      label: "Breathing",
      metric: "respiratory_rate"
    }
  ]
}, {
  key: "fitness",
  label: "Fitness",
  score: "fitness_score",
  rings: [
    {
      key: "sleeping",
      label: "Sleeping",
      metric: "sleeping_heart_rate"
    },
    {
      key: "oxygen",
      label: "Blood oxygen",
      metric: "oxygen_saturation"
    },
    {
      key: "vo2",
      label: "VO\u2082 max",
      metric: "vo2_max"
    }
  ]
}], Ie = {
  resting: {
    title: "Resting heart rate",
    about: "How fast your heart beats when you are awake and at rest. A lower rate usually means a fitter heart; a rise over a few days can point to stress, poor sleep or illness.",
    scoring: "100 at 50 bpm or lower, falling to 0 at 100 bpm. The normal adult range is 60\u2013100 bpm; well-trained people rest at 40\u201360."
  },
  recovery: {
    title: "Heart rate variability",
    about: "How much the time between heartbeats varies (SDNN). Higher usually means you are well recovered; it drops with stress, illness, alcohol and hard training.",
    scoring: "0 at 15 ms, rising to 100 at 100 ms or higher. It differs a lot between people and falls with age, so your own trend says more than the number."
  },
  breathing: {
    title: "Respiratory rate",
    about: "Breaths per minute, usually measured while you sleep. It is steady from night to night; a rise can be an early sign of illness.",
    scoring: "100 from 12 to 18 breaths a minute, falling to 0 at 28 and at 6. The normal adult range at rest is 12\u201320."
  },
  sleeping: {
    title: "Sleeping heart rate",
    about: "Your average heart rate over the whole hours you were asleep last night. It runs below your resting rate; a higher night can follow a late meal, alcohol, strain or illness.",
    scoring: "100 at 45 bpm or lower, falling to 0 at 85 bpm."
  },
  oxygen: {
    title: "Blood oxygen",
    about: "How much oxygen your red blood cells carry (oxygen saturation). Wrist readings vary a little; look for a lasting drop rather than one low reading.",
    scoring: "100 at 97 % or higher, 85 at 95 %, falling to 0 at 90 %. 95\u2013100 % is normal; below 90 % is low."
  },
  vo2: {
    title: "VO\u2082 max",
    about: "The most oxygen your body can use during hard exercise, estimated by your watch from outdoor walks, runs and hikes. It is the standard measure of cardio fitness.",
    scoring: "Your percentile among adults of your age and sex (FRIEND registry). The median scores 50; the 95th percentile or higher scores 100."
  }
};
function zt(t) {
  const e = Math.round(t), r = e % 100;
  return `${e}${r >= 11 && r <= 13 ? "th" : [
    "th",
    "st",
    "nd",
    "rd"
  ][e % 10] ?? "th"}`;
}
var et = {
  "3m": {
    label: "3M",
    days: 92,
    period: "day"
  },
  "6m": {
    label: "6M",
    days: 183,
    period: "week"
  },
  "1y": {
    label: "1Y",
    days: 366,
    period: "week"
  },
  all: {
    label: "All",
    days: 6935,
    period: "month"
  }
}, je = [
  "heart",
  "vo2",
  "weight"
], We = 2, Ye = 10, Ze = [15, 40], rt = (t) => Math.min(1, Math.max(0, t)), Jt = class extends H {
  constructor() {
    super(), this._ticks = 0, this._token = 0, this._seriesTokens = {}, this._summary = null, this._series = {}, this._heartHours = 48, this._vo2Range = "6m", this._weightRange = "6m", this._hover = null, this._tip = null, this._tipAbove = !1, this._error = null, this._now = Date.now(), this._ready = !1;
  }
  static getConfigElement() {
    return document.createElement("vital-rings-card-editor");
  }
  static getStubConfig(t) {
    return { entity: Object.keys(t?.entities ?? {}).find((e) => e.startsWith("sensor.") && t?.entities?.[e]?.platform === "vital_rings") ?? "" };
  }
  setConfig(t) {
    if (!t || typeof t != "object") throw new Error("Vital Rings: the card configuration is missing");
    this._config = {
      show_rows: !0,
      show_heart: !0,
      show_vitals: !0,
      show_body: !0,
      ...t
    };
    const e = Number(this._config.heart_hours);
    this._heartHours = Ne.includes(e) ? e : 48;
    const r = this._config.trend_range, s = r && Nt.includes(r) ? r : "6m";
    this._vo2Range = s, this._weightRange = s, this._loadedFor = void 0;
  }
  getCardSize() {
    const t = this._config;
    return 4 + (t?.show_heart ? 4 : 0) + (t?.show_vitals ? 4 : 0) + (t?.show_body ? 4 : 0);
  }
  getGridOptions() {
    return {
      columns: 12,
      min_columns: 6,
      rows: "auto"
    };
  }
  connectedCallback() {
    super.connectedCallback(), this._timer = window.setInterval(() => this._tick(), 6e4);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), window.clearInterval(this._timer), this._timer = void 0;
  }
  _tick() {
    this._now = Date.now(), this._ticks += 1, this._ticks % We === 0 && this._load(this._ticks % Ye === 0);
  }
  shouldUpdate(t) {
    if (t.size > 1 || !t.has("hass")) return !0;
    const e = this._config?.entity;
    return !e || !this._summary ? !0 : t.get("hass")?.states[e] !== this.hass?.states[e];
  }
  firstUpdated() {
    requestAnimationFrame(() => this._ready = !0);
  }
  updated() {
    const t = this._config?.entity;
    if (!this.hass || !t) return;
    const e = this.hass.states[t];
    if (this._loadedFor !== t || e !== this._seen) {
      const r = this._loadedFor !== t;
      this._loadedFor = t, this._seen = e, r && (this._summary = null, this._series = {}), this._load(!0);
    }
  }
  async _load(t) {
    const e = this._config?.entity, r = this.hass?.callWS;
    if (!e || !r) return;
    const s = ++this._token;
    try {
      const i = await r({
        type: "vital_rings/summary",
        entity_id: e
      });
      if (s !== this._token) return;
      const a = i && typeof i.metrics == "object" && i.metrics ? i.metrics : {};
      this._summary = {
        updated: i?.updated ?? null,
        synced: i?.synced ?? null,
        metrics: a
      }, this._error = null, this._now = Date.now();
    } catch {
      s === this._token && (this._error = "VitalRings did not answer. Check that the integration is set up and loaded.");
      return;
    }
    if (t) for (const i of je) this._loadSeries(i);
  }
  _request(t) {
    if (t === "heart") return {
      metric: "heart_rate",
      period: "hour",
      start: Date.now() - this._heartHours * x
    };
    const e = et[t === "vo2" ? this._vo2Range : this._weightRange];
    return {
      metric: t === "vo2" ? "vo2_max" : "weight",
      period: e.period,
      start: Date.now() - e.days * D
    };
  }
  _wanted(t) {
    const e = this._config;
    return t === "heart" ? e?.show_heart !== !1 : t === "vo2" ? e?.show_vitals !== !1 : e?.show_body !== !1;
  }
  async _loadSeries(t) {
    const e = this._config?.entity, r = this.hass?.callWS;
    if (!e || !r || !this._wanted(t)) return;
    const s = (this._seriesTokens[t] ?? 0) + 1;
    this._seriesTokens[t] = s;
    const i = this._request(t);
    let a = [];
    try {
      const o = await r({
        type: "vital_rings/series",
        entity_id: e,
        metric: i.metric,
        period: i.period,
        start: new Date(i.start).toISOString()
      });
      Array.isArray(o?.points) && (a = o.points.filter((n) => Number.isFinite(n?.start) && Number.isFinite(n?.end) && Number.isFinite(n?.mean)).map((n) => ({
        start: n.start,
        end: n.end,
        mean: n.mean,
        min: Number.isFinite(n.min) ? n.min : n.mean,
        max: Number.isFinite(n.max) ? n.max : n.mean
      })).slice(-2e3));
    } catch {
    }
    this._seriesTokens[t] === s && (this._series = {
      ...this._series,
      [t]: a
    });
  }
  _metric(t) {
    return this._summary?.metrics[t];
  }
  get _language() {
    return this.hass?.locale?.language;
  }
  get _timeZone() {
    return this.hass?.config?.time_zone;
  }
  get _pounds() {
    const t = this._config?.weight_unit;
    return t === "kg" || t === "lb" ? t === "lb" : this.hass?.config?.unit_system?.mass === "lb";
  }
  render() {
    const t = this._config;
    if (!t) return l;
    const e = De(t.preset, t.colors, t.theme_background), r = t.entity ? this.hass?.states[t.entity] : void 0, s = this._summary;
    let i = "";
    t.entity ? this.hass && !r ? i = `Entity not found: ${t.entity}` : this._error ? i = this._error : s && !Object.keys(s.metrics).length && (i = "No health data yet. The figures appear after the next sync.") : i = "Choose a VitalRings entity in the card settings.";
    const a = [
      t.show_heart ? this._renderHeart() : l,
      t.show_vitals ? this._renderVitals() : l,
      t.show_body ? this._renderBody() : l
    ].filter((o) => o !== l);
    return d`
      <ha-card class=${t.tiles ?? qt(t.preset) ? "tiles" : ""} style=${Ae(e)}>
        <div class="header">
          <span class="title">${t.name ?? "Heart & vitals"}</span>
          ${this._renderSynced()}
        </div>
        ${i ? d`<div class="message">${i}</div>` : l}
        <div class="body">
          <div class="sets">${Ve.map((o) => this._renderSet(o, t.show_rows !== !1))}</div>
          ${a.length ? d`<div class="panels n${a.length}">${a}</div>` : l}
        </div>
      </ha-card>
    `;
  }
  _renderSynced() {
    const t = this._summary?.synced, e = Ee(t, this._now), r = Ct(t, this._now);
    if (e === null || r === null) return l;
    const s = e <= 120 ? "fresh" : e <= 360 ? "recent" : "stale", i = `Health data last arrived ${Tt(Date.parse(t), this._language, this._timeZone)}`;
    return d`<span class="age ${s}" title=${i}>${r === "now" ? "Synced just now" : `Synced ${r} ago`}</span>`;
  }
  _fraction(t) {
    return !this._ready || t === null ? 0 : rt(t / 100);
  }
  _reading(t, e) {
    const r = v(e);
    if (r === null) return "No reading yet";
    if (t === "resting_heart_rate") return `Resting ${_(r)} bpm`;
    if (t === "heart_rate_variability") return `HRV ${_(r)} ms`;
    if (t === "respiratory_rate") return `${_(r, 1)} breaths/min`;
    if (t === "oxygen_saturation") return `${_(r)} %`;
    if (t === "sleeping_heart_rate") {
      const i = v(e, "lowest");
      return `${_(r)} bpm${i !== null ? ` \xB7 low ${_(i)}` : ""}`;
    }
    const s = v(e, "percentile");
    return `${_(r, 1)}${s !== null ? ` \xB7 ${zt(s)} percentile` : ""}`;
  }
  _best(t) {
    const e = t?.full;
    if (!e || typeof e != "object") return "";
    const r = at(e.low), s = at(e.high);
    return e.direction === "low" && r !== null ? `Best \u2264 ${U(r)}` : e.direction === "high" && s !== null ? `Best \u2265 ${U(s)}` : r !== null && s !== null ? `Best ${U(r)}\u2013${U(s)}` : "";
  }
  _openTip(t, e) {
    const r = e.currentTarget.getBoundingClientRect(), s = this.getBoundingClientRect();
    this._tipAbove = s.bottom - r.bottom < 200 && r.top - s.top > s.bottom - r.bottom, this._tip = t;
  }
  _renderInfo(t, e, r) {
    const s = Ie[t], i = v(r, "score"), a = this._usual(r, e === "vo2_max" || e === "respiratory_rate" ? 1 : 0);
    return d`
      <div class="info ${this._tipAbove ? "above" : ""}" id="vr-tip-${t}" role="tooltip">
        <b>${s.title}</b>
        <p>${s.about}</p>
        <p><i>Score</i>${s.scoring}</p>
        <p>
          <i>Yours</i>${this._reading(e, r)}${i !== null ? `, ${Math.round(i)} of 100` : ""}${a ? `. ${a}` : ""}
        </p>
      </div>
    `;
  }
  _renderSet(t, e) {
    const r = v(this._metric(t.score)), s = r === null ? "" : r >= 85 ? "excellent" : r >= 70 ? "good" : r >= 50 ? "fair" : "low", i = [
      70,
      56,
      42
    ], a = t.rings.map((n) => {
      const h = this._metric(n.metric);
      return {
        ...n,
        data: h,
        score: v(h, "score")
      };
    }), o = `${t.label} score ${r === null ? "not available" : `${Math.round(r)} of 100`}. ` + a.map((n) => `${n.label} ${_(n.score)} of 100`).join(", ");
    return d`
      <div class="set">
        <div class="rings ${s ? `b-${s}` : ""}" role="img" aria-label=${o}>
          <svg viewBox="0 0 160 160" aria-hidden="true">
            <defs>
              ${a.map((n) => Y`
                  <linearGradient id="vr-grad-${n.key}" class="c-${n.key}" gradientUnits="userSpaceOnUse"
                    x1="0" y1="0" x2="0" y2="160">
                    <stop offset="0" style="stop-color:currentColor"></stop>
                    <stop offset="1" style="stop-color:var(--end, currentColor)"></stop>
                  </linearGradient>`)}
            </defs>
            ${a.map((n, h) => {
      const p = i[h], g = 2 * Math.PI * p, u = this._fraction(n.score);
      return Y`
                <circle class="track c-${n.key}" cx="80" cy="80" r=${p} stroke-width="10"></circle>
                <circle style="stroke:url(#vr-grad-${n.key})" class="fill c-${n.key} ${u <= 0 ? "empty" : ""}"
                  cx="80" cy="80" r=${p} stroke-width="10"
                  stroke-dasharray=${g} stroke-dashoffset=${g * (1 - u)}></circle>`;
    })}
          </svg>
          <div class="center">
            <span class="score">${r === null ? "--" : Math.round(r)}</span>
            <span class="band"><span class="band-dot"></span><span>${t.label}</span></span>
          </div>
        </div>
        ${e ? d`<div class="rows">
              ${a.map((n) => d`
                  <div
                    class="row c-${n.key}"
                    tabindex="0"
                    aria-describedby=${this._tip === n.key ? `vr-tip-${n.key}` : l}
                    @pointerenter=${(h) => this._openTip(n.key, h)}
                    @pointerleave=${() => this._tip = null}
                    @focus=${(h) => this._openTip(n.key, h)}
                    @blur=${() => this._tip = null}
                  >
                    <div class="row-head">
                      <span class="dot"></span>
                      <span class="row-name">${n.label}</span>
                      <span class="row-value"><b>${_(n.score)}</b>/100</span>
                    </div>
                    <div class="bar"><div class="bar-fill" style="width:${this._fraction(n.score) * 100}%"></div></div>
                    <div class="row-detail">
                      <span>${this._reading(n.metric, n.data)}</span><span>${this._best(n.data)}</span>
                    </div>
                    ${this._tip === n.key ? this._renderInfo(n.key, n.metric, n.data) : l}
                  </div>
                `)}
            </div>` : l}
      </div>
    `;
  }
  _seg(t, e, r, s) {
    return d`
      <span class="seg" role="group" aria-label=${t}>
        ${e.map((i) => d`<button
            type="button"
            aria-pressed=${i.value === r ? "true" : "false"}
            @click=${() => s(i.value)}
          >
            ${i.label}
          </button>`)}
      </span>
    `;
  }
  _hoverOf(t) {
    return this._hover?.chart === t ? this._hover.index : null;
  }
  _setHover(t, e) {
    this._hover = e === null ? null : {
      chart: t,
      index: e
    };
  }
  _range(t, e) {
    const r = v(t), s = v(t, "low"), i = v(t, "high"), a = v(t, "average");
    if (r === null || s === null || i === null || i < s) return l;
    const o = Math.max(i - s, e) * 0.6, n = Math.min(s, r) - o, h = Math.max(i, r) + o, p = (g) => rt((g - n) / (h - n)) * 100;
    return d`
      <div class="range" title="Your usual range, with today's value (${r > i ? "above" : r < s ? "below" : "inside"} it)">
        <span class="range-band" style="left:${p(s)}%;width:${Math.max(3, p(i) - p(s))}%"></span>
        ${a !== null ? d`<span class="range-avg" style="left:${p(a)}%"></span>` : l}
        <span class="range-dot" style="left:${this._ready ? p(r) : 50}%"></span>
      </div>
    `;
  }
  _usual(t, e) {
    const r = v(t, "low"), s = v(t, "high");
    if (r === null || s === null) return "";
    const i = t?.window_days ? ` \xB7 ${t.window_days} days` : "";
    return `Usual ${_(r, e)}\u2013${_(s, e)}${i}`;
  }
  _stat(t, e, r, s = l, i = "", a = !1) {
    return d`
      <div class="stat k-${t} ${a ? "wide" : ""}">
        <div class="stat-head"><span class="dot"></span><span class="stat-name">${e}</span></div>
        <div class="stat-value">${r}</div>
        ${s}
        ${i ? d`<div class="stat-note">${i}</div>` : l}
      </div>
    `;
  }
  _hourTicks(t, e) {
    const r = (e - t) / x, s = r <= 24 ? 6 : r <= 48 ? 12 : 24, i = [];
    for (let a = Math.ceil(t / x) * x; a <= e; a += x) {
      const o = Ce(a, this._timeZone);
      o % s || i.push({
        at: a,
        label: o === 0 ? Rt(a, this._language, this._timeZone) : V(a, this._language, this._timeZone)
      });
    }
    return i;
  }
  _dateTicks(t, e) {
    const r = [], s = new Date(t);
    if (e - t > 900 * D) {
      const o = new Date(e).getFullYear() - s.getFullYear(), n = Math.max(1, Math.ceil(o / 6));
      for (let h = s.getFullYear() + 1; h <= new Date(e).getFullYear(); h++)
        (new Date(e).getFullYear() - h) % n || r.push({
          at: new Date(h, 0, 1).getTime(),
          label: String(h)
        });
      return r;
    }
    const i = [];
    for (let o = new Date(s.getFullYear(), s.getMonth() + 1, 1); o.getTime() <= e; )
      i.push(o), o = new Date(o.getFullYear(), o.getMonth() + 1, 1);
    const a = Math.max(1, Math.ceil(i.length / 6));
    return i.forEach((o, n) => {
      (i.length - 1 - n) % a || r.push({
        at: o.getTime(),
        label: o.getMonth() === 0 ? String(o.getFullYear()) : o.toLocaleDateString(this._language, { month: "short" })
      });
    }), r;
  }
  _pointTitle(t, e) {
    const r = this._language, s = this._timeZone;
    if (e === "hour") return `${Rt(t.start, r, s)} ${V(t.start, r, s)} \u2013 ${V(t.end, r, s)}`;
    const i = t.start + Math.min(D / 2, (t.end - t.start) / 2);
    return e === "day" ? Mt(i, r, s) : e === "week" ? `Week of ${Mt(i, r, s)}` : new Date(i).toLocaleDateString(r, {
      month: "long",
      year: "numeric"
    });
  }
  _points(t, e, r = 1) {
    const s = this._series[t];
    return s ? s.map((i) => ({
      at: (i.start + i.end) / 2,
      value: i.mean * r,
      low: i.min * r,
      high: i.max * r,
      title: this._pointTitle(i, e)
    })) : null;
  }
  _renderHeart() {
    const t = this._metric("heart_rate"), e = this._metric("awake_heart_rate"), r = this._metric("awake_heart_rate_previous"), s = this._metric("workout_heart_rate"), i = this._points("heart", "hour");
    if (!this._summary) return l;
    const a = v(t) !== null || v(e) !== null || v(r) !== null || s;
    if (!i?.length && !a) return l;
    const o = Ct(t?.measured_at, this._now), n = e?.since ? Date.parse(e.since) : NaN, h = this._now, p = h - this._heartHours * x, g = i === null ? d`<div class="chart-empty">${"Loading\u2026"}</div>` : Ot({
      kind: "k-heart",
      points: i,
      domain: [p, h],
      ticks: this._hourTicks(p, h),
      unit: "bpm",
      digits: 0,
      label: "Average",
      band: !0,
      gapMs: 2.5 * x,
      minSpan: 20,
      hover: this._hoverOf("heart"),
      onHover: (y) => this._setHover("heart", y),
      description: `Heart rate over the last ${this._heartHours} hours: hourly average, high and low`
    }), u = s?.start ? Date.parse(s.start) : NaN, m = v(s, "duration_minutes"), b = v(s, "max");
    return d`
      <div class="section heart">
        <div class="section-head">
          <span>Heart rate</span>
          ${this._seg("Period of the heart rate chart", [
      {
        value: 24,
        label: "24h"
      },
      {
        value: 48,
        label: "48h"
      },
      {
        value: 168,
        label: "7d"
      }
    ], this._heartHours, (y) => {
      this._heartHours = y, this._hover = null, this._loadSeries("heart");
    })}
        </div>
        ${g}
        ${i?.length ? d`<div class="legend k-heart">
              <span class="high"><i></i>Hourly high</span>
              <span class="avg"><i></i>Average</span>
              <span class="low"><i></i>Hourly low</span>
            </div>` : l}
        ${a ? d`<div class="stats" style="margin-top:12px">
              ${v(t) !== null ? this._stat("heart", "Latest reading", d`<b>${_(v(t))}</b> bpm`, l, o === null ? "" : o === "now" ? "Just now" : `${o} ago`) : l}
              ${v(e) !== null ? this._stat("awake", "Awake today", d`<b>${_(v(e))}</b> bpm`, l, Number.isFinite(n) ? `Since ${V(n, this._language, this._timeZone)}` : "") : l}
              ${v(r) !== null ? this._stat("awake", "Awake, day before", d`<b>${_(v(r))}</b> bpm`, l, "Wake-up to bedtime") : l}
              ${s ? this._stat("workout", `${Re(s.workout)}${m !== null ? ` \xB7 ${Me(m)}` : ""}`, v(s) !== null ? d`<b>${_(v(s))}</b> bpm
                          avg${b !== null ? ` \xB7 max ${_(b)}` : ""}` : d`<b>--</b> no heart rate yet`, l, Number.isFinite(u) ? Tt(u, this._language, this._timeZone) : "") : l}
            </div>` : l}
      </div>
    `;
  }
  _trendChart(t, e, r) {
    const s = et[e], i = this._points(t, s.period, r.factor ?? 1);
    if (i === null) return d`<div class="chart-empty">${"Loading\u2026"}</div>`;
    const a = this._now, o = e === "all" && i.length ? i[0].at - 15 * D : a - s.days * D;
    return Ot({
      kind: r.kind,
      points: i,
      domain: [o, a],
      ticks: this._dateTicks(o, a),
      unit: r.unit,
      digits: r.digits,
      label: r.label,
      markers: r.markers,
      smooth: r.smooth,
      minSpan: r.minSpan,
      hover: this._hoverOf(t),
      onHover: (n) => this._setHover(t, n),
      description: `${r.label} over time`
    });
  }
  _trendSeg(t, e) {
    return this._seg(e, Nt.map((r) => ({
      value: r,
      label: et[r].label
    })), t === "vo2" ? this._vo2Range : this._weightRange, (r) => {
      t === "vo2" ? this._vo2Range = r : this._weightRange = r, this._hover = null, this._series = {
        ...this._series,
        [t]: void 0
      }, this._loadSeries(t);
    });
  }
  _renderVitals() {
    const t = this._metric("vo2_max"), e = v(t);
    if (!this._summary || e === null && !this._series.vo2?.length) return l;
    const r = v(t, "percentile");
    return d`
      <div class="section vitals">
        <div class="section-head">
          <span>${"VO\u2082 max"}</span>${this._trendSeg("vo2", "Period of the VO2 max chart")}
        </div>
        ${this._trendChart("vo2", this._vo2Range, {
      kind: "k-vo2",
      label: "VO\u2082 max",
      unit: "",
      digits: 1,
      minSpan: 2
    })}
        ${e !== null ? d`<div class="stats" style="margin-top:12px">
              ${this._stat("vo2", "Latest estimate", d`<b>${_(e, 1)}</b> ${"mL/kg\xB7min"}`, this._range(t, 1), this._usual(t, 1))}
              ${r !== null ? this._stat("vo2", "Benchmark", d`<b>${zt(r)}</b> percentile`, l, "Same age and sex") : l}
            </div>` : l}
      </div>
    `;
  }
  _renderBody() {
    const t = this._metric("weight"), e = this._metric("height"), r = this._metric("bmi"), s = v(t);
    if (!this._summary || s === null && v(e) === null && !this._series.weight?.length) return l;
    const i = this._pounds, a = i ? Se : 1, o = i ? "lb" : "kg", n = v(t, "first");
    let h = "";
    if (s !== null && n !== null && (t?.days ?? 0) > 1) {
      const y = (s - n) * a, N = t?.window_days ?? 30;
      h = Math.abs(y) < 0.05 ? `Steady over ${N} days` : `${y < 0 ? "Down" : "Up"} ${Math.abs(y).toFixed(1)} ${o} in ${N} days`;
    }
    const p = v(r), g = (r?.category ?? "").slice(0, 20), [u, m] = Ze, b = d`
      <div class="range zones" title="Underweight, healthy, overweight and obese (WHO adult classes)">
        <span class="z-low" style="flex:${18.5 - u}"></span>
        <span class="z-healthy" style="flex:${6.5}"></span>
        <span class="z-over" style="flex:${5}"></span>
        <span class="z-obese" style="flex:${m - 30}"></span>
        ${p !== null ? d`<span
              class="range-dot"
              style="flex:none;left:${this._ready ? rt((p - u) / (m - u)) * 100 : 50}%"
            ></span>` : l}
      </div>
    `;
    return d`
      <div class="section body">
        <div class="section-head">
          <span>Weight</span>${this._trendSeg("weight", "Period of the weight chart")}
        </div>
        ${this._trendChart("weight", this._weightRange, {
      kind: "k-weight",
      label: "Weight",
      unit: o,
      digits: 1,
      minSpan: 2,
      factor: a,
      markers: this._weightRange !== "3m",
      smooth: !1
    })}
        <div class="stats" style="margin-top:12px">
          ${s !== null ? this._stat("weight", "Weight", d`<b>${_(s * a, 1)}</b> ${o}`, l, h) : l}
          ${p !== null ? this._stat("bmi", "Body mass index", d`<b>${_(p, 1)}</b> ${g ? g.charAt(0).toUpperCase() + g.slice(1) : ""}`, b, "Healthy 18.5\u201325") : l}
          ${v(e) !== null ? this._stat("height", "Height", d`<b>${Te(v(e), i)}</b>`) : l}
        </div>
      </div>
    `;
  }
};
gt = Jt;
gt.styles = Be;
gt.properties = {
  hass: { attribute: !1 },
  _config: { state: !0 },
  _summary: { state: !0 },
  _series: { state: !0 },
  _heartHours: { state: !0 },
  _vo2Range: { state: !0 },
  _weightRange: { state: !0 },
  _hover: { state: !0 },
  _tip: { state: !0 },
  _tipAbove: { state: !0 },
  _error: { state: !0 },
  _now: { state: !0 },
  _ready: { state: !0 }
};
customElements.get(q) || customElements.define(q, Jt);
window.customCards = window.customCards ?? [];
window.customCards.some((t) => t.type === q) || window.customCards.push({
  type: q,
  name: "Vital Rings",
  description: "Two sets of rings scored against health benchmarks, a heart rate chart, VO2 max and weight.",
  preview: !0
});
console.info(`%c VITAL-RINGS-CARD %c ${Fe} `, "background:#d61fb6;color:#fff", "");
export {
  Fe as CARD_VERSION,
  Jt as VitalRingsCard
};
