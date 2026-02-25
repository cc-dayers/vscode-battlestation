var N=globalThis,j=N.ShadowRoot&&(N.ShadyCSS===void 0||N.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,rt=Symbol(),at=new WeakMap,D=class{constructor(t,s,e){if(this._$cssResult$=!0,e!==rt)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=s}get styleSheet(){let t=this.o,s=this.t;if(j&&t===void 0){let e=s!==void 0&&s.length===1;e&&(t=at.get(s)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),e&&at.set(s,t))}return t}toString(){return this.cssText}},lt=i=>new D(typeof i=="string"?i:i+"",void 0,rt);var ct=(i,t)=>{if(j)i.adoptedStyleSheets=t.map(s=>s instanceof CSSStyleSheet?s:s.styleSheet);else for(let s of t){let e=document.createElement("style"),n=N.litNonce;n!==void 0&&e.setAttribute("nonce",n),e.textContent=s.cssText,i.appendChild(e)}},W=j?i=>i:i=>i instanceof CSSStyleSheet?(t=>{let s="";for(let e of t.cssRules)s+=e.cssText;return lt(s)})(i):i;var{is:xt,defineProperty:Tt,getOwnPropertyDescriptor:Pt,getOwnPropertyNames:kt,getOwnPropertySymbols:Ot,getPrototypeOf:Mt}=Object,B=globalThis,dt=B.trustedTypes,It=dt?dt.emptyScript:"",Lt=B.reactiveElementPolyfillSupport,T=(i,t)=>i,F={toAttribute(i,t){switch(t){case Boolean:i=i?It:null;break;case Object:case Array:i=i==null?i:JSON.stringify(i)}return i},fromAttribute(i,t){let s=i;switch(t){case Boolean:s=i!==null;break;case Number:s=i===null?null:Number(i);break;case Object:case Array:try{s=JSON.parse(i)}catch{s=null}}return s}},pt=(i,t)=>!xt(i,t),ht={attribute:!0,type:String,converter:F,reflect:!1,useDefault:!1,hasChanged:pt};Symbol.metadata??=Symbol("metadata"),B.litPropertyMetadata??=new WeakMap;var $=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,s=ht){if(s.state&&(s.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((s=Object.create(s)).wrapped=!0),this.elementProperties.set(t,s),!s.noAccessor){let e=Symbol(),n=this.getPropertyDescriptor(t,e,s);n!==void 0&&Tt(this.prototype,t,n)}}static getPropertyDescriptor(t,s,e){let{get:n,set:o}=Pt(this.prototype,t)??{get(){return this[s]},set(a){this[s]=a}};return{get:n,set(a){let d=n?.call(this);o?.call(this,a),this.requestUpdate(t,d,e)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??ht}static _$Ei(){if(this.hasOwnProperty(T("elementProperties")))return;let t=Mt(this);t.finalize(),t.l!==void 0&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(T("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(T("properties"))){let s=this.properties,e=[...kt(s),...Ot(s)];for(let n of e)this.createProperty(n,s[n])}let t=this[Symbol.metadata];if(t!==null){let s=litPropertyMetadata.get(t);if(s!==void 0)for(let[e,n]of s)this.elementProperties.set(e,n)}this._$Eh=new Map;for(let[s,e]of this.elementProperties){let n=this._$Eu(s,e);n!==void 0&&this._$Eh.set(n,s)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){let s=[];if(Array.isArray(t)){let e=new Set(t.flat(1/0).reverse());for(let n of e)s.unshift(W(n))}else t!==void 0&&s.push(W(t));return s}static _$Eu(t,s){let e=s.attribute;return e===!1?void 0:typeof e=="string"?e:typeof t=="string"?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),this.renderRoot!==void 0&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){let t=new Map,s=this.constructor.elementProperties;for(let e of s.keys())this.hasOwnProperty(e)&&(t.set(e,this[e]),delete this[e]);t.size>0&&(this._$Ep=t)}createRenderRoot(){let t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return ct(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,s,e){this._$AK(t,e)}_$ET(t,s){let e=this.constructor.elementProperties.get(t),n=this.constructor._$Eu(t,e);if(n!==void 0&&e.reflect===!0){let o=(e.converter?.toAttribute!==void 0?e.converter:F).toAttribute(s,e.type);this._$Em=t,o==null?this.removeAttribute(n):this.setAttribute(n,o),this._$Em=null}}_$AK(t,s){let e=this.constructor,n=e._$Eh.get(t);if(n!==void 0&&this._$Em!==n){let o=e.getPropertyOptions(n),a=typeof o.converter=="function"?{fromAttribute:o.converter}:o.converter?.fromAttribute!==void 0?o.converter:F;this._$Em=n;let d=a.fromAttribute(s,o.type);this[n]=d??this._$Ej?.get(n)??d,this._$Em=null}}requestUpdate(t,s,e,n=!1,o){if(t!==void 0){let a=this.constructor;if(n===!1&&(o=this[t]),e??=a.getPropertyOptions(t),!((e.hasChanged??pt)(o,s)||e.useDefault&&e.reflect&&o===this._$Ej?.get(t)&&!this.hasAttribute(a._$Eu(t,e))))return;this.C(t,s,e)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(t,s,{useDefault:e,reflect:n,wrapped:o},a){e&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,a??s??this[t]),o!==!0||a!==void 0)||(this._$AL.has(t)||(this.hasUpdated||e||(s=void 0),this._$AL.set(t,s)),n===!0&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(s){Promise.reject(s)}let t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[n,o]of this._$Ep)this[n]=o;this._$Ep=void 0}let e=this.constructor.elementProperties;if(e.size>0)for(let[n,o]of e){let{wrapped:a}=o,d=this[n];a!==!0||this._$AL.has(n)||d===void 0||this.C(n,void 0,o,d)}}let t=!1,s=this._$AL;try{t=this.shouldUpdate(s),t?(this.willUpdate(s),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(s)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(s)}willUpdate(t){}_$AE(t){this._$EO?.forEach(s=>s.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(s=>this._$ET(s,this[s])),this._$EM()}updated(t){}firstUpdated(t){}};$.elementStyles=[],$.shadowRootOptions={mode:"open"},$[T("elementProperties")]=new Map,$[T("finalized")]=new Map,Lt?.({ReactiveElement:$}),(B.reactiveElementVersions??=[]).push("2.1.2");var tt=globalThis,ut=i=>i,V=tt.trustedTypes,gt=V?V.createPolicy("lit-html",{createHTML:i=>i}):void 0,bt="$lit$",b=`lit$${Math.random().toFixed(9).slice(2)}$`,yt="?"+b,Ut=`<${yt}>`,S=document,k=()=>S.createComment(""),O=i=>i===null||typeof i!="object"&&typeof i!="function",et=Array.isArray,Rt=i=>et(i)||typeof i?.[Symbol.iterator]=="function",K=`[ 	
\f\r]`,P=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,ft=/-->/g,vt=/>/g,y=RegExp(`>|${K}(?:([^\\s"'>=/]+)(${K}*=${K}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),$t=/'/g,mt=/"/g,At=/^(?:script|style|textarea|title)$/i,st=i=>(t,...s)=>({_$litType$:i,strings:t,values:s}),g=st(1),Jt=st(2),Yt=st(3),m=Symbol.for("lit-noChange"),p=Symbol.for("lit-nothing"),_t=new WeakMap,A=S.createTreeWalker(S,129);function St(i,t){if(!et(i)||!i.hasOwnProperty("raw"))throw Error("invalid template strings array");return gt!==void 0?gt.createHTML(t):t}var Ht=(i,t)=>{let s=i.length-1,e=[],n,o=t===2?"<svg>":t===3?"<math>":"",a=P;for(let d=0;d<s;d++){let r=i[d],h,u,c=-1,v=0;for(;v<r.length&&(a.lastIndex=v,u=a.exec(r),u!==null);)v=a.lastIndex,a===P?u[1]==="!--"?a=ft:u[1]!==void 0?a=vt:u[2]!==void 0?(At.test(u[2])&&(n=RegExp("</"+u[2],"g")),a=y):u[3]!==void 0&&(a=y):a===y?u[0]===">"?(a=n??P,c=-1):u[1]===void 0?c=-2:(c=a.lastIndex-u[2].length,h=u[1],a=u[3]===void 0?y:u[3]==='"'?mt:$t):a===mt||a===$t?a=y:a===ft||a===vt?a=P:(a=y,n=void 0);let _=a===y&&i[d+1].startsWith("/>")?" ":"";o+=a===P?r+Ut:c>=0?(e.push(h),r.slice(0,c)+bt+r.slice(c)+b+_):r+b+(c===-2?d:_)}return[St(i,o+(i[s]||"<?>")+(t===2?"</svg>":t===3?"</math>":"")),e]},M=class i{constructor({strings:t,_$litType$:s},e){let n;this.parts=[];let o=0,a=0,d=t.length-1,r=this.parts,[h,u]=Ht(t,s);if(this.el=i.createElement(h,e),A.currentNode=this.el.content,s===2||s===3){let c=this.el.content.firstChild;c.replaceWith(...c.childNodes)}for(;(n=A.nextNode())!==null&&r.length<d;){if(n.nodeType===1){if(n.hasAttributes())for(let c of n.getAttributeNames())if(c.endsWith(bt)){let v=u[a++],_=n.getAttribute(c).split(b),H=/([.?@])?(.*)/.exec(v);r.push({type:1,index:o,name:H[2],strings:_,ctor:H[1]==="."?Y:H[1]==="?"?X:H[1]==="@"?Z:w}),n.removeAttribute(c)}else c.startsWith(b)&&(r.push({type:6,index:o}),n.removeAttribute(c));if(At.test(n.tagName)){let c=n.textContent.split(b),v=c.length-1;if(v>0){n.textContent=V?V.emptyScript:"";for(let _=0;_<v;_++)n.append(c[_],k()),A.nextNode(),r.push({type:2,index:++o});n.append(c[v],k())}}}else if(n.nodeType===8)if(n.data===yt)r.push({type:2,index:o});else{let c=-1;for(;(c=n.data.indexOf(b,c+1))!==-1;)r.push({type:7,index:o}),c+=b.length-1}o++}}static createElement(t,s){let e=S.createElement("template");return e.innerHTML=t,e}};function C(i,t,s=i,e){if(t===m)return t;let n=e!==void 0?s._$Co?.[e]:s._$Cl,o=O(t)?void 0:t._$litDirective$;return n?.constructor!==o&&(n?._$AO?.(!1),o===void 0?n=void 0:(n=new o(i),n._$AT(i,s,e)),e!==void 0?(s._$Co??=[])[e]=n:s._$Cl=n),n!==void 0&&(t=C(i,n._$AS(i,t.values),n,e)),t}var J=class{constructor(t,s){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=s}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){let{el:{content:s},parts:e}=this._$AD,n=(t?.creationScope??S).importNode(s,!0);A.currentNode=n;let o=A.nextNode(),a=0,d=0,r=e[0];for(;r!==void 0;){if(a===r.index){let h;r.type===2?h=new I(o,o.nextSibling,this,t):r.type===1?h=new r.ctor(o,r.name,r.strings,this,t):r.type===6&&(h=new Q(o,this,t)),this._$AV.push(h),r=e[++d]}a!==r?.index&&(o=A.nextNode(),a++)}return A.currentNode=S,n}p(t){let s=0;for(let e of this._$AV)e!==void 0&&(e.strings!==void 0?(e._$AI(t,e,s),s+=e.strings.length-2):e._$AI(t[s])),s++}},I=class i{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,s,e,n){this.type=2,this._$AH=p,this._$AN=void 0,this._$AA=t,this._$AB=s,this._$AM=e,this.options=n,this._$Cv=n?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode,s=this._$AM;return s!==void 0&&t?.nodeType===11&&(t=s.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,s=this){t=C(this,t,s),O(t)?t===p||t==null||t===""?(this._$AH!==p&&this._$AR(),this._$AH=p):t!==this._$AH&&t!==m&&this._(t):t._$litType$!==void 0?this.$(t):t.nodeType!==void 0?this.T(t):Rt(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==p&&O(this._$AH)?this._$AA.nextSibling.data=t:this.T(S.createTextNode(t)),this._$AH=t}$(t){let{values:s,_$litType$:e}=t,n=typeof e=="number"?this._$AC(t):(e.el===void 0&&(e.el=M.createElement(St(e.h,e.h[0]),this.options)),e);if(this._$AH?._$AD===n)this._$AH.p(s);else{let o=new J(n,this),a=o.u(this.options);o.p(s),this.T(a),this._$AH=o}}_$AC(t){let s=_t.get(t.strings);return s===void 0&&_t.set(t.strings,s=new M(t)),s}k(t){et(this._$AH)||(this._$AH=[],this._$AR());let s=this._$AH,e,n=0;for(let o of t)n===s.length?s.push(e=new i(this.O(k()),this.O(k()),this,this.options)):e=s[n],e._$AI(o),n++;n<s.length&&(this._$AR(e&&e._$AB.nextSibling,n),s.length=n)}_$AR(t=this._$AA.nextSibling,s){for(this._$AP?.(!1,!0,s);t!==this._$AB;){let e=ut(t).nextSibling;ut(t).remove(),t=e}}setConnected(t){this._$AM===void 0&&(this._$Cv=t,this._$AP?.(t))}},w=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,s,e,n,o){this.type=1,this._$AH=p,this._$AN=void 0,this.element=t,this.name=s,this._$AM=n,this.options=o,e.length>2||e[0]!==""||e[1]!==""?(this._$AH=Array(e.length-1).fill(new String),this.strings=e):this._$AH=p}_$AI(t,s=this,e,n){let o=this.strings,a=!1;if(o===void 0)t=C(this,t,s,0),a=!O(t)||t!==this._$AH&&t!==m,a&&(this._$AH=t);else{let d=t,r,h;for(t=o[0],r=0;r<o.length-1;r++)h=C(this,d[e+r],s,r),h===m&&(h=this._$AH[r]),a||=!O(h)||h!==this._$AH[r],h===p?t=p:t!==p&&(t+=(h??"")+o[r+1]),this._$AH[r]=h}a&&!n&&this.j(t)}j(t){t===p?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}},Y=class extends w{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===p?void 0:t}},X=class extends w{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==p)}},Z=class extends w{constructor(t,s,e,n,o){super(t,s,e,n,o),this.type=5}_$AI(t,s=this){if((t=C(this,t,s,0)??p)===m)return;let e=this._$AH,n=t===p&&e!==p||t.capture!==e.capture||t.once!==e.once||t.passive!==e.passive,o=t!==p&&(e===p||n);n&&this.element.removeEventListener(this.name,this,e),o&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}},Q=class{constructor(t,s,e){this.element=t,this.type=6,this._$AN=void 0,this._$AM=s,this.options=e}get _$AU(){return this._$AM._$AU}_$AI(t){C(this,t)}};var Nt=tt.litHtmlPolyfillSupport;Nt?.(M,I),(tt.litHtmlVersions??=[]).push("3.3.2");var L=(i,t,s)=>{let e=s?.renderBefore??t,n=e._$litPart$;if(n===void 0){let o=s?.renderBefore??null;e._$litPart$=n=new I(t.insertBefore(k(),o),o,void 0,s??{})}return n._$AI(i),n};var it=globalThis,x=class extends ${constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){let s=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=L(s,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return m}};x._$litElement$=!0,x.finalized=!0,it.litElementHydrateSupport?.({LitElement:x});var Dt=it.litElementPolyfillSupport;Dt?.({LitElement:x});(it.litElementVersions??=[]).push("4.2.2");var Et={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},Ct=i=>(...t)=>({_$litDirective$:i,values:t}),G=class{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,s,e){this._$Ct=t,this._$AM=s,this._$Ci=e}_$AS(t,s){return this.update(t,s)}update(t,s){return this.render(...s)}};var wt=Ct(class extends G{constructor(i){if(super(i),i.type!==Et.ATTRIBUTE||i.name!=="class"||i.strings?.length>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(i){return" "+Object.keys(i).filter(t=>i[t]).join(" ")+" "}update(i,[t]){if(this.st===void 0){this.st=new Set,i.strings!==void 0&&(this.nt=new Set(i.strings.join(" ").split(/\s/).filter(e=>e!=="")));for(let e in t)t[e]&&!this.nt?.has(e)&&this.st.add(e);return this.render(t)}let s=i.element.classList;for(let e of this.st)e in t||(s.remove(e),this.st.delete(e));for(let e in t){let n=!!t[e];n===this.st.has(e)||this.nt?.has(e)||(n?(s.add(e),this.st.add(e)):(s.remove(e),this.st.delete(e)))}return m}});var jt=[{value:"eye-closed",label:"Eye Closed"},{value:"x",label:"X Mark"},{value:"trash",label:"Trash"},{value:"close",label:"Close"},{value:"circle-slash",label:"Circle Slash"}],E=window.acquireVsCodeApi(),nt=document.getElementById("root"),l=window.__SETTINGS__||{showIcon:!0,showType:!0,showCommand:!0,showGroup:!0,hideIcon:"eye-closed",backupCount:0,configExists:!1,usedIcons:[],customConfigPath:null},q=!1,z=!1,U=i=>{Object.assign(l,i),R()},Bt=()=>{q=!q,R()},ot=()=>{q=!1,R()},Vt=()=>{try{console.log("[SettingsView] Saving settings..."),E.postMessage({command:"saveSettings",settings:{showIcon:l.showIcon,showType:l.showType,showCommand:l.showCommand,showGroup:l.showGroup,hideIcon:l.hideIcon}}),console.log("[SettingsView] Save message sent")}catch(i){console.error("Failed to save settings:",i),alert(`Failed to save settings: ${i}`)}},Gt=()=>l.usedIcons.map(i=>g`
      <span class="lp-icon-chip" title=${i}>
        <span class="codicon codicon-${i}"></span>
        <span class="lp-icon-chip-name">${i}</span>
      </span>
    `),f=(i,t,s,e)=>g`
  <button
    type="button"
    class=${wt({"lp-config-btn":!0,"lp-btn":!0,"lp-btn-secondary":!0,"lp-btn-danger":!!e?.danger,"lp-config-cta":!!e?.cta})}
    ?disabled=${e?.disabled??!1}
    title=${e?.title??t}
    aria-label=${e?.ariaLabel??t}
    @click=${()=>{e?.onClick?e.onClick():(ot(),E.postMessage({command:s}))}}
  >
    <span class="codicon codicon-${i}"></span><span class="lp-btn-text">${t}</span>
  </button>
`,R=()=>{if(nt){if(!window.__SETTINGS__){L(g`
        <div class="lp-settings-loading">
          <div class="lp-settings-loading-icon">⚙️</div>
          <div>Loading settings...</div>
        </div>
      `,nt);return}L(g`
      <div class="lp-settings-view">
        <div class="lp-settings-header">
          <h3><span class="codicon codicon-settings-gear"></span> Settings</h3>
          <div class="lp-top-actions">
            <button
              type="button"
              class="lp-icon-btn"
              title="Open Battlestation visual settings"
              aria-label="Open Battlestation visual settings"
              @click=${()=>E.postMessage({command:"openVisualSettings"})}
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
                ${f("file","Open","openConfig",{disabled:!l.configExists,title:l.configExists?"Open config file":"Generate config first",ariaLabel:"Open config file"})}
                ${f("folder-opened","Location","openConfigFolder",{title:"Open folder containing battle.json",ariaLabel:"Open config location"})}
                ${f("refresh",l.configExists?"Regen":"Generate","showGenerateConfig",{cta:!0,title:l.configExists?"Regenerate config from scanned sources":"Generate new config file",ariaLabel:l.configExists?"Regenerate config":"Generate config"})}
                ${l.backupCount>0?f("history","Undo","restoreConfig",{disabled:!l.configExists,title:`Restore a previous config (${l.backupCount})`,ariaLabel:"Restore previous config"}):null}
                ${l.configExists?f("trash","Delete","deleteConfig",{danger:!0,title:"Delete config file",ariaLabel:"Delete config file",onClick:()=>Bt()}):null}
              </div>
            </div>
            ${l.configExists&&q?g`
              <div class="lp-config-confirm">
                <div class="lp-config-confirm-text">
                  <span>Delete battle.json?</span><br> You can recover any you have generated previously on this machine later.
                </div>
                <div class="lp-config-confirm-actions">
                  ${f("trash","Delete","deleteConfig",{danger:!0,ariaLabel:"Confirm delete config file"})}
                  ${f("close","Cancel","",{onClick:()=>ot(),ariaLabel:"Cancel delete config"})}
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
          @click=${()=>{z=!z,R()}}
        >
          <span class="codicon codicon-${z?"chevron-down":"chevron-right"}"></span>
          <span>Advanced</span>
        </button>
        ${z?g`
          <div class="lp-generate-content">
            <div class="lp-setting-row">
              <div class="lp-setting-label">
                <div class="lp-setting-name">Config Location</div>
                <div class="lp-setting-desc">
                  ${l.customConfigPath?g`Custom: <code class="lp-inline-code">${l.customConfigPath}/battle.json</code>`:g`Default: <code class="lp-inline-code">.vscode/battle.json</code>`}
                </div>
              </div>
              <div class="lp-inline-actions">
                ${f("folder-opened","Change","changeConfigLocation",{title:"Choose a custom folder to store battle.json",ariaLabel:"Change config location",onClick:()=>E.postMessage({command:"changeConfigLocation"})})}
                ${l.customConfigPath?f("discard","Reset","resetConfigLocation",{title:"Reset to default location (.vscode/battle.json)",ariaLabel:"Reset config location",onClick:()=>E.postMessage({command:"resetConfigLocation"})}):null}
              </div>
            </div>
            <div class="lp-setting-row">
              <div class="lp-setting-label">
                <div class="lp-setting-name">Import Config</div>
                <div class="lp-setting-desc">Load an existing battle.json from disk. Your current config will be backed up first.</div>
              </div>
              ${f("desktop-download","Import","importConfig",{title:"Browse for a JSON config file to import",ariaLabel:"Import config file",onClick:()=>E.postMessage({command:"importConfig"})})}
            </div>
          </div>
        `:null}
        </div>

        <div class="lp-setting-group">
          <div class="lp-setting-group-title">🎨 Display</div>
          <div class="lp-setting-row">
          <div class="lp-setting-label">
            <div class="lp-setting-name">Show Icons</div>
            <div class="lp-setting-desc">Display codicons next to button names</div>
          </div>
          <label class="lp-setting-toggle">
            <input
              type="checkbox"
              .checked=${l.showIcon}
              @change=${i=>U({showIcon:i.target.checked})}
            />
            <span class="lp-toggle-slider"></span>
          </label>
        </div>
          <div class="lp-setting-row">
          <div class="lp-setting-label">
            <div class="lp-setting-name">Show Type</div>
            <div class="lp-setting-desc">Display command type (npm, shell, vscode, etc.)</div>
          </div>
          <label class="lp-setting-toggle">
            <input
              type="checkbox"
              .checked=${l.showType}
              @change=${i=>U({showType:i.target.checked})}
            />
            <span class="lp-toggle-slider"></span>
          </label>
        </div>
          <div class="lp-setting-row">
          <div class="lp-setting-label">
            <div class="lp-setting-name">Show Command</div>
            <div class="lp-setting-desc">Display the actual command text</div>
          </div>
          <label class="lp-setting-toggle">
            <input
              type="checkbox"
              .checked=${l.showCommand}
              @change=${i=>U({showCommand:i.target.checked})}
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
              .checked=${l.showGroup}
              @change=${i=>U({showGroup:i.target.checked})}
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
            .value=${l.hideIcon}
            @change=${i=>U({hideIcon:i.target.value})}
          >
            ${jt.map(i=>g`<option value=${i.value}>${i.label}</option>`)}
          </select>
          </div>
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
                >codicons</a
              are supported—just add them to your config and refresh.
              </div>
            </div>
            <div class="lp-loaded-icons-wrap">
              <div class="lp-loaded-icons-title">Currently Loaded (${l.usedIcons.length} icons):</div>
              <div class="lp-loaded-icons-grid">${Gt()}</div>
            </div>
          </div>
        </div>
      
        <div class="lp-form-actions">
          <button
            type="button"
            class="lp-btn lp-btn-secondary"
            @click=${()=>{console.log("[SettingsView] Cancel clicked"),ot(),E.postMessage({command:"cancelForm"})}}
          >
            Cancel
          </button>
          <button
            type="button"
            class="lp-btn lp-btn-primary"
            @click=${()=>{console.log("[SettingsView] Save button clicked"),Vt()}}
          >
            Save Settings
          </button>
        </div>
      </div>

    `,nt)}};R();
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
