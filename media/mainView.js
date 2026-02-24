// node_modules/@lit/reactive-element/css-tag.js
var t = globalThis;
var e = t.ShadowRoot && (void 0 === t.ShadyCSS || t.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype;
var s = Symbol();
var o = /* @__PURE__ */ new WeakMap();
var n = class {
  constructor(t3, e4, o5) {
    if (this._$cssResult$ = true, o5 !== s)
      throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t3, this.t = e4;
  }
  get styleSheet() {
    let t3 = this.o;
    const s4 = this.t;
    if (e && void 0 === t3) {
      const e4 = void 0 !== s4 && 1 === s4.length;
      e4 && (t3 = o.get(s4)), void 0 === t3 && ((this.o = t3 = new CSSStyleSheet()).replaceSync(this.cssText), e4 && o.set(s4, t3));
    }
    return t3;
  }
  toString() {
    return this.cssText;
  }
};
var r = (t3) => new n("string" == typeof t3 ? t3 : t3 + "", void 0, s);
var S = (s4, o5) => {
  if (e)
    s4.adoptedStyleSheets = o5.map((t3) => t3 instanceof CSSStyleSheet ? t3 : t3.styleSheet);
  else
    for (const e4 of o5) {
      const o6 = document.createElement("style"), n4 = t.litNonce;
      void 0 !== n4 && o6.setAttribute("nonce", n4), o6.textContent = e4.cssText, s4.appendChild(o6);
    }
};
var c = e ? (t3) => t3 : (t3) => t3 instanceof CSSStyleSheet ? ((t4) => {
  let e4 = "";
  for (const s4 of t4.cssRules)
    e4 += s4.cssText;
  return r(e4);
})(t3) : t3;

// node_modules/@lit/reactive-element/reactive-element.js
var { is: i2, defineProperty: e2, getOwnPropertyDescriptor: h, getOwnPropertyNames: r2, getOwnPropertySymbols: o2, getPrototypeOf: n2 } = Object;
var a = globalThis;
var c2 = a.trustedTypes;
var l = c2 ? c2.emptyScript : "";
var p = a.reactiveElementPolyfillSupport;
var d = (t3, s4) => t3;
var u = { toAttribute(t3, s4) {
  switch (s4) {
    case Boolean:
      t3 = t3 ? l : null;
      break;
    case Object:
    case Array:
      t3 = null == t3 ? t3 : JSON.stringify(t3);
  }
  return t3;
}, fromAttribute(t3, s4) {
  let i5 = t3;
  switch (s4) {
    case Boolean:
      i5 = null !== t3;
      break;
    case Number:
      i5 = null === t3 ? null : Number(t3);
      break;
    case Object:
    case Array:
      try {
        i5 = JSON.parse(t3);
      } catch (t4) {
        i5 = null;
      }
  }
  return i5;
} };
var f = (t3, s4) => !i2(t3, s4);
var b = { attribute: true, type: String, converter: u, reflect: false, useDefault: false, hasChanged: f };
Symbol.metadata ??= Symbol("metadata"), a.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
var y = class extends HTMLElement {
  static addInitializer(t3) {
    this._$Ei(), (this.l ??= []).push(t3);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t3, s4 = b) {
    if (s4.state && (s4.attribute = false), this._$Ei(), this.prototype.hasOwnProperty(t3) && ((s4 = Object.create(s4)).wrapped = true), this.elementProperties.set(t3, s4), !s4.noAccessor) {
      const i5 = Symbol(), h3 = this.getPropertyDescriptor(t3, i5, s4);
      void 0 !== h3 && e2(this.prototype, t3, h3);
    }
  }
  static getPropertyDescriptor(t3, s4, i5) {
    const { get: e4, set: r4 } = h(this.prototype, t3) ?? { get() {
      return this[s4];
    }, set(t4) {
      this[s4] = t4;
    } };
    return { get: e4, set(s5) {
      const h3 = e4?.call(this);
      r4?.call(this, s5), this.requestUpdate(t3, h3, i5);
    }, configurable: true, enumerable: true };
  }
  static getPropertyOptions(t3) {
    return this.elementProperties.get(t3) ?? b;
  }
  static _$Ei() {
    if (this.hasOwnProperty(d("elementProperties")))
      return;
    const t3 = n2(this);
    t3.finalize(), void 0 !== t3.l && (this.l = [...t3.l]), this.elementProperties = new Map(t3.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(d("finalized")))
      return;
    if (this.finalized = true, this._$Ei(), this.hasOwnProperty(d("properties"))) {
      const t4 = this.properties, s4 = [...r2(t4), ...o2(t4)];
      for (const i5 of s4)
        this.createProperty(i5, t4[i5]);
    }
    const t3 = this[Symbol.metadata];
    if (null !== t3) {
      const s4 = litPropertyMetadata.get(t3);
      if (void 0 !== s4)
        for (const [t4, i5] of s4)
          this.elementProperties.set(t4, i5);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t4, s4] of this.elementProperties) {
      const i5 = this._$Eu(t4, s4);
      void 0 !== i5 && this._$Eh.set(i5, t4);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(s4) {
    const i5 = [];
    if (Array.isArray(s4)) {
      const e4 = new Set(s4.flat(1 / 0).reverse());
      for (const s5 of e4)
        i5.unshift(c(s5));
    } else
      void 0 !== s4 && i5.push(c(s4));
    return i5;
  }
  static _$Eu(t3, s4) {
    const i5 = s4.attribute;
    return false === i5 ? void 0 : "string" == typeof i5 ? i5 : "string" == typeof t3 ? t3.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = false, this.hasUpdated = false, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    this._$ES = new Promise((t3) => this.enableUpdating = t3), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((t3) => t3(this));
  }
  addController(t3) {
    (this._$EO ??= /* @__PURE__ */ new Set()).add(t3), void 0 !== this.renderRoot && this.isConnected && t3.hostConnected?.();
  }
  removeController(t3) {
    this._$EO?.delete(t3);
  }
  _$E_() {
    const t3 = /* @__PURE__ */ new Map(), s4 = this.constructor.elementProperties;
    for (const i5 of s4.keys())
      this.hasOwnProperty(i5) && (t3.set(i5, this[i5]), delete this[i5]);
    t3.size > 0 && (this._$Ep = t3);
  }
  createRenderRoot() {
    const t3 = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return S(t3, this.constructor.elementStyles), t3;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(true), this._$EO?.forEach((t3) => t3.hostConnected?.());
  }
  enableUpdating(t3) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((t3) => t3.hostDisconnected?.());
  }
  attributeChangedCallback(t3, s4, i5) {
    this._$AK(t3, i5);
  }
  _$ET(t3, s4) {
    const i5 = this.constructor.elementProperties.get(t3), e4 = this.constructor._$Eu(t3, i5);
    if (void 0 !== e4 && true === i5.reflect) {
      const h3 = (void 0 !== i5.converter?.toAttribute ? i5.converter : u).toAttribute(s4, i5.type);
      this._$Em = t3, null == h3 ? this.removeAttribute(e4) : this.setAttribute(e4, h3), this._$Em = null;
    }
  }
  _$AK(t3, s4) {
    const i5 = this.constructor, e4 = i5._$Eh.get(t3);
    if (void 0 !== e4 && this._$Em !== e4) {
      const t4 = i5.getPropertyOptions(e4), h3 = "function" == typeof t4.converter ? { fromAttribute: t4.converter } : void 0 !== t4.converter?.fromAttribute ? t4.converter : u;
      this._$Em = e4;
      const r4 = h3.fromAttribute(s4, t4.type);
      this[e4] = r4 ?? this._$Ej?.get(e4) ?? r4, this._$Em = null;
    }
  }
  requestUpdate(t3, s4, i5, e4 = false, h3) {
    if (void 0 !== t3) {
      const r4 = this.constructor;
      if (false === e4 && (h3 = this[t3]), i5 ??= r4.getPropertyOptions(t3), !((i5.hasChanged ?? f)(h3, s4) || i5.useDefault && i5.reflect && h3 === this._$Ej?.get(t3) && !this.hasAttribute(r4._$Eu(t3, i5))))
        return;
      this.C(t3, s4, i5);
    }
    false === this.isUpdatePending && (this._$ES = this._$EP());
  }
  C(t3, s4, { useDefault: i5, reflect: e4, wrapped: h3 }, r4) {
    i5 && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t3) && (this._$Ej.set(t3, r4 ?? s4 ?? this[t3]), true !== h3 || void 0 !== r4) || (this._$AL.has(t3) || (this.hasUpdated || i5 || (s4 = void 0), this._$AL.set(t3, s4)), true === e4 && this._$Em !== t3 && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t3));
  }
  async _$EP() {
    this.isUpdatePending = true;
    try {
      await this._$ES;
    } catch (t4) {
      Promise.reject(t4);
    }
    const t3 = this.scheduleUpdate();
    return null != t3 && await t3, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    if (!this.isUpdatePending)
      return;
    if (!this.hasUpdated) {
      if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
        for (const [t5, s5] of this._$Ep)
          this[t5] = s5;
        this._$Ep = void 0;
      }
      const t4 = this.constructor.elementProperties;
      if (t4.size > 0)
        for (const [s5, i5] of t4) {
          const { wrapped: t5 } = i5, e4 = this[s5];
          true !== t5 || this._$AL.has(s5) || void 0 === e4 || this.C(s5, void 0, i5, e4);
        }
    }
    let t3 = false;
    const s4 = this._$AL;
    try {
      t3 = this.shouldUpdate(s4), t3 ? (this.willUpdate(s4), this._$EO?.forEach((t4) => t4.hostUpdate?.()), this.update(s4)) : this._$EM();
    } catch (s5) {
      throw t3 = false, this._$EM(), s5;
    }
    t3 && this._$AE(s4);
  }
  willUpdate(t3) {
  }
  _$AE(t3) {
    this._$EO?.forEach((t4) => t4.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = true, this.firstUpdated(t3)), this.updated(t3);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = false;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(t3) {
    return true;
  }
  update(t3) {
    this._$Eq &&= this._$Eq.forEach((t4) => this._$ET(t4, this[t4])), this._$EM();
  }
  updated(t3) {
  }
  firstUpdated(t3) {
  }
};
y.elementStyles = [], y.shadowRootOptions = { mode: "open" }, y[d("elementProperties")] = /* @__PURE__ */ new Map(), y[d("finalized")] = /* @__PURE__ */ new Map(), p?.({ ReactiveElement: y }), (a.reactiveElementVersions ??= []).push("2.1.2");

