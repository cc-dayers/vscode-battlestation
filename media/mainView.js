// node_modules/@lit/reactive-element/development/css-tag.js
var NODE_MODE = false;
var global = globalThis;
var supportsAdoptingStyleSheets = global.ShadowRoot && (global.ShadyCSS === void 0 || global.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype;
var constructionToken = /* @__PURE__ */ Symbol();
var cssTagCache = /* @__PURE__ */ new WeakMap();
var CSSResult = class {
  constructor(cssText, strings, safeToken) {
    this["_$cssResult$"] = true;
    if (safeToken !== constructionToken) {
      throw new Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    }
    this.cssText = cssText;
    this._strings = strings;
  }
  // This is a getter so that it's lazy. In practice, this means stylesheets
  // are not created until the first element instance is made.
  get styleSheet() {
    let styleSheet = this._styleSheet;
    const strings = this._strings;
    if (supportsAdoptingStyleSheets && styleSheet === void 0) {
      const cacheable = strings !== void 0 && strings.length === 1;
      if (cacheable) {
        styleSheet = cssTagCache.get(strings);
      }
      if (styleSheet === void 0) {
        (this._styleSheet = styleSheet = new CSSStyleSheet()).replaceSync(this.cssText);
        if (cacheable) {
          cssTagCache.set(strings, styleSheet);
        }
      }
    }
    return styleSheet;
  }
  toString() {
    return this.cssText;
  }
};
var unsafeCSS = (value) => new CSSResult(typeof value === "string" ? value : String(value), void 0, constructionToken);
var adoptStyles = (renderRoot, styles) => {
  if (supportsAdoptingStyleSheets) {
    renderRoot.adoptedStyleSheets = styles.map((s) => s instanceof CSSStyleSheet ? s : s.styleSheet);
  } else {
    for (const s of styles) {
      const style = document.createElement("style");
      const nonce = global["litNonce"];
      if (nonce !== void 0) {
        style.setAttribute("nonce", nonce);
      }
      style.textContent = s.cssText;
      renderRoot.appendChild(style);
    }
  }
};
var cssResultFromStyleSheet = (sheet) => {
  let cssText = "";
  for (const rule of sheet.cssRules) {
    cssText += rule.cssText;
  }
  return unsafeCSS(cssText);
};
var getCompatibleStyle = supportsAdoptingStyleSheets || NODE_MODE && global.CSSStyleSheet === void 0 ? (s) => s : (s) => s instanceof CSSStyleSheet ? cssResultFromStyleSheet(s) : s;

// node_modules/@lit/reactive-element/development/reactive-element.js
var { is, defineProperty, getOwnPropertyDescriptor, getOwnPropertyNames, getOwnPropertySymbols, getPrototypeOf } = Object;
var NODE_MODE2 = false;
var global2 = globalThis;
if (NODE_MODE2) {
  global2.customElements ??= customElements;
}
var DEV_MODE = true;
var issueWarning;
var trustedTypes = global2.trustedTypes;
var emptyStringForBooleanAttribute = trustedTypes ? trustedTypes.emptyScript : "";
var polyfillSupport = DEV_MODE ? global2.reactiveElementPolyfillSupportDevMode : global2.reactiveElementPolyfillSupport;
if (DEV_MODE) {
  global2.litIssuedWarnings ??= /* @__PURE__ */ new Set();
  issueWarning = (code, warning) => {
    warning += ` See https://lit.dev/msg/${code} for more information.`;
    if (!global2.litIssuedWarnings.has(warning) && !global2.litIssuedWarnings.has(code)) {
      console.warn(warning);
      global2.litIssuedWarnings.add(warning);
    }
  };
  queueMicrotask(() => {
    issueWarning("dev-mode", `Lit is in dev mode. Not recommended for production!`);
    if (global2.ShadyDOM?.inUse && polyfillSupport === void 0) {
      issueWarning("polyfill-support-missing", `Shadow DOM is being polyfilled via \`ShadyDOM\` but the \`polyfill-support\` module has not been loaded.`);
    }
  });
}
var debugLogEvent = DEV_MODE ? (event) => {
  const shouldEmit = global2.emitLitDebugLogEvents;
  if (!shouldEmit) {
    return;
  }
  global2.dispatchEvent(new CustomEvent("lit-debug", {
    detail: event
  }));
} : void 0;
var JSCompiler_renameProperty = (prop, _obj) => prop;
var defaultConverter = {
  toAttribute(value, type) {
    switch (type) {
      case Boolean:
        value = value ? emptyStringForBooleanAttribute : null;
        break;
      case Object:
      case Array:
        value = value == null ? value : JSON.stringify(value);
        break;
    }
    return value;
  },
  fromAttribute(value, type) {
    let fromValue = value;
    switch (type) {
      case Boolean:
        fromValue = value !== null;
        break;
      case Number:
        fromValue = value === null ? null : Number(value);
        break;
      case Object:
      case Array:
        try {
          fromValue = JSON.parse(value);
        } catch (e) {
          fromValue = null;
        }
        break;
    }
    return fromValue;
  }
};
var notEqual = (value, old) => !is(value, old);
var defaultPropertyDeclaration = {
  attribute: true,
  type: String,
  converter: defaultConverter,
  reflect: false,
  useDefault: false,
  hasChanged: notEqual
};
Symbol.metadata ??= /* @__PURE__ */ Symbol("metadata");
global2.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
var ReactiveElement = class extends HTMLElement {
  /**
   * Adds an initializer function to the class that is called during instance
   * construction.
   *
   * This is useful for code that runs against a `ReactiveElement`
   * subclass, such as a decorator, that needs to do work for each
   * instance, such as setting up a `ReactiveController`.
   *
   * ```ts
   * const myDecorator = (target: typeof ReactiveElement, key: string) => {
   *   target.addInitializer((instance: ReactiveElement) => {
   *     // This is run during construction of the element
   *     new MyController(instance);
   *   });
   * }
   * ```
   *
   * Decorating a field will then cause each instance to run an initializer
   * that adds a controller:
   *
   * ```ts
   * class MyElement extends LitElement {
   *   @myDecorator foo;
   * }
   * ```
   *
   * Initializers are stored per-constructor. Adding an initializer to a
   * subclass does not add it to a superclass. Since initializers are run in
   * constructors, initializers will run in order of the class hierarchy,
   * starting with superclasses and progressing to the instance's class.
   *
   * @nocollapse
   */
  static addInitializer(initializer) {
    this.__prepare();
    (this._initializers ??= []).push(initializer);
  }
  /**
   * Returns a list of attributes corresponding to the registered properties.
   * @nocollapse
   * @category attributes
   */
  static get observedAttributes() {
    this.finalize();
    return this.__attributeToPropertyMap && [...this.__attributeToPropertyMap.keys()];
  }
  /**
   * Creates a property accessor on the element prototype if one does not exist
   * and stores a {@linkcode PropertyDeclaration} for the property with the
   * given options. The property setter calls the property's `hasChanged`
   * property option or uses a strict identity check to determine whether or not
   * to request an update.
   *
   * This method may be overridden to customize properties; however,
   * when doing so, it's important to call `super.createProperty` to ensure
   * the property is setup correctly. This method calls
   * `getPropertyDescriptor` internally to get a descriptor to install.
   * To customize what properties do when they are get or set, override
   * `getPropertyDescriptor`. To customize the options for a property,
   * implement `createProperty` like this:
   *
   * ```ts
   * static createProperty(name, options) {
   *   options = Object.assign(options, {myOption: true});
   *   super.createProperty(name, options);
   * }
   * ```
   *
   * @nocollapse
   * @category properties
   */
  static createProperty(name, options = defaultPropertyDeclaration) {
    if (options.state) {
      options.attribute = false;
    }
    this.__prepare();
    if (this.prototype.hasOwnProperty(name)) {
      options = Object.create(options);
      options.wrapped = true;
    }
    this.elementProperties.set(name, options);
    if (!options.noAccessor) {
      const key = DEV_MODE ? (
        // Use Symbol.for in dev mode to make it easier to maintain state
        // when doing HMR.
        /* @__PURE__ */ Symbol.for(`${String(name)} (@property() cache)`)
      ) : /* @__PURE__ */ Symbol();
      const descriptor = this.getPropertyDescriptor(name, key, options);
      if (descriptor !== void 0) {
        defineProperty(this.prototype, name, descriptor);
      }
    }
  }
  /**
   * Returns a property descriptor to be defined on the given named property.
   * If no descriptor is returned, the property will not become an accessor.
   * For example,
   *
   * ```ts
   * class MyElement extends LitElement {
   *   static getPropertyDescriptor(name, key, options) {
   *     const defaultDescriptor =
   *         super.getPropertyDescriptor(name, key, options);
   *     const setter = defaultDescriptor.set;
   *     return {
   *       get: defaultDescriptor.get,
   *       set(value) {
   *         setter.call(this, value);
   *         // custom action.
   *       },
   *       configurable: true,
   *       enumerable: true
   *     }
   *   }
   * }
   * ```
   *
   * @nocollapse
   * @category properties
   */
  static getPropertyDescriptor(name, key, options) {
    const { get, set } = getOwnPropertyDescriptor(this.prototype, name) ?? {
      get() {
        return this[key];
      },
      set(v) {
        this[key] = v;
      }
    };
    if (DEV_MODE && get == null) {
      if ("value" in (getOwnPropertyDescriptor(this.prototype, name) ?? {})) {
        throw new Error(`Field ${JSON.stringify(String(name))} on ${this.name} was declared as a reactive property but it's actually declared as a value on the prototype. Usually this is due to using @property or @state on a method.`);
      }
      issueWarning("reactive-property-without-getter", `Field ${JSON.stringify(String(name))} on ${this.name} was declared as a reactive property but it does not have a getter. This will be an error in a future version of Lit.`);
    }
    return {
      get,
      set(value) {
        const oldValue = get?.call(this);
        set?.call(this, value);
        this.requestUpdate(name, oldValue, options);
      },
      configurable: true,
      enumerable: true
    };
  }
  /**
   * Returns the property options associated with the given property.
   * These options are defined with a `PropertyDeclaration` via the `properties`
   * object or the `@property` decorator and are registered in
   * `createProperty(...)`.
   *
   * Note, this method should be considered "final" and not overridden. To
   * customize the options for a given property, override
   * {@linkcode createProperty}.
   *
   * @nocollapse
   * @final
   * @category properties
   */
  static getPropertyOptions(name) {
    return this.elementProperties.get(name) ?? defaultPropertyDeclaration;
  }
  /**
   * Initializes static own properties of the class used in bookkeeping
   * for element properties, initializers, etc.
   *
   * Can be called multiple times by code that needs to ensure these
   * properties exist before using them.
   *
   * This method ensures the superclass is finalized so that inherited
   * property metadata can be copied down.
   * @nocollapse
   */
  static __prepare() {
    if (this.hasOwnProperty(JSCompiler_renameProperty("elementProperties", this))) {
      return;
    }
    const superCtor = getPrototypeOf(this);
    superCtor.finalize();
    if (superCtor._initializers !== void 0) {
      this._initializers = [...superCtor._initializers];
    }
    this.elementProperties = new Map(superCtor.elementProperties);
  }
  /**
   * Finishes setting up the class so that it's ready to be registered
   * as a custom element and instantiated.
   *
   * This method is called by the ReactiveElement.observedAttributes getter.
   * If you override the observedAttributes getter, you must either call
   * super.observedAttributes to trigger finalization, or call finalize()
   * yourself.
   *
   * @nocollapse
   */
  static finalize() {
    if (this.hasOwnProperty(JSCompiler_renameProperty("finalized", this))) {
      return;
    }
    this.finalized = true;
    this.__prepare();
    if (this.hasOwnProperty(JSCompiler_renameProperty("properties", this))) {
      const props = this.properties;
      const propKeys = [
        ...getOwnPropertyNames(props),
        ...getOwnPropertySymbols(props)
      ];
      for (const p of propKeys) {
        this.createProperty(p, props[p]);
      }
    }
    const metadata = this[Symbol.metadata];
    if (metadata !== null) {
      const properties = litPropertyMetadata.get(metadata);
      if (properties !== void 0) {
        for (const [p, options] of properties) {
          this.elementProperties.set(p, options);
        }
      }
    }
    this.__attributeToPropertyMap = /* @__PURE__ */ new Map();
    for (const [p, options] of this.elementProperties) {
      const attr = this.__attributeNameForProperty(p, options);
      if (attr !== void 0) {
        this.__attributeToPropertyMap.set(attr, p);
      }
    }
    this.elementStyles = this.finalizeStyles(this.styles);
    if (DEV_MODE) {
      if (this.hasOwnProperty("createProperty")) {
        issueWarning("no-override-create-property", "Overriding ReactiveElement.createProperty() is deprecated. The override will not be called with standard decorators");
      }
      if (this.hasOwnProperty("getPropertyDescriptor")) {
        issueWarning("no-override-get-property-descriptor", "Overriding ReactiveElement.getPropertyDescriptor() is deprecated. The override will not be called with standard decorators");
      }
    }
  }
  /**
   * Takes the styles the user supplied via the `static styles` property and
   * returns the array of styles to apply to the element.
   * Override this method to integrate into a style management system.
   *
   * Styles are deduplicated preserving the _last_ instance in the list. This
   * is a performance optimization to avoid duplicated styles that can occur
   * especially when composing via subclassing. The last item is kept to try
   * to preserve the cascade order with the assumption that it's most important
   * that last added styles override previous styles.
   *
   * @nocollapse
   * @category styles
   */
  static finalizeStyles(styles) {
    const elementStyles = [];
    if (Array.isArray(styles)) {
      const set = new Set(styles.flat(Infinity).reverse());
      for (const s of set) {
        elementStyles.unshift(getCompatibleStyle(s));
      }
    } else if (styles !== void 0) {
      elementStyles.push(getCompatibleStyle(styles));
    }
    return elementStyles;
  }
  /**
   * Returns the property name for the given attribute `name`.
   * @nocollapse
   */
  static __attributeNameForProperty(name, options) {
    const attribute = options.attribute;
    return attribute === false ? void 0 : typeof attribute === "string" ? attribute : typeof name === "string" ? name.toLowerCase() : void 0;
  }
  constructor() {
    super();
    this.__instanceProperties = void 0;
    this.isUpdatePending = false;
    this.hasUpdated = false;
    this.__reflectingProperty = null;
    this.__initialize();
  }
  /**
   * Internal only override point for customizing work done when elements
   * are constructed.
   */
  __initialize() {
    this.__updatePromise = new Promise((res) => this.enableUpdating = res);
    this._$changedProperties = /* @__PURE__ */ new Map();
    this.__saveInstanceProperties();
    this.requestUpdate();
    this.constructor._initializers?.forEach((i) => i(this));
  }
  /**
   * Registers a `ReactiveController` to participate in the element's reactive
   * update cycle. The element automatically calls into any registered
   * controllers during its lifecycle callbacks.
   *
   * If the element is connected when `addController()` is called, the
   * controller's `hostConnected()` callback will be immediately called.
   * @category controllers
   */
  addController(controller) {
    (this.__controllers ??= /* @__PURE__ */ new Set()).add(controller);
    if (this.renderRoot !== void 0 && this.isConnected) {
      controller.hostConnected?.();
    }
  }
  /**
   * Removes a `ReactiveController` from the element.
   * @category controllers
   */
  removeController(controller) {
    this.__controllers?.delete(controller);
  }
  /**
   * Fixes any properties set on the instance before upgrade time.
   * Otherwise these would shadow the accessor and break these properties.
   * The properties are stored in a Map which is played back after the
   * constructor runs.
   */
  __saveInstanceProperties() {
    const instanceProperties = /* @__PURE__ */ new Map();
    const elementProperties = this.constructor.elementProperties;
    for (const p of elementProperties.keys()) {
      if (this.hasOwnProperty(p)) {
        instanceProperties.set(p, this[p]);
        delete this[p];
      }
    }
    if (instanceProperties.size > 0) {
      this.__instanceProperties = instanceProperties;
    }
  }
  /**
   * Returns the node into which the element should render and by default
   * creates and returns an open shadowRoot. Implement to customize where the
   * element's DOM is rendered. For example, to render into the element's
   * childNodes, return `this`.
   *
   * @return Returns a node into which to render.
   * @category rendering
   */
  createRenderRoot() {
    const renderRoot = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    adoptStyles(renderRoot, this.constructor.elementStyles);
    return renderRoot;
  }
  /**
   * On first connection, creates the element's renderRoot, sets up
   * element styling, and enables updating.
   * @category lifecycle
   */
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot();
    this.enableUpdating(true);
    this.__controllers?.forEach((c) => c.hostConnected?.());
  }
  /**
   * Note, this method should be considered final and not overridden. It is
   * overridden on the element instance with a function that triggers the first
   * update.
   * @category updates
   */
  enableUpdating(_requestedUpdate) {
  }
  /**
   * Allows for `super.disconnectedCallback()` in extensions while
   * reserving the possibility of making non-breaking feature additions
   * when disconnecting at some point in the future.
   * @category lifecycle
   */
  disconnectedCallback() {
    this.__controllers?.forEach((c) => c.hostDisconnected?.());
  }
  /**
   * Synchronizes property values when attributes change.
   *
   * Specifically, when an attribute is set, the corresponding property is set.
   * You should rarely need to implement this callback. If this method is
   * overridden, `super.attributeChangedCallback(name, _old, value)` must be
   * called.
   *
   * See [responding to attribute changes](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements#responding_to_attribute_changes)
   * on MDN for more information about the `attributeChangedCallback`.
   * @category attributes
   */
  attributeChangedCallback(name, _old, value) {
    this._$attributeToProperty(name, value);
  }
  __propertyToAttribute(name, value) {
    const elemProperties = this.constructor.elementProperties;
    const options = elemProperties.get(name);
    const attr = this.constructor.__attributeNameForProperty(name, options);
    if (attr !== void 0 && options.reflect === true) {
      const converter = options.converter?.toAttribute !== void 0 ? options.converter : defaultConverter;
      const attrValue = converter.toAttribute(value, options.type);
      if (DEV_MODE && this.constructor.enabledWarnings.includes("migration") && attrValue === void 0) {
        issueWarning("undefined-attribute-value", `The attribute value for the ${name} property is undefined on element ${this.localName}. The attribute will be removed, but in the previous version of \`ReactiveElement\`, the attribute would not have changed.`);
      }
      this.__reflectingProperty = name;
      if (attrValue == null) {
        this.removeAttribute(attr);
      } else {
        this.setAttribute(attr, attrValue);
      }
      this.__reflectingProperty = null;
    }
  }
  /** @internal */
  _$attributeToProperty(name, value) {
    const ctor = this.constructor;
    const propName = ctor.__attributeToPropertyMap.get(name);
    if (propName !== void 0 && this.__reflectingProperty !== propName) {
      const options = ctor.getPropertyOptions(propName);
      const converter = typeof options.converter === "function" ? { fromAttribute: options.converter } : options.converter?.fromAttribute !== void 0 ? options.converter : defaultConverter;
      this.__reflectingProperty = propName;
      const convertedValue = converter.fromAttribute(value, options.type);
      this[propName] = convertedValue ?? this.__defaultValues?.get(propName) ?? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      convertedValue;
      this.__reflectingProperty = null;
    }
  }
  /**
   * Requests an update which is processed asynchronously. This should be called
   * when an element should update based on some state not triggered by setting
   * a reactive property. In this case, pass no arguments. It should also be
   * called when manually implementing a property setter. In this case, pass the
   * property `name` and `oldValue` to ensure that any configured property
   * options are honored.
   *
   * @param name name of requesting property
   * @param oldValue old value of requesting property
   * @param options property options to use instead of the previously
   *     configured options
   * @param useNewValue if true, the newValue argument is used instead of
   *     reading the property value. This is important to use if the reactive
   *     property is a standard private accessor, as opposed to a plain
   *     property, since private members can't be dynamically read by name.
   * @param newValue the new value of the property. This is only used if
   *     `useNewValue` is true.
   * @category updates
   */
  requestUpdate(name, oldValue, options, useNewValue = false, newValue) {
    if (name !== void 0) {
      if (DEV_MODE && name instanceof Event) {
        issueWarning(``, `The requestUpdate() method was called with an Event as the property name. This is probably a mistake caused by binding this.requestUpdate as an event listener. Instead bind a function that will call it with no arguments: () => this.requestUpdate()`);
      }
      const ctor = this.constructor;
      if (useNewValue === false) {
        newValue = this[name];
      }
      options ??= ctor.getPropertyOptions(name);
      const changed = (options.hasChanged ?? notEqual)(newValue, oldValue) || // When there is no change, check a corner case that can occur when
      // 1. there's a initial value which was not reflected
      // 2. the property is subsequently set to this value.
      // For example, `prop: {useDefault: true, reflect: true}`
      // and el.prop = 'foo'. This should be considered a change if the
      // attribute is not set because we will now reflect the property to the attribute.
      options.useDefault && options.reflect && newValue === this.__defaultValues?.get(name) && !this.hasAttribute(ctor.__attributeNameForProperty(name, options));
      if (changed) {
        this._$changeProperty(name, oldValue, options);
      } else {
        return;
      }
    }
    if (this.isUpdatePending === false) {
      this.__updatePromise = this.__enqueueUpdate();
    }
  }
  /**
   * @internal
   */
  _$changeProperty(name, oldValue, { useDefault, reflect, wrapped }, initializeValue) {
    if (useDefault && !(this.__defaultValues ??= /* @__PURE__ */ new Map()).has(name)) {
      this.__defaultValues.set(name, initializeValue ?? oldValue ?? this[name]);
      if (wrapped !== true || initializeValue !== void 0) {
        return;
      }
    }
    if (!this._$changedProperties.has(name)) {
      if (!this.hasUpdated && !useDefault) {
        oldValue = void 0;
      }
      this._$changedProperties.set(name, oldValue);
    }
    if (reflect === true && this.__reflectingProperty !== name) {
      (this.__reflectingProperties ??= /* @__PURE__ */ new Set()).add(name);
    }
  }
  /**
   * Sets up the element to asynchronously update.
   */
  async __enqueueUpdate() {
    this.isUpdatePending = true;
    try {
      await this.__updatePromise;
    } catch (e) {
      Promise.reject(e);
    }
    const result = this.scheduleUpdate();
    if (result != null) {
      await result;
    }
    return !this.isUpdatePending;
  }
  /**
   * Schedules an element update. You can override this method to change the
   * timing of updates by returning a Promise. The update will await the
   * returned Promise, and you should resolve the Promise to allow the update
   * to proceed. If this method is overridden, `super.scheduleUpdate()`
   * must be called.
   *
   * For instance, to schedule updates to occur just before the next frame:
   *
   * ```ts
   * override protected async scheduleUpdate(): Promise<unknown> {
   *   await new Promise((resolve) => requestAnimationFrame(() => resolve()));
   *   super.scheduleUpdate();
   * }
   * ```
   * @category updates
   */
  scheduleUpdate() {
    const result = this.performUpdate();
    if (DEV_MODE && this.constructor.enabledWarnings.includes("async-perform-update") && typeof result?.then === "function") {
      issueWarning("async-perform-update", `Element ${this.localName} returned a Promise from performUpdate(). This behavior is deprecated and will be removed in a future version of ReactiveElement.`);
    }
    return result;
  }
  /**
   * Performs an element update. Note, if an exception is thrown during the
   * update, `firstUpdated` and `updated` will not be called.
   *
   * Call `performUpdate()` to immediately process a pending update. This should
   * generally not be needed, but it can be done in rare cases when you need to
   * update synchronously.
   *
   * @category updates
   */
  performUpdate() {
    if (!this.isUpdatePending) {
      return;
    }
    debugLogEvent?.({ kind: "update" });
    if (!this.hasUpdated) {
      this.renderRoot ??= this.createRenderRoot();
      if (DEV_MODE) {
        const ctor = this.constructor;
        const shadowedProperties = [...ctor.elementProperties.keys()].filter((p) => this.hasOwnProperty(p) && p in getPrototypeOf(this));
        if (shadowedProperties.length) {
          throw new Error(`The following properties on element ${this.localName} will not trigger updates as expected because they are set using class fields: ${shadowedProperties.join(", ")}. Native class fields and some compiled output will overwrite accessors used for detecting changes. See https://lit.dev/msg/class-field-shadowing for more information.`);
        }
      }
      if (this.__instanceProperties) {
        for (const [p, value] of this.__instanceProperties) {
          this[p] = value;
        }
        this.__instanceProperties = void 0;
      }
      const elementProperties = this.constructor.elementProperties;
      if (elementProperties.size > 0) {
        for (const [p, options] of elementProperties) {
          const { wrapped } = options;
          const value = this[p];
          if (wrapped === true && !this._$changedProperties.has(p) && value !== void 0) {
            this._$changeProperty(p, void 0, options, value);
          }
        }
      }
    }
    let shouldUpdate = false;
    const changedProperties = this._$changedProperties;
    try {
      shouldUpdate = this.shouldUpdate(changedProperties);
      if (shouldUpdate) {
        this.willUpdate(changedProperties);
        this.__controllers?.forEach((c) => c.hostUpdate?.());
        this.update(changedProperties);
      } else {
        this.__markUpdated();
      }
    } catch (e) {
      shouldUpdate = false;
      this.__markUpdated();
      throw e;
    }
    if (shouldUpdate) {
      this._$didUpdate(changedProperties);
    }
  }
  /**
   * Invoked before `update()` to compute values needed during the update.
   *
   * Implement `willUpdate` to compute property values that depend on other
   * properties and are used in the rest of the update process.
   *
   * ```ts
   * willUpdate(changedProperties) {
   *   // only need to check changed properties for an expensive computation.
   *   if (changedProperties.has('firstName') || changedProperties.has('lastName')) {
   *     this.sha = computeSHA(`${this.firstName} ${this.lastName}`);
   *   }
   * }
   *
   * render() {
   *   return html`SHA: ${this.sha}`;
   * }
   * ```
   *
   * @category updates
   */
  willUpdate(_changedProperties) {
  }
  // Note, this is an override point for polyfill-support.
  // @internal
  _$didUpdate(changedProperties) {
    this.__controllers?.forEach((c) => c.hostUpdated?.());
    if (!this.hasUpdated) {
      this.hasUpdated = true;
      this.firstUpdated(changedProperties);
    }
    this.updated(changedProperties);
    if (DEV_MODE && this.isUpdatePending && this.constructor.enabledWarnings.includes("change-in-update")) {
      issueWarning("change-in-update", `Element ${this.localName} scheduled an update (generally because a property was set) after an update completed, causing a new update to be scheduled. This is inefficient and should be avoided unless the next update can only be scheduled as a side effect of the previous update.`);
    }
  }
  __markUpdated() {
    this._$changedProperties = /* @__PURE__ */ new Map();
    this.isUpdatePending = false;
  }
  /**
   * Returns a Promise that resolves when the element has completed updating.
   * The Promise value is a boolean that is `true` if the element completed the
   * update without triggering another update. The Promise result is `false` if
   * a property was set inside `updated()`. If the Promise is rejected, an
   * exception was thrown during the update.
   *
   * To await additional asynchronous work, override the `getUpdateComplete`
   * method. For example, it is sometimes useful to await a rendered element
   * before fulfilling this Promise. To do this, first await
   * `super.getUpdateComplete()`, then any subsequent state.
   *
   * @return A promise of a boolean that resolves to true if the update completed
   *     without triggering another update.
   * @category updates
   */
  get updateComplete() {
    return this.getUpdateComplete();
  }
  /**
   * Override point for the `updateComplete` promise.
   *
   * It is not safe to override the `updateComplete` getter directly due to a
   * limitation in TypeScript which means it is not possible to call a
   * superclass getter (e.g. `super.updateComplete.then(...)`) when the target
   * language is ES5 (https://github.com/microsoft/TypeScript/issues/338).
   * This method should be overridden instead. For example:
   *
   * ```ts
   * class MyElement extends LitElement {
   *   override async getUpdateComplete() {
   *     const result = await super.getUpdateComplete();
   *     await this._myChild.updateComplete;
   *     return result;
   *   }
   * }
   * ```
   *
   * @return A promise of a boolean that resolves to true if the update completed
   *     without triggering another update.
   * @category updates
   */
  getUpdateComplete() {
    return this.__updatePromise;
  }
  /**
   * Controls whether or not `update()` should be called when the element requests
   * an update. By default, this method always returns `true`, but this can be
   * customized to control when to update.
   *
   * @param _changedProperties Map of changed properties with old values
   * @category updates
   */
  shouldUpdate(_changedProperties) {
    return true;
  }
  /**
   * Updates the element. This method reflects property values to attributes.
   * It can be overridden to render and keep updated element DOM.
   * Setting properties inside this method will *not* trigger
   * another update.
   *
   * @param _changedProperties Map of changed properties with old values
   * @category updates
   */
  update(_changedProperties) {
    this.__reflectingProperties &&= this.__reflectingProperties.forEach((p) => this.__propertyToAttribute(p, this[p]));
    this.__markUpdated();
  }
  /**
   * Invoked whenever the element is updated. Implement to perform
   * post-updating tasks via DOM APIs, for example, focusing an element.
   *
   * Setting properties inside this method will trigger the element to update
   * again after this update cycle completes.
   *
   * @param _changedProperties Map of changed properties with old values
   * @category updates
   */
  updated(_changedProperties) {
  }
  /**
   * Invoked when the element is first updated. Implement to perform one time
   * work on the element after update.
   *
   * ```ts
   * firstUpdated() {
   *   this.renderRoot.getElementById('my-text-area').focus();
   * }
   * ```
   *
   * Setting properties inside this method will trigger the element to update
   * again after this update cycle completes.
   *
   * @param _changedProperties Map of changed properties with old values
   * @category updates
   */
  firstUpdated(_changedProperties) {
  }
};
ReactiveElement.elementStyles = [];
ReactiveElement.shadowRootOptions = { mode: "open" };
ReactiveElement[JSCompiler_renameProperty("elementProperties", ReactiveElement)] = /* @__PURE__ */ new Map();
ReactiveElement[JSCompiler_renameProperty("finalized", ReactiveElement)] = /* @__PURE__ */ new Map();
polyfillSupport?.({ ReactiveElement });
if (DEV_MODE) {
  ReactiveElement.enabledWarnings = [
    "change-in-update",
    "async-perform-update"
  ];
  const ensureOwnWarnings = function(ctor) {
    if (!ctor.hasOwnProperty(JSCompiler_renameProperty("enabledWarnings", ctor))) {
      ctor.enabledWarnings = ctor.enabledWarnings.slice();
    }
  };
  ReactiveElement.enableWarning = function(warning) {
    ensureOwnWarnings(this);
    if (!this.enabledWarnings.includes(warning)) {
      this.enabledWarnings.push(warning);
    }
  };
  ReactiveElement.disableWarning = function(warning) {
    ensureOwnWarnings(this);
    const i = this.enabledWarnings.indexOf(warning);
    if (i >= 0) {
      this.enabledWarnings.splice(i, 1);
    }
  };
}
(global2.reactiveElementVersions ??= []).push("2.1.2");
if (DEV_MODE && global2.reactiveElementVersions.length > 1) {
  queueMicrotask(() => {
    issueWarning("multiple-versions", `Multiple versions of Lit loaded. Loading multiple versions is not recommended.`);
  });
}

