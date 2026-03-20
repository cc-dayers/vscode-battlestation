var oe=globalThis,re=oe.ShadowRoot&&(oe.ShadyCSS===void 0||oe.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,Le=Symbol(),Ie=new WeakMap,ae=class{constructor(e,n,s){if(this._$cssResult$=!0,s!==Le)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=n}get styleSheet(){let e=this.o,n=this.t;if(re&&e===void 0){let s=n!==void 0&&n.length===1;s&&(e=Ie.get(n)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),s&&Ie.set(n,e))}return e}toString(){return this.cssText}},Oe=t=>new ae(typeof t=="string"?t:t+"",void 0,Le);var Ge=(t,e)=>{if(re)t.adoptedStyleSheets=e.map(n=>n instanceof CSSStyleSheet?n:n.styleSheet);else for(let n of e){let s=document.createElement("style"),o=oe.litNonce;o!==void 0&&s.setAttribute("nonce",o),s.textContent=n.cssText,t.appendChild(s)}},ue=re?t=>t:t=>t instanceof CSSStyleSheet?(e=>{let n="";for(let s of e.cssRules)n+=s.cssText;return Oe(n)})(t):t;var{is:pt,defineProperty:dt,getOwnPropertyDescriptor:ut,getOwnPropertyNames:ht,getOwnPropertySymbols:gt,getPrototypeOf:mt}=Object,le=globalThis,Re=le.trustedTypes,$t=Re?Re.emptyScript:"",vt=le.reactiveElementPolyfillSupport,W=(t,e)=>t,he={toAttribute(t,e){switch(e){case Boolean:t=t?$t:null;break;case Object:case Array:t=t==null?t:JSON.stringify(t)}return t},fromAttribute(t,e){let n=t;switch(e){case Boolean:n=t!==null;break;case Number:n=t===null?null:Number(t);break;case Object:case Array:try{n=JSON.parse(t)}catch{n=null}}return n}},Ue=(t,e)=>!pt(t,e),Be={attribute:!0,type:String,converter:he,reflect:!1,useDefault:!1,hasChanged:Ue};Symbol.metadata??=Symbol("metadata"),le.litPropertyMetadata??=new WeakMap;var P=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,n=Be){if(n.state&&(n.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((n=Object.create(n)).wrapped=!0),this.elementProperties.set(e,n),!n.noAccessor){let s=Symbol(),o=this.getPropertyDescriptor(e,s,n);o!==void 0&&dt(this.prototype,e,o)}}static getPropertyDescriptor(e,n,s){let{get:o,set:a}=ut(this.prototype,e)??{get(){return this[n]},set(r){this[n]=r}};return{get:o,set(r){let l=o?.call(this);a?.call(this,r),this.requestUpdate(e,l,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??Be}static _$Ei(){if(this.hasOwnProperty(W("elementProperties")))return;let e=mt(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(W("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(W("properties"))){let n=this.properties,s=[...ht(n),...gt(n)];for(let o of s)this.createProperty(o,n[o])}let e=this[Symbol.metadata];if(e!==null){let n=litPropertyMetadata.get(e);if(n!==void 0)for(let[s,o]of n)this.elementProperties.set(s,o)}this._$Eh=new Map;for(let[n,s]of this.elementProperties){let o=this._$Eu(n,s);o!==void 0&&this._$Eh.set(o,n)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let n=[];if(Array.isArray(e)){let s=new Set(e.flat(1/0).reverse());for(let o of s)n.unshift(ue(o))}else e!==void 0&&n.push(ue(e));return n}static _$Eu(e,n){let s=n.attribute;return s===!1?void 0:typeof s=="string"?s:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,n=this.constructor.elementProperties;for(let s of n.keys())this.hasOwnProperty(s)&&(e.set(s,this[s]),delete this[s]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return Ge(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,n,s){this._$AK(e,s)}_$ET(e,n){let s=this.constructor.elementProperties.get(e),o=this.constructor._$Eu(e,s);if(o!==void 0&&s.reflect===!0){let a=(s.converter?.toAttribute!==void 0?s.converter:he).toAttribute(n,s.type);this._$Em=e,a==null?this.removeAttribute(o):this.setAttribute(o,a),this._$Em=null}}_$AK(e,n){let s=this.constructor,o=s._$Eh.get(e);if(o!==void 0&&this._$Em!==o){let a=s.getPropertyOptions(o),r=typeof a.converter=="function"?{fromAttribute:a.converter}:a.converter?.fromAttribute!==void 0?a.converter:he;this._$Em=o;let l=r.fromAttribute(n,a.type);this[o]=l??this._$Ej?.get(o)??l,this._$Em=null}}requestUpdate(e,n,s,o=!1,a){if(e!==void 0){let r=this.constructor;if(o===!1&&(a=this[e]),s??=r.getPropertyOptions(e),!((s.hasChanged??Ue)(a,n)||s.useDefault&&s.reflect&&a===this._$Ej?.get(e)&&!this.hasAttribute(r._$Eu(e,s))))return;this.C(e,n,s)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,n,{useDefault:s,reflect:o,wrapped:a},r){s&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,r??n??this[e]),a!==!0||r!==void 0)||(this._$AL.has(e)||(this.hasUpdated||s||(n=void 0),this._$AL.set(e,n)),o===!0&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(n){Promise.reject(n)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[o,a]of this._$Ep)this[o]=a;this._$Ep=void 0}let s=this.constructor.elementProperties;if(s.size>0)for(let[o,a]of s){let{wrapped:r}=a,l=this[o];r!==!0||this._$AL.has(o)||l===void 0||this.C(o,void 0,a,l)}}let e=!1,n=this._$AL;try{e=this.shouldUpdate(n),e?(this.willUpdate(n),this._$EO?.forEach(s=>s.hostUpdate?.()),this.update(n)):this._$EM()}catch(s){throw e=!1,this._$EM(),s}e&&this._$AE(n)}willUpdate(e){}_$AE(e){this._$EO?.forEach(n=>n.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(n=>this._$ET(n,this[n])),this._$EM()}updated(e){}firstUpdated(e){}};P.elementStyles=[],P.shadowRootOptions={mode:"open"},P[W("elementProperties")]=new Map,P[W("finalized")]=new Map,vt?.({ReactiveElement:P}),(le.reactiveElementVersions??=[]).push("2.1.2");var be=globalThis,Ne=t=>t,ie=be.trustedTypes,Fe=ie?ie.createPolicy("lit-html",{createHTML:t=>t}):void 0,ze="$lit$",D=`lit$${Math.random().toFixed(9).slice(2)}$`,Qe="?"+D,ft=`<${Qe}>`,L=document,z=()=>L.createComment(""),Q=t=>t===null||typeof t!="object"&&typeof t!="function",Ae=Array.isArray,yt=t=>Ae(t)||typeof t?.[Symbol.iterator]=="function",ge=`[ 	
\f\r]`,V=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Ke=/-->/g,je=/>/g,H=RegExp(`>|${ge}(?:([^\\s"'>=/]+)(${ge}*=${ge}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),qe=/'/g,We=/"/g,Ye=/^(?:script|style|textarea|title)$/i,we=t=>(e,...n)=>({_$litType$:t,strings:e,values:n}),u=we(1),gn=we(2),mn=we(3),O=Symbol.for("lit-noChange"),$=Symbol.for("lit-nothing"),Ve=new WeakMap,I=L.createTreeWalker(L,129);function Xe(t,e){if(!Ae(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return Fe!==void 0?Fe.createHTML(e):e}var bt=(t,e)=>{let n=t.length-1,s=[],o,a=e===2?"<svg>":e===3?"<math>":"",r=V;for(let l=0;l<n;l++){let d=t[l],h,m,p=-1,v=0;for(;v<d.length&&(r.lastIndex=v,m=r.exec(d),m!==null);)v=r.lastIndex,r===V?m[1]==="!--"?r=Ke:m[1]!==void 0?r=je:m[2]!==void 0?(Ye.test(m[2])&&(o=RegExp("</"+m[2],"g")),r=H):m[3]!==void 0&&(r=H):r===H?m[0]===">"?(r=o??V,p=-1):m[1]===void 0?p=-2:(p=r.lastIndex-m[2].length,h=m[1],r=m[3]===void 0?H:m[3]==='"'?We:qe):r===We||r===qe?r=H:r===Ke||r===je?r=V:(r=H,o=void 0);let y=r===H&&t[l+1].startsWith("/>")?" ":"";a+=r===V?d+ft:p>=0?(s.push(h),d.slice(0,p)+ze+d.slice(p)+D+y):d+D+(p===-2?l:y)}return[Xe(t,a+(t[n]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),s]},Y=class t{constructor({strings:e,_$litType$:n},s){let o;this.parts=[];let a=0,r=0,l=e.length-1,d=this.parts,[h,m]=bt(e,n);if(this.el=t.createElement(h,s),I.currentNode=this.el.content,n===2||n===3){let p=this.el.content.firstChild;p.replaceWith(...p.childNodes)}for(;(o=I.nextNode())!==null&&d.length<l;){if(o.nodeType===1){if(o.hasAttributes())for(let p of o.getAttributeNames())if(p.endsWith(ze)){let v=m[r++],y=o.getAttribute(p).split(D),w=/([.?@])?(.*)/.exec(v);d.push({type:1,index:a,name:w[2],strings:y,ctor:w[1]==="."?$e:w[1]==="?"?ve:w[1]==="@"?fe:N}),o.removeAttribute(p)}else p.startsWith(D)&&(d.push({type:6,index:a}),o.removeAttribute(p));if(Ye.test(o.tagName)){let p=o.textContent.split(D),v=p.length-1;if(v>0){o.textContent=ie?ie.emptyScript:"";for(let y=0;y<v;y++)o.append(p[y],z()),I.nextNode(),d.push({type:2,index:++a});o.append(p[v],z())}}}else if(o.nodeType===8)if(o.data===Qe)d.push({type:2,index:a});else{let p=-1;for(;(p=o.data.indexOf(D,p+1))!==-1;)d.push({type:7,index:a}),p+=D.length-1}a++}}static createElement(e,n){let s=L.createElement("template");return s.innerHTML=e,s}};function U(t,e,n=t,s){if(e===O)return e;let o=s!==void 0?n._$Co?.[s]:n._$Cl,a=Q(e)?void 0:e._$litDirective$;return o?.constructor!==a&&(o?._$AO?.(!1),a===void 0?o=void 0:(o=new a(t),o._$AT(t,n,s)),s!==void 0?(n._$Co??=[])[s]=o:n._$Cl=o),o!==void 0&&(e=U(t,o._$AS(t,e.values),o,s)),e}var me=class{constructor(e,n){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=n}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:n},parts:s}=this._$AD,o=(e?.creationScope??L).importNode(n,!0);I.currentNode=o;let a=I.nextNode(),r=0,l=0,d=s[0];for(;d!==void 0;){if(r===d.index){let h;d.type===2?h=new X(a,a.nextSibling,this,e):d.type===1?h=new d.ctor(a,d.name,d.strings,this,e):d.type===6&&(h=new ye(a,this,e)),this._$AV.push(h),d=s[++l]}r!==d?.index&&(a=I.nextNode(),r++)}return I.currentNode=L,o}p(e){let n=0;for(let s of this._$AV)s!==void 0&&(s.strings!==void 0?(s._$AI(e,s,n),n+=s.strings.length-2):s._$AI(e[n])),n++}},X=class t{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,n,s,o){this.type=2,this._$AH=$,this._$AN=void 0,this._$AA=e,this._$AB=n,this._$AM=s,this.options=o,this._$Cv=o?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,n=this._$AM;return n!==void 0&&e?.nodeType===11&&(e=n.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,n=this){e=U(this,e,n),Q(e)?e===$||e==null||e===""?(this._$AH!==$&&this._$AR(),this._$AH=$):e!==this._$AH&&e!==O&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):yt(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==$&&Q(this._$AH)?this._$AA.nextSibling.data=e:this.T(L.createTextNode(e)),this._$AH=e}$(e){let{values:n,_$litType$:s}=e,o=typeof s=="number"?this._$AC(e):(s.el===void 0&&(s.el=Y.createElement(Xe(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===o)this._$AH.p(n);else{let a=new me(o,this),r=a.u(this.options);a.p(n),this.T(r),this._$AH=a}}_$AC(e){let n=Ve.get(e.strings);return n===void 0&&Ve.set(e.strings,n=new Y(e)),n}k(e){Ae(this._$AH)||(this._$AH=[],this._$AR());let n=this._$AH,s,o=0;for(let a of e)o===n.length?n.push(s=new t(this.O(z()),this.O(z()),this,this.options)):s=n[o],s._$AI(a),o++;o<n.length&&(this._$AR(s&&s._$AB.nextSibling,o),n.length=o)}_$AR(e=this._$AA.nextSibling,n){for(this._$AP?.(!1,!0,n);e!==this._$AB;){let s=Ne(e).nextSibling;Ne(e).remove(),e=s}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},N=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,n,s,o,a){this.type=1,this._$AH=$,this._$AN=void 0,this.element=e,this.name=n,this._$AM=o,this.options=a,s.length>2||s[0]!==""||s[1]!==""?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=$}_$AI(e,n=this,s,o){let a=this.strings,r=!1;if(a===void 0)e=U(this,e,n,0),r=!Q(e)||e!==this._$AH&&e!==O,r&&(this._$AH=e);else{let l=e,d,h;for(e=a[0],d=0;d<a.length-1;d++)h=U(this,l[s+d],n,d),h===O&&(h=this._$AH[d]),r||=!Q(h)||h!==this._$AH[d],h===$?e=$:e!==$&&(e+=(h??"")+a[d+1]),this._$AH[d]=h}r&&!o&&this.j(e)}j(e){e===$?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}},$e=class extends N{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===$?void 0:e}},ve=class extends N{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==$)}},fe=class extends N{constructor(e,n,s,o,a){super(e,n,s,o,a),this.type=5}_$AI(e,n=this){if((e=U(this,e,n,0)??$)===O)return;let s=this._$AH,o=e===$&&s!==$||e.capture!==s.capture||e.once!==s.once||e.passive!==s.passive,a=e!==$&&(s===$||o);o&&this.element.removeEventListener(this.name,this,s),a&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},ye=class{constructor(e,n,s){this.element=e,this.type=6,this._$AN=void 0,this._$AM=n,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(e){U(this,e)}};var At=be.litHtmlPolyfillSupport;At?.(Y,X),(be.litHtmlVersions??=[]).push("3.3.2");var ce=(t,e,n)=>{let s=n?.renderBefore??e,o=s._$litPart$;if(o===void 0){let a=n?.renderBefore??null;s._$litPart$=o=new X(e.insertBefore(z(),a),a,void 0,n??{})}return o._$AI(t),o};var Ee=globalThis,F=class extends P{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let n=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=ce(n,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return O}};F._$litElement$=!0,F.finalized=!0,Ee.litElementHydrateSupport?.({LitElement:F});var wt=Ee.litElementPolyfillSupport;wt?.({LitElement:F});(Ee.litElementVersions??=[]).push("4.2.2");var g=window.acquireVsCodeApi(),Je=document.getElementById("root"),_e=!1,ke=!1,b=()=>{if(_e){ke=!0;return}x()},Et=t=>{_e=!0;try{t()}finally{_e=!1,ke&&(ke=!1,x())}};window.addEventListener("resize",()=>{g.postMessage({command:"webviewResized",width:window.innerWidth})});setTimeout(()=>{g.postMessage({command:"webviewResized",width:window.innerWidth})},100);var Se={actions:[],groups:[],searchQuery:"",loading:!1,generating:!1,display:{showCommand:!0,showGroup:!0,hideIcon:"eye-closed",playButtonBg:"transparent",actionToolbar:["hide","setColor","edit","delete"]},iconMap:{},collapsedGroups:[],showSearch:!1,showHidden:!1,selectionMode:!1,selectedItems:[],openActionMenuFor:null,runStatus:{}};window.__INITIAL_DATA__&&Object.assign(Se,window.__INITIAL_DATA__);var Me=g.getState()||{};Me.collapsedGroups&&(Se.collapsedGroups=Me.collapsedGroups);var i=new Proxy(Se,{set(t,e,n){return Reflect.set(t,e,n),b(),e==="collapsedGroups"&&g.setState({...Me,collapsedGroups:n}),!0}}),f=null,k=null,te=!0,S=null,A=null,T=null,ne=!0,E=null,j=!1,q=!0,Ze=!1,_=null,J=!0,Z=!1,ee=!1,G=!1,C=!1,_t=()=>{B(),E=null,_=null,G=!0,b()},kt=()=>{f=null,k=null,S=null,G=!1,b()},Mt=(t,e)=>{f=e,t.dataTransfer.effectAllowed="move";let n=t.currentTarget.closest(".lp-btn-wrapper");if(n){let s=n.getBoundingClientRect(),o=t.clientX-s.left,a=t.clientY-s.top;t.dataTransfer.setDragImage(n,o,a)}setTimeout(()=>b(),0)},Ct=(t,e)=>{if(!f||f===e)return;t.preventDefault(),t.dataTransfer.dropEffect="move";let s=t.currentTarget.getBoundingClientRect(),o=t.clientY<s.top+s.height/2;(k!==e||te!==o)&&(k=e,te=o,b())},St=(t,e)=>{let n=t.relatedTarget;!t.currentTarget.contains(n)&&k===e&&(k=null,b())},Tt=(t,e)=>{if(t.preventDefault(),!f||f===e)return;let n={...f};e.group!==void 0?n.group=e.group:delete n.group;let s=i.actions.map(d=>d===f?n:d),o=s.indexOf(n),a=s.indexOf(e);if(o===-1||a===-1){f=null,k=null,S=null;return}s.splice(o,1);let r=s.indexOf(e),l=te?r:r+1;s.splice(l,0,n),f=null,k=null,S=null,i.actions=s,g.postMessage({command:"reorderActions",actions:s})},et=(t,e)=>{let n=[...i.actions],s=n.indexOf(t);if(e==="up"&&s<=0||e==="down"&&s>=n.length-1)return;let o=e==="up"?s-1:s+1;[n[s],n[o]]=[n[o],n[s]],i.actions=n,g.postMessage({command:"reorderActions",actions:n})},xt=()=>{f=null,k=null,S=null,A=null,T=null,b()},Pt=(t,e)=>{A=e,t.dataTransfer.effectAllowed="move";let n=t.currentTarget.closest(".lp-group-header");if(n){let s=n.getBoundingClientRect();t.dataTransfer.setDragImage(n,t.clientX-s.left,t.clientY-s.top)}setTimeout(()=>b(),0)},Dt=()=>{A=null,T=null,b()},Ht=(t,e)=>{if(A){if(A===e)return;t.preventDefault(),t.stopPropagation(),t.dataTransfer.dropEffect="move";let s=t.currentTarget.getBoundingClientRect(),o=t.clientY<s.top+s.height/2;(T!==e||ne!==o)&&(T=e,ne=o,b());return}f&&(t.preventDefault(),t.stopPropagation(),t.dataTransfer.dropEffect="move",S!==e.name&&(k=null,S=e.name,b()))},It=(t,e)=>{if(A){let n=t.relatedTarget;!t.currentTarget.contains(n)&&T===e&&(T=null,b());return}S===e.name&&(S=null,b())},Lt=(t,e)=>{if(t.preventDefault(),t.stopPropagation(),A){if(A===e)return;let l=[...i.groups],d=A,h=l.findIndex(w=>w===d),m=l.findIndex(w=>w===e);if(h===-1||m===-1){A=null,T=null;return}let[p]=l.splice(h,1),v=l.findIndex(w=>w===e),y=ne?v:v+1;l.splice(y,0,p),A=null,T=null,i.groups=l,g.postMessage({command:"reorderGroups",groups:l});return}let n=f;if(!n)return;let s={...n,group:e.name},o=i.actions.filter(l=>l!==n),a=o.length;for(let l=o.length-1;l>=0;l--)if(o[l].group===e.name){a=l+1;break}let r=[...o.slice(0,a),s,...o.slice(a)];f=null,k=null,S=null,i.actions=r,g.postMessage({command:"reorderActions",actions:r})},tt=t=>{let e=new Set(i.collapsedGroups);e.has(t)?e.delete(t):e.add(t),i.collapsedGroups=Array.from(e)},Ot=t=>{g.postMessage({command:"executeCommand",item:t})},Gt=t=>{g.postMessage({command:"editAction",item:t})},Rt=(t,e)=>{B(),_=null,E===e?E=null:(E=e,q=!0,j=!!t.backgroundColor),x()},Bt=t=>{g.postMessage({command:"deleteAction",item:t})},nt=(t,e)=>{g.postMessage({command:"assignGroup",item:t,groupName:e})},Ut=(t,e)=>{g.postMessage({command:"bulkAssignGroup",items:t,groupName:e}),C=!1,x()},Te=t=>encodeURIComponent(`${t.name}|${t.command}|${t.type}|${t.workspace??""}`),st=(t,e)=>{t.isOpen()||t.open(),e==="last"?t.focusLast():t.focusFirst()},Nt=(t,e)=>{if(t.key==="Escape"&&e.isOpen()){t.preventDefault(),e.close(!0);return}if(t.key==="Enter"||t.key===" "||t.key==="ArrowDown"){t.preventDefault(),st(e,"first");return}t.key==="ArrowUp"&&(t.preventDefault(),st(e,"last"))},Ft=(t,e)=>{let n=t.currentTarget,s=e.getMenuItems(n);if(!s.length)return;let o=s.indexOf(document.activeElement);if(t.key==="Escape"){t.preventDefault(),e.close(!0);return}if(t.key==="Tab"){e.close();return}if(t.key==="Home"){t.preventDefault(),s[0].focus();return}if(t.key==="End"){t.preventDefault(),s[s.length-1].focus();return}if(t.key==="ArrowDown"){t.preventDefault();let a=o>=0?(o+1)%s.length:0;s[a].focus();return}if(t.key==="ArrowUp"){t.preventDefault();let a=o>=0?(o-1+s.length)%s.length:s.length-1;s[a].focus()}},Kt=t=>{let e=Te(t);requestAnimationFrame(()=>{document.querySelector(`.lp-menu-trigger[data-action-menu-id="${e}"]`)?.focus()})},ot=(t,e="first")=>{let n=Te(t);requestAnimationFrame(()=>{let s=document.querySelector(`.lp-menu-panel[data-action-menu-id="${n}"]`);if(!s)return;let o=Array.from(s.querySelectorAll(".lp-menu-item"));if(!o.length)return;(e==="last"?o[o.length-1]:o[0]).focus()})},at=t=>({isOpen:()=>i.openActionMenuFor===t,open:()=>{i.openActionMenuFor=t},close:(e=!1)=>B(e?t:void 0),focusFirst:()=>ot(t,"first"),focusLast:()=>ot(t,"last"),getMenuItems:e=>Array.from(e.querySelectorAll(".lp-menu-item"))}),jt=(t,e)=>{t.stopPropagation(),E=null,_=null,i.openActionMenuFor=i.openActionMenuFor===e?null:e},B=t=>{i.openActionMenuFor&&(i.openActionMenuFor=null),t&&Kt(t)},K=t=>{t(),B()},qt=(t,e)=>{Nt(t,at(e))},Wt=(t,e)=>{Ft(t,at(e))},Vt=t=>{g.postMessage({command:"hideAction",item:t})},zt=t=>{g.postMessage({command:"editGroup",group:t})},Qt=t=>{g.postMessage({command:"hideGroup",group:t})},Yt=t=>`grp-${encodeURIComponent(t.name)}`,Xt=(t,e)=>{B(),E=null,_===e?_=null:(_=e,J=!0,Z=!!t.backgroundColor,ee=!!t.borderColor),x()},Jt=t=>{let e=t.color||t.backgroundColor||t.borderColor||"",n=a=>{g.postMessage({command:"setGroupColor",group:t,color:a,applyToAccent:J,applyToBg:Z,applyToBorder:ee})},s=a=>n(a.target.value),o=a=>{let r=a.target.value.trim();r&&n(r)};return u`
        <div class="lp-cp-popout" @click=${a=>a.stopPropagation()}>
            <div class="lp-cp-swatches">
                ${rt.map(a=>u`
                    <button class="lp-cp-swatch ${e===a.value?"lp-cp-swatch--active":""}"
                        style="background:${a.value}" title=${a.name}
                        @click=${()=>n(a.value)}></button>
                `)}
                <button class="lp-cp-swatch lp-cp-swatch--clear" title="Clear color"
                    @click=${()=>n("")}>
                    <span class="codicon codicon-circle-slash"></span>
                </button>
            </div>
            <div class="lp-cp-custom-row">
                <div class="lp-cp-preview" style="background:${e||"transparent"}"></div>
                <input class="lp-cp-text" type="text" placeholder="#hex or var(--color)"
                    value=${e}
                    @change=${o}>
                <label class="lp-cp-native-wrap" title="Open color wheel">
                    <input type="color" value=${e.startsWith("#")?e:"#000000"}
                        @change=${s}>
                    <span class="codicon codicon-color-mode"></span>
                </label>
            </div>
            <div class="lp-cp-targets">
                <span class="lp-cp-targets-hd">Apply to</span>
                <div class="lp-cp-target-btns">
                    <label class="lp-cp-target-label">
                        <input type="checkbox" .checked=${J}
                            @change=${a=>{J=a.target.checked,J?e&&n(e):g.postMessage({command:"setGroupColor",group:t,color:"",applyToAccent:!0,applyToBg:!1,applyToBorder:!1})}}>
                        Accent
                    </label>
                    <label class="lp-cp-target-label">
                        <input type="checkbox" .checked=${Z}
                            @change=${a=>{Z=a.target.checked,Z?e&&n(e):g.postMessage({command:"setGroupColor",group:t,color:"",applyToAccent:!1,applyToBg:!0,applyToBorder:!1})}}>
                        BG
                    </label>
                    <label class="lp-cp-target-label">
                        <input type="checkbox" .checked=${ee}
                            @change=${a=>{ee=a.target.checked,ee?e&&n(e):g.postMessage({command:"setGroupColor",group:t,color:"",applyToAccent:!1,applyToBg:!1,applyToBorder:!0})}}>
                        Border
                    </label>
                </div>
            </div>
        </div>
    `},Zt=t=>{let e=Math.floor((Date.now()-t)/1e3);if(e<60)return`${e}s ago`;let n=Math.floor(e/60);return n<60?`${n}m ago`:`${Math.floor(n/60)}h ago`},en=t=>{if(t.type==="npm"&&t.command.startsWith("npm run "))return t.command.replace("npm run ","");if(t.type==="task"){let e=t.command.split("|")[1];return e||"task"}if(t.type==="launch"){let e=t.command.split("|")[1];return e||"launch"}if(t.type==="vscode"){let[e,n]=t.command.split("|");return e==="workbench.action.tasks.runTask"?n||"task":e==="workbench.action.debug.start"?n||"launch":n?`${e} ${n}`:e}return t.command},tn=t=>{let e=`lp-menu-container lp-menu-container--${t.kind}`,n=`lp-menu-trigger lp-menu-trigger--${t.kind}`,s=`lp-menu-panel lp-menu-panel--${t.kind}`;return u`
        <div
            class=${e}
            data-action-menu-id=${t.kind==="action"?t.menuId:""}
            data-group-menu-id=${t.kind==="group"?t.menuId:""}>
            <button
                class=${n}
                title=${t.triggerTitle}
                aria-label=${t.triggerAriaLabel}
                aria-haspopup="true"
                aria-expanded=${t.isOpen?"true":"false"}
                data-action-menu-id=${t.kind==="action"?t.menuId:""}
                data-group-menu-id=${t.kind==="group"?t.menuId:""}
                @click=${t.onTriggerClick}
                @keydown=${t.onTriggerKeydown}>
                <span class="codicon codicon-ellipsis"></span>
            </button>

            ${t.isOpen?u`
                <div
                    class=${s}
                    data-action-menu-id=${t.kind==="action"?t.menuId:""}
                    data-group-menu-id=${t.kind==="group"?t.menuId:""}
                    role="menu"
                    @click=${t.onMenuClick}
                    @keydown=${t.onMenuKeydown}>
                    ${t.menuContent}
                </div>
            `:null}
        </div>
    `},nn=[{name:"Forest",value:"#162d1e"},{name:"Ocean",value:"#0e1e30"},{name:"Dusk",value:"#1e1030"},{name:"Ember",value:"#2e160a"},{name:"Slate",value:"#141e28"},{name:"Olive",value:"#1e2210"},{name:"Teal",value:"#0e2828"},{name:"Crimson",value:"#2e0e0e"}],rt=[{name:"Red",value:"var(--vscode-charts-red)"},{name:"Orange",value:"var(--vscode-charts-orange)"},{name:"Yellow",value:"var(--vscode-charts-yellow)"},{name:"Green",value:"var(--vscode-charts-green)"},{name:"Blue",value:"var(--vscode-charts-blue)"},{name:"Purple",value:"var(--vscode-charts-purple)"},{name:"Pink",value:"var(--vscode-charts-pink)"},{name:"Error",value:"var(--vscode-errorForeground)"},{name:"Warning",value:"var(--vscode-editorWarning-foreground)"},{name:"Info",value:"var(--vscode-editorInfo-foreground)"},{name:"Success",value:"var(--vscode-testing-iconPassed)"}],sn=t=>{let e=t.match(/^#([0-9a-f]{6})$/i);if(!e)return null;let n=parseInt(e[1].slice(0,2),16)/255,s=parseInt(e[1].slice(2,4),16)/255,o=parseInt(e[1].slice(4,6),16)/255,a=Math.max(n,s,o),r=Math.min(n,s,o),l=a-r,d=0,h=0,m=(a+r)/2;return l>0&&(h=l/(m>.5?2-a-r:a+r),d=a===n?(s-o)/l+(s<o?6:0):a===s?(o-n)/l+2:(n-s)/l+4,d/=6),[d*360,h*100,m*100]},pe=(t,e,n)=>{t/=360,e/=100,n/=100;let s=o=>{let a=(o+t*12)%12,r=e*Math.min(n,1-n);return n-r*Math.max(-1,Math.min(a-3,9-a,1))};return"#"+[s(0),s(8),s(4)].map(o=>Math.round(o*255).toString(16).padStart(2,"0")).join("")},on=t=>{let e=sn(t);if(!e)return[];let[n,s,o]=e,a=Math.max(Math.min(s,65),25),r=Math.max(Math.min(o,32),8);return[pe((n+30)%360,a,r),pe((n-30+360)%360,a,r),pe((n+150)%360,a,r),pe((n+180)%360,a,r)]},an=t=>{let e=t.rowBackgroundColor||t.backgroundColor||"",n=e.startsWith("#")?on(e):[],s=l=>{g.postMessage({command:"setActionColor",item:t,color:l,applyToPlay:j,applyToRow:q})},o=()=>{g.postMessage({command:"setActionColor",item:t,color:"",applyToPlay:j,applyToRow:q})},a=l=>s(l.target.value),r=l=>{let d=l.target.value.trim();d&&s(d)};return u`
        <div class="lp-cp-popout" @click=${l=>l.stopPropagation()}>
            <div class="lp-cp-swatches">
                ${nn.map(l=>u`
                    <button class="lp-cp-swatch ${e===l.value?"lp-cp-swatch--active":""}"
                        style="background:${l.value}" title=${l.name}
                        @click=${()=>s(l.value)}></button>
                `)}
                <button class="lp-cp-swatch lp-cp-swatch--clear" title="Clear color"
                    @click=${o}>
                    <span class="codicon codicon-circle-slash"></span>
                </button>
            </div>
            ${n.length?u`
                <div class="lp-cp-harmonies-row">
                    <span class="lp-cp-harmonies-label">Harmonies</span>
                    <div class="lp-cp-harmonies">
                        ${n.map(l=>u`
                            <button class="lp-cp-swatch lp-cp-swatch--sm ${e===l?"lp-cp-swatch--active":""}"
                                style="background:${l}" title=${l}
                                @click=${()=>s(l)}></button>
                        `)}
                    </div>
                </div>
            `:null}
            <div class="lp-cp-custom-row">
                <div class="lp-cp-preview" style="background:${e||"transparent"}"></div>
                <input class="lp-cp-text" type="text" placeholder="#hex or var(--color)"
                    value=${e}
                    @change=${r}>
                <label class="lp-cp-native-wrap" title="Open color wheel">
                    <input type="color" value=${e.startsWith("#")?e:"#000000"}
                        @change=${a}>
                    <span class="codicon codicon-color-mode"></span>
                </label>
            </div>
            <details class="lp-cp-theme-section" .open=${Ze}
                @toggle=${l=>{Ze=l.target.open}}>
                <summary class="lp-cp-theme-toggle">
                    <span class="codicon codicon-chevron-right lp-cp-theme-chevron"></span>
                    VSCode theme colors
                </summary>
                <div class="lp-cp-swatches lp-cp-theme-swatches">
                    ${rt.map(l=>u`
                        <button class="lp-cp-swatch ${e===l.value?"lp-cp-swatch--active":""}"
                            style="background:${l.value}" title=${l.name}
                            @click=${()=>s(l.value)}></button>
                    `)}
                </div>
            </details>
            <div class="lp-cp-targets">
                <span class="lp-cp-targets-hd">Apply to</span>
                <div class="lp-cp-target-btns">
                    <label class="lp-cp-target-label">
                        <input type="checkbox" .checked=${j}
                            @change=${l=>{j=l.target.checked,j?e&&s(e):g.postMessage({command:"setActionColor",item:t,color:"",applyToPlay:!0,applyToRow:!1})}}>
                        <span class="codicon codicon-play"></span>Play
                    </label>
                    <label class="lp-cp-target-label">
                        <input type="checkbox" .checked=${q}
                            @change=${l=>{q=l.target.checked,q?e&&s(e):g.postMessage({command:"setActionColor",item:t,color:"",applyToPlay:!1,applyToRow:!0})}}>
                        Row bg
                    </label>
                </div>
            </div>
        </div>
    `},Ce=t=>{let e=t.hidden,{display:n}=i,s=[],o=null;if(t.workspace){let c="";t.workspaceColor&&(c=`background-color: ${t.workspaceColor}; color: var(--vscode-editor-background); border: 1px solid color-mix(in srgb, var(--vscode-foreground) 20%, transparent); opacity: 0.9;`),o=u`<span class="lp-workspace-label" style="${c}">${t.workspace}</span>`}if(n.showCommand){let c=en(t),M=t.name.trim().toLowerCase();c.trim().toLowerCase()!==M&&t.command.trim().toLowerCase()!==M&&s.push(c)}let a=!!t.group,l=i.groups.length>0||a,d=i.openActionMenuFor===t,h=Te(t),m=f===t,p=k===t,v=["lp-btn-wrapper",e?"lp-hidden-item":"",m?"lp-dragging":"",p&&te?"lp-drag-over-top":"",p&&!te?"lp-drag-over-bottom":"",E===h?"lp-cp-open":"",d?"lp-menu-open":"",G?"lp-reorder-mode-row":""].filter(Boolean).join(" "),y=i.runStatus[t.name],w=y?u`<span
            class="lp-status-dot ${y.exitCode===0?"lp-status-ok":"lp-status-fail"}"
            title="Last run: ${Zt(y.timestamp)} — Exit ${y.exitCode}">
          </span>`:null,se={edit:{icon:"edit",label:"Edit",action:()=>Gt(t)},setColor:{icon:"symbol-color",label:"Set color",action:()=>Rt(t,h)},hide:{icon:e?"eye":n.hideIcon,label:e?"Show":"Hide",action:()=>Vt(t)},delete:{icon:"trash",label:"Delete",action:()=>Bt(t),dangerous:!0}},Pe=n.actionToolbar??["hide","setColor","edit","delete"],it=Pe.filter(c=>se[c]).map(c=>({id:c,...se[c]})),De=Object.keys(se).filter(c=>!Pe.includes(c)).map(c=>({id:c,...se[c]})),He=!i.searchQuery,ct=!G&&(De.length>0||l||He);return u`
    <div class=${v}
        data-action-name=${t.name}
        style=${t.rowBackgroundColor?`--lp-row-bg:${t.rowBackgroundColor}`:""}
        @dragover=${c=>Ct(c,t)}
        @dragleave=${c=>St(c,t)}
        @drop=${c=>Tt(c,t)}>
        ${i.selectionMode?u`<input type="checkbox" class="lp-btn-checkbox" .checked=${i.selectedItems.includes(t)} @change=${c=>{c.target.checked?i.selectedItems=[...i.selectedItems,t]:i.selectedItems=i.selectedItems.filter(M=>M!==t)}}>`:null}

        ${G?u`
        <button class="lp-reorder-handle" draggable="true"
            title="Drag to reorder"
            aria-label=${`Drag ${t.name} to reorder`}
            @dragstart=${c=>Mt(c,t)}
            @dragend=${xt}>
            <span class="codicon codicon-gripper"></span>
        </button>`:u`
        <button
            class="lp-play-btn"
            style=${t.backgroundColor?`--lp-play-btn-bg: ${t.backgroundColor}`:n.playButtonBg&&n.playButtonBg!=="transparent"?`--lp-play-btn-bg: ${n.playButtonBg}`:""}
            title="Run"
            aria-label=${`Run ${t.name}`}
            @click=${()=>Ot(t)}>
            <span class="codicon codicon-play"></span>
        </button>`}

        <div class="lp-btn ${i.selectionMode?"has-checkbox":""}">
             ${o}
             <span class="lp-btn-name">
                ${t.name}
                ${e?u`<span class="lp-hidden-badge">(hidden)</span>`:null}
                ${w}
                <span class="lp-action-toolbar" style=${G?"display:none":""}>
                    ${it.map(c=>c.id==="setColor"?u`
                        <div class="lp-cp-container">
                            <button class="lp-inline-action-btn ${E===h?"lp-cp-active":""}"
                                title=${c.label} aria-label="${c.label} ${t.name}"
                                @click=${M=>{M.stopPropagation(),c.action()}}>
                                <span class="codicon codicon-${c.icon}"></span>
                            </button>
                        </div>
                    `:u`
                        <button class="lp-inline-action-btn ${c.dangerous?"lp-btn-dangerous":""}"
                            title=${c.label} aria-label="${c.label} ${t.name}"
                            @click=${M=>{M.stopPropagation(),c.action()}}>
                            <span class="codicon codicon-${c.icon}"></span>
                        </button>
                    `)}
                    ${ct?tn({kind:"action",menuId:h,isOpen:d,triggerTitle:"More actions",triggerAriaLabel:`More actions for ${t.name}`,onTriggerClick:c=>jt(c,t),onTriggerKeydown:c=>qt(c,t),onMenuClick:c=>c.stopPropagation(),onMenuKeydown:c=>Wt(c,t),menuContent:u`
                            ${De.map(c=>u`
                                <button class="lp-menu-item lp-menu-item--action" role="menuitem"
                                    @click=${()=>K(()=>c.action())}>
                                    <span class="codicon codicon-${c.icon}"></span>
                                    ${c.label}
                                </button>
                            `)}
                            ${l?u`
                                <div class="lp-menu-divider"></div>
                                <button class="lp-menu-item lp-menu-item--action" role="menuitem" @click=${()=>K(()=>nt(t,"__none__"))}>
                                    <span class="codicon codicon-clear-all"></span>
                                    Remove from group
                                </button>
                                ${i.groups.map(c=>u`
                                    <button class="lp-menu-item lp-menu-item--action" role="menuitem" @click=${()=>K(()=>nt(t,c.name))}>
                                        ${c.icon?u`<span class="codicon codicon-${c.icon}"></span>`:u`<span class="codicon codicon-folder"></span>`}
                                        Assign to ${c.name}
                                    </button>
                                `)}
                            `:null}
                            ${He?u`
                                <div class="lp-menu-divider"></div>
                                <button class="lp-menu-item lp-menu-item--action" role="menuitem"
                                    @click=${()=>K(()=>_t())}>
                                    <span class="codicon codicon-grabber"></span>
                                    Reorder actions
                                </button>
                                <button class="lp-menu-item lp-menu-item--action" role="menuitem"
                                    ?disabled=${i.actions.indexOf(t)===0}
                                    @click=${()=>K(()=>et(t,"up"))}>
                                    <span class="codicon codicon-arrow-up"></span>
                                    Move up
                                </button>
                                <button class="lp-menu-item lp-menu-item--action" role="menuitem"
                                    ?disabled=${i.actions.indexOf(t)===i.actions.length-1}
                                    @click=${()=>K(()=>et(t,"down"))}>
                                    <span class="codicon codicon-arrow-down"></span>
                                    Move down
                                </button>
                            `:null}
                        `}):null}
                </span>
             </span>
             ${s.length?u`<span class="lp-btn-meta">${s.map((c,M)=>u`${M>0?" \xB7 ":""}${c}`)}</span>`:null}
        </div>
        ${E===h?an(t):null}
    </div>
    `},rn=(t,e)=>{let n=!!i.searchQuery||!i.collapsedGroups.includes(t.name),s=!!t.hidden,o=[],a=t.borderColor||t.color;a&&(a.includes("--vscode-charts-")?o.push(`--lp-group-accent: ${a}`):o.push(`--lp-group-accent: ${a}`)),t.color&&(t.color.includes("--vscode-charts-")||o.push(`color: ${t.color}`)),t.backgroundColor&&o.push(`background-color: ${t.backgroundColor}`);let r=[];t.backgroundColor&&r.push(`background-color: ${t.backgroundColor}`);let l=Yt(t);return u`
    <details class="lp-group ${A===t?"lp-dragging-group":""} ${T===t&&ne?"lp-drag-over-top-group":""} ${T===t&&!ne?"lp-drag-over-bottom-group":""}" ?open=${n} @toggle=${p=>{if(i.searchQuery)return;let v=p.target;(v.open&&i.collapsedGroups.includes(t.name)||!v.open&&!i.collapsedGroups.includes(t.name))&&tt(t.name)}}>
        <summary class="lp-group-header ${s?"lp-hidden-group":""} ${S===t.name?"lp-drag-over-group":""} ${_===l?"lp-group-header--picker-open":""}"
            style="${o.join(";")}"
            @dragover=${p=>Ht(p,t)}
            @dragleave=${p=>It(p,t)}
            @drop=${p=>Lt(p,t)}>
            <span class="codicon codicon-chevron-down lp-group-chevron"></span>
            <button class="lp-group-drag-handle" draggable="true"
                title="Drag to reorder group" aria-label=${`Drag ${t.name} to reorder`}
                @click=${p=>{p.preventDefault(),p.stopPropagation()}}
                @dragstart=${p=>Pt(p,t)}
                @dragend=${Dt}>
                <span class="codicon codicon-gripper"></span>
            </button>
            <div class="lp-group-header-content">
                ${t.icon?u`<span class="codicon codicon-${t.icon} lp-group-icon"></span>`:null}
                <span class="lp-group-name">${t.name}</span>
                ${s?u`<span class="lp-hidden-badge"><span class="codicon codicon-eye-closed"></span>hidden</span>`:null}
            </div>
            <span class="lp-group-action-toolbar">
                <button class="lp-inline-action-btn"
                    title=${s?"Show group":"Hide group"}
                    aria-label=${s?`Show group ${t.name}`:`Hide group ${t.name}`}
                    @click=${p=>{p.preventDefault(),p.stopPropagation(),Qt(t)}}>
                    <span class="codicon codicon-${s?"eye":i.display.hideIcon}"></span>
                </button>
                <div class="lp-cp-container">
                    <button class="lp-inline-action-btn ${_===l?"lp-cp-active":""}"
                        title="Set color"
                        aria-label="Set color for group ${t.name}"
                        @click=${p=>{p.preventDefault(),p.stopPropagation(),Xt(t,l)}}>
                        <span class="codicon codicon-symbol-color"></span>
                    </button>
                </div>
                <button class="lp-inline-action-btn"
                    title="Edit group"
                    aria-label="Edit group ${t.name}"
                    @click=${p=>{p.preventDefault(),p.stopPropagation(),zt(t)}}>
                    <span class="codicon codicon-edit"></span>
                </button>
            </span>
            ${_===l?Jt(t):null}
        </summary>
        <div class="lp-group-items" style="${r.join(";")}">
            ${e.map(p=>Ce(p))}
        </div>
    </details>
    `},ln=t=>{if(!i.showSearch&&!i.searchQuery)return null;let e=i.groups.length>0&&!!i.searchQuery&&t.length>0;return u`
    <div id="searchContainer" class="lp-search-container">
        <div class="lp-search-row">
            <input type="text" class="lp-search-box" 
                placeholder="🔍 Search actions..." 
                .value=${i.searchQuery}
                @input=${n=>{i.searchQuery=n.target.value,C=!1}}
            >
            ${e?u`
                <div class="lp-search-assign-wrap">
                    <button class="lp-search-assign-btn ${C?"lp-search-assign-btn--open":""}"
                        title="Assign all ${t.length} result(s) to a group"
                        aria-label="Assign all search results to a group"
                        id="searchAssignBtn"
                        @click=${n=>{n.stopPropagation(),C=!C,x()}}>
                        <span class="codicon codicon-folder-moved"></span>
                    </button>
                    ${C?u`
                        <div class="lp-search-assign-picker" @click=${n=>n.stopPropagation()}>
                            <div class="lp-search-assign-picker-label">Assign ${t.length} result(s) to:</div>
                            ${i.groups.map(n=>u`
                                <button class="lp-search-assign-picker-item"
                                    @click=${()=>Ut(t,n.name)}>
                                    ${n.icon?u`<span class="codicon codicon-${n.icon}"></span>`:u`<span class="codicon codicon-folder"></span>`}
                                    ${n.name}
                                </button>
                            `)}
                        </div>
                    `:null}
                </div>
            `:null}
        </div>
    </div>
    `},x=()=>{if(!Je)return;let t=i.actions;if(i.showHidden||(t=t.filter(n=>!n.hidden)),i.searchQuery){let n=i.searchQuery.toLowerCase();t=t.filter(s=>s.name.toLowerCase().includes(n)||s.command.toLowerCase().includes(n)||s.group&&s.group.toLowerCase().includes(n))}let e=[];if(i.display.showGroup&&i.groups.length>0){let n=new Map,s=[];t.forEach(o=>{o.group?(n.has(o.group)||n.set(o.group,[]),n.get(o.group).push(o)):s.push(o)}),i.groups.forEach(o=>{if(o.hidden&&!i.showHidden)return;let a=n.get(o.name);a&&a.length&&e.push(rn(o,a))}),s.length&&e.push(u`
            <details class="lp-group" open>
                <summary class="lp-group-header"><span class="codicon codicon-chevron-down lp-group-chevron"></span> Ungrouped</summary>
                                <div class="lp-group-items">${s.map(o=>Ce(o))}</div>
            </details>
          `)}else e.push(t.map(n=>Ce(n)));if(t.length===0&&(i.searchQuery?e.push(u`
            <div class="lp-empty-state lp-no-results">
                <span class="codicon codicon-search"></span>
                <span>No results for "<strong>${i.searchQuery}</strong>"</span>
            </div>
          `):e.push(u`
            <div class="lp-empty-state">
                <div class="lp-welcome"><h2 class="lp-welcome-title">Welcome</h2></div>
                <div class="lp-empty-actions">
                    <button class="lp-empty-btn lp-empty-primary" @click=${()=>{i.generating=!0,g.postMessage({command:"showGenerateConfig"})}}>
                        <span class="codicon ${i.generating?"codicon-loading codicon-modifier-spin":"codicon-sparkle"}"></span>
                        <span class="lp-btn-label">${i.generating?"Detecting...":"Auto-detect"}</span>
                    </button>
                </div>
            </div>
          `)),ce(u`
    <div id="toast" class="lp-toast"></div>
    ${i.loading?u`<div class="lp-loading-overlay"><span class="codicon codicon-loading codicon-modifier-spin"></span></div>`:null}
    ${ln(t)}
    ${G?u`
    <div class="lp-reorder-banner">
        <span class="lp-reorder-banner-label">
            <span class="codicon codicon-grabber"></span>
            Drag rows to reorder
        </span>
        <button class="lp-reorder-banner-done" @click=${kt}>
            <span class="codicon codicon-check"></span>
            Done
        </button>
    </div>`:null}
    <div class="lp-grid">
        ${e}
    </div>
  `,Je),i.newActionNames&&i.newActionNames.length>0){let n=[...i.newActionNames];i.newActionNames=[],requestAnimationFrame(()=>{let s=!1;for(let o of n){let a=o.replace(/"/g,'\\"'),r=document.querySelector(`[data-action-name="${a}"]`);r&&(s||(r.scrollIntoView({behavior:"smooth",block:"center"}),s=!0),r.classList.add("lp-highlight-new"),setTimeout(()=>{r.classList.remove("lp-highlight-new")},2200))}})}requestAnimationFrame(()=>{document.querySelectorAll(".lp-menu-panel--action, .lp-menu-panel--group").forEach(n=>{let s=n.getBoundingClientRect();n.classList.toggle("lp-menu-flip",s.bottom>window.innerHeight-8)})})};window.addEventListener("message",t=>{let e=t.data;switch(e.type){case"update":Et(()=>{Object.assign(i,e.data),i.loading=!1,i.generating=!1});break;case"setLoading":i.loading=e.value;break;case"toggleSearch":i.showSearch=e.visible;break;case"collapseAllGroups":i.collapsedGroups=i.groups.map(n=>n.name),b();break;case"expandAllGroups":i.collapsedGroups=[],b();break;case"showToast":break}e.command==="statusUpdate"&&(i.runStatus={...i.runStatus,[e.name]:{exitCode:e.exitCode,timestamp:e.timestamp}})});x();document.addEventListener("click",t=>{let e=t.target;if(e?.closest(".lp-menu-container")||B(),!e?.closest(".lp-cp-container")){let n=!1;E!==null&&(E=null,n=!0),_!==null&&(_=null,n=!0),n&&x()}!e?.closest(".lp-search-assign-wrap")&&C&&(C=!1,x())});document.addEventListener("keydown",t=>{t.key==="Escape"&&(B(),C&&(C=!1,x()))});var R=null,de=0,xe=()=>{R!==null&&(cancelAnimationFrame(R),R=null),de=0},lt=()=>{if(de===0){R=null;return}document.documentElement.scrollTop+=de,R=requestAnimationFrame(lt)};document.addEventListener("dragover",t=>{if(!f&&!A)return;let e=80,n=14,{clientY:s}=t,o=window.innerHeight,a=0;s<e?a=-Math.ceil(n*(1-s/e)):s>o-e&&(a=Math.ceil(n*(1-(o-s)/e))),de=a,a!==0&&R===null?R=requestAnimationFrame(lt):a===0&&xe()});document.addEventListener("dragend",xe);document.addEventListener("drop",xe);
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