// node_modules/lit-html/lit-html.js
var t2 = globalThis;
var i3 = (t3) => t3;
var s2 = t2.trustedTypes;
var e3 = s2 ? s2.createPolicy("lit-html", { createHTML: (t3) => t3 }) : void 0;
var h2 = "$lit$";
var o3 = `lit$${Math.random().toFixed(9).slice(2)}$`;
var n3 = "?" + o3;
var r3 = `<${n3}>`;
var l2 = document;
var c3 = () => l2.createComment("");
var a2 = (t3) => null === t3 || "object" != typeof t3 && "function" != typeof t3;
var u2 = Array.isArray;
var d2 = (t3) => u2(t3) || "function" == typeof t3?.[Symbol.iterator];
var f2 = "[ 	\n\f\r]";
var v = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g;
var _ = /-->/g;
var m = />/g;
var p2 = RegExp(`>|${f2}(?:([^\\s"'>=/]+)(${f2}*=${f2}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g");
var g = /'/g;
var $ = /"/g;
var y2 = /^(?:script|style|textarea|title)$/i;
var x = (t3) => (i5, ...s4) => ({ _$litType$: t3, strings: i5, values: s4 });
var b2 = x(1);
var w = x(2);
var T = x(3);
var E = Symbol.for("lit-noChange");
var A = Symbol.for("lit-nothing");
var C = /* @__PURE__ */ new WeakMap();
var P = l2.createTreeWalker(l2, 129);
function V(t3, i5) {
  if (!u2(t3) || !t3.hasOwnProperty("raw"))
    throw Error("invalid template strings array");
  return void 0 !== e3 ? e3.createHTML(i5) : i5;
}
var N = (t3, i5) => {
  const s4 = t3.length - 1, e4 = [];
  let n4, l3 = 2 === i5 ? "<svg>" : 3 === i5 ? "<math>" : "", c4 = v;
  for (let i6 = 0; i6 < s4; i6++) {
    const s5 = t3[i6];
    let a3, u3, d3 = -1, f3 = 0;
    for (; f3 < s5.length && (c4.lastIndex = f3, u3 = c4.exec(s5), null !== u3); )
      f3 = c4.lastIndex, c4 === v ? "!--" === u3[1] ? c4 = _ : void 0 !== u3[1] ? c4 = m : void 0 !== u3[2] ? (y2.test(u3[2]) && (n4 = RegExp("</" + u3[2], "g")), c4 = p2) : void 0 !== u3[3] && (c4 = p2) : c4 === p2 ? ">" === u3[0] ? (c4 = n4 ?? v, d3 = -1) : void 0 === u3[1] ? d3 = -2 : (d3 = c4.lastIndex - u3[2].length, a3 = u3[1], c4 = void 0 === u3[3] ? p2 : '"' === u3[3] ? $ : g) : c4 === $ || c4 === g ? c4 = p2 : c4 === _ || c4 === m ? c4 = v : (c4 = p2, n4 = void 0);
    const x2 = c4 === p2 && t3[i6 + 1].startsWith("/>") ? " " : "";
    l3 += c4 === v ? s5 + r3 : d3 >= 0 ? (e4.push(a3), s5.slice(0, d3) + h2 + s5.slice(d3) + o3 + x2) : s5 + o3 + (-2 === d3 ? i6 : x2);
  }
  return [V(t3, l3 + (t3[s4] || "<?>") + (2 === i5 ? "</svg>" : 3 === i5 ? "</math>" : "")), e4];
};
var S2 = class _S {
  constructor({ strings: t3, _$litType$: i5 }, e4) {
    let r4;
    this.parts = [];
    let l3 = 0, a3 = 0;
    const u3 = t3.length - 1, d3 = this.parts, [f3, v2] = N(t3, i5);
    if (this.el = _S.createElement(f3, e4), P.currentNode = this.el.content, 2 === i5 || 3 === i5) {
      const t4 = this.el.content.firstChild;
      t4.replaceWith(...t4.childNodes);
    }
    for (; null !== (r4 = P.nextNode()) && d3.length < u3; ) {
      if (1 === r4.nodeType) {
        if (r4.hasAttributes())
          for (const t4 of r4.getAttributeNames())
            if (t4.endsWith(h2)) {
              const i6 = v2[a3++], s4 = r4.getAttribute(t4).split(o3), e5 = /([.?@])?(.*)/.exec(i6);
              d3.push({ type: 1, index: l3, name: e5[2], strings: s4, ctor: "." === e5[1] ? I : "?" === e5[1] ? L : "@" === e5[1] ? z : H }), r4.removeAttribute(t4);
            } else
              t4.startsWith(o3) && (d3.push({ type: 6, index: l3 }), r4.removeAttribute(t4));
        if (y2.test(r4.tagName)) {
          const t4 = r4.textContent.split(o3), i6 = t4.length - 1;
          if (i6 > 0) {
            r4.textContent = s2 ? s2.emptyScript : "";
            for (let s4 = 0; s4 < i6; s4++)
              r4.append(t4[s4], c3()), P.nextNode(), d3.push({ type: 2, index: ++l3 });
            r4.append(t4[i6], c3());
          }
        }
      } else if (8 === r4.nodeType)
        if (r4.data === n3)
          d3.push({ type: 2, index: l3 });
        else {
          let t4 = -1;
          for (; -1 !== (t4 = r4.data.indexOf(o3, t4 + 1)); )
            d3.push({ type: 7, index: l3 }), t4 += o3.length - 1;
        }
      l3++;
    }
  }
  static createElement(t3, i5) {
    const s4 = l2.createElement("template");
    return s4.innerHTML = t3, s4;
  }
};
function M(t3, i5, s4 = t3, e4) {
  if (i5 === E)
    return i5;
  let h3 = void 0 !== e4 ? s4._$Co?.[e4] : s4._$Cl;
  const o5 = a2(i5) ? void 0 : i5._$litDirective$;
  return h3?.constructor !== o5 && (h3?._$AO?.(false), void 0 === o5 ? h3 = void 0 : (h3 = new o5(t3), h3._$AT(t3, s4, e4)), void 0 !== e4 ? (s4._$Co ??= [])[e4] = h3 : s4._$Cl = h3), void 0 !== h3 && (i5 = M(t3, h3._$AS(t3, i5.values), h3, e4)), i5;
}
var R = class {
  constructor(t3, i5) {
    this._$AV = [], this._$AN = void 0, this._$AD = t3, this._$AM = i5;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t3) {
    const { el: { content: i5 }, parts: s4 } = this._$AD, e4 = (t3?.creationScope ?? l2).importNode(i5, true);
    P.currentNode = e4;
    let h3 = P.nextNode(), o5 = 0, n4 = 0, r4 = s4[0];
    for (; void 0 !== r4; ) {
      if (o5 === r4.index) {
        let i6;
        2 === r4.type ? i6 = new k(h3, h3.nextSibling, this, t3) : 1 === r4.type ? i6 = new r4.ctor(h3, r4.name, r4.strings, this, t3) : 6 === r4.type && (i6 = new Z(h3, this, t3)), this._$AV.push(i6), r4 = s4[++n4];
      }
      o5 !== r4?.index && (h3 = P.nextNode(), o5++);
    }
    return P.currentNode = l2, e4;
  }
  p(t3) {
    let i5 = 0;
    for (const s4 of this._$AV)
      void 0 !== s4 && (void 0 !== s4.strings ? (s4._$AI(t3, s4, i5), i5 += s4.strings.length - 2) : s4._$AI(t3[i5])), i5++;
  }
};
var k = class _k {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(t3, i5, s4, e4) {
    this.type = 2, this._$AH = A, this._$AN = void 0, this._$AA = t3, this._$AB = i5, this._$AM = s4, this.options = e4, this._$Cv = e4?.isConnected ?? true;
  }
  get parentNode() {
    let t3 = this._$AA.parentNode;
    const i5 = this._$AM;
    return void 0 !== i5 && 11 === t3?.nodeType && (t3 = i5.parentNode), t3;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t3, i5 = this) {
    t3 = M(this, t3, i5), a2(t3) ? t3 === A || null == t3 || "" === t3 ? (this._$AH !== A && this._$AR(), this._$AH = A) : t3 !== this._$AH && t3 !== E && this._(t3) : void 0 !== t3._$litType$ ? this.$(t3) : void 0 !== t3.nodeType ? this.T(t3) : d2(t3) ? this.k(t3) : this._(t3);
  }
  O(t3) {
    return this._$AA.parentNode.insertBefore(t3, this._$AB);
  }
  T(t3) {
    this._$AH !== t3 && (this._$AR(), this._$AH = this.O(t3));
  }
  _(t3) {
    this._$AH !== A && a2(this._$AH) ? this._$AA.nextSibling.data = t3 : this.T(l2.createTextNode(t3)), this._$AH = t3;
  }
  $(t3) {
    const { values: i5, _$litType$: s4 } = t3, e4 = "number" == typeof s4 ? this._$AC(t3) : (void 0 === s4.el && (s4.el = S2.createElement(V(s4.h, s4.h[0]), this.options)), s4);
    if (this._$AH?._$AD === e4)
      this._$AH.p(i5);
    else {
      const t4 = new R(e4, this), s5 = t4.u(this.options);
      t4.p(i5), this.T(s5), this._$AH = t4;
    }
  }
  _$AC(t3) {
    let i5 = C.get(t3.strings);
    return void 0 === i5 && C.set(t3.strings, i5 = new S2(t3)), i5;
  }
  k(t3) {
    u2(this._$AH) || (this._$AH = [], this._$AR());
    const i5 = this._$AH;
    let s4, e4 = 0;
    for (const h3 of t3)
      e4 === i5.length ? i5.push(s4 = new _k(this.O(c3()), this.O(c3()), this, this.options)) : s4 = i5[e4], s4._$AI(h3), e4++;
    e4 < i5.length && (this._$AR(s4 && s4._$AB.nextSibling, e4), i5.length = e4);
  }
  _$AR(t3 = this._$AA.nextSibling, s4) {
    for (this._$AP?.(false, true, s4); t3 !== this._$AB; ) {
      const s5 = i3(t3).nextSibling;
      i3(t3).remove(), t3 = s5;
    }
  }
  setConnected(t3) {
    void 0 === this._$AM && (this._$Cv = t3, this._$AP?.(t3));
  }
};
var H = class {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t3, i5, s4, e4, h3) {
    this.type = 1, this._$AH = A, this._$AN = void 0, this.element = t3, this.name = i5, this._$AM = e4, this.options = h3, s4.length > 2 || "" !== s4[0] || "" !== s4[1] ? (this._$AH = Array(s4.length - 1).fill(new String()), this.strings = s4) : this._$AH = A;
  }
  _$AI(t3, i5 = this, s4, e4) {
    const h3 = this.strings;
    let o5 = false;
    if (void 0 === h3)
      t3 = M(this, t3, i5, 0), o5 = !a2(t3) || t3 !== this._$AH && t3 !== E, o5 && (this._$AH = t3);
    else {
      const e5 = t3;
      let n4, r4;
      for (t3 = h3[0], n4 = 0; n4 < h3.length - 1; n4++)
        r4 = M(this, e5[s4 + n4], i5, n4), r4 === E && (r4 = this._$AH[n4]), o5 ||= !a2(r4) || r4 !== this._$AH[n4], r4 === A ? t3 = A : t3 !== A && (t3 += (r4 ?? "") + h3[n4 + 1]), this._$AH[n4] = r4;
    }
    o5 && !e4 && this.j(t3);
  }
  j(t3) {
    t3 === A ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t3 ?? "");
  }
};
var I = class extends H {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t3) {
    this.element[this.name] = t3 === A ? void 0 : t3;
  }
};
var L = class extends H {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t3) {
    this.element.toggleAttribute(this.name, !!t3 && t3 !== A);
  }
};
var z = class extends H {
  constructor(t3, i5, s4, e4, h3) {
    super(t3, i5, s4, e4, h3), this.type = 5;
  }
  _$AI(t3, i5 = this) {
    if ((t3 = M(this, t3, i5, 0) ?? A) === E)
      return;
    const s4 = this._$AH, e4 = t3 === A && s4 !== A || t3.capture !== s4.capture || t3.once !== s4.once || t3.passive !== s4.passive, h3 = t3 !== A && (s4 === A || e4);
    e4 && this.element.removeEventListener(this.name, this, s4), h3 && this.element.addEventListener(this.name, this, t3), this._$AH = t3;
  }
  handleEvent(t3) {
    "function" == typeof this._$AH ? this._$AH.call(this.options?.host ?? this.element, t3) : this._$AH.handleEvent(t3);
  }
};
var Z = class {
  constructor(t3, i5, s4) {
    this.element = t3, this.type = 6, this._$AN = void 0, this._$AM = i5, this.options = s4;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t3) {
    M(this, t3);
  }
};
var B = t2.litHtmlPolyfillSupport;
B?.(S2, k), (t2.litHtmlVersions ??= []).push("3.3.2");
var D = (t3, i5, s4) => {
  const e4 = s4?.renderBefore ?? i5;
  let h3 = e4._$litPart$;
  if (void 0 === h3) {
    const t4 = s4?.renderBefore ?? null;
    e4._$litPart$ = h3 = new k(i5.insertBefore(c3(), t4), t4, void 0, s4 ?? {});
  }
  return h3._$AI(t3), h3;
};

// node_modules/lit-element/lit-element.js
var s3 = globalThis;
var i4 = class extends y {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const t3 = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= t3.firstChild, t3;
  }
  update(t3) {
    const r4 = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t3), this._$Do = D(r4, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(true);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(false);
  }
  render() {
    return E;
  }
};
i4._$litElement$ = true, i4["finalized"] = true, s3.litElementHydrateSupport?.({ LitElement: i4 });
var o4 = s3.litElementPolyfillSupport;
o4?.({ LitElement: i4 });
(s3.litElementVersions ??= []).push("4.2.2");

// src/webview/mainView.ts
var vscode = window.acquireVsCodeApi();
var root = document.getElementById("root");
var isBatchingState = false;
var hasPendingRender = false;
var requestRender = () => {
  if (isBatchingState) {
    hasPendingRender = true;
    return;
  }
  renderView();
};
var batchStateUpdates = (updater) => {
  isBatchingState = true;
  try {
    updater();
  } finally {
    isBatchingState = false;
    if (hasPendingRender) {
      hasPendingRender = false;
      renderView();
    }
  }
};
var startState = {
  actions: [],
  groups: [],
  searchQuery: "",
  loading: false,
  generating: false,
  display: {
    showIcon: true,
    showType: true,
    showCommand: true,
    showGroup: true,
    hideIcon: "eye-closed",
    playButtonBg: "transparent",
    density: "comfortable",
    useEmojiLoader: false,
    loaderEmoji: "\u{1F32F}"
  },
  secondaryGroups: {},
  iconMap: {},
  collapsedGroups: [],
  showSearch: false,
  showHidden: false,
  // Default
  selectionMode: false,
  selectedItems: [],
  openActionMenuFor: null
};
if (window.__INITIAL_DATA__) {
  Object.assign(startState, window.__INITIAL_DATA__);
}
var storedState = vscode.getState() || {};
if (storedState.collapsedGroups) {
  startState.collapsedGroups = storedState.collapsedGroups;
}
var state = new Proxy(startState, {
  set(target, p3, value) {
    target[p3] = value;
    requestRender();
    if (p3 === "collapsedGroups") {
      vscode.setState({ ...storedState, collapsedGroups: value });
    }
    return true;
  }
});
var dragSrcAction = null;
var dragOverAction = null;
var dragOverTop = true;
var handleDragStart = (e4, item) => {
  dragSrcAction = item;
  e4.dataTransfer.effectAllowed = "move";
  const wrapper = e4.currentTarget.closest(".lp-btn-wrapper");
  if (wrapper) {
    const rect = wrapper.getBoundingClientRect();
    const offsetX = e4.clientX - rect.left;
    const offsetY = e4.clientY - rect.top;
    e4.dataTransfer.setDragImage(wrapper, offsetX, offsetY);
  }
  setTimeout(() => requestRender(), 0);
};
var handleDragOver = (e4, item) => {
  if (!dragSrcAction || dragSrcAction === item)
    return;
  e4.preventDefault();
  e4.dataTransfer.dropEffect = "move";
  const target = e4.currentTarget;
  const rect = target.getBoundingClientRect();
  const top = e4.clientY < rect.top + rect.height / 2;
  if (dragOverAction !== item || dragOverTop !== top) {
    dragOverAction = item;
    dragOverTop = top;
    requestRender();
  }
};
var handleDragLeave = (e4, item) => {
  const related = e4.relatedTarget;
  const wrapper = e4.currentTarget;
  if (!wrapper.contains(related) && dragOverAction === item) {
    dragOverAction = null;
    requestRender();
  }
};
var handleDrop = (e4, item) => {
  e4.preventDefault();
  if (!dragSrcAction || dragSrcAction === item)
    return;
  const newActions = [...state.actions];
  const srcIdx = newActions.indexOf(dragSrcAction);
  const tgtIdx = newActions.indexOf(item);
  if (srcIdx === -1 || tgtIdx === -1) {
    dragSrcAction = null;
    dragOverAction = null;
    return;
  }
  newActions.splice(srcIdx, 1);
  const adjustedTgt = newActions.indexOf(item);
  const insertIdx = dragOverTop ? adjustedTgt : adjustedTgt + 1;
  newActions.splice(insertIdx, 0, dragSrcAction);
  dragSrcAction = null;
  dragOverAction = null;
  state.actions = newActions;
  vscode.postMessage({ command: "reorderActions", actions: newActions });
};
var handleDragEnd = () => {
  dragSrcAction = null;
  dragOverAction = null;
  requestRender();
};
var toggleGroup = (groupName) => {
  const newCollapsed = new Set(state.collapsedGroups);
  if (newCollapsed.has(groupName)) {
    newCollapsed.delete(groupName);
  } else {
    newCollapsed.add(groupName);
  }
  state.collapsedGroups = Array.from(newCollapsed);
};
var executeAction = (item) => {
  vscode.postMessage({ command: "executeCommand", item });
};
var editAction = (item) => {
  vscode.postMessage({ command: "editAction", item });
};
var setActionColor = (item) => {
  vscode.postMessage({ command: "setActionColor", item });
};
var assignGroup = (item, groupName) => {
  vscode.postMessage({ command: "assignGroup", item, groupName });
};
var getActionMenuId = (item) => {
  return encodeURIComponent(`${item.name}|${item.command}|${item.type}|${item.workspace ?? ""}`);
};
var openMenuAndFocus = (config, target) => {
  if (!config.isOpen()) {
    config.open();
  }
  if (target === "last") {
    config.focusLast();
  } else {
    config.focusFirst();
  }
};
var handleFlyoutTriggerKeydown = (e4, config) => {
  if (e4.key === "Escape" && config.isOpen()) {
    e4.preventDefault();
    config.close(true);
    return;
  }
  if (e4.key === "Enter" || e4.key === " " || e4.key === "ArrowDown") {
    e4.preventDefault();
    openMenuAndFocus(config, "first");
    return;
  }
  if (e4.key === "ArrowUp") {
    e4.preventDefault();
    openMenuAndFocus(config, "last");
  }
};
var handleFlyoutMenuKeydown = (e4, config) => {
  const flyout = e4.currentTarget;
  const menuItems = config.getMenuItems(flyout);
  if (!menuItems.length)
    return;
  const currentIndex = menuItems.indexOf(document.activeElement);
  if (e4.key === "Escape") {
    e4.preventDefault();
    config.close(true);
    return;
  }
  if (e4.key === "Tab") {
    config.close();
    return;
  }
  if (e4.key === "Home") {
    e4.preventDefault();
    menuItems[0].focus();
    return;
  }
  if (e4.key === "End") {
    e4.preventDefault();
    menuItems[menuItems.length - 1].focus();
    return;
  }
  if (e4.key === "ArrowDown") {
    e4.preventDefault();
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % menuItems.length : 0;
    menuItems[nextIndex].focus();
    return;
  }
  if (e4.key === "ArrowUp") {
    e4.preventDefault();
    const previousIndex = currentIndex >= 0 ? (currentIndex - 1 + menuItems.length) % menuItems.length : menuItems.length - 1;
    menuItems[previousIndex].focus();
  }
};
var focusActionMenuTrigger = (item) => {
  const actionMenuId = getActionMenuId(item);
  requestAnimationFrame(() => {
    const trigger = document.querySelector(`.lp-menu-trigger[data-action-menu-id="${actionMenuId}"]`);
    trigger?.focus();
  });
};
var focusActionMenuItem = (item, target = "first") => {
  const actionMenuId = getActionMenuId(item);
  requestAnimationFrame(() => {
    const flyout = document.querySelector(`.lp-menu-panel[data-action-menu-id="${actionMenuId}"]`);
    if (!flyout)
      return;
    const items = Array.from(flyout.querySelectorAll(".lp-menu-item"));
    if (!items.length)
      return;
    const next = target === "last" ? items[items.length - 1] : items[0];
    next.focus();
  });
};
var getActionMenuKeyboardConfig = (item) => ({
  isOpen: () => state.openActionMenuFor === item,
  open: () => {
    state.openActionMenuFor = item;
  },
  close: (restoreFocus = false) => closeActionMenu(restoreFocus ? item : void 0),
  focusFirst: () => focusActionMenuItem(item, "first"),
  focusLast: () => focusActionMenuItem(item, "last"),
  getMenuItems: (flyout) => Array.from(flyout.querySelectorAll(".lp-menu-item"))
});
var toggleActionMenu = (e4, item) => {
  e4.stopPropagation();
  state.openActionMenuFor = state.openActionMenuFor === item ? null : item;
};
var closeActionMenu = (itemToRefocus) => {
  if (state.openActionMenuFor) {
    state.openActionMenuFor = null;
  }
  if (itemToRefocus) {
    focusActionMenuTrigger(itemToRefocus);
  }
};
var onActionMenuAction = (callback) => {
  callback();
  closeActionMenu();
};
var onActionMenuTriggerKeydown = (e4, item) => {
  handleFlyoutTriggerKeydown(e4, getActionMenuKeyboardConfig(item));
};
var onActionMenuKeydown = (e4, item) => {
  handleFlyoutMenuKeydown(e4, getActionMenuKeyboardConfig(item));
};
var hideAction = (item) => {
  vscode.postMessage({ command: "hideAction", item });
};
var editGroup = (group) => {
  vscode.postMessage({ command: "editGroup", group });
};
var hideGroup = (group) => {
  vscode.postMessage({ command: "hideGroup", group });
};
var formatCommandMeta = (item) => {
  if (item.type === "npm" && item.command.startsWith("npm run ")) {
    return `npm: ${item.command.replace("npm run ", "")}`;
  }
  if (item.type === "task") {
    const taskLabel = item.command.split("|")[1];
    return taskLabel ? `task: ${taskLabel}` : "task";
  }
  if (item.type === "launch") {
    const launchLabel = item.command.split("|")[1];
    return launchLabel ? `launch: ${launchLabel}` : "launch";
  }
  if (item.type === "vscode") {
    const [commandId, commandArg] = item.command.split("|");
    if (commandId === "workbench.action.tasks.runTask") {
      return commandArg ? `task: ${commandArg}` : "task";
    }
    if (commandId === "workbench.action.debug.start") {
      return commandArg ? `launch: ${commandArg}` : "launch";
    }
    return commandArg ? `${commandId} ${commandArg}` : commandId;
  }
  return item.command;
};
var renderFlyoutMenu = (config) => {
  const containerClass = `lp-menu-container lp-menu-container--${config.kind}`;
  const triggerClass = `lp-menu-trigger lp-menu-trigger--${config.kind}`;
  const flyoutClass = `lp-menu-panel lp-menu-panel--${config.kind}`;
  return b2`
        <div
            class=${containerClass}
            data-action-menu-id=${config.kind === "action" ? config.menuId : ""}
            data-group-menu-id=${config.kind === "group" ? config.menuId : ""}>
            <button
                class=${triggerClass}
                title=${config.triggerTitle}
                aria-label=${config.triggerAriaLabel}
                aria-haspopup="menu"
                aria-expanded=${config.isOpen ? "true" : "false"}
                data-action-menu-id=${config.kind === "action" ? config.menuId : ""}
                data-group-menu-id=${config.kind === "group" ? config.menuId : ""}
                @click=${config.onTriggerClick}
                @keydown=${config.onTriggerKeydown}>
                <span class="codicon codicon-ellipsis"></span>
            </button>

            ${config.isOpen ? b2`
                <div
                    class=${flyoutClass}
                    data-action-menu-id=${config.kind === "action" ? config.menuId : ""}
                    data-group-menu-id=${config.kind === "group" ? config.menuId : ""}
                    role="menu"
                    @click=${config.onMenuClick}
                    @keydown=${config.onMenuKeydown}>
                    ${config.menuContent}
                </div>
            ` : null}
        </div>
    `;
};
var renderButton = (item) => {
  const isHidden = item.hidden;
  const { display, iconMap, secondaryGroups } = state;
  const icon = display.showIcon ? iconMap[item.type] || "" : "";
  const metaParts = [];
  if (item.workspace) {
    const workspaceStyle = item.workspaceColor ? `background-color: ${item.workspaceColor};` : "";
    metaParts.push(b2`<span class="lp-workspace-label" style="${workspaceStyle}">${item.workspace}</span>`);
  }
  const prettyCommand = formatCommandMeta(item);
  if (display.showType && display.showCommand) {
    metaParts.push(item.type);
    metaParts.push(prettyCommand);
  } else if (display.showType)
    metaParts.push(item.type);
  else if (display.showCommand)
    metaParts.push(prettyCommand);
  const isInGroup = !!item.group;
  const hasGroups = state.groups.length > 0;
  const showGroupActions = hasGroups || isInGroup;
  const isMenuOpen = state.openActionMenuFor === item;
  const actionMenuId = getActionMenuId(item);
  const actionStyle = item.backgroundColor ? `background-color: ${item.backgroundColor} !important;` : "";
  const isDragging = dragSrcAction === item;
  const isDragOver = dragOverAction === item;
  const wrapperClass = [
    "lp-btn-wrapper",
    isHidden ? "lp-hidden-item" : "",
    isDragging ? "lp-dragging" : "",
    isDragOver && dragOverTop ? "lp-drag-over-top" : "",
    isDragOver && !dragOverTop ? "lp-drag-over-bottom" : ""
  ].filter(Boolean).join(" ");
  return b2`
    <div class=${wrapperClass}
        @dragover=${(e4) => handleDragOver(e4, item)}
        @dragleave=${(e4) => handleDragLeave(e4, item)}
        @drop=${(e4) => handleDrop(e4, item)}>
        ${state.selectionMode ? b2`<input type="checkbox" class="lp-btn-checkbox" .checked=${state.selectedItems.includes(item)} @change=${(e4) => {
    if (e4.target.checked)
      state.selectedItems = [...state.selectedItems, item];
    else
      state.selectedItems = state.selectedItems.filter((i5) => i5 !== item);
  }}>` : null}
        
        <button
            class="lp-play-btn"
            style="--lp-play-btn-bg: ${display.playButtonBg}"
            title="Run"
            aria-label=${`Run ${item.name}`}
            @click=${() => executeAction(item)}>
            <span class="codicon codicon-play"></span>
        </button>
        ${!state.searchQuery ? b2`
        <button class="lp-drag-handle" draggable="true" title="Drag to reorder" aria-label=${`Drag ${item.name} to reorder`}
            @dragstart=${(e4) => handleDragStart(e4, item)}
            @dragend=${handleDragEnd}>
            <span class="codicon codicon-gripper"></span>
        </button>` : null}
        
        <div class="lp-btn ${state.selectionMode ? "has-checkbox" : ""}" style="${actionStyle}">
             <span class="lp-btn-name">
                ${icon ? b2`<span class="codicon codicon-${icon} lp-icon"></span>` : null}
                ${item.name}
                ${isHidden ? b2`<span class="lp-hidden-badge">(hidden)</span>` : null}
             </span>
             ${metaParts.length ? b2`<span class="lp-btn-meta">${metaParts.map((part, idx) => b2`${idx > 0 ? " \xB7 " : ""}${part}`)}</span>` : null}
        </div>

        ${renderFlyoutMenu({
    kind: "action",
    menuId: actionMenuId,
    isOpen: isMenuOpen,
    triggerTitle: "More actions",
    triggerAriaLabel: `More actions for ${item.name}`,
    onTriggerClick: (e4) => toggleActionMenu(e4, item),
    onTriggerKeydown: (e4) => onActionMenuTriggerKeydown(e4, item),
    onMenuClick: (e4) => e4.stopPropagation(),
    onMenuKeydown: (e4) => onActionMenuKeydown(e4, item),
    menuContent: b2`
                <button class="lp-menu-item lp-menu-item--action" role="menuitem" @click=${() => onActionMenuAction(() => editAction(item))}>
                    <span class="codicon codicon-edit"></span>
                    Edit
                </button>
                <button class="lp-menu-item lp-menu-item--action" role="menuitem" @click=${() => onActionMenuAction(() => setActionColor(item))}>
                    <span class="codicon codicon-symbol-color"></span>
                    Set color
                </button>
                <button class="lp-menu-item lp-menu-item--action" role="menuitem" @click=${() => onActionMenuAction(() => hideAction(item))}>
                    <span class="codicon codicon-${isHidden ? "eye" : display.hideIcon}"></span>
                    ${isHidden ? "Show" : "Hide"}
                </button>

                ${showGroupActions ? b2`
                    <div class="lp-menu-divider"></div>
                    <button class="lp-menu-item lp-menu-item--action" role="menuitem" @click=${() => onActionMenuAction(() => assignGroup(item, "__none__"))}>
                        <span class="codicon codicon-clear-all"></span>
                        Remove from group
                    </button>
                    ${state.groups.map((g2) => b2`
                        <button class="lp-menu-item lp-menu-item--action" role="menuitem" @click=${() => onActionMenuAction(() => assignGroup(item, g2.name))}>
                            ${g2.icon ? b2`<span class="codicon codicon-${g2.icon}"></span>` : b2`<span class="codicon codicon-folder"></span>`}
                            Assign to ${g2.name}
                        </button>
                    `)}
                ` : null}
            `
  })}
    </div>
    `;
};
var renderGroup = (group, actions) => {
  const isOpen = !state.collapsedGroups.includes(group.name);
  const isHiddenGroup = !!group.hidden;
  const styles = [];
  if (group.color) {
    if (group.color.includes("--vscode-charts-")) {
      styles.push(`--lp-group-accent: ${group.color}`);
    } else {
      styles.push(`color: ${group.color}`);
      styles.push(`--lp-group-accent: ${group.color}`);
    }
  }
  if (group.backgroundColor)
    styles.push(`background-color: ${group.backgroundColor}`);
  if (group.borderColor)
    styles.push(`border-color: ${group.borderColor}`);
  const itemsStyles = [];
  if (group.backgroundColor)
    itemsStyles.push(`background-color: ${group.backgroundColor}`);
  if (group.borderColor) {
    itemsStyles.push(`border: 1px solid ${group.borderColor}`);
    itemsStyles.push(`border-radius: 4px`);
    itemsStyles.push(`padding: 8px`);
  }
  return b2`
    <details class="lp-group" ?open=${isOpen} @toggle=${(e4) => {
    const d3 = e4.target;
    if (d3.open && state.collapsedGroups.includes(group.name)) {
      toggleGroup(group.name);
    } else if (!d3.open && !state.collapsedGroups.includes(group.name)) {
      toggleGroup(group.name);
    }
  }}>
        <summary class="lp-group-header ${isHiddenGroup ? "lp-hidden-group" : ""}" style="${styles.join(";")}">
            <span class="codicon codicon-chevron-down lp-group-chevron"></span>
            <div class="lp-group-header-content">
                ${group.icon ? b2`<span class="codicon codicon-${group.icon} lp-group-icon"></span>` : null}
                <span class="lp-group-name">${group.name}</span>
                ${isHiddenGroup ? b2`<span class="lp-hidden-badge">(hidden)</span>` : null}
            </div>
            <div class="lp-menu-container lp-menu-container--group">
                <button
                    class="lp-menu-trigger lp-menu-trigger--group"
                    title=${isHiddenGroup ? "Show group" : "Hide group"}
                    aria-label=${isHiddenGroup ? `Show group ${group.name}` : `Hide group ${group.name}`}
                    @click=${(e4) => {
    e4.preventDefault();
    e4.stopPropagation();
    hideGroup(group);
  }}>
                    <span class="codicon codicon-${isHiddenGroup ? "eye" : state.display.hideIcon}"></span>
                </button>
                <button
                    class="lp-menu-trigger lp-menu-trigger--group"
                    title="Edit group"
                    aria-label="Edit group ${group.name}"
                    @click=${(e4) => {
    e4.preventDefault();
    e4.stopPropagation();
    editGroup(group);
  }}>
                    <span class="codicon codicon-settings-gear"></span>
                </button>
            </div>
        </summary>
        <div class="lp-group-items" style="${itemsStyles.join(";")}">
            ${actions.map((a3) => renderButton(a3))}
        </div>
    </details>
    `;
};
var renderSearch = () => {
  if (!state.showSearch && !state.searchQuery)
    return null;
  return b2`
    <div id="searchContainer" class="lp-search-container">
        <input type="text" class="lp-search-box" 
            placeholder="🔍 Search actions..." 
            .value=${state.searchQuery}
            @input=${(e4) => {
    state.searchQuery = e4.target.value;
  }}
        >
        <!-- Additional search buttons (Select Multiple, etc) could go here -->
    </div>
    `;
};
var renderMainToolbar = () => {
  const hiddenActionCount = state.actions.filter((a3) => a3.hidden).length;
  const hiddenGroupCount = state.groups.filter((g2) => g2.hidden).length;
  const hiddenTotal = hiddenActionCount + hiddenGroupCount;
  const showCounts = hiddenTotal > 0;
  return b2`
    <div class="lp-main-toolbar">
        <button
            class="lp-toolbar-btn"
            title=${state.showHidden ? "Hide hidden actions and groups" : "Show hidden actions and groups"}
            aria-label=${state.showHidden ? "Hide hidden actions and groups" : "Show hidden actions and groups"}
            @click=${() => {
    state.showHidden = !state.showHidden;
    vscode.postMessage({ command: "toggleShowHidden" });
  }}>
            <span class="codicon codicon-${state.showHidden ? state.display.hideIcon : "eye"}"></span>
            <span>${state.showHidden ? "Hide Hidden" : "Show Hidden"}</span>
            ${showCounts ? b2`<span class="lp-hidden-count">${hiddenTotal}</span>` : null}
        </button>
    </div>
  `;
};
var renderView = () => {
  if (!root)
    return;
  let visibleActions = state.actions;
  if (!state.showHidden) {
    visibleActions = visibleActions.filter((a3) => !a3.hidden);
  }
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    visibleActions = visibleActions.filter(
      (a3) => a3.name.toLowerCase().includes(q) || a3.command.toLowerCase().includes(q) || a3.group && a3.group.toLowerCase().includes(q)
    );
  }
  const content = [];
  if (state.display.showGroup && state.groups.length > 0) {
    const grouped = /* @__PURE__ */ new Map();
    const ungrouped = [];
    visibleActions.forEach((a3) => {
      if (a3.group) {
        if (!grouped.has(a3.group))
          grouped.set(a3.group, []);
        grouped.get(a3.group).push(a3);
      } else {
        ungrouped.push(a3);
      }
    });
    state.groups.forEach((g2) => {
      if (g2.hidden && !state.showHidden) {
        return;
      }
      const acts = grouped.get(g2.name);
      if (acts && acts.length) {
        content.push(renderGroup(g2, acts));
      }
    });
    if (ungrouped.length) {
      content.push(b2`
            <details class="lp-group" open>
                <summary class="lp-group-header"><span class="codicon codicon-chevron-down lp-group-chevron"></span> Ungrouped</summary>
                                <div class="lp-group-items">${ungrouped.map((a3) => renderButton(a3))}</div>
            </details>
          `);
    }
  } else {
    content.push(visibleActions.map((a3) => renderButton(a3)));
  }
  if (visibleActions.length === 0) {
    content.push(b2`
        <div class="lp-empty-state">
            <div class="lp-welcome"><h2 class="lp-welcome-title">Welcome</h2></div>
            <div class="lp-empty-actions">
                <button class="lp-empty-btn lp-empty-primary" @click=${() => {
      state.generating = true;
      vscode.postMessage({ command: "showGenerateConfig" });
    }}>
                    <span class="codicon ${state.generating ? "codicon-loading codicon-modifier-spin" : "codicon-sparkle"}"></span>
                    <span class="lp-btn-label">${state.generating ? "Detecting..." : "Auto-detect"}</span>
                </button>
            </div>
        </div>
      `);
  }
  D(b2`
    <div id="toast" class="lp-toast"></div>
    ${state.loading ? b2`<div class="lp-loading-overlay"><span class="codicon codicon-loading codicon-modifier-spin"></span></div>` : null}
    ${renderMainToolbar()}
    ${renderSearch()}
    <div class="lp-grid ${state.display.density}">
        ${content}
    </div>
  `, root);
};
window.addEventListener("message", (event) => {
  const msg = event.data;
  switch (msg.type) {
    case "update":
      batchStateUpdates(() => {
        Object.assign(state, msg.data);
        state.loading = false;
        state.generating = false;
      });
      break;
    case "setLoading":
      state.loading = msg.value;
      break;
    case "toggleSearch":
      state.showSearch = msg.visible;
      break;
    case "collapseAllGroups":
      state.collapsedGroups = state.groups.map((g2) => g2.name);
      requestRender();
      break;
    case "expandAllGroups":
      state.collapsedGroups = [];
      requestRender();
      break;
    case "showToast":
      break;
  }
});
renderView();
document.addEventListener("click", (e4) => {
  const target = e4.target;
  if (!target?.closest(".lp-menu-container")) {
    closeActionMenu();
  }
});
document.addEventListener("keydown", (e4) => {
  if (e4.key === "Escape") {
    closeActionMenu();
  }
});
/*! Bundled license information:

@lit/reactive-element/css-tag.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/reactive-element.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/lit-html.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-element/lit-element.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/is-server.js:
  (**
   * @license
   * Copyright 2022 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)
*/
//# sourceMappingURL=mainView.js.map