// node_modules/lit-html/development/lit-html.js
var DEV_MODE2 = true;
var ENABLE_EXTRA_SECURITY_HOOKS = true;
var ENABLE_SHADYDOM_NOPATCH = true;
var NODE_MODE3 = false;
var global3 = globalThis;
var debugLogEvent2 = DEV_MODE2 ? (event) => {
  const shouldEmit = global3.emitLitDebugLogEvents;
  if (!shouldEmit) {
    return;
  }
  global3.dispatchEvent(new CustomEvent("lit-debug", {
    detail: event
  }));
} : void 0;
var debugLogRenderId = 0;
var issueWarning2;
if (DEV_MODE2) {
  global3.litIssuedWarnings ??= /* @__PURE__ */ new Set();
  issueWarning2 = (code, warning) => {
    warning += code ? ` See https://lit.dev/msg/${code} for more information.` : "";
    if (!global3.litIssuedWarnings.has(warning) && !global3.litIssuedWarnings.has(code)) {
      console.warn(warning);
      global3.litIssuedWarnings.add(warning);
    }
  };
  queueMicrotask(() => {
    issueWarning2("dev-mode", `Lit is in dev mode. Not recommended for production!`);
  });
}
var wrap = ENABLE_SHADYDOM_NOPATCH && global3.ShadyDOM?.inUse && global3.ShadyDOM?.noPatch === true ? global3.ShadyDOM.wrap : (node) => node;
var trustedTypes2 = global3.trustedTypes;
var policy = trustedTypes2 ? trustedTypes2.createPolicy("lit-html", {
  createHTML: (s) => s
}) : void 0;
var identityFunction = (value) => value;
var noopSanitizer = (_node, _name, _type) => identityFunction;
var setSanitizer = (newSanitizer) => {
  if (!ENABLE_EXTRA_SECURITY_HOOKS) {
    return;
  }
  if (sanitizerFactoryInternal !== noopSanitizer) {
    throw new Error(`Attempted to overwrite existing lit-html security policy. setSanitizeDOMValueFactory should be called at most once.`);
  }
  sanitizerFactoryInternal = newSanitizer;
};
var _testOnlyClearSanitizerFactoryDoNotCallOrElse = () => {
  sanitizerFactoryInternal = noopSanitizer;
};
var createSanitizer = (node, name, type) => {
  return sanitizerFactoryInternal(node, name, type);
};
var boundAttributeSuffix = "$lit$";
var marker = `lit$${Math.random().toFixed(9).slice(2)}$`;
var markerMatch = "?" + marker;
var nodeMarker = `<${markerMatch}>`;
var d = NODE_MODE3 && global3.document === void 0 ? {
  createTreeWalker() {
    return {};
  }
} : document;
var createMarker = () => d.createComment("");
var isPrimitive = (value) => value === null || typeof value != "object" && typeof value != "function";
var isArray = Array.isArray;
var isIterable = (value) => isArray(value) || // eslint-disable-next-line @typescript-eslint/no-explicit-any
typeof value?.[Symbol.iterator] === "function";
var SPACE_CHAR = `[ 	
\f\r]`;
var ATTR_VALUE_CHAR = `[^ 	
\f\r"'\`<>=]`;
var NAME_CHAR = `[^\\s"'>=/]`;
var textEndRegex = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g;
var COMMENT_START = 1;
var TAG_NAME = 2;
var DYNAMIC_TAG_NAME = 3;
var commentEndRegex = /-->/g;
var comment2EndRegex = />/g;
var tagEndRegex = new RegExp(`>|${SPACE_CHAR}(?:(${NAME_CHAR}+)(${SPACE_CHAR}*=${SPACE_CHAR}*(?:${ATTR_VALUE_CHAR}|("|')|))|$)`, "g");
var ENTIRE_MATCH = 0;
var ATTRIBUTE_NAME = 1;
var SPACES_AND_EQUALS = 2;
var QUOTE_CHAR = 3;
var singleQuoteAttrEndRegex = /'/g;
var doubleQuoteAttrEndRegex = /"/g;
var rawTextElement = /^(?:script|style|textarea|title)$/i;
var HTML_RESULT = 1;
var SVG_RESULT = 2;
var MATHML_RESULT = 3;
var ATTRIBUTE_PART = 1;
var CHILD_PART = 2;
var PROPERTY_PART = 3;
var BOOLEAN_ATTRIBUTE_PART = 4;
var EVENT_PART = 5;
var ELEMENT_PART = 6;
var COMMENT_PART = 7;
var tag = (type) => (strings, ...values) => {
  if (DEV_MODE2 && strings.some((s) => s === void 0)) {
    console.warn("Some template strings are undefined.\nThis is probably caused by illegal octal escape sequences.");
  }
  if (DEV_MODE2) {
    if (values.some((val) => val?.["_$litStatic$"])) {
      issueWarning2("", `Static values 'literal' or 'unsafeStatic' cannot be used as values to non-static templates.
Please use the static 'html' tag function. See https://lit.dev/docs/templates/expressions/#static-expressions`);
    }
  }
  return {
    // This property needs to remain unminified.
    ["_$litType$"]: type,
    strings,
    values
  };
};
var html = tag(HTML_RESULT);
var svg = tag(SVG_RESULT);
var mathml = tag(MATHML_RESULT);
var noChange = /* @__PURE__ */ Symbol.for("lit-noChange");
var nothing = /* @__PURE__ */ Symbol.for("lit-nothing");
var templateCache = /* @__PURE__ */ new WeakMap();
var walker = d.createTreeWalker(
  d,
  129
  /* NodeFilter.SHOW_{ELEMENT|COMMENT} */
);
var sanitizerFactoryInternal = noopSanitizer;
function trustFromTemplateString(tsa, stringFromTSA) {
  if (!isArray(tsa) || !tsa.hasOwnProperty("raw")) {
    let message = "invalid template strings array";
    if (DEV_MODE2) {
      message = `
          Internal Error: expected template strings to be an array
          with a 'raw' field. Faking a template strings array by
          calling html or svg like an ordinary function is effectively
          the same as calling unsafeHtml and can lead to major security
          issues, e.g. opening your code up to XSS attacks.
          If you're using the html or svg tagged template functions normally
          and still seeing this error, please file a bug at
          https://github.com/lit/lit/issues/new?template=bug_report.md
          and include information about your build tooling, if any.
        `.trim().replace(/\n */g, "\n");
    }
    throw new Error(message);
  }
  return policy !== void 0 ? policy.createHTML(stringFromTSA) : stringFromTSA;
}
var getTemplateHtml = (strings, type) => {
  const l = strings.length - 1;
  const attrNames = [];
  let html2 = type === SVG_RESULT ? "<svg>" : type === MATHML_RESULT ? "<math>" : "";
  let rawTextEndRegex;
  let regex = textEndRegex;
  for (let i = 0; i < l; i++) {
    const s = strings[i];
    let attrNameEndIndex = -1;
    let attrName;
    let lastIndex = 0;
    let match;
    while (lastIndex < s.length) {
      regex.lastIndex = lastIndex;
      match = regex.exec(s);
      if (match === null) {
        break;
      }
      lastIndex = regex.lastIndex;
      if (regex === textEndRegex) {
        if (match[COMMENT_START] === "!--") {
          regex = commentEndRegex;
        } else if (match[COMMENT_START] !== void 0) {
          regex = comment2EndRegex;
        } else if (match[TAG_NAME] !== void 0) {
          if (rawTextElement.test(match[TAG_NAME])) {
            rawTextEndRegex = new RegExp(`</${match[TAG_NAME]}`, "g");
          }
          regex = tagEndRegex;
        } else if (match[DYNAMIC_TAG_NAME] !== void 0) {
          if (DEV_MODE2) {
            throw new Error("Bindings in tag names are not supported. Please use static templates instead. See https://lit.dev/docs/templates/expressions/#static-expressions");
          }
          regex = tagEndRegex;
        }
      } else if (regex === tagEndRegex) {
        if (match[ENTIRE_MATCH] === ">") {
          regex = rawTextEndRegex ?? textEndRegex;
          attrNameEndIndex = -1;
        } else if (match[ATTRIBUTE_NAME] === void 0) {
          attrNameEndIndex = -2;
        } else {
          attrNameEndIndex = regex.lastIndex - match[SPACES_AND_EQUALS].length;
          attrName = match[ATTRIBUTE_NAME];
          regex = match[QUOTE_CHAR] === void 0 ? tagEndRegex : match[QUOTE_CHAR] === '"' ? doubleQuoteAttrEndRegex : singleQuoteAttrEndRegex;
        }
      } else if (regex === doubleQuoteAttrEndRegex || regex === singleQuoteAttrEndRegex) {
        regex = tagEndRegex;
      } else if (regex === commentEndRegex || regex === comment2EndRegex) {
        regex = textEndRegex;
      } else {
        regex = tagEndRegex;
        rawTextEndRegex = void 0;
      }
    }
    if (DEV_MODE2) {
      console.assert(attrNameEndIndex === -1 || regex === tagEndRegex || regex === singleQuoteAttrEndRegex || regex === doubleQuoteAttrEndRegex, "unexpected parse state B");
    }
    const end = regex === tagEndRegex && strings[i + 1].startsWith("/>") ? " " : "";
    html2 += regex === textEndRegex ? s + nodeMarker : attrNameEndIndex >= 0 ? (attrNames.push(attrName), s.slice(0, attrNameEndIndex) + boundAttributeSuffix + s.slice(attrNameEndIndex)) + marker + end : s + marker + (attrNameEndIndex === -2 ? i : end);
  }
  const htmlResult = html2 + (strings[l] || "<?>") + (type === SVG_RESULT ? "</svg>" : type === MATHML_RESULT ? "</math>" : "");
  return [trustFromTemplateString(strings, htmlResult), attrNames];
};
var Template = class _Template {
  constructor({ strings, ["_$litType$"]: type }, options) {
    this.parts = [];
    let node;
    let nodeIndex = 0;
    let attrNameIndex = 0;
    const partCount = strings.length - 1;
    const parts = this.parts;
    const [html2, attrNames] = getTemplateHtml(strings, type);
    this.el = _Template.createElement(html2, options);
    walker.currentNode = this.el.content;
    if (type === SVG_RESULT || type === MATHML_RESULT) {
      const wrapper = this.el.content.firstChild;
      wrapper.replaceWith(...wrapper.childNodes);
    }
    while ((node = walker.nextNode()) !== null && parts.length < partCount) {
      if (node.nodeType === 1) {
        if (DEV_MODE2) {
          const tag2 = node.localName;
          if (/^(?:textarea|template)$/i.test(tag2) && node.innerHTML.includes(marker)) {
            const m = `Expressions are not supported inside \`${tag2}\` elements. See https://lit.dev/msg/expression-in-${tag2} for more information.`;
            if (tag2 === "template") {
              throw new Error(m);
            } else
              issueWarning2("", m);
          }
        }
        if (node.hasAttributes()) {
          for (const name of node.getAttributeNames()) {
            if (name.endsWith(boundAttributeSuffix)) {
              const realName = attrNames[attrNameIndex++];
              const value = node.getAttribute(name);
              const statics = value.split(marker);
              const m = /([.?@])?(.*)/.exec(realName);
              parts.push({
                type: ATTRIBUTE_PART,
                index: nodeIndex,
                name: m[2],
                strings: statics,
                ctor: m[1] === "." ? PropertyPart : m[1] === "?" ? BooleanAttributePart : m[1] === "@" ? EventPart : AttributePart
              });
              node.removeAttribute(name);
            } else if (name.startsWith(marker)) {
              parts.push({
                type: ELEMENT_PART,
                index: nodeIndex
              });
              node.removeAttribute(name);
            }
          }
        }
        if (rawTextElement.test(node.tagName)) {
          const strings2 = node.textContent.split(marker);
          const lastIndex = strings2.length - 1;
          if (lastIndex > 0) {
            node.textContent = trustedTypes2 ? trustedTypes2.emptyScript : "";
            for (let i = 0; i < lastIndex; i++) {
              node.append(strings2[i], createMarker());
              walker.nextNode();
              parts.push({ type: CHILD_PART, index: ++nodeIndex });
            }
            node.append(strings2[lastIndex], createMarker());
          }
        }
      } else if (node.nodeType === 8) {
        const data = node.data;
        if (data === markerMatch) {
          parts.push({ type: CHILD_PART, index: nodeIndex });
        } else {
          let i = -1;
          while ((i = node.data.indexOf(marker, i + 1)) !== -1) {
            parts.push({ type: COMMENT_PART, index: nodeIndex });
            i += marker.length - 1;
          }
        }
      }
      nodeIndex++;
    }
    if (DEV_MODE2) {
      if (attrNames.length !== attrNameIndex) {
        throw new Error(`Detected duplicate attribute bindings. This occurs if your template has duplicate attributes on an element tag. For example "<input ?disabled=\${true} ?disabled=\${false}>" contains a duplicate "disabled" attribute. The error was detected in the following template: 
\`` + strings.join("${...}") + "`");
      }
    }
    debugLogEvent2 && debugLogEvent2({
      kind: "template prep",
      template: this,
      clonableTemplate: this.el,
      parts: this.parts,
      strings
    });
  }
  // Overridden via `litHtmlPolyfillSupport` to provide platform support.
  /** @nocollapse */
  static createElement(html2, _options) {
    const el = d.createElement("template");
    el.innerHTML = html2;
    return el;
  }
};
function resolveDirective(part, value, parent = part, attributeIndex) {
  if (value === noChange) {
    return value;
  }
  let currentDirective = attributeIndex !== void 0 ? parent.__directives?.[attributeIndex] : parent.__directive;
  const nextDirectiveConstructor = isPrimitive(value) ? void 0 : (
    // This property needs to remain unminified.
    value["_$litDirective$"]
  );
  if (currentDirective?.constructor !== nextDirectiveConstructor) {
    currentDirective?.["_$notifyDirectiveConnectionChanged"]?.(false);
    if (nextDirectiveConstructor === void 0) {
      currentDirective = void 0;
    } else {
      currentDirective = new nextDirectiveConstructor(part);
      currentDirective._$initialize(part, parent, attributeIndex);
    }
    if (attributeIndex !== void 0) {
      (parent.__directives ??= [])[attributeIndex] = currentDirective;
    } else {
      parent.__directive = currentDirective;
    }
  }
  if (currentDirective !== void 0) {
    value = resolveDirective(part, currentDirective._$resolve(part, value.values), currentDirective, attributeIndex);
  }
  return value;
}
var TemplateInstance = class {
  constructor(template, parent) {
    this._$parts = [];
    this._$disconnectableChildren = void 0;
    this._$template = template;
    this._$parent = parent;
  }
  // Called by ChildPart parentNode getter
  get parentNode() {
    return this._$parent.parentNode;
  }
  // See comment in Disconnectable interface for why this is a getter
  get _$isConnected() {
    return this._$parent._$isConnected;
  }
  // This method is separate from the constructor because we need to return a
  // DocumentFragment and we don't want to hold onto it with an instance field.
  _clone(options) {
    const { el: { content }, parts } = this._$template;
    const fragment = (options?.creationScope ?? d).importNode(content, true);
    walker.currentNode = fragment;
    let node = walker.nextNode();
    let nodeIndex = 0;
    let partIndex = 0;
    let templatePart = parts[0];
    while (templatePart !== void 0) {
      if (nodeIndex === templatePart.index) {
        let part;
        if (templatePart.type === CHILD_PART) {
          part = new ChildPart(node, node.nextSibling, this, options);
        } else if (templatePart.type === ATTRIBUTE_PART) {
          part = new templatePart.ctor(node, templatePart.name, templatePart.strings, this, options);
        } else if (templatePart.type === ELEMENT_PART) {
          part = new ElementPart(node, this, options);
        }
        this._$parts.push(part);
        templatePart = parts[++partIndex];
      }
      if (nodeIndex !== templatePart?.index) {
        node = walker.nextNode();
        nodeIndex++;
      }
    }
    walker.currentNode = d;
    return fragment;
  }
  _update(values) {
    let i = 0;
    for (const part of this._$parts) {
      if (part !== void 0) {
        debugLogEvent2 && debugLogEvent2({
          kind: "set part",
          part,
          value: values[i],
          valueIndex: i,
          values,
          templateInstance: this
        });
        if (part.strings !== void 0) {
          part._$setValue(values, part, i);
          i += part.strings.length - 2;
        } else {
          part._$setValue(values[i]);
        }
      }
      i++;
    }
  }
};
var ChildPart = class _ChildPart {
  // See comment in Disconnectable interface for why this is a getter
  get _$isConnected() {
    return this._$parent?._$isConnected ?? this.__isConnected;
  }
  constructor(startNode, endNode, parent, options) {
    this.type = CHILD_PART;
    this._$committedValue = nothing;
    this._$disconnectableChildren = void 0;
    this._$startNode = startNode;
    this._$endNode = endNode;
    this._$parent = parent;
    this.options = options;
    this.__isConnected = options?.isConnected ?? true;
    if (ENABLE_EXTRA_SECURITY_HOOKS) {
      this._textSanitizer = void 0;
    }
  }
  /**
   * The parent node into which the part renders its content.
   *
   * A ChildPart's content consists of a range of adjacent child nodes of
   * `.parentNode`, possibly bordered by 'marker nodes' (`.startNode` and
   * `.endNode`).
   *
   * - If both `.startNode` and `.endNode` are non-null, then the part's content
   * consists of all siblings between `.startNode` and `.endNode`, exclusively.
   *
   * - If `.startNode` is non-null but `.endNode` is null, then the part's
   * content consists of all siblings following `.startNode`, up to and
   * including the last child of `.parentNode`. If `.endNode` is non-null, then
   * `.startNode` will always be non-null.
   *
   * - If both `.endNode` and `.startNode` are null, then the part's content
   * consists of all child nodes of `.parentNode`.
   */
  get parentNode() {
    let parentNode = wrap(this._$startNode).parentNode;
    const parent = this._$parent;
    if (parent !== void 0 && parentNode?.nodeType === 11) {
      parentNode = parent.parentNode;
    }
    return parentNode;
  }
  /**
   * The part's leading marker node, if any. See `.parentNode` for more
   * information.
   */
  get startNode() {
    return this._$startNode;
  }
  /**
   * The part's trailing marker node, if any. See `.parentNode` for more
   * information.
   */
  get endNode() {
    return this._$endNode;
  }
  _$setValue(value, directiveParent = this) {
    if (DEV_MODE2 && this.parentNode === null) {
      throw new Error(`This \`ChildPart\` has no \`parentNode\` and therefore cannot accept a value. This likely means the element containing the part was manipulated in an unsupported way outside of Lit's control such that the part's marker nodes were ejected from DOM. For example, setting the element's \`innerHTML\` or \`textContent\` can do this.`);
    }
    value = resolveDirective(this, value, directiveParent);
    if (isPrimitive(value)) {
      if (value === nothing || value == null || value === "") {
        if (this._$committedValue !== nothing) {
          debugLogEvent2 && debugLogEvent2({
            kind: "commit nothing to child",
            start: this._$startNode,
            end: this._$endNode,
            parent: this._$parent,
            options: this.options
          });
          this._$clear();
        }
        this._$committedValue = nothing;
      } else if (value !== this._$committedValue && value !== noChange) {
        this._commitText(value);
      }
    } else if (value["_$litType$"] !== void 0) {
      this._commitTemplateResult(value);
    } else if (value.nodeType !== void 0) {
      if (DEV_MODE2 && this.options?.host === value) {
        this._commitText(`[probable mistake: rendered a template's host in itself (commonly caused by writing \${this} in a template]`);
        console.warn(`Attempted to render the template host`, value, `inside itself. This is almost always a mistake, and in dev mode `, `we render some warning text. In production however, we'll `, `render it, which will usually result in an error, and sometimes `, `in the element disappearing from the DOM.`);
        return;
      }
      this._commitNode(value);
    } else if (isIterable(value)) {
      this._commitIterable(value);
    } else {
      this._commitText(value);
    }
  }
  _insert(node) {
    return wrap(wrap(this._$startNode).parentNode).insertBefore(node, this._$endNode);
  }
  _commitNode(value) {
    if (this._$committedValue !== value) {
      this._$clear();
      if (ENABLE_EXTRA_SECURITY_HOOKS && sanitizerFactoryInternal !== noopSanitizer) {
        const parentNodeName = this._$startNode.parentNode?.nodeName;
        if (parentNodeName === "STYLE" || parentNodeName === "SCRIPT") {
          let message = "Forbidden";
          if (DEV_MODE2) {
            if (parentNodeName === "STYLE") {
              message = `Lit does not support binding inside style nodes. This is a security risk, as style injection attacks can exfiltrate data and spoof UIs. Consider instead using css\`...\` literals to compose styles, and do dynamic styling with css custom properties, ::parts, <slot>s, and by mutating the DOM rather than stylesheets.`;
            } else {
              message = `Lit does not support binding inside script nodes. This is a security risk, as it could allow arbitrary code execution.`;
            }
          }
          throw new Error(message);
        }
      }
      debugLogEvent2 && debugLogEvent2({
        kind: "commit node",
        start: this._$startNode,
        parent: this._$parent,
        value,
        options: this.options
      });
      this._$committedValue = this._insert(value);
    }
  }
  _commitText(value) {
    if (this._$committedValue !== nothing && isPrimitive(this._$committedValue)) {
      const node = wrap(this._$startNode).nextSibling;
      if (ENABLE_EXTRA_SECURITY_HOOKS) {
        if (this._textSanitizer === void 0) {
          this._textSanitizer = createSanitizer(node, "data", "property");
        }
        value = this._textSanitizer(value);
      }
      debugLogEvent2 && debugLogEvent2({
        kind: "commit text",
        node,
        value,
        options: this.options
      });
      node.data = value;
    } else {
      if (ENABLE_EXTRA_SECURITY_HOOKS) {
        const textNode = d.createTextNode("");
        this._commitNode(textNode);
        if (this._textSanitizer === void 0) {
          this._textSanitizer = createSanitizer(textNode, "data", "property");
        }
        value = this._textSanitizer(value);
        debugLogEvent2 && debugLogEvent2({
          kind: "commit text",
          node: textNode,
          value,
          options: this.options
        });
        textNode.data = value;
      } else {
        this._commitNode(d.createTextNode(value));
        debugLogEvent2 && debugLogEvent2({
          kind: "commit text",
          node: wrap(this._$startNode).nextSibling,
          value,
          options: this.options
        });
      }
    }
    this._$committedValue = value;
  }
  _commitTemplateResult(result) {
    const { values, ["_$litType$"]: type } = result;
    const template = typeof type === "number" ? this._$getTemplate(result) : (type.el === void 0 && (type.el = Template.createElement(trustFromTemplateString(type.h, type.h[0]), this.options)), type);
    if (this._$committedValue?._$template === template) {
      debugLogEvent2 && debugLogEvent2({
        kind: "template updating",
        template,
        instance: this._$committedValue,
        parts: this._$committedValue._$parts,
        options: this.options,
        values
      });
      this._$committedValue._update(values);
    } else {
      const instance = new TemplateInstance(template, this);
      const fragment = instance._clone(this.options);
      debugLogEvent2 && debugLogEvent2({
        kind: "template instantiated",
        template,
        instance,
        parts: instance._$parts,
        options: this.options,
        fragment,
        values
      });
      instance._update(values);
      debugLogEvent2 && debugLogEvent2({
        kind: "template instantiated and updated",
        template,
        instance,
        parts: instance._$parts,
        options: this.options,
        fragment,
        values
      });
      this._commitNode(fragment);
      this._$committedValue = instance;
    }
  }
  // Overridden via `litHtmlPolyfillSupport` to provide platform support.
  /** @internal */
  _$getTemplate(result) {
    let template = templateCache.get(result.strings);
    if (template === void 0) {
      templateCache.set(result.strings, template = new Template(result));
    }
    return template;
  }
  _commitIterable(value) {
    if (!isArray(this._$committedValue)) {
      this._$committedValue = [];
      this._$clear();
    }
    const itemParts = this._$committedValue;
    let partIndex = 0;
    let itemPart;
    for (const item of value) {
      if (partIndex === itemParts.length) {
        itemParts.push(itemPart = new _ChildPart(this._insert(createMarker()), this._insert(createMarker()), this, this.options));
      } else {
        itemPart = itemParts[partIndex];
      }
      itemPart._$setValue(item);
      partIndex++;
    }
    if (partIndex < itemParts.length) {
      this._$clear(itemPart && wrap(itemPart._$endNode).nextSibling, partIndex);
      itemParts.length = partIndex;
    }
  }
  /**
   * Removes the nodes contained within this Part from the DOM.
   *
   * @param start Start node to clear from, for clearing a subset of the part's
   *     DOM (used when truncating iterables)
   * @param from  When `start` is specified, the index within the iterable from
   *     which ChildParts are being removed, used for disconnecting directives
   *     in those Parts.
   *
   * @internal
   */
  _$clear(start = wrap(this._$startNode).nextSibling, from) {
    this._$notifyConnectionChanged?.(false, true, from);
    while (start !== this._$endNode) {
      const n = wrap(start).nextSibling;
      wrap(start).remove();
      start = n;
    }
  }
  /**
   * Implementation of RootPart's `isConnected`. Note that this method
   * should only be called on `RootPart`s (the `ChildPart` returned from a
   * top-level `render()` call). It has no effect on non-root ChildParts.
   * @param isConnected Whether to set
   * @internal
   */
  setConnected(isConnected) {
    if (this._$parent === void 0) {
      this.__isConnected = isConnected;
      this._$notifyConnectionChanged?.(isConnected);
    } else if (DEV_MODE2) {
      throw new Error("part.setConnected() may only be called on a RootPart returned from render().");
    }
  }
};
var AttributePart = class {
  get tagName() {
    return this.element.tagName;
  }
  // See comment in Disconnectable interface for why this is a getter
  get _$isConnected() {
    return this._$parent._$isConnected;
  }
  constructor(element, name, strings, parent, options) {
    this.type = ATTRIBUTE_PART;
    this._$committedValue = nothing;
    this._$disconnectableChildren = void 0;
    this.element = element;
    this.name = name;
    this._$parent = parent;
    this.options = options;
    if (strings.length > 2 || strings[0] !== "" || strings[1] !== "") {
      this._$committedValue = new Array(strings.length - 1).fill(new String());
      this.strings = strings;
    } else {
      this._$committedValue = nothing;
    }
    if (ENABLE_EXTRA_SECURITY_HOOKS) {
      this._sanitizer = void 0;
    }
  }
  /**
   * Sets the value of this part by resolving the value from possibly multiple
   * values and static strings and committing it to the DOM.
   * If this part is single-valued, `this._strings` will be undefined, and the
   * method will be called with a single value argument. If this part is
   * multi-value, `this._strings` will be defined, and the method is called
   * with the value array of the part's owning TemplateInstance, and an offset
   * into the value array from which the values should be read.
   * This method is overloaded this way to eliminate short-lived array slices
   * of the template instance values, and allow a fast-path for single-valued
   * parts.
   *
   * @param value The part value, or an array of values for multi-valued parts
   * @param valueIndex the index to start reading values from. `undefined` for
   *   single-valued parts
   * @param noCommit causes the part to not commit its value to the DOM. Used
   *   in hydration to prime attribute parts with their first-rendered value,
   *   but not set the attribute, and in SSR to no-op the DOM operation and
   *   capture the value for serialization.
   *
   * @internal
   */
  _$setValue(value, directiveParent = this, valueIndex, noCommit) {
    const strings = this.strings;
    let change = false;
    if (strings === void 0) {
      value = resolveDirective(this, value, directiveParent, 0);
      change = !isPrimitive(value) || value !== this._$committedValue && value !== noChange;
      if (change) {
        this._$committedValue = value;
      }
    } else {
      const values = value;
      value = strings[0];
      let i, v;
      for (i = 0; i < strings.length - 1; i++) {
        v = resolveDirective(this, values[valueIndex + i], directiveParent, i);
        if (v === noChange) {
          v = this._$committedValue[i];
        }
        change ||= !isPrimitive(v) || v !== this._$committedValue[i];
        if (v === nothing) {
          value = nothing;
        } else if (value !== nothing) {
          value += (v ?? "") + strings[i + 1];
        }
        this._$committedValue[i] = v;
      }
    }
    if (change && !noCommit) {
      this._commitValue(value);
    }
  }
  /** @internal */
  _commitValue(value) {
    if (value === nothing) {
      wrap(this.element).removeAttribute(this.name);
    } else {
      if (ENABLE_EXTRA_SECURITY_HOOKS) {
        if (this._sanitizer === void 0) {
          this._sanitizer = sanitizerFactoryInternal(this.element, this.name, "attribute");
        }
        value = this._sanitizer(value ?? "");
      }
      debugLogEvent2 && debugLogEvent2({
        kind: "commit attribute",
        element: this.element,
        name: this.name,
        value,
        options: this.options
      });
      wrap(this.element).setAttribute(this.name, value ?? "");
    }
  }
};
var PropertyPart = class extends AttributePart {
  constructor() {
    super(...arguments);
    this.type = PROPERTY_PART;
  }
  /** @internal */
  _commitValue(value) {
    if (ENABLE_EXTRA_SECURITY_HOOKS) {
      if (this._sanitizer === void 0) {
        this._sanitizer = sanitizerFactoryInternal(this.element, this.name, "property");
      }
      value = this._sanitizer(value);
    }
    debugLogEvent2 && debugLogEvent2({
      kind: "commit property",
      element: this.element,
      name: this.name,
      value,
      options: this.options
    });
    this.element[this.name] = value === nothing ? void 0 : value;
  }
};
var BooleanAttributePart = class extends AttributePart {
  constructor() {
    super(...arguments);
    this.type = BOOLEAN_ATTRIBUTE_PART;
  }
  /** @internal */
  _commitValue(value) {
    debugLogEvent2 && debugLogEvent2({
      kind: "commit boolean attribute",
      element: this.element,
      name: this.name,
      value: !!(value && value !== nothing),
      options: this.options
    });
    wrap(this.element).toggleAttribute(this.name, !!value && value !== nothing);
  }
};
var EventPart = class extends AttributePart {
  constructor(element, name, strings, parent, options) {
    super(element, name, strings, parent, options);
    this.type = EVENT_PART;
    if (DEV_MODE2 && this.strings !== void 0) {
      throw new Error(`A \`<${element.localName}>\` has a \`@${name}=...\` listener with invalid content. Event listeners in templates must have exactly one expression and no surrounding text.`);
    }
  }
  // EventPart does not use the base _$setValue/_resolveValue implementation
  // since the dirty checking is more complex
  /** @internal */
  _$setValue(newListener, directiveParent = this) {
    newListener = resolveDirective(this, newListener, directiveParent, 0) ?? nothing;
    if (newListener === noChange) {
      return;
    }
    const oldListener = this._$committedValue;
    const shouldRemoveListener = newListener === nothing && oldListener !== nothing || newListener.capture !== oldListener.capture || newListener.once !== oldListener.once || newListener.passive !== oldListener.passive;
    const shouldAddListener = newListener !== nothing && (oldListener === nothing || shouldRemoveListener);
    debugLogEvent2 && debugLogEvent2({
      kind: "commit event listener",
      element: this.element,
      name: this.name,
      value: newListener,
      options: this.options,
      removeListener: shouldRemoveListener,
      addListener: shouldAddListener,
      oldListener
    });
    if (shouldRemoveListener) {
      this.element.removeEventListener(this.name, this, oldListener);
    }
    if (shouldAddListener) {
      this.element.addEventListener(this.name, this, newListener);
    }
    this._$committedValue = newListener;
  }
  handleEvent(event) {
    if (typeof this._$committedValue === "function") {
      this._$committedValue.call(this.options?.host ?? this.element, event);
    } else {
      this._$committedValue.handleEvent(event);
    }
  }
};
var ElementPart = class {
  constructor(element, parent, options) {
    this.element = element;
    this.type = ELEMENT_PART;
    this._$disconnectableChildren = void 0;
    this._$parent = parent;
    this.options = options;
  }
  // See comment in Disconnectable interface for why this is a getter
  get _$isConnected() {
    return this._$parent._$isConnected;
  }
  _$setValue(value) {
    debugLogEvent2 && debugLogEvent2({
      kind: "commit to element binding",
      element: this.element,
      value,
      options: this.options
    });
    resolveDirective(this, value);
  }
};
var polyfillSupport2 = DEV_MODE2 ? global3.litHtmlPolyfillSupportDevMode : global3.litHtmlPolyfillSupport;
polyfillSupport2?.(Template, ChildPart);
(global3.litHtmlVersions ??= []).push("3.3.2");
if (DEV_MODE2 && global3.litHtmlVersions.length > 1) {
  queueMicrotask(() => {
    issueWarning2("multiple-versions", `Multiple versions of Lit loaded. Loading multiple versions is not recommended.`);
  });
}
var render = (value, container, options) => {
  if (DEV_MODE2 && container == null) {
    throw new TypeError(`The container to render into may not be ${container}`);
  }
  const renderId = DEV_MODE2 ? debugLogRenderId++ : 0;
  const partOwnerNode = options?.renderBefore ?? container;
  let part = partOwnerNode["_$litPart$"];
  debugLogEvent2 && debugLogEvent2({
    kind: "begin render",
    id: renderId,
    value,
    container,
    options,
    part
  });
  if (part === void 0) {
    const endNode = options?.renderBefore ?? null;
    partOwnerNode["_$litPart$"] = part = new ChildPart(container.insertBefore(createMarker(), endNode), endNode, void 0, options ?? {});
  }
  part._$setValue(value);
  debugLogEvent2 && debugLogEvent2({
    kind: "end render",
    id: renderId,
    value,
    container,
    options,
    part
  });
  return part;
};
if (ENABLE_EXTRA_SECURITY_HOOKS) {
  render.setSanitizer = setSanitizer;
  render.createSanitizer = createSanitizer;
  if (DEV_MODE2) {
    render._testOnlyClearSanitizerFactoryDoNotCallOrElse = _testOnlyClearSanitizerFactoryDoNotCallOrElse;
  }
}

