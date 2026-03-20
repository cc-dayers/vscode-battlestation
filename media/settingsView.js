var N=globalThis,B=N.ShadowRoot&&(N.ShadyCSS===void 0||N.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,ct=Symbol(),rt=new WeakMap,j=class{constructor(t,s,e){if(this._$cssResult$=!0,e!==ct)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=s}get styleSheet(){let t=this.o,s=this.t;if(B&&t===void 0){let e=s!==void 0&&s.length===1;e&&(t=rt.get(s)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),e&&rt.set(s,t))}return t}toString(){return this.cssText}},dt=n=>new j(typeof n=="string"?n:n+"",void 0,ct);var ht=(n,t)=>{if(B)n.adoptedStyleSheets=t.map(s=>s instanceof CSSStyleSheet?s:s.styleSheet);else for(let s of t){let e=document.createElement("style"),i=N.litNonce;i!==void 0&&e.setAttribute("nonce",i),e.textContent=s.cssText,n.appendChild(e)}},K=B?n=>n:n=>n instanceof CSSStyleSheet?(t=>{let s="";for(let e of t.cssRules)s+=e.cssText;return dt(s)})(n):n;var{is:Ot,defineProperty:Pt,getOwnPropertyDescriptor:Ht,getOwnPropertyNames:Mt,getOwnPropertySymbols:Lt,getPrototypeOf:Dt}=Object,z=globalThis,pt=z.trustedTypes,It=pt?pt.emptyScript:"",Ut=z.reactiveElementPolyfillSupport,P=(n,t)=>n,J={toAttribute(n,t){switch(t){case Boolean:n=n?It:null;break;case Object:case Array:n=n==null?n:JSON.stringify(n)}return n},fromAttribute(n,t){let s=n;switch(t){case Boolean:s=n!==null;break;case Number:s=n===null?null:Number(n);break;case Object:case Array:try{s=JSON.parse(n)}catch{s=null}}return s}},gt=(n,t)=>!Ot(n,t),ut={attribute:!0,type:String,converter:J,reflect:!1,useDefault:!1,hasChanged:gt};Symbol.metadata??=Symbol("metadata"),z.litPropertyMetadata??=new WeakMap;var v=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,s=ut){if(s.state&&(s.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((s=Object.create(s)).wrapped=!0),this.elementProperties.set(t,s),!s.noAccessor){let e=Symbol(),i=this.getPropertyDescriptor(t,e,s);i!==void 0&&Pt(this.prototype,t,i)}}static getPropertyDescriptor(t,s,e){let{get:i,set:o}=Ht(this.prototype,t)??{get(){return this[s]},set(a){this[s]=a}};return{get:i,set(a){let p=i?.call(this);o?.call(this,a),this.requestUpdate(t,p,e)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??ut}static _$Ei(){if(this.hasOwnProperty(P("elementProperties")))return;let t=Dt(this);t.finalize(),t.l!==void 0&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(P("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(P("properties"))){let s=this.properties,e=[...Mt(s),...Lt(s)];for(let i of e)this.createProperty(i,s[i])}let t=this[Symbol.metadata];if(t!==null){let s=litPropertyMetadata.get(t);if(s!==void 0)for(let[e,i]of s)this.elementProperties.set(e,i)}this._$Eh=new Map;for(let[s,e]of this.elementProperties){let i=this._$Eu(s,e);i!==void 0&&this._$Eh.set(i,s)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){let s=[];if(Array.isArray(t)){let e=new Set(t.flat(1/0).reverse());for(let i of e)s.unshift(K(i))}else t!==void 0&&s.push(K(t));return s}static _$Eu(t,s){let e=s.attribute;return e===!1?void 0:typeof e=="string"?e:typeof t=="string"?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),this.renderRoot!==void 0&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){let t=new Map,s=this.constructor.elementProperties;for(let e of s.keys())this.hasOwnProperty(e)&&(t.set(e,this[e]),delete this[e]);t.size>0&&(this._$Ep=t)}createRenderRoot(){let t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return ht(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,s,e){this._$AK(t,e)}_$ET(t,s){let e=this.constructor.elementProperties.get(t),i=this.constructor._$Eu(t,e);if(i!==void 0&&e.reflect===!0){let o=(e.converter?.toAttribute!==void 0?e.converter:J).toAttribute(s,e.type);this._$Em=t,o==null?this.removeAttribute(i):this.setAttribute(i,o),this._$Em=null}}_$AK(t,s){let e=this.constructor,i=e._$Eh.get(t);if(i!==void 0&&this._$Em!==i){let o=e.getPropertyOptions(i),a=typeof o.converter=="function"?{fromAttribute:o.converter}:o.converter?.fromAttribute!==void 0?o.converter:J;this._$Em=i;let p=a.fromAttribute(s,o.type);this[i]=p??this._$Ej?.get(i)??p,this._$Em=null}}requestUpdate(t,s,e,i=!1,o){if(t!==void 0){let a=this.constructor;if(i===!1&&(o=this[t]),e??=a.getPropertyOptions(t),!((e.hasChanged??gt)(o,s)||e.useDefault&&e.reflect&&o===this._$Ej?.get(t)&&!this.hasAttribute(a._$Eu(t,e))))return;this.C(t,s,e)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(t,s,{useDefault:e,reflect:i,wrapped:o},a){e&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,a??s??this[t]),o!==!0||a!==void 0)||(this._$AL.has(t)||(this.hasUpdated||e||(s=void 0),this._$AL.set(t,s)),i===!0&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(s){Promise.reject(s)}let t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[i,o]of this._$Ep)this[i]=o;this._$Ep=void 0}let e=this.constructor.elementProperties;if(e.size>0)for(let[i,o]of e){let{wrapped:a}=o,p=this[i];a!==!0||this._$AL.has(i)||p===void 0||this.C(i,void 0,o,p)}}let t=!1,s=this._$AL;try{t=this.shouldUpdate(s),t?(this.willUpdate(s),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(s)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(s)}willUpdate(t){}_$AE(t){this._$EO?.forEach(s=>s.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(s=>this._$ET(s,this[s])),this._$EM()}updated(t){}firstUpdated(t){}};v.elementStyles=[],v.shadowRootOptions={mode:"open"},v[P("elementProperties")]=new Map,v[P("finalized")]=new Map,Ut?.({ReactiveElement:v}),(z.reactiveElementVersions??=[]).push("2.1.2");var st=globalThis,ft=n=>n,V=st.trustedTypes,$t=V?V.createPolicy("lit-html",{createHTML:n=>n}):void 0,At="$lit$",A=`lit$${Math.random().toFixed(9).slice(2)}$`,Ct="?"+A,Rt=`<${Ct}>`,w=document,M=()=>w.createComment(""),L=n=>n===null||typeof n!="object"&&typeof n!="function",it=Array.isArray,Nt=n=>it(n)||typeof n?.[Symbol.iterator]=="function",Y=`[ 	
\f\r]`,H=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,vt=/-->/g,mt=/>/g,S=RegExp(`>|${Y}(?:([^\\s"'>=/]+)(${Y}*=${Y}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),bt=/'/g,_t=/"/g,St=/^(?:script|style|textarea|title)$/i,nt=n=>(t,...s)=>({_$litType$:n,strings:t,values:s}),g=nt(1),te=nt(2),ee=nt(3),m=Symbol.for("lit-noChange"),u=Symbol.for("lit-nothing"),yt=new WeakMap,E=w.createTreeWalker(w,129);function Et(n,t){if(!it(n)||!n.hasOwnProperty("raw"))throw Error("invalid template strings array");return $t!==void 0?$t.createHTML(t):t}var jt=(n,t)=>{let s=n.length-1,e=[],i,o=t===2?"<svg>":t===3?"<math>":"",a=H;for(let p=0;p<s;p++){let l=n[p],d,h,c=-1,$=0;for(;$<l.length&&(a.lastIndex=$,h=a.exec(l),h!==null);)$=a.lastIndex,a===H?h[1]==="!--"?a=vt:h[1]!==void 0?a=mt:h[2]!==void 0?(St.test(h[2])&&(i=RegExp("</"+h[2],"g")),a=S):h[3]!==void 0&&(a=S):a===S?h[0]===">"?(a=i??H,c=-1):h[1]===void 0?c=-2:(c=a.lastIndex-h[2].length,d=h[1],a=h[3]===void 0?S:h[3]==='"'?_t:bt):a===_t||a===bt?a=S:a===vt||a===mt?a=H:(a=S,i=void 0);let y=a===S&&n[p+1].startsWith("/>")?" ":"";o+=a===H?l+Rt:c>=0?(e.push(d),l.slice(0,c)+At+l.slice(c)+A+y):l+A+(c===-2?p:y)}return[Et(n,o+(n[s]||"<?>")+(t===2?"</svg>":t===3?"</math>":"")),e]},D=class n{constructor({strings:t,_$litType$:s},e){let i;this.parts=[];let o=0,a=0,p=t.length-1,l=this.parts,[d,h]=jt(t,s);if(this.el=n.createElement(d,e),E.currentNode=this.el.content,s===2||s===3){let c=this.el.content.firstChild;c.replaceWith(...c.childNodes)}for(;(i=E.nextNode())!==null&&l.length<p;){if(i.nodeType===1){if(i.hasAttributes())for(let c of i.getAttributeNames())if(c.endsWith(At)){let $=h[a++],y=i.getAttribute(c).split(A),R=/([.?@])?(.*)/.exec($);l.push({type:1,index:o,name:R[2],strings:y,ctor:R[1]==="."?Z:R[1]==="?"?Q:R[1]==="@"?tt:k}),i.removeAttribute(c)}else c.startsWith(A)&&(l.push({type:6,index:o}),i.removeAttribute(c));if(St.test(i.tagName)){let c=i.textContent.split(A),$=c.length-1;if($>0){i.textContent=V?V.emptyScript:"";for(let y=0;y<$;y++)i.append(c[y],M()),E.nextNode(),l.push({type:2,index:++o});i.append(c[$],M())}}}else if(i.nodeType===8)if(i.data===Ct)l.push({type:2,index:o});else{let c=-1;for(;(c=i.data.indexOf(A,c+1))!==-1;)l.push({type:7,index:o}),c+=A.length-1}o++}}static createElement(t,s){let e=w.createElement("template");return e.innerHTML=t,e}};function x(n,t,s=n,e){if(t===m)return t;let i=e!==void 0?s._$Co?.[e]:s._$Cl,o=L(t)?void 0:t._$litDirective$;return i?.constructor!==o&&(i?._$AO?.(!1),o===void 0?i=void 0:(i=new o(n),i._$AT(n,s,e)),e!==void 0?(s._$Co??=[])[e]=i:s._$Cl=i),i!==void 0&&(t=x(n,i._$AS(n,t.values),i,e)),t}var X=class{constructor(t,s){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=s}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){let{el:{content:s},parts:e}=this._$AD,i=(t?.creationScope??w).importNode(s,!0);E.currentNode=i;let o=E.nextNode(),a=0,p=0,l=e[0];for(;l!==void 0;){if(a===l.index){let d;l.type===2?d=new I(o,o.nextSibling,this,t):l.type===1?d=new l.ctor(o,l.name,l.strings,this,t):l.type===6&&(d=new et(o,this,t)),this._$AV.push(d),l=e[++p]}a!==l?.index&&(o=E.nextNode(),a++)}return E.currentNode=w,i}p(t){let s=0;for(let e of this._$AV)e!==void 0&&(e.strings!==void 0?(e._$AI(t,e,s),s+=e.strings.length-2):e._$AI(t[s])),s++}},I=class n{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,s,e,i){this.type=2,this._$AH=u,this._$AN=void 0,this._$AA=t,this._$AB=s,this._$AM=e,this.options=i,this._$Cv=i?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode,s=this._$AM;return s!==void 0&&t?.nodeType===11&&(t=s.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,s=this){t=x(this,t,s),L(t)?t===u||t==null||t===""?(this._$AH!==u&&this._$AR(),this._$AH=u):t!==this._$AH&&t!==m&&this._(t):t._$litType$!==void 0?this.$(t):t.nodeType!==void 0?this.T(t):Nt(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==u&&L(this._$AH)?this._$AA.nextSibling.data=t:this.T(w.createTextNode(t)),this._$AH=t}$(t){let{values:s,_$litType$:e}=t,i=typeof e=="number"?this._$AC(t):(e.el===void 0&&(e.el=D.createElement(Et(e.h,e.h[0]),this.options)),e);if(this._$AH?._$AD===i)this._$AH.p(s);else{let o=new X(i,this),a=o.u(this.options);o.p(s),this.T(a),this._$AH=o}}_$AC(t){let s=yt.get(t.strings);return s===void 0&&yt.set(t.strings,s=new D(t)),s}k(t){it(this._$AH)||(this._$AH=[],this._$AR());let s=this._$AH,e,i=0;for(let o of t)i===s.length?s.push(e=new n(this.O(M()),this.O(M()),this,this.options)):e=s[i],e._$AI(o),i++;i<s.length&&(this._$AR(e&&e._$AB.nextSibling,i),s.length=i)}_$AR(t=this._$AA.nextSibling,s){for(this._$AP?.(!1,!0,s);t!==this._$AB;){let e=ft(t).nextSibling;ft(t).remove(),t=e}}setConnected(t){this._$AM===void 0&&(this._$Cv=t,this._$AP?.(t))}},k=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,s,e,i,o){this.type=1,this._$AH=u,this._$AN=void 0,this.element=t,this.name=s,this._$AM=i,this.options=o,e.length>2||e[0]!==""||e[1]!==""?(this._$AH=Array(e.length-1).fill(new String),this.strings=e):this._$AH=u}_$AI(t,s=this,e,i){let o=this.strings,a=!1;if(o===void 0)t=x(this,t,s,0),a=!L(t)||t!==this._$AH&&t!==m,a&&(this._$AH=t);else{let p=t,l,d;for(t=o[0],l=0;l<o.length-1;l++)d=x(this,p[e+l],s,l),d===m&&(d=this._$AH[l]),a||=!L(d)||d!==this._$AH[l],d===u?t=u:t!==u&&(t+=(d??"")+o[l+1]),this._$AH[l]=d}a&&!i&&this.j(t)}j(t){t===u?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}},Z=class extends k{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===u?void 0:t}},Q=class extends k{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==u)}},tt=class extends k{constructor(t,s,e,i,o){super(t,s,e,i,o),this.type=5}_$AI(t,s=this){if((t=x(this,t,s,0)??u)===m)return;let e=this._$AH,i=t===u&&e!==u||t.capture!==e.capture||t.once!==e.once||t.passive!==e.passive,o=t!==u&&(e===u||i);i&&this.element.removeEventListener(this.name,this,e),o&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}},et=class{constructor(t,s,e){this.element=t,this.type=6,this._$AN=void 0,this._$AM=s,this.options=e}get _$AU(){return this._$AM._$AU}_$AI(t){x(this,t)}};var Bt=st.litHtmlPolyfillSupport;Bt?.(D,I),(st.litHtmlVersions??=[]).push("3.3.2");var U=(n,t,s)=>{let e=s?.renderBefore??t,i=e._$litPart$;if(i===void 0){let o=s?.renderBefore??null;e._$litPart$=i=new I(t.insertBefore(M(),o),o,void 0,s??{})}return i._$AI(n),i};var ot=globalThis,T=class extends v{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){let s=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=U(s,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return m}};T._$litElement$=!0,T.finalized=!0,ot.litElementHydrateSupport?.({LitElement:T});var zt=ot.litElementPolyfillSupport;zt?.({LitElement:T});(ot.litElementVersions??=[]).push("4.2.2");var wt={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},xt=n=>(...t)=>({_$litDirective$:n,values:t}),G=class{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,s,e){this._$Ct=t,this._$AM=s,this._$Ci=e}_$AS(t,s){return this.update(t,s)}update(t,s){return this.render(...s)}};var kt=xt(class extends G{constructor(n){if(super(n),n.type!==wt.ATTRIBUTE||n.name!=="class"||n.strings?.length>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(n){return" "+Object.keys(n).filter(t=>n[t]).join(" ")+" "}update(n,[t]){if(this.st===void 0){this.st=new Set,n.strings!==void 0&&(this.nt=new Set(n.strings.join(" ").split(/\s/).filter(e=>e!=="")));for(let e in t)t[e]&&!this.nt?.has(e)&&this.st.add(e);return this.render(t)}let s=n.element.classList;for(let e of this.st)e in t||(s.remove(e),this.st.delete(e));for(let e in t){let i=!!t[e];i===this.st.has(e)||this.nt?.has(e)||(i?(s.add(e),this.st.add(e)):(s.remove(e),this.st.delete(e)))}return m}});var Vt=[{value:"eye-closed",label:"Eye Closed"},{value:"x",label:"X Mark"},{value:"trash",label:"Trash"},{value:"close",label:"Close"},{value:"circle-slash",label:"Circle Slash"}],Tt=[{id:"edit",icon:"edit",label:"Edit"},{id:"setColor",icon:"symbol-color",label:"Set Color"},{id:"hide",icon:"eye-closed",label:"Hide / Show"},{id:"delete",icon:"trash",label:"Delete"}],_=window.acquireVsCodeApi(),at=document.getElementById("root"),r=window.__SETTINGS__||{showCommand:!0,showGroup:!0,hideIcon:"eye-closed",backupCount:0,configExists:!1,usedIcons:[],customConfigPath:null,actionToolbar:["hide","setColor","edit","delete"]},W=!1,F=!1,q=!1,b=null,O=n=>{Object.assign(r,n),C()},Gt=()=>{W=!W,C()},lt=()=>{W=!1,C()},qt=()=>{F=!F,C()},Wt=()=>{F=!1,C()},Ft=()=>{try{console.log("[SettingsView] Saving settings..."),_.postMessage({command:"saveSettings",settings:{showCommand:r.showCommand,showGroup:r.showGroup,hideIcon:r.hideIcon,actionToolbar:r.actionToolbar}}),console.log("[SettingsView] Save message sent")}catch(n){console.error("Failed to save settings:",n),alert(`Failed to save settings: ${n}`)}},Kt=()=>r.usedIcons.map(n=>g`
      <span class="lp-icon-chip" title=${n}>
        <span class="codicon codicon-${n}"></span>
        <span class="lp-icon-chip-name">${n}</span>
      </span>
    `),f=(n,t,s,e)=>g`
  <button
    type="button"
    class=${kt({"lp-config-btn":!0,"lp-btn":!0,"lp-btn-secondary":!0,"lp-btn-danger":!!e?.danger,"lp-config-cta":!!e?.cta})}
    ?disabled=${e?.disabled??!1}
    title=${e?.title??t}
    aria-label=${e?.ariaLabel??t}
    @click=${()=>{e?.onClick?e.onClick():(lt(),_.postMessage({command:s}))}}
  >
    <span class="codicon codicon-${n}"></span><span class="lp-btn-text">${t}</span>
  </button>
`,C=()=>{if(at){if(!window.__SETTINGS__){U(g`
        <div class="lp-settings-loading">
          <div class="lp-settings-loading-icon">⚙️</div>
          <div>Loading settings...</div>
        </div>
      `,at);return}U(g`
      <div class="lp-settings-view">
        <div class="lp-settings-header">
          <h3><span class="codicon codicon-settings-gear"></span> Settings</h3>
          <div class="lp-top-actions">
            <button
              type="button"
              class="lp-icon-btn"
              title="Open Battlestation visual settings"
              aria-label="Open Battlestation visual settings"
              @click=${()=>_.postMessage({command:"openVisualSettings"})}
            >
              <span class="codicon codicon-settings"></span>
            </button>
          </div>
        </div>

        <div class="lp-setting-group">
          <div class="lp-config-header">
            <div class="lp-config-toolbar">
              <div class="lp-setting-group-title">📄 battle.json</div>
              <div class="lp-config-actions">
                ${f("file","Open","openConfig",{disabled:!r.configExists,title:r.configExists?"Open config file":"Generate config first",ariaLabel:"Open config file"})}
                ${f("folder-opened","Location","openConfigFolder",{title:"Open folder containing battle.json",ariaLabel:"Open config location"})}
                ${f("refresh",r.configExists?"Regen":"Generate","showGenerateConfig",{cta:!0,title:r.configExists?"Regenerate config from scanned sources":"Generate new config file",ariaLabel:r.configExists?"Regenerate config":"Generate config"})}
                ${r.backupCount>0?f("history","Restore","restoreConfig",{disabled:!1,title:`Restore a previous config (${r.backupCount})`,ariaLabel:"Restore previous config"}):null}
                ${r.configExists?f("trash","Delete","deleteConfig",{danger:!0,title:"Delete config file",ariaLabel:"Delete config file",onClick:()=>Gt()}):null}
                ${!r.configExists&&r.backupCount>0?f("trash","Delete History","clearHistory",{danger:!0,title:"Delete history backups",ariaLabel:"Delete history backups",onClick:()=>qt()}):null}
              </div>
            </div>
            ${r.configExists&&W?g`
              <div class="lp-config-confirm">
                <div class="lp-config-confirm-text" style="display: flex; flex-direction: column; gap: 4px;">
                  <span style="font-weight: 600;">Delete battle.json?</span>
                  <span style="opacity: 0.85;">This cannot be undone.</span>
                </div>
                ${r.backupCount>0?g`<label class="lp-checkbox-label" style="display:flex;align-items:center;margin-top:2px;">
                  <input type="checkbox" id="deleteHistoryAlso" class="lp-checkbox" style="margin:0;">
                  <span style="margin-left:8px;font-size:12px;opacity:0.9;">Also history</span>
                </label>`:null}
                <div class="lp-config-confirm-actions">
                  ${f("trash","Delete","deleteConfig",{danger:!0,ariaLabel:"Confirm delete config file",onClick:()=>{let n=document.getElementById("deleteHistoryAlso")?.checked;_.postMessage({command:"deleteConfig",deleteHistory:n})}})}
                  ${f("close","Cancel","",{onClick:()=>lt(),ariaLabel:"Cancel delete config"})}
                </div>
              </div>
            `:null}
            ${!r.configExists&&r.backupCount>0&&F?g`
              <div class="lp-config-confirm">
                <div class="lp-config-confirm-text" style="display: flex; flex-direction: column; gap: 4px;">
                  <span style="font-weight: 600;">Delete ${r.backupCount} history backup${r.backupCount!==1?"s":""}?</span>
                  <span style="opacity: 0.85;">This cannot be undone.</span>
                </div>
                <div class="lp-config-confirm-actions">
                  ${f("trash","Delete History","clearHistory",{danger:!0,ariaLabel:"Confirm delete history",onClick:()=>{_.postMessage({command:"clearHistory"})}})}
                  ${f("close","Cancel","",{onClick:()=>Wt(),ariaLabel:"Cancel delete history"})}
                </div>
              </div>
            `:null}
          </div>
        </div>

        <!-- Advanced Section -->
        <div class="lp-setting-group">
        <button
          type="button"
          class="lp-generate-toggle"
          @click=${()=>{q=!q,C()}}
        >
          <span class="codicon codicon-${q?"chevron-down":"chevron-right"}"></span>
          <span>Advanced</span>
        </button>
        ${q?g`
          <div class="lp-generate-content">
            <div class="lp-setting-row">
              <div class="lp-setting-label">
                <div class="lp-setting-name">Config Location</div>
                <div class="lp-setting-desc">
                  ${r.customConfigPath?g`Custom: <code class="lp-inline-code">${r.customConfigPath}/battle.json</code>`:g`Default: <code class="lp-inline-code">.vscode/battle.json</code>`}
                </div>
              </div>
              <div class="lp-inline-actions">
                ${f("folder-opened","Change","changeConfigLocation",{title:"Choose a custom folder to store battle.json",ariaLabel:"Change config location",onClick:()=>_.postMessage({command:"changeConfigLocation"})})}
                ${r.customConfigPath?f("discard","Reset","resetConfigLocation",{title:"Reset to default location (.vscode/battle.json)",ariaLabel:"Reset config location",onClick:()=>_.postMessage({command:"resetConfigLocation"})}):null}
              </div>
            </div>
            <div class="lp-setting-row">
              <div class="lp-setting-label">
                <div class="lp-setting-name">Import Config</div>
                <div class="lp-setting-desc">Load an existing battle.json from disk. Your current config will be backed up first.</div>
              </div>
              ${f("desktop-download","Import","importConfig",{title:"Browse for a JSON config file to import",ariaLabel:"Import config file",onClick:()=>_.postMessage({command:"importConfig"})})}
            </div>
          </div>
        `:null}
        </div>

        <div class="lp-setting-group">
          <div class="lp-setting-group-title">🎨 Display</div>
          <div class="lp-setting-row">
          <div class="lp-setting-label">
            <div class="lp-setting-name">Show Command</div>
            <div class="lp-setting-desc">Display the actual command text</div>
          </div>
          <label class="lp-setting-toggle">
            <input
              type="checkbox"
              .checked=${r.showCommand}
              @change=${n=>O({showCommand:n.target.checked})}
            />
            <span class="lp-toggle-slider"></span>
          </label>
        </div>
          <div class="lp-setting-row">
          <div class="lp-setting-label">
            <div class="lp-setting-name">Show Groups</div>
            <div class="lp-setting-desc">Display group headers and organization</div>
          </div>
          <label class="lp-setting-toggle">
            <input
              type="checkbox"
              .checked=${r.showGroup}
              @change=${n=>O({showGroup:n.target.checked})}
            />
            <span class="lp-toggle-slider"></span>
          </label>
        </div>
          <div class="lp-setting-row">
          <div class="lp-setting-label">
            <div class="lp-setting-name">Hide Icon</div>
            <div class="lp-setting-desc">Icon to use for hiding items</div>
          </div>
          <select
            id="hideIcon"
            class="lp-hide-icon-select"
            .value=${r.hideIcon}
            @change=${n=>O({hideIcon:n.target.value})}
          >
            ${Vt.map(n=>g`<option value=${n.value}>${n.label}</option>`)}
          </select>
          </div>
        </div>

        <div class="lp-setting-group">
          <div class="lp-setting-group-title">🛠️ Action Toolbar</div>
          <div class="lp-setting-desc" style="margin-bottom: 8px; font-size: 11px; opacity: 0.75;">
            Choose which buttons appear directly on each action card. Drag to reorder. Unchecked buttons move to the ellipsis menu.
          </div>
          ${(()=>{let n=Tt.map(i=>i.id),t=r.actionToolbar.filter(i=>n.includes(i)),s=n.filter(i=>!t.includes(i)),e=[...t,...s];return e.map(i=>{let o=Tt.find(l=>l.id===i),a=t.includes(i);return g`
                <div class="lp-toolbar-cfg-item ${b!==null&&b!==i?"lp-toolbar-cfg-drop":""}"
                    draggable="true"
                    @dragstart=${()=>{b=i}}
                    @dragover=${l=>{l.preventDefault()}}
                    @drop=${l=>{if(l.preventDefault(),!b||b===i){b=null;return}let d=b;b=null;let h=e.filter(c=>c!==d);h.splice(h.indexOf(i),0,d),O({actionToolbar:h.filter(c=>t.includes(c))})}}
                    @dragend=${()=>{b=null,C()}}>
                  <span class="codicon codicon-gripper" style="opacity:0.4; font-size:12px; cursor:grab; flex-shrink:0;"></span>
                  <span class="codicon codicon-${o.icon}" style="font-size:13px; flex-shrink:0;"></span>
                  <span style="flex:1; font-size:12px;">${o.label}</span>
                  <label class="lp-setting-toggle" style="flex-shrink:0;">
                    <input type="checkbox" .checked=${a}
                      @change=${l=>{let d=l.target.checked;O(d?{actionToolbar:[...t,i]}:{actionToolbar:t.filter(h=>h!==i)})}} />
                    <span class="lp-toggle-slider"></span>
                  </label>
                </div>
              `})})()}
        </div>

        <div class="lp-setting-group">
          <div class="lp-setting-group-title">🎭 Available Icons</div>
          <div class="lp-setting-row lp-icon-row">
            <div class="lp-setting-label lp-icon-help-row">
              <span class="codicon codicon-info"></span>
              <div class="lp-setting-desc lp-icon-help-text">
              Only icons used in your config are loaded for performance. All
              <a
                href="https://microsoft.github.io/vscode-codicons/dist/codicon.html"
                target="_blank"
                >codicons</a>
              are supported—just add them to your config and refresh.
              </div>
            </div>
            <div class="lp-loaded-icons-wrap">
              <div class="lp-loaded-icons-title">Currently Loaded (${r.usedIcons.length} icons):</div>
              <div class="lp-loaded-icons-grid">${Kt()}</div>
            </div>
          </div>
        </div>
      
        <div class="lp-form-actions">
          <button
            type="button"
            class="lp-btn lp-btn-secondary"
            @click=${()=>{console.log("[SettingsView] Cancel clicked"),lt(),_.postMessage({command:"cancelForm"})}}
          >
            Cancel
          </button>
          <button
            type="button"
            class="lp-btn lp-btn-primary"
            @click=${()=>{console.log("[SettingsView] Save button clicked"),Ft()}}
          >
            Save Settings
          </button>
        </div>
      </div>

    `,at)}};C();
/*! Bundled license information:

@lit/reactive-element/css-tag.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/reactive-element.js:
lit-html/lit-html.js:
lit-element/lit-element.js:
lit-html/directive.js:
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

lit-html/directives/class-map.js:
  (**
   * @license
   * Copyright 2018 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)
*/