// node_modules/lit-element/development/lit-element.js
var JSCompiler_renameProperty2 = (prop, _obj) => prop;
var DEV_MODE3 = true;
var global4 = globalThis;
var issueWarning3;
if (DEV_MODE3) {
  global4.litIssuedWarnings ??= /* @__PURE__ */ new Set();
  issueWarning3 = (code, warning) => {
    warning += ` See https://lit.dev/msg/${code} for more information.`;
    if (!global4.litIssuedWarnings.has(warning) && !global4.litIssuedWarnings.has(code)) {
      console.warn(warning);
      global4.litIssuedWarnings.add(warning);
    }
  };
}
var LitElement = class extends ReactiveElement {
  constructor() {
    super(...arguments);
    this.renderOptions = { host: this };
    this.__childPart = void 0;
  }
  /**
   * @category rendering
   */
  createRenderRoot() {
    const renderRoot = super.createRenderRoot();
    this.renderOptions.renderBefore ??= renderRoot.firstChild;
    return renderRoot;
  }
  /**
   * Updates the element. This method reflects property values to attributes
   * and calls `render` to render DOM via lit-html. Setting properties inside
   * this method will *not* trigger another update.
   * @param changedProperties Map of changed properties with old values
   * @category updates
   */
  update(changedProperties) {
    const value = this.render();
    if (!this.hasUpdated) {
      this.renderOptions.isConnected = this.isConnected;
    }
    super.update(changedProperties);
    this.__childPart = render(value, this.renderRoot, this.renderOptions);
  }
  /**
   * Invoked when the component is added to the document's DOM.
   *
   * In `connectedCallback()` you should setup tasks that should only occur when
   * the element is connected to the document. The most common of these is
   * adding event listeners to nodes external to the element, like a keydown
   * event handler added to the window.
   *
   * ```ts
   * connectedCallback() {
   *   super.connectedCallback();
   *   addEventListener('keydown', this._handleKeydown);
   * }
   * ```
   *
   * Typically, anything done in `connectedCallback()` should be undone when the
   * element is disconnected, in `disconnectedCallback()`.
   *
   * @category lifecycle
   */
  connectedCallback() {
    super.connectedCallback();
    this.__childPart?.setConnected(true);
  }
  /**
   * Invoked when the component is removed from the document's DOM.
   *
   * This callback is the main signal to the element that it may no longer be
   * used. `disconnectedCallback()` should ensure that nothing is holding a
   * reference to the element (such as event listeners added to nodes external
   * to the element), so that it is free to be garbage collected.
   *
   * ```ts
   * disconnectedCallback() {
   *   super.disconnectedCallback();
   *   window.removeEventListener('keydown', this._handleKeydown);
   * }
   * ```
   *
   * An element may be re-connected after being disconnected.
   *
   * @category lifecycle
   */
  disconnectedCallback() {
    super.disconnectedCallback();
    this.__childPart?.setConnected(false);
  }
  /**
   * Invoked on each update to perform rendering tasks. This method may return
   * any value renderable by lit-html's `ChildPart` - typically a
   * `TemplateResult`. Setting properties inside this method will *not* trigger
   * the element to update.
   * @category rendering
   */
  render() {
    return noChange;
  }
};
LitElement["_$litElement$"] = true;
LitElement[JSCompiler_renameProperty2("finalized", LitElement)] = true;
global4.litElementHydrateSupport?.({ LitElement });
var polyfillSupport3 = DEV_MODE3 ? global4.litElementPolyfillSupportDevMode : global4.litElementPolyfillSupport;
polyfillSupport3?.({ LitElement });
(global4.litElementVersions ??= []).push("4.2.2");
if (DEV_MODE3 && global4.litElementVersions.length > 1) {
  queueMicrotask(() => {
    issueWarning3("multiple-versions", `Multiple versions of Lit loaded. Loading multiple versions is not recommended.`);
  });
}

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
    showCommand: true,
    showGroup: true,
    hideIcon: "eye-closed",
    playButtonBg: "transparent",
    actionToolbar: ["hide", "setColor", "edit", "delete"]
  },
  iconMap: {},
  collapsedGroups: [],
  showSearch: false,
  showHidden: false,
  // Default
  selectionMode: false,
  selectedItems: [],
  openActionMenuFor: null,
  runStatus: {}
};
if (window.__INITIAL_DATA__) {
  Object.assign(startState, window.__INITIAL_DATA__);
}
var storedState = vscode.getState() || {};
if (storedState.collapsedGroups) {
  startState.collapsedGroups = storedState.collapsedGroups;
}
var state = new Proxy(startState, {
  set(target, p, value) {
    Reflect.set(target, p, value);
    requestRender();
    if (p === "collapsedGroups") {
      vscode.setState({ ...storedState, collapsedGroups: value });
    }
    return true;
  }
});
var dragSrcAction = null;
var dragOverAction = null;
var dragOverTop = true;
var dragOverGroupName = null;
var dragSrcGroup = null;
var dragOverGroup = null;
var dragOverGroupTop = true;
var colorPickerOpenFor = null;
var colorPickerApplyToPlay = false;
var colorPickerApplyToRow = true;
var colorPickerThemeExpanded = false;
var groupColorPickerOpenFor = null;
var groupColorPickerApplyToAccent = true;
var groupColorPickerApplyToBg = false;
var groupColorPickerApplyToBorder = false;
var reorderMode = false;
var enterReorderMode = () => {
  closeActionMenu();
  colorPickerOpenFor = null;
  groupColorPickerOpenFor = null;
  reorderMode = true;
  requestRender();
};
var exitReorderMode = () => {
  dragSrcAction = null;
  dragOverAction = null;
  dragOverGroupName = null;
  reorderMode = false;
  requestRender();
};
var handleDragStart = (e, item) => {
  dragSrcAction = item;
  e.dataTransfer.effectAllowed = "move";
  const wrapper = e.currentTarget.closest(".lp-btn-wrapper");
  if (wrapper) {
    const rect = wrapper.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    e.dataTransfer.setDragImage(wrapper, offsetX, offsetY);
  }
  setTimeout(() => requestRender(), 0);
};
var handleDragOver = (e, item) => {
  if (!dragSrcAction || dragSrcAction === item) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
  const target = e.currentTarget;
  const rect = target.getBoundingClientRect();
  const top = e.clientY < rect.top + rect.height / 2;
  if (dragOverAction !== item || dragOverTop !== top) {
    dragOverAction = item;
    dragOverTop = top;
    requestRender();
  }
};
var handleDragLeave = (e, item) => {
  const related = e.relatedTarget;
  const wrapper = e.currentTarget;
  if (!wrapper.contains(related) && dragOverAction === item) {
    dragOverAction = null;
    requestRender();
  }
};
var handleDrop = (e, item) => {
  e.preventDefault();
  if (!dragSrcAction || dragSrcAction === item) return;
  const updatedSrc = { ...dragSrcAction };
  if (item.group !== void 0) {
    updatedSrc.group = item.group;
  } else {
    delete updatedSrc.group;
  }
  const newActions = state.actions.map((a) => a === dragSrcAction ? updatedSrc : a);
  const srcIdx = newActions.indexOf(updatedSrc);
  const tgtIdx = newActions.indexOf(item);
  if (srcIdx === -1 || tgtIdx === -1) {
    dragSrcAction = null;
    dragOverAction = null;
    dragOverGroupName = null;
    return;
  }
  newActions.splice(srcIdx, 1);
  const adjustedTgt = newActions.indexOf(item);
  const insertIdx = dragOverTop ? adjustedTgt : adjustedTgt + 1;
  newActions.splice(insertIdx, 0, updatedSrc);
  dragSrcAction = null;
  dragOverAction = null;
  dragOverGroupName = null;
  state.actions = newActions;
  vscode.postMessage({ command: "reorderActions", actions: newActions });
};
var moveAction = (item, direction) => {
  const actions = [...state.actions];
  const idx = actions.indexOf(item);
  if (direction === "up" && idx <= 0) return;
  if (direction === "down" && idx >= actions.length - 1) return;
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  [actions[idx], actions[swapIdx]] = [actions[swapIdx], actions[idx]];
  state.actions = actions;
  vscode.postMessage({ command: "reorderActions", actions });
};
var handleDragEnd = () => {
  dragSrcAction = null;
  dragOverAction = null;
  dragOverGroupName = null;
  dragSrcGroup = null;
  dragOverGroup = null;
  requestRender();
};
var handleGroupDragStart = (e, group) => {
  dragSrcGroup = group;
  e.dataTransfer.effectAllowed = "move";
  const summary = e.currentTarget.closest(".lp-group-header");
  if (summary) {
    const rect = summary.getBoundingClientRect();
    e.dataTransfer.setDragImage(summary, e.clientX - rect.left, e.clientY - rect.top);
  }
  setTimeout(() => requestRender(), 0);
};
var handleGroupDragEnd = () => {
  dragSrcGroup = null;
  dragOverGroup = null;
  requestRender();
};
var handleDragOverGroupHeader = (e, group) => {
  if (dragSrcGroup) {
    if (dragSrcGroup === group) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const top = e.clientY < rect.top + rect.height / 2;
    if (dragOverGroup !== group || dragOverGroupTop !== top) {
      dragOverGroup = group;
      dragOverGroupTop = top;
      requestRender();
    }
    return;
  }
  if (!dragSrcAction) return;
  e.preventDefault();
  e.stopPropagation();
  e.dataTransfer.dropEffect = "move";
  if (dragOverGroupName !== group.name) {
    dragOverAction = null;
    dragOverGroupName = group.name;
    requestRender();
  }
};
var handleDragLeaveGroupHeader = (e, group) => {
  if (dragSrcGroup) {
    const related = e.relatedTarget;
    const wrapper = e.currentTarget;
    if (!wrapper.contains(related) && dragOverGroup === group) {
      dragOverGroup = null;
      requestRender();
    }
    return;
  }
  if (dragOverGroupName !== group.name) return;
  dragOverGroupName = null;
  requestRender();
};
var handleDropOnGroupHeader = (e, group) => {
  e.preventDefault();
  e.stopPropagation();
  if (dragSrcGroup) {
    if (dragSrcGroup === group) return;
    const groups = [...state.groups];
    const src2 = dragSrcGroup;
    const srcIdx = groups.findIndex((g) => g === src2);
    const tgtIdx = groups.findIndex((g) => g === group);
    if (srcIdx === -1 || tgtIdx === -1) {
      dragSrcGroup = null;
      dragOverGroup = null;
      return;
    }
    const [removed] = groups.splice(srcIdx, 1);
    const adjustedTgt = groups.findIndex((g) => g === group);
    const insertIdx2 = dragOverGroupTop ? adjustedTgt : adjustedTgt + 1;
    groups.splice(insertIdx2, 0, removed);
    dragSrcGroup = null;
    dragOverGroup = null;
    state.groups = groups;
    vscode.postMessage({ command: "reorderGroups", groups });
    return;
  }
  const src = dragSrcAction;
  if (!src) return;
  const updatedSrc = { ...src, group: group.name };
  const withoutSrc = state.actions.filter((a) => a !== src);
  let insertIdx = withoutSrc.length;
  for (let i = withoutSrc.length - 1; i >= 0; i--) {
    if (withoutSrc[i].group === group.name) {
      insertIdx = i + 1;
      break;
    }
  }
  const newActions = [
    ...withoutSrc.slice(0, insertIdx),
    updatedSrc,
    ...withoutSrc.slice(insertIdx)
  ];
  dragSrcAction = null;
  dragOverAction = null;
  dragOverGroupName = null;
  state.actions = newActions;
  vscode.postMessage({ command: "reorderActions", actions: newActions });
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
var setActionColor = (item, menuId) => {
  closeActionMenu();
  groupColorPickerOpenFor = null;
  if (colorPickerOpenFor === menuId) {
    colorPickerOpenFor = null;
  } else {
    colorPickerOpenFor = menuId;
    colorPickerApplyToRow = true;
    colorPickerApplyToPlay = !!item.backgroundColor;
  }
  renderView();
};
var deleteAction = (item) => {
  vscode.postMessage({ command: "deleteAction", item });
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
var handleFlyoutTriggerKeydown = (e, config) => {
  if (e.key === "Escape" && config.isOpen()) {
    e.preventDefault();
    config.close(true);
    return;
  }
  if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
    e.preventDefault();
    openMenuAndFocus(config, "first");
    return;
  }
  if (e.key === "ArrowUp") {
    e.preventDefault();
    openMenuAndFocus(config, "last");
  }
};
var handleFlyoutMenuKeydown = (e, config) => {
  const flyout = e.currentTarget;
  const menuItems = config.getMenuItems(flyout);
  if (!menuItems.length) return;
  const currentIndex = menuItems.indexOf(document.activeElement);
  if (e.key === "Escape") {
    e.preventDefault();
    config.close(true);
    return;
  }
  if (e.key === "Tab") {
    config.close();
    return;
  }
  if (e.key === "Home") {
    e.preventDefault();
    menuItems[0].focus();
    return;
  }
  if (e.key === "End") {
    e.preventDefault();
    menuItems[menuItems.length - 1].focus();
    return;
  }
  if (e.key === "ArrowDown") {
    e.preventDefault();
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % menuItems.length : 0;
    menuItems[nextIndex].focus();
    return;
  }
  if (e.key === "ArrowUp") {
    e.preventDefault();
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
    if (!flyout) return;
    const items = Array.from(flyout.querySelectorAll(".lp-menu-item"));
    if (!items.length) return;
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
var toggleActionMenu = (e, item) => {
  e.stopPropagation();
  colorPickerOpenFor = null;
  groupColorPickerOpenFor = null;
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
var onActionMenuTriggerKeydown = (e, item) => {
  handleFlyoutTriggerKeydown(e, getActionMenuKeyboardConfig(item));
};
var onActionMenuKeydown = (e, item) => {
  handleFlyoutMenuKeydown(e, getActionMenuKeyboardConfig(item));
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
var getGroupMenuId = (group) => `grp-${encodeURIComponent(group.name)}`;
var setGroupColorAction = (group, menuId) => {
  closeActionMenu();
  colorPickerOpenFor = null;
  if (groupColorPickerOpenFor === menuId) {
    groupColorPickerOpenFor = null;
  } else {
    groupColorPickerOpenFor = menuId;
    groupColorPickerApplyToAccent = true;
    groupColorPickerApplyToBg = !!group.backgroundColor;
    groupColorPickerApplyToBorder = !!group.borderColor;
  }
  renderView();
};
var renderGroupColorPickerPopout = (group) => {
  const currentColor = group.color || group.backgroundColor || group.borderColor || "";
  const applyNow = (color) => {
    vscode.postMessage({
      command: "setGroupColor",
      group,
      color,
      applyToAccent: groupColorPickerApplyToAccent,
      applyToBg: groupColorPickerApplyToBg,
      applyToBorder: groupColorPickerApplyToBorder
    });
  };
  const onNativeInput = (e) => applyNow(e.target.value);
  const onTextChange = (e) => {
    const v = e.target.value.trim();
    if (v) applyNow(v);
  };
  return html`
        <div class="lp-cp-popout" @click=${(e) => e.stopPropagation()}>
            <div class="lp-cp-swatches">
                ${THEME_COLORS.map((c) => html`
                    <button class="lp-cp-swatch ${currentColor === c.value ? "lp-cp-swatch--active" : ""}"
                        style="background:${c.value}" title=${c.name}
                        @click=${() => applyNow(c.value)}></button>
                `)}
                <button class="lp-cp-swatch lp-cp-swatch--clear" title="Clear color"
                    @click=${() => applyNow("")}>
                    <span class="codicon codicon-circle-slash"></span>
                </button>
            </div>
            <div class="lp-cp-custom-row">
                <div class="lp-cp-preview" style="background:${currentColor || "transparent"}"></div>
                <input class="lp-cp-text" type="text" placeholder="#hex or var(--color)"
                    value=${currentColor}
                    @change=${onTextChange}>
                <label class="lp-cp-native-wrap" title="Open color wheel">
                    <input type="color" value=${currentColor.startsWith("#") ? currentColor : "#000000"}
                        @input=${onNativeInput}>
                    <span class="codicon codicon-color-mode"></span>
                </label>
            </div>
            <div class="lp-cp-targets">
                <span class="lp-cp-targets-hd">Apply to</span>
                <div class="lp-cp-target-btns">
                    <label class="lp-cp-target-label">
                        <input type="checkbox" .checked=${groupColorPickerApplyToAccent}
                            @change=${(e) => {
    groupColorPickerApplyToAccent = e.target.checked;
    if (groupColorPickerApplyToAccent) {
      if (currentColor) applyNow(currentColor);
    } else {
      vscode.postMessage({ command: "setGroupColor", group, color: "", applyToAccent: true, applyToBg: false, applyToBorder: false });
    }
  }}>
                        Accent
                    </label>
                    <label class="lp-cp-target-label">
                        <input type="checkbox" .checked=${groupColorPickerApplyToBg}
                            @change=${(e) => {
    groupColorPickerApplyToBg = e.target.checked;
    if (groupColorPickerApplyToBg) {
      if (currentColor) applyNow(currentColor);
    } else {
      vscode.postMessage({ command: "setGroupColor", group, color: "", applyToAccent: false, applyToBg: true, applyToBorder: false });
    }
  }}>
                        BG
                    </label>
                    <label class="lp-cp-target-label">
                        <input type="checkbox" .checked=${groupColorPickerApplyToBorder}
                            @change=${(e) => {
    groupColorPickerApplyToBorder = e.target.checked;
    if (groupColorPickerApplyToBorder) {
      if (currentColor) applyNow(currentColor);
    } else {
      vscode.postMessage({ command: "setGroupColor", group, color: "", applyToAccent: false, applyToBg: false, applyToBorder: true });
    }
  }}>
                        Border
                    </label>
                </div>
            </div>
        </div>
    `;
};
var formatRelativeTime = (timestamp) => {
  const secs = Math.floor((Date.now() - timestamp) / 1e3);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
};
var formatCommandMeta = (item) => {
  if (item.type === "npm" && item.command.startsWith("npm run ")) {
    return item.command.replace("npm run ", "");
  }
  if (item.type === "task") {
    const taskLabel = item.command.split("|")[1];
    return taskLabel ? taskLabel : "task";
  }
  if (item.type === "launch") {
    const launchLabel = item.command.split("|")[1];
    return launchLabel ? launchLabel : "launch";
  }
  if (item.type === "vscode") {
    const [commandId, commandArg] = item.command.split("|");
    if (commandId === "workbench.action.tasks.runTask") {
      return commandArg ? commandArg : "task";
    }
    if (commandId === "workbench.action.debug.start") {
      return commandArg ? commandArg : "launch";
    }
    return commandArg ? `${commandId} ${commandArg}` : commandId;
  }
  return item.command;
};
var renderFlyoutMenu = (config) => {
  const containerClass = `lp-menu-container lp-menu-container--${config.kind}`;
  const triggerClass = `lp-menu-trigger lp-menu-trigger--${config.kind}`;
  const flyoutClass = `lp-menu-panel lp-menu-panel--${config.kind}`;
  return html`
        <div
            class=${containerClass}
            data-action-menu-id=${config.kind === "action" ? config.menuId : ""}
            data-group-menu-id=${config.kind === "group" ? config.menuId : ""}>
            <button
                class=${triggerClass}
                title=${config.triggerTitle}
                aria-label=${config.triggerAriaLabel}
                aria-haspopup="true"
                aria-expanded=${config.isOpen ? "true" : "false"}
                data-action-menu-id=${config.kind === "action" ? config.menuId : ""}
                data-group-menu-id=${config.kind === "group" ? config.menuId : ""}
                @click=${config.onTriggerClick}
                @keydown=${config.onTriggerKeydown}>
                <span class="codicon codicon-ellipsis"></span>
            </button>

            ${config.isOpen ? html`
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
var ROW_BG_PRESETS = [
  { name: "Forest", value: "#162d1e" },
  { name: "Ocean", value: "#0e1e30" },
  { name: "Dusk", value: "#1e1030" },
  { name: "Ember", value: "#2e160a" },
  { name: "Slate", value: "#141e28" },
  { name: "Olive", value: "#1e2210" },
  { name: "Teal", value: "#0e2828" },
  { name: "Crimson", value: "#2e0e0e" }
];
var THEME_COLORS = [
  { name: "Red", value: "var(--vscode-charts-red)" },
  { name: "Orange", value: "var(--vscode-charts-orange)" },
  { name: "Yellow", value: "var(--vscode-charts-yellow)" },
  { name: "Green", value: "var(--vscode-charts-green)" },
  { name: "Blue", value: "var(--vscode-charts-blue)" },
  { name: "Purple", value: "var(--vscode-charts-purple)" },
  { name: "Pink", value: "var(--vscode-charts-pink)" },
  { name: "Error", value: "var(--vscode-errorForeground)" },
  { name: "Warning", value: "var(--vscode-editorWarning-foreground)" },
  { name: "Info", value: "var(--vscode-editorInfo-foreground)" },
  { name: "Success", value: "var(--vscode-testing-iconPassed)" }
];
var hexToHsl = (hex) => {
  const m = hex.match(/^#([0-9a-f]{6})$/i);
  if (!m) return null;
  let r = parseInt(m[1].slice(0, 2), 16) / 255;
  let g = parseInt(m[1].slice(2, 4), 16) / 255;
  let b = parseInt(m[1].slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d2 = max - min;
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (d2 > 0) {
    s = d2 / (l > 0.5 ? 2 - max - min : max + min);
    h = max === r ? (g - b) / d2 + (g < b ? 6 : 0) : max === g ? (b - r) / d2 + 2 : (r - g) / d2 + 4;
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
};
var hslToHex = (h, s, l) => {
  h /= 360;
  s /= 100;
  l /= 100;
  const f = (n) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return "#" + [f(0), f(8), f(4)].map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("");
};
var deriveHarmonies = (hex) => {
  const hsl = hexToHsl(hex);
  if (!hsl) return [];
  const [h, s, l] = hsl;
  const rs = Math.max(Math.min(s, 65), 25);
  const rl = Math.max(Math.min(l, 32), 8);
  return [
    hslToHex((h + 30) % 360, rs, rl),
    hslToHex((h - 30 + 360) % 360, rs, rl),
    hslToHex((h + 150) % 360, rs, rl),
    hslToHex((h + 180) % 360, rs, rl)
  ];
};
var renderColorPickerPopout = (item) => {
  const currentColor = item.rowBackgroundColor || item.backgroundColor || "";
  const harmonies = currentColor.startsWith("#") ? deriveHarmonies(currentColor) : [];
  const applyNow = (color) => {
    vscode.postMessage({ command: "setActionColor", item, color, applyToPlay: colorPickerApplyToPlay, applyToRow: colorPickerApplyToRow });
  };
  const clearColor = () => {
    vscode.postMessage({ command: "setActionColor", item, color: "", applyToPlay: colorPickerApplyToPlay, applyToRow: colorPickerApplyToRow });
  };
  const onNativeInput = (e) => applyNow(e.target.value);
  const onTextChange = (e) => {
    const v = e.target.value.trim();
    if (v) applyNow(v);
  };
  return html`
        <div class="lp-cp-popout" @click=${(e) => e.stopPropagation()}>
            <div class="lp-cp-swatches">
                ${ROW_BG_PRESETS.map((c) => html`
                    <button class="lp-cp-swatch ${currentColor === c.value ? "lp-cp-swatch--active" : ""}"
                        style="background:${c.value}" title=${c.name}
                        @click=${() => applyNow(c.value)}></button>
                `)}
                <button class="lp-cp-swatch lp-cp-swatch--clear" title="Clear color"
                    @click=${clearColor}>
                    <span class="codicon codicon-circle-slash"></span>
                </button>
            </div>
            ${harmonies.length ? html`
                <div class="lp-cp-harmonies-row">
                    <span class="lp-cp-harmonies-label">Harmonies</span>
                    <div class="lp-cp-harmonies">
                        ${harmonies.map((c) => html`
                            <button class="lp-cp-swatch lp-cp-swatch--sm ${currentColor === c ? "lp-cp-swatch--active" : ""}"
                                style="background:${c}" title=${c}
                                @click=${() => applyNow(c)}></button>
                        `)}
                    </div>
                </div>
            ` : null}
            <div class="lp-cp-custom-row">
                <div class="lp-cp-preview" style="background:${currentColor || "transparent"}"></div>
                <input class="lp-cp-text" type="text" placeholder="#hex or var(--color)"
                    value=${currentColor}
                    @change=${onTextChange}>
                <label class="lp-cp-native-wrap" title="Open color wheel">
                    <input type="color" value=${currentColor.startsWith("#") ? currentColor : "#000000"}
                        @input=${onNativeInput}>
                    <span class="codicon codicon-color-mode"></span>
                </label>
            </div>
            <details class="lp-cp-theme-section" .open=${colorPickerThemeExpanded}
                @toggle=${(e) => {
    colorPickerThemeExpanded = e.target.open;
  }}>
                <summary class="lp-cp-theme-toggle">
                    <span class="codicon codicon-chevron-right lp-cp-theme-chevron"></span>
                    VSCode theme colors
                </summary>
                <div class="lp-cp-swatches lp-cp-theme-swatches">
                    ${THEME_COLORS.map((c) => html`
                        <button class="lp-cp-swatch ${currentColor === c.value ? "lp-cp-swatch--active" : ""}"
                            style="background:${c.value}" title=${c.name}
                            @click=${() => applyNow(c.value)}></button>
                    `)}
                </div>
            </details>
            <div class="lp-cp-targets">
                <span class="lp-cp-targets-hd">Apply to</span>
                <div class="lp-cp-target-btns">
                    <label class="lp-cp-target-label">
                        <input type="checkbox" .checked=${colorPickerApplyToPlay}
                            @change=${(e) => {
    colorPickerApplyToPlay = e.target.checked;
    if (colorPickerApplyToPlay) {
      if (currentColor) applyNow(currentColor);
    } else {
      vscode.postMessage({ command: "setActionColor", item, color: "", applyToPlay: true, applyToRow: false });
    }
  }}>
                        <span class="codicon codicon-play"></span>Play
                    </label>
                    <label class="lp-cp-target-label">
                        <input type="checkbox" .checked=${colorPickerApplyToRow}
                            @change=${(e) => {
    colorPickerApplyToRow = e.target.checked;
    if (colorPickerApplyToRow) {
      if (currentColor) applyNow(currentColor);
    } else {
      vscode.postMessage({ command: "setActionColor", item, color: "", applyToPlay: false, applyToRow: true });
    }
  }}>
                        Row bg
                    </label>
                </div>
            </div>
        </div>
    `;
};
var renderButton = (item) => {
  const isHidden = item.hidden;
  const { display } = state;
  const metaParts = [];
  let topLabel = null;
  if (item.workspace) {
    topLabel = html`<span class="lp-workspace-label">${item.workspace}</span>`;
  }
  if (display.showCommand) {
    metaParts.push(formatCommandMeta(item));
  }
  const isInGroup = !!item.group;
  const hasGroups = state.groups.length > 0;
  const showGroupActions = hasGroups || isInGroup;
  const isMenuOpen = state.openActionMenuFor === item;
  const actionMenuId = getActionMenuId(item);
  const isDragging = dragSrcAction === item;
  const isDragOver = dragOverAction === item;
  const wrapperClass = [
    "lp-btn-wrapper",
    isHidden ? "lp-hidden-item" : "",
    isDragging ? "lp-dragging" : "",
    isDragOver && dragOverTop ? "lp-drag-over-top" : "",
    isDragOver && !dragOverTop ? "lp-drag-over-bottom" : "",
    colorPickerOpenFor === actionMenuId ? "lp-cp-open" : "",
    isMenuOpen ? "lp-menu-open" : "",
    reorderMode ? "lp-reorder-mode-row" : ""
  ].filter(Boolean).join(" ");
  const runEntry = state.runStatus[item.name];
  const statusDot = runEntry ? html`<span
            class="lp-status-dot ${runEntry.exitCode === 0 ? "lp-status-ok" : "lp-status-fail"}"
            title="Last run: ${formatRelativeTime(runEntry.timestamp)} — Exit ${runEntry.exitCode}">
          </span>` : null;
  const staticBtnDefs = {
    edit: { icon: "edit", label: "Edit", action: () => editAction(item) },
    setColor: { icon: "symbol-color", label: "Set color", action: () => setActionColor(item, actionMenuId) },
    hide: { icon: isHidden ? "eye" : display.hideIcon, label: isHidden ? "Show" : "Hide", action: () => hideAction(item) },
    delete: { icon: "trash", label: "Delete", action: () => deleteAction(item), dangerous: true }
  };
  const toolbar = display.actionToolbar ?? ["hide", "setColor", "edit", "delete"];
  const inlineBtns = toolbar.filter((id) => staticBtnDefs[id]).map((id) => ({ id, ...staticBtnDefs[id] }));
  const ellipsisStaticBtns = Object.keys(staticBtnDefs).filter((id) => !toolbar.includes(id)).map((id) => ({ id, ...staticBtnDefs[id] }));
  const canReorder = !state.searchQuery;
  const hasEllipsisContent = !reorderMode && (ellipsisStaticBtns.length > 0 || showGroupActions || canReorder);
  return html`
    <div class=${wrapperClass}
        style=${item.rowBackgroundColor ? `--lp-row-bg:${item.rowBackgroundColor}` : ""}
        @dragover=${(e) => handleDragOver(e, item)}
        @dragleave=${(e) => handleDragLeave(e, item)}
        @drop=${(e) => handleDrop(e, item)}>
        ${state.selectionMode ? html`<input type="checkbox" class="lp-btn-checkbox" .checked=${state.selectedItems.includes(item)} @change=${(e) => {
    if (e.target.checked) state.selectedItems = [...state.selectedItems, item];
    else state.selectedItems = state.selectedItems.filter((i) => i !== item);
  }}>` : null}

        ${reorderMode ? html`
        <button class="lp-reorder-handle" draggable="true"
            title="Drag to reorder"
            aria-label=${`Drag ${item.name} to reorder`}
            @dragstart=${(e) => handleDragStart(e, item)}
            @dragend=${handleDragEnd}>
            <span class="codicon codicon-gripper"></span>
        </button>` : html`
        <button
            class="lp-play-btn"
            style=${item.backgroundColor ? `--lp-play-btn-bg: ${item.backgroundColor}` : display.playButtonBg && display.playButtonBg !== "transparent" ? `--lp-play-btn-bg: ${display.playButtonBg}` : ""}
            title="Run"
            aria-label=${`Run ${item.name}`}
            @click=${() => executeAction(item)}>
            <span class="codicon codicon-play"></span>
        </button>`}

        <div class="lp-btn ${state.selectionMode ? "has-checkbox" : ""}">
             ${topLabel}
             <span class="lp-btn-name">
                ${item.name}
                ${isHidden ? html`<span class="lp-hidden-badge">(hidden)</span>` : null}
                ${statusDot}
                <span class="lp-action-toolbar" style=${reorderMode ? "display:none" : ""}>
                    ${inlineBtns.map((btn) => btn.id === "setColor" ? html`
                        <div class="lp-cp-container">
                            <button class="lp-inline-action-btn ${colorPickerOpenFor === actionMenuId ? "lp-cp-active" : ""}"
                                title=${btn.label} aria-label="${btn.label} ${item.name}"
                                @click=${(e) => {
    e.stopPropagation();
    btn.action();
  }}>
                                <span class="codicon codicon-${btn.icon}"></span>
                            </button>
                        </div>
                    ` : html`
                        <button class="lp-inline-action-btn ${btn.dangerous ? "lp-btn-dangerous" : ""}"
                            title=${btn.label} aria-label="${btn.label} ${item.name}"
                            @click=${(e) => {
    e.stopPropagation();
    btn.action();
  }}>
                            <span class="codicon codicon-${btn.icon}"></span>
                        </button>
                    `)}
                    ${hasEllipsisContent ? renderFlyoutMenu({
    kind: "action",
    menuId: actionMenuId,
    isOpen: isMenuOpen,
    triggerTitle: "More actions",
    triggerAriaLabel: `More actions for ${item.name}`,
    onTriggerClick: (e) => toggleActionMenu(e, item),
    onTriggerKeydown: (e) => onActionMenuTriggerKeydown(e, item),
    onMenuClick: (e) => e.stopPropagation(),
    onMenuKeydown: (e) => onActionMenuKeydown(e, item),
    menuContent: html`
                            ${ellipsisStaticBtns.map((btn) => html`
                                <button class="lp-menu-item lp-menu-item--action" role="menuitem"
                                    @click=${() => onActionMenuAction(() => btn.action())}>
                                    <span class="codicon codicon-${btn.icon}"></span>
                                    ${btn.label}
                                </button>
                            `)}
                            ${showGroupActions ? html`
                                <div class="lp-menu-divider"></div>
                                <button class="lp-menu-item lp-menu-item--action" role="menuitem" @click=${() => onActionMenuAction(() => assignGroup(item, "__none__"))}>
                                    <span class="codicon codicon-clear-all"></span>
                                    Remove from group
                                </button>
                                ${state.groups.map((g) => html`
                                    <button class="lp-menu-item lp-menu-item--action" role="menuitem" @click=${() => onActionMenuAction(() => assignGroup(item, g.name))}>
                                        ${g.icon ? html`<span class="codicon codicon-${g.icon}"></span>` : html`<span class="codicon codicon-folder"></span>`}
                                        Assign to ${g.name}
                                    </button>
                                `)}
                            ` : null}
                            ${canReorder ? html`
                                <div class="lp-menu-divider"></div>
                                <button class="lp-menu-item lp-menu-item--action" role="menuitem"
                                    @click=${() => onActionMenuAction(() => enterReorderMode())}>
                                    <span class="codicon codicon-grabber"></span>
                                    Reorder actions
                                </button>
                                <button class="lp-menu-item lp-menu-item--action" role="menuitem"
                                    ?disabled=${state.actions.indexOf(item) === 0}
                                    @click=${() => onActionMenuAction(() => moveAction(item, "up"))}>
                                    <span class="codicon codicon-arrow-up"></span>
                                    Move up
                                </button>
                                <button class="lp-menu-item lp-menu-item--action" role="menuitem"
                                    ?disabled=${state.actions.indexOf(item) === state.actions.length - 1}
                                    @click=${() => onActionMenuAction(() => moveAction(item, "down"))}>
                                    <span class="codicon codicon-arrow-down"></span>
                                    Move down
                                </button>
                            ` : null}
                        `
  }) : null}
                </span>
             </span>
             ${metaParts.length ? html`<span class="lp-btn-meta">${metaParts.map((part, idx) => html`${idx > 0 ? " \xB7 " : ""}${part}`)}</span>` : null}
        </div>
        ${colorPickerOpenFor === actionMenuId ? renderColorPickerPopout(item) : null}
    </div>
    `;
};
var renderGroup = (group, actions) => {
  const isOpen = !state.collapsedGroups.includes(group.name);
  const isHiddenGroup = !!group.hidden;
  const styles = [];
  const accent = group.borderColor || group.color;
  if (accent) {
    if (accent.includes("--vscode-charts-")) {
      styles.push(`--lp-group-accent: ${accent}`);
    } else {
      styles.push(`--lp-group-accent: ${accent}`);
    }
  }
  if (group.color) {
    if (!group.color.includes("--vscode-charts-")) {
      styles.push(`color: ${group.color}`);
    }
  }
  if (group.backgroundColor) styles.push(`background-color: ${group.backgroundColor}`);
  const itemsStyles = [];
  if (group.backgroundColor) itemsStyles.push(`background-color: ${group.backgroundColor}`);
  const groupMenuId = getGroupMenuId(group);
  const isDraggingGroup = dragSrcGroup === group;
  const isDragOverGroupTop = dragOverGroup === group && dragOverGroupTop;
  const isDragOverGroupBottom = dragOverGroup === group && !dragOverGroupTop;
  return html`
    <details class="lp-group ${isDraggingGroup ? "lp-dragging-group" : ""} ${isDragOverGroupTop ? "lp-drag-over-top-group" : ""} ${isDragOverGroupBottom ? "lp-drag-over-bottom-group" : ""}" ?open=${isOpen} @toggle=${(e) => {
    const d2 = e.target;
    if (d2.open && state.collapsedGroups.includes(group.name)) {
      toggleGroup(group.name);
    } else if (!d2.open && !state.collapsedGroups.includes(group.name)) {
      toggleGroup(group.name);
    }
  }}>
        <summary class="lp-group-header ${isHiddenGroup ? "lp-hidden-group" : ""} ${dragOverGroupName === group.name ? "lp-drag-over-group" : ""} ${groupColorPickerOpenFor === groupMenuId ? "lp-group-header--picker-open" : ""}"
            style="${styles.join(";")}"
            @dragover=${(e) => handleDragOverGroupHeader(e, group)}
            @dragleave=${(e) => handleDragLeaveGroupHeader(e, group)}
            @drop=${(e) => handleDropOnGroupHeader(e, group)}>
            <span class="codicon codicon-chevron-down lp-group-chevron"></span>
            <button class="lp-group-drag-handle" draggable="true"
                title="Drag to reorder group" aria-label=${`Drag ${group.name} to reorder`}
                @click=${(e) => {
    e.preventDefault();
    e.stopPropagation();
  }}
                @dragstart=${(e) => handleGroupDragStart(e, group)}
                @dragend=${handleGroupDragEnd}>
                <span class="codicon codicon-gripper"></span>
            </button>
            <div class="lp-group-header-content">
                ${group.icon ? html`<span class="codicon codicon-${group.icon} lp-group-icon"></span>` : null}
                <span class="lp-group-name">${group.name}</span>
                ${isHiddenGroup ? html`<span class="lp-hidden-badge"><span class="codicon codicon-eye-closed"></span>hidden</span>` : null}
            </div>
            <span class="lp-group-action-toolbar">
                <button class="lp-inline-action-btn"
                    title=${isHiddenGroup ? "Show group" : "Hide group"}
                    aria-label=${isHiddenGroup ? `Show group ${group.name}` : `Hide group ${group.name}`}
                    @click=${(e) => {
    e.preventDefault();
    e.stopPropagation();
    hideGroup(group);
  }}>
                    <span class="codicon codicon-${isHiddenGroup ? "eye" : state.display.hideIcon}"></span>
                </button>
                <div class="lp-cp-container">
                    <button class="lp-inline-action-btn ${groupColorPickerOpenFor === groupMenuId ? "lp-cp-active" : ""}"
                        title="Set color"
                        aria-label="Set color for group ${group.name}"
                        @click=${(e) => {
    e.preventDefault();
    e.stopPropagation();
    setGroupColorAction(group, groupMenuId);
  }}>
                        <span class="codicon codicon-symbol-color"></span>
                    </button>
                </div>
                <button class="lp-inline-action-btn"
                    title="Edit group"
                    aria-label="Edit group ${group.name}"
                    @click=${(e) => {
    e.preventDefault();
    e.stopPropagation();
    editGroup(group);
  }}>
                    <span class="codicon codicon-edit"></span>
                </button>
            </span>
            ${groupColorPickerOpenFor === groupMenuId ? renderGroupColorPickerPopout(group) : null}
        </summary>
        <div class="lp-group-items" style="${itemsStyles.join(";")}">
            ${actions.map((a) => renderButton(a))}
        </div>
    </details>
    `;
};
var renderSearch = () => {
  if (!state.showSearch && !state.searchQuery) return null;
  return html`
    <div id="searchContainer" class="lp-search-container">
        <input type="text" class="lp-search-box" 
            placeholder="🔍 Search actions..." 
            .value=${state.searchQuery}
            @input=${(e) => {
    state.searchQuery = e.target.value;
  }}
        >
        <!-- Additional search buttons (Select Multiple, etc) could go here -->
    </div>
    `;
};
var renderView = () => {
  if (!root) return;
  let visibleActions = state.actions;
  if (!state.showHidden) {
    visibleActions = visibleActions.filter((a) => !a.hidden);
  }
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    visibleActions = visibleActions.filter(
      (a) => a.name.toLowerCase().includes(q) || a.command.toLowerCase().includes(q) || a.group && a.group.toLowerCase().includes(q)
    );
  }
  const content = [];
  if (state.display.showGroup && state.groups.length > 0) {
    const grouped = /* @__PURE__ */ new Map();
    const ungrouped = [];
    visibleActions.forEach((a) => {
      if (a.group) {
        if (!grouped.has(a.group)) grouped.set(a.group, []);
        grouped.get(a.group).push(a);
      } else {
        ungrouped.push(a);
      }
    });
    state.groups.forEach((g) => {
      if (g.hidden && !state.showHidden) {
        return;
      }
      const acts = grouped.get(g.name);
      if (acts && acts.length) {
        content.push(renderGroup(g, acts));
      }
    });
    if (ungrouped.length) {
      content.push(html`
            <details class="lp-group" open>
                <summary class="lp-group-header"><span class="codicon codicon-chevron-down lp-group-chevron"></span> Ungrouped</summary>
                                <div class="lp-group-items">${ungrouped.map((a) => renderButton(a))}</div>
            </details>
          `);
    }
  } else {
    content.push(visibleActions.map((a) => renderButton(a)));
  }
  if (visibleActions.length === 0) {
    if (state.searchQuery) {
      content.push(html`
            <div class="lp-empty-state lp-no-results">
                <span class="codicon codicon-search"></span>
                <span>No results for "<strong>${state.searchQuery}</strong>"</span>
            </div>
          `);
    } else {
      content.push(html`
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
  }
  render(html`
    <div id="toast" class="lp-toast"></div>
    ${state.loading ? html`<div class="lp-loading-overlay"><span class="codicon codicon-loading codicon-modifier-spin"></span></div>` : null}
    ${renderSearch()}
    ${reorderMode ? html`
    <div class="lp-reorder-banner">
        <span class="lp-reorder-banner-label">
            <span class="codicon codicon-grabber"></span>
            Drag rows to reorder
        </span>
        <button class="lp-reorder-banner-done" @click=${exitReorderMode}>
            <span class="codicon codicon-check"></span>
            Done
        </button>
    </div>` : null}
    <div class="lp-grid">
        ${content}
    </div>
  `, root);
  requestAnimationFrame(() => {
    document.querySelectorAll(".lp-menu-panel--action, .lp-menu-panel--group").forEach((panel) => {
      const rect = panel.getBoundingClientRect();
      panel.classList.toggle("lp-menu-flip", rect.bottom > window.innerHeight - 8);
    });
  });
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
      state.collapsedGroups = state.groups.map((g) => g.name);
      requestRender();
      break;
    case "expandAllGroups":
      state.collapsedGroups = [];
      requestRender();
      break;
    case "showToast":
      break;
  }
  if (msg.command === "statusUpdate") {
    state.runStatus = { ...state.runStatus, [msg.name]: { exitCode: msg.exitCode, timestamp: msg.timestamp } };
  }
});
renderView();
document.addEventListener("click", (e) => {
  const target = e.target;
  if (!target?.closest(".lp-menu-container")) {
    closeActionMenu();
  }
  if (!target?.closest(".lp-cp-container")) {
    let changed = false;
    if (colorPickerOpenFor !== null) {
      colorPickerOpenFor = null;
      changed = true;
    }
    if (groupColorPickerOpenFor !== null) {
      groupColorPickerOpenFor = null;
      changed = true;
    }
    if (changed) renderView();
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeActionMenu();
  }
});
var autoScrollRAF = null;
var autoScrollSpeed = 0;
var stopAutoScroll = () => {
  if (autoScrollRAF !== null) {
    cancelAnimationFrame(autoScrollRAF);
    autoScrollRAF = null;
  }
  autoScrollSpeed = 0;
};
var runAutoScroll = () => {
  if (autoScrollSpeed === 0) {
    autoScrollRAF = null;
    return;
  }
  document.documentElement.scrollTop += autoScrollSpeed;
  autoScrollRAF = requestAnimationFrame(runAutoScroll);
};
document.addEventListener("dragover", (e) => {
  if (!dragSrcAction && !dragSrcGroup) return;
  const ZONE = 80;
  const MAX_PX = 14;
  const { clientY } = e;
  const vh = window.innerHeight;
  let speed = 0;
  if (clientY < ZONE) {
    speed = -Math.ceil(MAX_PX * (1 - clientY / ZONE));
  } else if (clientY > vh - ZONE) {
    speed = Math.ceil(MAX_PX * (1 - (vh - clientY) / ZONE));
  }
  autoScrollSpeed = speed;
  if (speed !== 0 && autoScrollRAF === null) {
    autoScrollRAF = requestAnimationFrame(runAutoScroll);
  } else if (speed === 0) {
    stopAutoScroll();
  }
});
document.addEventListener("dragend", stopAutoScroll);
document.addEventListener("drop", stopAutoScroll);
/*! Bundled license information:

@lit/reactive-element/development/css-tag.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/development/reactive-element.js:
lit-html/development/lit-html.js:
lit-element/development/lit-element.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/development/is-server.js:
  (**
   * @license
   * Copyright 2022 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)
*/
//# sourceMappingURL=mainView.js.map
