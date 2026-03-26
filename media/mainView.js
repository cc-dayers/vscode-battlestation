var le=globalThis,ce=le.ShadowRoot&&(le.ShadyCSS===void 0||le.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,Re=Symbol(),Ge=new WeakMap,ie=class{constructor(e,n,o){if(this._$cssResult$=!0,o!==Re)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=n}get styleSheet(){let e=this.o,n=this.t;if(ce&&e===void 0){let o=n!==void 0&&n.length===1;o&&(e=Ge.get(n)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),o&&Ge.set(n,e))}return e}toString(){return this.cssText}},Be=t=>new ie(typeof t=="string"?t:t+"",void 0,Re);var Ue=(t,e)=>{if(ce)t.adoptedStyleSheets=e.map(n=>n instanceof CSSStyleSheet?n:n.styleSheet);else for(let n of e){let o=document.createElement("style"),s=le.litNonce;s!==void 0&&o.setAttribute("nonce",s),o.textContent=n.cssText,t.appendChild(o)}},fe=ce?t=>t:t=>t instanceof CSSStyleSheet?(e=>{let n="";for(let o of e.cssRules)n+=o.cssText;return Be(n)})(t):t;var{is:gt,defineProperty:mt,getOwnPropertyDescriptor:ft,getOwnPropertyNames:vt,getOwnPropertySymbols:$t,getPrototypeOf:bt}=Object,pe=globalThis,Ne=pe.trustedTypes,yt=Ne?Ne.emptyScript:"",At=pe.reactiveElementPolyfillSupport,z=(t,e)=>t,ve={toAttribute(t,e){switch(e){case Boolean:t=t?yt:null;break;case Object:case Array:t=t==null?t:JSON.stringify(t)}return t},fromAttribute(t,e){let n=t;switch(e){case Boolean:n=t!==null;break;case Number:n=t===null?null:Number(t);break;case Object:case Array:try{n=JSON.parse(t)}catch{n=null}}return n}},Ke=(t,e)=>!gt(t,e),Fe={attribute:!0,type:String,converter:ve,reflect:!1,useDefault:!1,hasChanged:Ke};Symbol.metadata??=Symbol("metadata"),pe.litPropertyMetadata??=new WeakMap;var H=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,n=Fe){if(n.state&&(n.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((n=Object.create(n)).wrapped=!0),this.elementProperties.set(e,n),!n.noAccessor){let o=Symbol(),s=this.getPropertyDescriptor(e,o,n);s!==void 0&&mt(this.prototype,e,s)}}static getPropertyDescriptor(e,n,o){let{get:s,set:r}=ft(this.prototype,e)??{get(){return this[n]},set(a){this[n]=a}};return{get:s,set(a){let l=s?.call(this);r?.call(this,a),this.requestUpdate(e,l,o)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??Fe}static _$Ei(){if(this.hasOwnProperty(z("elementProperties")))return;let e=bt(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(z("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(z("properties"))){let n=this.properties,o=[...vt(n),...$t(n)];for(let s of o)this.createProperty(s,n[s])}let e=this[Symbol.metadata];if(e!==null){let n=litPropertyMetadata.get(e);if(n!==void 0)for(let[o,s]of n)this.elementProperties.set(o,s)}this._$Eh=new Map;for(let[n,o]of this.elementProperties){let s=this._$Eu(n,o);s!==void 0&&this._$Eh.set(s,n)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let n=[];if(Array.isArray(e)){let o=new Set(e.flat(1/0).reverse());for(let s of o)n.unshift(fe(s))}else e!==void 0&&n.push(fe(e));return n}static _$Eu(e,n){let o=n.attribute;return o===!1?void 0:typeof o=="string"?o:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,n=this.constructor.elementProperties;for(let o of n.keys())this.hasOwnProperty(o)&&(e.set(o,this[o]),delete this[o]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return Ue(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,n,o){this._$AK(e,o)}_$ET(e,n){let o=this.constructor.elementProperties.get(e),s=this.constructor._$Eu(e,o);if(s!==void 0&&o.reflect===!0){let r=(o.converter?.toAttribute!==void 0?o.converter:ve).toAttribute(n,o.type);this._$Em=e,r==null?this.removeAttribute(s):this.setAttribute(s,r),this._$Em=null}}_$AK(e,n){let o=this.constructor,s=o._$Eh.get(e);if(s!==void 0&&this._$Em!==s){let r=o.getPropertyOptions(s),a=typeof r.converter=="function"?{fromAttribute:r.converter}:r.converter?.fromAttribute!==void 0?r.converter:ve;this._$Em=s;let l=a.fromAttribute(n,r.type);this[s]=l??this._$Ej?.get(s)??l,this._$Em=null}}requestUpdate(e,n,o,s=!1,r){if(e!==void 0){let a=this.constructor;if(s===!1&&(r=this[e]),o??=a.getPropertyOptions(e),!((o.hasChanged??Ke)(r,n)||o.useDefault&&o.reflect&&r===this._$Ej?.get(e)&&!this.hasAttribute(a._$Eu(e,o))))return;this.C(e,n,o)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,n,{useDefault:o,reflect:s,wrapped:r},a){o&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,a??n??this[e]),r!==!0||a!==void 0)||(this._$AL.has(e)||(this.hasUpdated||o||(n=void 0),this._$AL.set(e,n)),s===!0&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(n){Promise.reject(n)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[s,r]of this._$Ep)this[s]=r;this._$Ep=void 0}let o=this.constructor.elementProperties;if(o.size>0)for(let[s,r]of o){let{wrapped:a}=r,l=this[s];a!==!0||this._$AL.has(s)||l===void 0||this.C(s,void 0,r,l)}}let e=!1,n=this._$AL;try{e=this.shouldUpdate(n),e?(this.willUpdate(n),this._$EO?.forEach(o=>o.hostUpdate?.()),this.update(n)):this._$EM()}catch(o){throw e=!1,this._$EM(),o}e&&this._$AE(n)}willUpdate(e){}_$AE(e){this._$EO?.forEach(n=>n.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(n=>this._$ET(n,this[n])),this._$EM()}updated(e){}firstUpdated(e){}};H.elementStyles=[],H.shadowRootOptions={mode:"open"},H[z("elementProperties")]=new Map,H[z("finalized")]=new Map,At?.({ReactiveElement:H}),(pe.reactiveElementVersions??=[]).push("2.1.2");var _e=globalThis,je=t=>t,de=_e.trustedTypes,qe=de?de.createPolicy("lit-html",{createHTML:t=>t}):void 0,Xe="$lit$",I=`lit$${Math.random().toFixed(9).slice(2)}$`,Je="?"+I,wt=`<${Je}>`,G=document,Y=()=>G.createComment(""),X=t=>t===null||typeof t!="object"&&typeof t!="function",ke=Array.isArray,Et=t=>ke(t)||typeof t?.[Symbol.iterator]=="function",$e=`[ 	
\f\r]`,Q=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,We=/-->/g,Ve=/>/g,L=RegExp(`>|${$e}(?:([^\\s"'>=/]+)(${$e}*=${$e}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),ze=/'/g,Qe=/"/g,Ze=/^(?:script|style|textarea|title)$/i,Me=t=>(e,...n)=>({_$litType$:t,strings:e,values:n}),h=Me(1),_n=Me(2),kn=Me(3),R=Symbol.for("lit-noChange"),$=Symbol.for("lit-nothing"),Ye=new WeakMap,O=G.createTreeWalker(G,129);function et(t,e){if(!ke(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return qe!==void 0?qe.createHTML(e):e}var _t=(t,e)=>{let n=t.length-1,o=[],s,r=e===2?"<svg>":e===3?"<math>":"",a=Q;for(let l=0;l<n;l++){let p=t[l],g,u,c=-1,f=0;for(;f<p.length&&(a.lastIndex=f,u=a.exec(p),u!==null);)f=a.lastIndex,a===Q?u[1]==="!--"?a=We:u[1]!==void 0?a=Ve:u[2]!==void 0?(Ze.test(u[2])&&(s=RegExp("</"+u[2],"g")),a=L):u[3]!==void 0&&(a=L):a===L?u[0]===">"?(a=s??Q,c=-1):u[1]===void 0?c=-2:(c=a.lastIndex-u[2].length,g=u[1],a=u[3]===void 0?L:u[3]==='"'?Qe:ze):a===Qe||a===ze?a=L:a===We||a===Ve?a=Q:(a=L,s=void 0);let E=a===L&&t[l+1].startsWith("/>")?" ":"";r+=a===Q?p+wt:c>=0?(o.push(g),p.slice(0,c)+Xe+p.slice(c)+I+E):p+I+(c===-2?l:E)}return[et(t,r+(t[n]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),o]},J=class t{constructor({strings:e,_$litType$:n},o){let s;this.parts=[];let r=0,a=0,l=e.length-1,p=this.parts,[g,u]=_t(e,n);if(this.el=t.createElement(g,o),O.currentNode=this.el.content,n===2||n===3){let c=this.el.content.firstChild;c.replaceWith(...c.childNodes)}for(;(s=O.nextNode())!==null&&p.length<l;){if(s.nodeType===1){if(s.hasAttributes())for(let c of s.getAttributeNames())if(c.endsWith(Xe)){let f=u[a++],E=s.getAttribute(c).split(I),y=/([.?@])?(.*)/.exec(f);p.push({type:1,index:r,name:y[2],strings:E,ctor:y[1]==="."?ye:y[1]==="?"?Ae:y[1]==="@"?we:K}),s.removeAttribute(c)}else c.startsWith(I)&&(p.push({type:6,index:r}),s.removeAttribute(c));if(Ze.test(s.tagName)){let c=s.textContent.split(I),f=c.length-1;if(f>0){s.textContent=de?de.emptyScript:"";for(let E=0;E<f;E++)s.append(c[E],Y()),O.nextNode(),p.push({type:2,index:++r});s.append(c[f],Y())}}}else if(s.nodeType===8)if(s.data===Je)p.push({type:2,index:r});else{let c=-1;for(;(c=s.data.indexOf(I,c+1))!==-1;)p.push({type:7,index:r}),c+=I.length-1}r++}}static createElement(e,n){let o=G.createElement("template");return o.innerHTML=e,o}};function F(t,e,n=t,o){if(e===R)return e;let s=o!==void 0?n._$Co?.[o]:n._$Cl,r=X(e)?void 0:e._$litDirective$;return s?.constructor!==r&&(s?._$AO?.(!1),r===void 0?s=void 0:(s=new r(t),s._$AT(t,n,o)),o!==void 0?(n._$Co??=[])[o]=s:n._$Cl=s),s!==void 0&&(e=F(t,s._$AS(t,e.values),s,o)),e}var be=class{constructor(e,n){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=n}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:n},parts:o}=this._$AD,s=(e?.creationScope??G).importNode(n,!0);O.currentNode=s;let r=O.nextNode(),a=0,l=0,p=o[0];for(;p!==void 0;){if(a===p.index){let g;p.type===2?g=new Z(r,r.nextSibling,this,e):p.type===1?g=new p.ctor(r,p.name,p.strings,this,e):p.type===6&&(g=new Ee(r,this,e)),this._$AV.push(g),p=o[++l]}a!==p?.index&&(r=O.nextNode(),a++)}return O.currentNode=G,s}p(e){let n=0;for(let o of this._$AV)o!==void 0&&(o.strings!==void 0?(o._$AI(e,o,n),n+=o.strings.length-2):o._$AI(e[n])),n++}},Z=class t{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,n,o,s){this.type=2,this._$AH=$,this._$AN=void 0,this._$AA=e,this._$AB=n,this._$AM=o,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,n=this._$AM;return n!==void 0&&e?.nodeType===11&&(e=n.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,n=this){e=F(this,e,n),X(e)?e===$||e==null||e===""?(this._$AH!==$&&this._$AR(),this._$AH=$):e!==this._$AH&&e!==R&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):Et(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==$&&X(this._$AH)?this._$AA.nextSibling.data=e:this.T(G.createTextNode(e)),this._$AH=e}$(e){let{values:n,_$litType$:o}=e,s=typeof o=="number"?this._$AC(e):(o.el===void 0&&(o.el=J.createElement(et(o.h,o.h[0]),this.options)),o);if(this._$AH?._$AD===s)this._$AH.p(n);else{let r=new be(s,this),a=r.u(this.options);r.p(n),this.T(a),this._$AH=r}}_$AC(e){let n=Ye.get(e.strings);return n===void 0&&Ye.set(e.strings,n=new J(e)),n}k(e){ke(this._$AH)||(this._$AH=[],this._$AR());let n=this._$AH,o,s=0;for(let r of e)s===n.length?n.push(o=new t(this.O(Y()),this.O(Y()),this,this.options)):o=n[s],o._$AI(r),s++;s<n.length&&(this._$AR(o&&o._$AB.nextSibling,s),n.length=s)}_$AR(e=this._$AA.nextSibling,n){for(this._$AP?.(!1,!0,n);e!==this._$AB;){let o=je(e).nextSibling;je(e).remove(),e=o}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},K=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,n,o,s,r){this.type=1,this._$AH=$,this._$AN=void 0,this.element=e,this.name=n,this._$AM=s,this.options=r,o.length>2||o[0]!==""||o[1]!==""?(this._$AH=Array(o.length-1).fill(new String),this.strings=o):this._$AH=$}_$AI(e,n=this,o,s){let r=this.strings,a=!1;if(r===void 0)e=F(this,e,n,0),a=!X(e)||e!==this._$AH&&e!==R,a&&(this._$AH=e);else{let l=e,p,g;for(e=r[0],p=0;p<r.length-1;p++)g=F(this,l[o+p],n,p),g===R&&(g=this._$AH[p]),a||=!X(g)||g!==this._$AH[p],g===$?e=$:e!==$&&(e+=(g??"")+r[p+1]),this._$AH[p]=g}a&&!s&&this.j(e)}j(e){e===$?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}},ye=class extends K{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===$?void 0:e}},Ae=class extends K{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==$)}},we=class extends K{constructor(e,n,o,s,r){super(e,n,o,s,r),this.type=5}_$AI(e,n=this){if((e=F(this,e,n,0)??$)===R)return;let o=this._$AH,s=e===$&&o!==$||e.capture!==o.capture||e.once!==o.once||e.passive!==o.passive,r=e!==$&&(o===$||s);s&&this.element.removeEventListener(this.name,this,o),r&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},Ee=class{constructor(e,n,o){this.element=e,this.type=6,this._$AN=void 0,this._$AM=n,this.options=o}get _$AU(){return this._$AM._$AU}_$AI(e){F(this,e)}};var kt=_e.litHtmlPolyfillSupport;kt?.(J,Z),(_e.litHtmlVersions??=[]).push("3.3.2");var ue=(t,e,n)=>{let o=n?.renderBefore??e,s=o._$litPart$;if(s===void 0){let r=n?.renderBefore??null;o._$litPart$=s=new Z(e.insertBefore(Y(),r),r,void 0,n??{})}return s._$AI(t),s};var Se=globalThis,j=class extends H{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let n=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=ue(n,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return R}};j._$litElement$=!0,j.finalized=!0,Se.litElementHydrateSupport?.({LitElement:j});var Mt=Se.litElementPolyfillSupport;Mt?.({LitElement:j});(Se.litElementVersions??=[]).push("4.2.2");var m=window.acquireVsCodeApi(),tt=document.getElementById("root"),Te=!1,Ce=!1,v=()=>{if(Te){Ce=!0;return}P()},St=t=>{Te=!0;try{t()}finally{Te=!1,Ce&&(Ce=!1,P())}};window.addEventListener("resize",()=>{m.postMessage({command:"webviewResized",width:window.innerWidth})});setTimeout(()=>{m.postMessage({command:"webviewResized",width:window.innerWidth})},100);var De={actions:[],groups:[],searchQuery:"",loading:!1,generating:!1,display:{showCommand:!0,showGroup:!0,hideIcon:"eye-closed",playButtonBg:"transparent",actionToolbar:["hide","setColor","edit","delete"]},iconMap:{},collapsedGroups:[],showSearch:!1,showHidden:!1,selectionMode:!1,selectedItems:[],openActionMenuFor:null,runStatus:{}};window.__INITIAL_DATA__&&Object.assign(De,window.__INITIAL_DATA__);var xe=m.getState()||{};xe.collapsedGroups&&(De.collapsedGroups=xe.collapsedGroups);var i=new Proxy(De,{set(t,e,n){return Reflect.set(t,e,n),v(),e==="collapsedGroups"&&m.setState({...xe,collapsedGroups:n}),!0}}),b=null,S=null,oe=!0,x=null,w=null,D=null,se=!0,A=null,_=null,re=!0,k=null,W=!1,V=!0,nt=!1,M=null,ee=!0,te=!1,ne=!1,B=!1,C=!1,Tt=()=>{N(),k=null,M=null,B=!0,v()},Ct=()=>{b=null,S=null,x=null,B=!1,v()},xt=(t,e)=>{b=e,t.dataTransfer.effectAllowed="move";let n=t.currentTarget.closest(".lp-btn-wrapper");if(n){let o=n.getBoundingClientRect(),s=t.clientX-o.left,r=t.clientY-o.top;t.dataTransfer.setDragImage(n,s,r)}setTimeout(()=>v(),0)},Dt=(t,e)=>{if(!b||b===e)return;t.preventDefault(),t.dataTransfer.dropEffect="move";let o=t.currentTarget.getBoundingClientRect(),s=t.clientY<o.top+o.height/2;(S!==e||oe!==s)&&(S=e,oe=s,v())},Pt=(t,e)=>{let n=t.relatedTarget;!t.currentTarget.contains(n)&&S===e&&(S=null,v())},Ht=(t,e)=>{if(t.preventDefault(),!b||b===e)return;let n={...b};e.group!==void 0?n.group=e.group:delete n.group;let o=i.actions.map(p=>p===b?n:p),s=o.indexOf(n),r=o.indexOf(e);if(s===-1||r===-1){b=null,S=null,x=null;return}o.splice(s,1);let a=o.indexOf(e),l=oe?a:a+1;o.splice(l,0,n),b=null,S=null,x=null,i.actions=o,m.postMessage({command:"reorderActions",actions:o})},ot=(t,e)=>{let n=[...i.actions],o=n.indexOf(t);if(e==="up"&&o<=0||e==="down"&&o>=n.length-1)return;let s=e==="up"?o-1:o+1;[n[o],n[s]]=[n[s],n[o]],i.actions=n,m.postMessage({command:"reorderActions",actions:n})},It=()=>{b=null,S=null,x=null,w=null,D=null,A=null,_=null,v()},Lt=(t,e)=>{w=e,t.dataTransfer.effectAllowed="move";let n=t.currentTarget.closest(".lp-group-header");if(n){let o=n.getBoundingClientRect();t.dataTransfer.setDragImage(n,t.clientX-o.left,t.clientY-o.top)}setTimeout(()=>v(),0)},Ot=()=>{w=null,D=null,v()},Gt=(t,e)=>{if(w){if(w===e)return;t.preventDefault(),t.stopPropagation(),t.dataTransfer.dropEffect="move";let o=t.currentTarget.getBoundingClientRect(),s=t.clientY<o.top+o.height/2;(D!==e||se!==s)&&(D=e,se=s,v());return}b&&(t.preventDefault(),t.stopPropagation(),t.dataTransfer.dropEffect="move",x!==e.name&&(S=null,x=e.name,v()))},Rt=(t,e)=>{if(w){let n=t.relatedTarget;!t.currentTarget.contains(n)&&D===e&&(D=null,v());return}x===e.name&&(x=null,v())},Bt=(t,e)=>{if(t.preventDefault(),t.stopPropagation(),w){if(w===e)return;let l=[...i.groups],p=w,g=l.findIndex(y=>y===p),u=l.findIndex(y=>y===e);if(g===-1||u===-1){w=null,D=null;return}let[c]=l.splice(g,1),f=l.findIndex(y=>y===e),E=se?f:f+1;l.splice(E,0,c),w=null,D=null,i.groups=l,m.postMessage({command:"reorderGroups",groups:l});return}let n=b;if(!n)return;let o={...n,group:e.name},s=i.actions.filter(l=>l!==n),r=s.length;for(let l=s.length-1;l>=0;l--)if(s[l].group===e.name){r=l+1;break}let a=[...s.slice(0,r),o,...s.slice(r)];b=null,S=null,x=null,i.actions=a,m.postMessage({command:"reorderActions",actions:a})},Ut=(t,e,n)=>{A={group:e.name,workspace:n},t.dataTransfer.effectAllowed="move";let o=t.currentTarget.closest(".lp-subgroup-header");if(o){let s=o.getBoundingClientRect();t.dataTransfer.setDragImage(o,t.clientX-s.left,t.clientY-s.top)}setTimeout(()=>v(),0)},Nt=()=>{A=null,_=null,v()},Ft=(t,e,n)=>{if(A){if(A.group===e.name&&A.workspace===n)return;t.preventDefault(),t.stopPropagation(),t.dataTransfer.dropEffect="move";let s=t.currentTarget.getBoundingClientRect(),r=t.clientY<s.top+s.height/2;(_?.workspace!==n||re!==r)&&(_={group:e.name,workspace:n},re=r,v())}},Kt=(t,e,n)=>{if(A){let o=t.relatedTarget;!t.currentTarget.contains(o)&&_?.workspace===n&&(_=null,v())}},jt=(t,e,n)=>{if(t.preventDefault(),t.stopPropagation(),A){if(A.group===e.name&&A.workspace===n)return;let o=A.workspace,s=A.group,r=n,a=e.name,l=i.actions.filter(u=>(u.workspace||"Default")===o&&u.group===s);l.forEach(u=>{u.group=a});let p=i.actions.filter(u=>!((u.workspace||"Default")===o&&u.group===s)),g=p.filter(u=>(u.workspace||"Default")===r&&u.group===a);if(g.length>0){let u=p.indexOf(g[0]),c=p.indexOf(g[g.length-1]),f=re?u:c+1;p.splice(f,0,...l)}else{let u=p.filter(c=>c.group===a);u.length>0?p.splice(p.indexOf(u[u.length-1])+1,0,...l):p.push(...l)}i.actions=p,m.postMessage({command:"reorderActions",actions:p}),A=null,_=null;return}},st=t=>{let e=new Set(i.collapsedGroups);e.has(t)?e.delete(t):e.add(t),i.collapsedGroups=Array.from(e)},qt=t=>{m.postMessage({command:"executeCommand",item:t})},Wt=t=>{m.postMessage({command:"editAction",item:t})},Vt=(t,e)=>{N(),M=null,k===e?k=null:(k=e,V=!0,W=!!t.backgroundColor),P()},zt=t=>{m.postMessage({command:"deleteAction",item:t})},rt=(t,e)=>{m.postMessage({command:"assignGroup",item:t,groupName:e})},Qt=(t,e)=>{m.postMessage({command:"bulkAssignGroup",items:t,groupName:e}),C=!1,P()},Pe=t=>encodeURIComponent(`${t.name}|${t.command}|${t.type}|${t.workspace??""}`),at=(t,e)=>{t.isOpen()||t.open(),e==="last"?t.focusLast():t.focusFirst()},Yt=(t,e)=>{if(t.key==="Escape"&&e.isOpen()){t.preventDefault(),e.close(!0);return}if(t.key==="Enter"||t.key===" "||t.key==="ArrowDown"){t.preventDefault(),at(e,"first");return}t.key==="ArrowUp"&&(t.preventDefault(),at(e,"last"))},Xt=(t,e)=>{let n=t.currentTarget,o=e.getMenuItems(n);if(!o.length)return;let s=o.indexOf(document.activeElement);if(t.key==="Escape"){t.preventDefault(),e.close(!0);return}if(t.key==="Tab"){e.close();return}if(t.key==="Home"){t.preventDefault(),o[0].focus();return}if(t.key==="End"){t.preventDefault(),o[o.length-1].focus();return}if(t.key==="ArrowDown"){t.preventDefault();let r=s>=0?(s+1)%o.length:0;o[r].focus();return}if(t.key==="ArrowUp"){t.preventDefault();let r=s>=0?(s-1+o.length)%o.length:o.length-1;o[r].focus()}},Jt=t=>{let e=Pe(t);requestAnimationFrame(()=>{document.querySelector(`.lp-menu-trigger[data-action-menu-id="${e}"]`)?.focus()})},lt=(t,e="first")=>{let n=Pe(t);requestAnimationFrame(()=>{let o=document.querySelector(`.lp-menu-panel[data-action-menu-id="${n}"]`);if(!o)return;let s=Array.from(o.querySelectorAll(".lp-menu-item"));if(!s.length)return;(e==="last"?s[s.length-1]:s[0]).focus()})},it=t=>({isOpen:()=>i.openActionMenuFor===t,open:()=>{i.openActionMenuFor=t},close:(e=!1)=>N(e?t:void 0),focusFirst:()=>lt(t,"first"),focusLast:()=>lt(t,"last"),getMenuItems:e=>Array.from(e.querySelectorAll(".lp-menu-item"))}),Zt=(t,e)=>{t.stopPropagation(),k=null,M=null,i.openActionMenuFor=i.openActionMenuFor===e?null:e},N=t=>{i.openActionMenuFor&&(i.openActionMenuFor=null),t&&Jt(t)},q=t=>{t(),N()},en=(t,e)=>{Yt(t,it(e))},tn=(t,e)=>{Xt(t,it(e))},nn=t=>{m.postMessage({command:"hideAction",item:t})},on=t=>{m.postMessage({command:"editGroup",group:t})},sn=t=>{m.postMessage({command:"hideGroup",group:t})},rn=t=>`grp-${encodeURIComponent(t.name)}`,an=(t,e)=>{N(),k=null,M===e?M=null:(M=e,ee=!0,te=!!t.backgroundColor,ne=!!t.borderColor),P()},ln=t=>{let e=t.color||t.backgroundColor||t.borderColor||"",n=r=>{m.postMessage({command:"setGroupColor",group:t,color:r,applyToAccent:ee,applyToBg:te,applyToBorder:ne})},o=r=>n(r.target.value),s=r=>{let a=r.target.value.trim();a&&n(a)};return h`
        <div class="lp-cp-popout" @click=${r=>r.stopPropagation()}>
            <div class="lp-cp-swatches">
                ${ct.map(r=>h`
                    <button class="lp-cp-swatch ${e===r.value?"lp-cp-swatch--active":""}"
                        style="background:${r.value}" title=${r.name}
                        @click=${()=>n(r.value)}></button>
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
                    @change=${s}>
                <label class="lp-cp-native-wrap" title="Open color wheel">
                    <input type="color" value=${e.startsWith("#")?e:"#000000"}
                        @change=${o}>
                    <span class="codicon codicon-color-mode"></span>
                </label>
            </div>
            <div class="lp-cp-targets">
                <span class="lp-cp-targets-hd">Apply to</span>
                <div class="lp-cp-target-btns">
                    <label class="lp-cp-target-label">
                        <input type="checkbox" .checked=${ee}
                            @change=${r=>{ee=r.target.checked,ee?e&&n(e):m.postMessage({command:"setGroupColor",group:t,color:"",applyToAccent:!0,applyToBg:!1,applyToBorder:!1})}}>
                        Accent
                    </label>
                    <label class="lp-cp-target-label">
                        <input type="checkbox" .checked=${te}
                            @change=${r=>{te=r.target.checked,te?e&&n(e):m.postMessage({command:"setGroupColor",group:t,color:"",applyToAccent:!1,applyToBg:!0,applyToBorder:!1})}}>
                        BG
                    </label>
                    <label class="lp-cp-target-label">
                        <input type="checkbox" .checked=${ne}
                            @change=${r=>{ne=r.target.checked,ne?e&&n(e):m.postMessage({command:"setGroupColor",group:t,color:"",applyToAccent:!1,applyToBg:!1,applyToBorder:!0})}}>
                        Border
                    </label>
                </div>
            </div>
        </div>
    `},cn=t=>{let e=Math.floor((Date.now()-t)/1e3);if(e<60)return`${e}s ago`;let n=Math.floor(e/60);return n<60?`${n}m ago`:`${Math.floor(n/60)}h ago`},pn=t=>{if(t.type==="npm"&&t.command.startsWith("npm run "))return t.command.replace("npm run ","");if(t.type==="task"){let e=t.command.split("|")[1];return e||"task"}if(t.type==="launch"){let e=t.command.split("|")[1];return e||"launch"}if(t.type==="vscode"){let[e,n]=t.command.split("|");return e==="workbench.action.tasks.runTask"?n||"task":e==="workbench.action.debug.start"?n||"launch":n?`${e} ${n}`:e}return t.command},dn=t=>{let e=`lp-menu-container lp-menu-container--${t.kind}`,n=`lp-menu-trigger lp-menu-trigger--${t.kind}`,o=`lp-menu-panel lp-menu-panel--${t.kind}`;return h`
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

            ${t.isOpen?h`
                <div
                    class=${o}
                    data-action-menu-id=${t.kind==="action"?t.menuId:""}
                    data-group-menu-id=${t.kind==="group"?t.menuId:""}
                    role="menu"
                    @click=${t.onMenuClick}
                    @keydown=${t.onMenuKeydown}>
                    ${t.menuContent}
                </div>
            `:null}
        </div>
    `},un=[{name:"Forest",value:"#162d1e"},{name:"Ocean",value:"#0e1e30"},{name:"Dusk",value:"#1e1030"},{name:"Ember",value:"#2e160a"},{name:"Slate",value:"#141e28"},{name:"Olive",value:"#1e2210"},{name:"Teal",value:"#0e2828"},{name:"Crimson",value:"#2e0e0e"}],ct=[{name:"Red",value:"var(--vscode-charts-red)"},{name:"Orange",value:"var(--vscode-charts-orange)"},{name:"Yellow",value:"var(--vscode-charts-yellow)"},{name:"Green",value:"var(--vscode-charts-green)"},{name:"Blue",value:"var(--vscode-charts-blue)"},{name:"Purple",value:"var(--vscode-charts-purple)"},{name:"Pink",value:"var(--vscode-charts-pink)"},{name:"Error",value:"var(--vscode-errorForeground)"},{name:"Warning",value:"var(--vscode-editorWarning-foreground)"},{name:"Info",value:"var(--vscode-editorInfo-foreground)"},{name:"Success",value:"var(--vscode-testing-iconPassed)"}],hn=t=>{let e=t.match(/^#([0-9a-f]{6})$/i);if(!e)return null;let n=parseInt(e[1].slice(0,2),16)/255,o=parseInt(e[1].slice(2,4),16)/255,s=parseInt(e[1].slice(4,6),16)/255,r=Math.max(n,o,s),a=Math.min(n,o,s),l=r-a,p=0,g=0,u=(r+a)/2;return l>0&&(g=l/(u>.5?2-r-a:r+a),p=r===n?(o-s)/l+(o<s?6:0):r===o?(s-n)/l+2:(n-o)/l+4,p/=6),[p*360,g*100,u*100]},he=(t,e,n)=>{t/=360,e/=100,n/=100;let o=s=>{let r=(s+t*12)%12,a=e*Math.min(n,1-n);return n-a*Math.max(-1,Math.min(r-3,9-r,1))};return"#"+[o(0),o(8),o(4)].map(s=>Math.round(s*255).toString(16).padStart(2,"0")).join("")},gn=t=>{let e=hn(t);if(!e)return[];let[n,o,s]=e,r=Math.max(Math.min(o,65),25),a=Math.max(Math.min(s,32),8);return[he((n+30)%360,r,a),he((n-30+360)%360,r,a),he((n+150)%360,r,a),he((n+180)%360,r,a)]},mn=t=>{let e=t.rowBackgroundColor||t.backgroundColor||"",n=e.startsWith("#")?gn(e):[],o=l=>{m.postMessage({command:"setActionColor",item:t,color:l,applyToPlay:W,applyToRow:V})},s=()=>{m.postMessage({command:"setActionColor",item:t,color:"",applyToPlay:W,applyToRow:V})},r=l=>o(l.target.value),a=l=>{let p=l.target.value.trim();p&&o(p)};return h`
        <div class="lp-cp-popout" @click=${l=>l.stopPropagation()}>
            <div class="lp-cp-swatches">
                ${un.map(l=>h`
                    <button class="lp-cp-swatch ${e===l.value?"lp-cp-swatch--active":""}"
                        style="background:${l.value}" title=${l.name}
                        @click=${()=>o(l.value)}></button>
                `)}
                <button class="lp-cp-swatch lp-cp-swatch--clear" title="Clear color"
                    @click=${s}>
                    <span class="codicon codicon-circle-slash"></span>
                </button>
            </div>
            ${n.length?h`
                <div class="lp-cp-harmonies-row">
                    <span class="lp-cp-harmonies-label">Harmonies</span>
                    <div class="lp-cp-harmonies">
                        ${n.map(l=>h`
                            <button class="lp-cp-swatch lp-cp-swatch--sm ${e===l?"lp-cp-swatch--active":""}"
                                style="background:${l}" title=${l}
                                @click=${()=>o(l)}></button>
                        `)}
                    </div>
                </div>
            `:null}
            <div class="lp-cp-custom-row">
                <div class="lp-cp-preview" style="background:${e||"transparent"}"></div>
                <input class="lp-cp-text" type="text" placeholder="#hex or var(--color)"
                    value=${e}
                    @change=${a}>
                <label class="lp-cp-native-wrap" title="Open color wheel">
                    <input type="color" value=${e.startsWith("#")?e:"#000000"}
                        @change=${r}>
                    <span class="codicon codicon-color-mode"></span>
                </label>
            </div>
            <details class="lp-cp-theme-section" .open=${nt}
                @toggle=${l=>{nt=l.target.open}}>
                <summary class="lp-cp-theme-toggle">
                    <span class="codicon codicon-chevron-right lp-cp-theme-chevron"></span>
                    VSCode theme colors
                </summary>
                <div class="lp-cp-swatches lp-cp-theme-swatches">
                    ${ct.map(l=>h`
                        <button class="lp-cp-swatch ${e===l.value?"lp-cp-swatch--active":""}"
                            style="background:${l.value}" title=${l.name}
                            @click=${()=>o(l.value)}></button>
                    `)}
                </div>
            </details>
            <div class="lp-cp-targets">
                <span class="lp-cp-targets-hd">Apply to</span>
                <div class="lp-cp-target-btns">
                    <label class="lp-cp-target-label">
                        <input type="checkbox" .checked=${W}
                            @change=${l=>{W=l.target.checked,W?e&&o(e):m.postMessage({command:"setActionColor",item:t,color:"",applyToPlay:!0,applyToRow:!1})}}>
                        <span class="codicon codicon-play"></span>Play
                    </label>
                    <label class="lp-cp-target-label">
                        <input type="checkbox" .checked=${V}
                            @change=${l=>{V=l.target.checked,V?e&&o(e):m.postMessage({command:"setActionColor",item:t,color:"",applyToPlay:!1,applyToRow:!0})}}>
                        Row bg
                    </label>
                </div>
            </div>
        </div>
    `},ge=(t,e=!1)=>{let n=t.hidden,{display:o}=i,s=[],r=null;if(t.workspace&&!e){let d="";t.workspaceColor&&(d=`background-color: ${t.workspaceColor}; color: var(--vscode-editor-background); border: 1px solid color-mix(in srgb, var(--vscode-foreground) 20%, transparent); opacity: 0.9;`),r=h`<span class="lp-workspace-label" style="${d}">${t.workspace}</span>`}if(o.showCommand){let d=pn(t),T=t.name.trim().toLowerCase();d.trim().toLowerCase()!==T&&t.command.trim().toLowerCase()!==T&&s.push(d)}let a=!!t.group,p=i.groups.length>0||a,g=i.openActionMenuFor===t,u=Pe(t),c=b===t,f=S===t,E=["lp-btn-wrapper",n?"lp-hidden-item":"",c?"lp-dragging":"",f&&oe?"lp-drag-over-top":"",f&&!oe?"lp-drag-over-bottom":"",k===u?"lp-cp-open":"",g?"lp-menu-open":"",B?"lp-reorder-mode-row":""].filter(Boolean).join(" "),y=i.runStatus[t.name],dt=y?h`<span
            class="lp-status-dot ${y.exitCode===0?"lp-status-ok":"lp-status-fail"}"
            title="Last run: ${cn(y.timestamp)} — Exit ${y.exitCode}">
          </span>`:null,ae={edit:{icon:"edit",label:"Edit",action:()=>Wt(t)},setColor:{icon:"symbol-color",label:"Set color",action:()=>Vt(t,u)},hide:{icon:n?"eye":o.hideIcon,label:n?"Show":"Hide",action:()=>nn(t)},delete:{icon:"trash",label:"Delete",action:()=>zt(t),dangerous:!0}},Ie=o.actionToolbar??["hide","setColor","edit","delete"],ut=Ie.filter(d=>ae[d]).map(d=>({id:d,...ae[d]})),Le=Object.keys(ae).filter(d=>!Ie.includes(d)).map(d=>({id:d,...ae[d]})),Oe=!i.searchQuery,ht=!B&&(Le.length>0||p||Oe);return h`
    <div class=${E}
        data-action-name=${t.name}
        style=${t.rowBackgroundColor?`--lp-row-bg:${t.rowBackgroundColor}`:""}
        @dragover=${d=>Dt(d,t)}
        @dragleave=${d=>Pt(d,t)}
        @drop=${d=>Ht(d,t)}>
        ${i.selectionMode?h`<input type="checkbox" class="lp-btn-checkbox" .checked=${i.selectedItems.includes(t)} @change=${d=>{d.target.checked?i.selectedItems=[...i.selectedItems,t]:i.selectedItems=i.selectedItems.filter(T=>T!==t)}}>`:null}

        ${B?h`
        <button class="lp-reorder-handle" draggable="true"
            title="Drag to reorder"
            aria-label=${`Drag ${t.name} to reorder`}
            @dragstart=${d=>xt(d,t)}
            @dragend=${It}>
            <span class="codicon codicon-gripper"></span>
        </button>`:h`
        <button
            class="lp-play-btn"
            style=${t.backgroundColor?`--lp-play-btn-bg: ${t.backgroundColor}`:o.playButtonBg&&o.playButtonBg!=="transparent"?`--lp-play-btn-bg: ${o.playButtonBg}`:""}
            title="Run"
            aria-label=${`Run ${t.name}`}
            @click=${()=>qt(t)}>
            <span class="codicon codicon-play"></span>
        </button>`}

        <div class="lp-btn ${i.selectionMode?"has-checkbox":""}">
             ${r}
             <span class="lp-btn-name">
                ${t.name}
                ${n?h`<span class="lp-hidden-badge">(hidden)</span>`:null}
                ${dt}
                <span class="lp-action-toolbar" style=${B?"display:none":""}>
                    ${ut.map(d=>d.id==="setColor"?h`
                        <div class="lp-cp-container">
                            <button class="lp-inline-action-btn ${k===u?"lp-cp-active":""}"
                                title=${d.label} aria-label="${d.label} ${t.name}"
                                @click=${T=>{T.stopPropagation(),d.action()}}>
                                <span class="codicon codicon-${d.icon}"></span>
                            </button>
                        </div>
                    `:h`
                        <button class="lp-inline-action-btn ${d.dangerous?"lp-btn-dangerous":""}"
                            title=${d.label} aria-label="${d.label} ${t.name}"
                            @click=${T=>{T.stopPropagation(),d.action()}}>
                            <span class="codicon codicon-${d.icon}"></span>
                        </button>
                    `)}
                    ${ht?dn({kind:"action",menuId:u,isOpen:g,triggerTitle:"More actions",triggerAriaLabel:`More actions for ${t.name}`,onTriggerClick:d=>Zt(d,t),onTriggerKeydown:d=>en(d,t),onMenuClick:d=>d.stopPropagation(),onMenuKeydown:d=>tn(d,t),menuContent:h`
                            ${Le.map(d=>h`
                                <button class="lp-menu-item lp-menu-item--action" role="menuitem"
                                    @click=${()=>q(()=>d.action())}>
                                    <span class="codicon codicon-${d.icon}"></span>
                                    ${d.label}
                                </button>
                            `)}
                            ${p?h`
                                <div class="lp-menu-divider"></div>
                                <button class="lp-menu-item lp-menu-item--action" role="menuitem" @click=${()=>q(()=>rt(t,"__none__"))}>
                                    <span class="codicon codicon-clear-all"></span>
                                    Remove from group
                                </button>
                                ${i.groups.map(d=>h`
                                    <button class="lp-menu-item lp-menu-item--action" role="menuitem" @click=${()=>q(()=>rt(t,d.name))}>
                                        ${d.icon?h`<span class="codicon codicon-${d.icon}"></span>`:h`<span class="codicon codicon-folder"></span>`}
                                        Assign to ${d.name}
                                    </button>
                                `)}
                            `:null}
                            ${Oe?h`
                                <div class="lp-menu-divider"></div>
                                <button class="lp-menu-item lp-menu-item--action" role="menuitem"
                                    @click=${()=>q(()=>Tt())}>
                                    <span class="codicon codicon-grabber"></span>
                                    Reorder actions
                                </button>
                                <button class="lp-menu-item lp-menu-item--action" role="menuitem"
                                    ?disabled=${i.actions.indexOf(t)===0}
                                    @click=${()=>q(()=>ot(t,"up"))}>
                                    <span class="codicon codicon-arrow-up"></span>
                                    Move up
                                </button>
                                <button class="lp-menu-item lp-menu-item--action" role="menuitem"
                                    ?disabled=${i.actions.indexOf(t)===i.actions.length-1}
                                    @click=${()=>q(()=>ot(t,"down"))}>
                                    <span class="codicon codicon-arrow-down"></span>
                                    Move down
                                </button>
                            `:null}
                        `}):null}
                </span>
             </span>
             ${s.length?h`<span class="lp-btn-meta">${s.map((d,T)=>h`${T>0?" \xB7 ":""}${d}`)}</span>`:null}
        </div>
        ${k===u?mn(t):null}
    </div>
    `},fn=(t,e)=>{let n=new Map,o=[];return e.forEach(s=>{let r=s.workspace||"Default";n.has(r)||(n.set(r,[]),o.push(r)),n.get(r).push(s)}),o.map(s=>{let r=n.get(s),a=r[0]?.workspaceColor,l=A?.group===t.name&&A?.workspace===s,p=_?.group===t.name&&_?.workspace===s&&re,g=_?.group===t.name&&_?.workspace===s&&!re,u=["lp-subgroup",l?"lp-dragging-group":"",p?"lp-drag-over-top-group":"",g?"lp-drag-over-bottom-group":""].filter(Boolean).join(" ");return h`
        <div class=${u}
            @dragover=${c=>Ft(c,t,s)}
            @dragleave=${c=>Kt(c,t,s)}
            @drop=${c=>jt(c,t,s)}>
            <div class="lp-subgroup-header" draggable="true"
                @dragstart=${c=>Ut(c,t,s)}
                @dragend=${Nt}>
                <button class="lp-group-drag-handle" title="Drag to reorder workspace group" @click=${c=>{c.preventDefault(),c.stopPropagation()}}>
                    <span class="codicon codicon-gripper"></span>
                </button>
                <div class="lp-subgroup-badge" style=${a?`background-color:${a}22; color:${a};border-color:${a}55`:""}>
                   <span class="codicon codicon-briefcase lp-subgroup-icon"></span>
                   ${s}
                </div>
            </div>
            <div class="lp-subgroup-items">
                ${r.map(c=>ge(c,!0))}
            </div>
        </div>
        `})},vn=(t,e)=>{let n=!!i.searchQuery||!i.collapsedGroups.includes(t.name),o=!!t.hidden,s=[],r=t.borderColor||t.color;r&&(r.includes("--vscode-charts-")?s.push(`--lp-group-accent: ${r}`):s.push(`--lp-group-accent: ${r}`)),t.color&&(t.color.includes("--vscode-charts-")||s.push(`color: ${t.color}`)),t.backgroundColor&&s.push(`background-color: ${t.backgroundColor}`);let a=[];t.backgroundColor&&a.push(`background-color: ${t.backgroundColor}`);let l=rn(t);return h`
    <details class="lp-group ${w===t?"lp-dragging-group":""} ${D===t&&se?"lp-drag-over-top-group":""} ${D===t&&!se?"lp-drag-over-bottom-group":""}" ?open=${n} @toggle=${c=>{if(i.searchQuery)return;let f=c.target;(f.open&&i.collapsedGroups.includes(t.name)||!f.open&&!i.collapsedGroups.includes(t.name))&&st(t.name)}}>
        <summary class="lp-group-header ${o?"lp-hidden-group":""} ${x===t.name?"lp-drag-over-group":""} ${M===l?"lp-group-header--picker-open":""}"
            style="${s.join(";")}"
            @dragover=${c=>Gt(c,t)}
            @dragleave=${c=>Rt(c,t)}
            @drop=${c=>Bt(c,t)}>
            <span class="codicon codicon-chevron-down lp-group-chevron"></span>
            <button class="lp-group-drag-handle" draggable="true"
                title="Drag to reorder group" aria-label=${`Drag ${t.name} to reorder`}
                @click=${c=>{c.preventDefault(),c.stopPropagation()}}
                @dragstart=${c=>Lt(c,t)}
                @dragend=${Ot}>
                <span class="codicon codicon-gripper"></span>
            </button>
            <div class="lp-group-header-content">
                ${t.icon?h`<span class="codicon codicon-${t.icon} lp-group-icon"></span>`:null}
                <span class="lp-group-name">${t.name}</span>
                ${o?h`<span class="lp-hidden-badge"><span class="codicon codicon-eye-closed"></span>hidden</span>`:null}
            </div>
            <span class="lp-group-action-toolbar">
                <button class="lp-inline-action-btn"
                    title=${o?"Show group":"Hide group"}
                    aria-label=${o?`Show group ${t.name}`:`Hide group ${t.name}`}
                    @click=${c=>{c.preventDefault(),c.stopPropagation(),sn(t)}}>
                    <span class="codicon codicon-${o?"eye":i.display.hideIcon}"></span>
                </button>
                <div class="lp-cp-container">
                    <button class="lp-inline-action-btn ${M===l?"lp-cp-active":""}"
                        title="Set color"
                        aria-label="Set color for group ${t.name}"
                        @click=${c=>{c.preventDefault(),c.stopPropagation(),an(t,l)}}>
                        <span class="codicon codicon-symbol-color"></span>
                    </button>
                </div>
                <button class="lp-inline-action-btn"
                    title="Edit group"
                    aria-label="Edit group ${t.name}"
                    @click=${c=>{c.preventDefault(),c.stopPropagation(),on(t)}}>
                    <span class="codicon codicon-edit"></span>
                </button>
            </span>
            ${M===l?ln(t):null}
        </summary>
        <div class="lp-group-items" style="${a.join(";")}">
            ${t.secondaryGroupBy==="workspace"?fn(t,e):e.map(c=>ge(c))}
        </div>
    </details>
    `},$n=t=>{if(!i.showSearch&&!i.searchQuery)return null;let e=i.groups.length>0&&!!i.searchQuery&&t.length>0;return h`
    <div id="searchContainer" class="lp-search-container">
        <div class="lp-search-row">
            <input type="text" class="lp-search-box" 
                placeholder="🔍 Search actions..." 
                .value=${i.searchQuery}
                @input=${n=>{i.searchQuery=n.target.value,C=!1}}
            >
            ${e?h`
                <div class="lp-search-assign-wrap">
                    <button class="lp-search-assign-btn ${C?"lp-search-assign-btn--open":""}"
                        title="Assign all ${t.length} result(s) to a group"
                        aria-label="Assign all search results to a group"
                        id="searchAssignBtn"
                        @click=${n=>{n.stopPropagation(),C=!C,P()}}>
                        <span class="codicon codicon-folder-opened"></span>
                    </button>
                    ${C?h`
                        <div class="lp-search-assign-picker" @click=${n=>n.stopPropagation()}>
                            <div class="lp-search-assign-picker-label">Assign ${t.length} result(s) to:</div>
                            ${i.groups.map(n=>h`
                                <button class="lp-search-assign-picker-item"
                                    @click=${()=>Qt(t,n.name)}>
                                    ${n.icon?h`<span class="codicon codicon-${n.icon}"></span>`:h`<span class="codicon codicon-folder"></span>`}
                                    ${n.name}
                                </button>
                            `)}
                        </div>
                    `:null}
                </div>
            `:null}
        </div>
    </div>
    `},P=()=>{if(!tt)return;let t=i.actions;if(i.showHidden||(t=t.filter(n=>!n.hidden)),i.searchQuery){let n=i.searchQuery.toLowerCase();t=t.filter(o=>o.name.toLowerCase().includes(n)||o.command.toLowerCase().includes(n)||o.group&&o.group.toLowerCase().includes(n))}let e=[];if(i.display.showGroup&&i.groups.length>0){let n=new Map,o=[];t.forEach(s=>{s.group?(n.has(s.group)||n.set(s.group,[]),n.get(s.group).push(s)):o.push(s)}),i.groups.forEach(s=>{if(s.hidden&&!i.showHidden)return;let r=n.get(s.name);r&&r.length&&e.push(vn(s,r))}),o.length&&e.push(h`
            <details class="lp-group" open>
                <summary class="lp-group-header"><span class="codicon codicon-chevron-down lp-group-chevron"></span> Ungrouped</summary>
                                <div class="lp-group-items">${o.map(s=>ge(s))}</div>
            </details>
          `)}else e.push(t.map(n=>ge(n)));if(t.length===0&&(i.searchQuery?e.push(h`
            <div class="lp-empty-state lp-no-results">
                <span class="codicon codicon-search"></span>
                <span>No results for "<strong>${i.searchQuery}</strong>"</span>
            </div>
          `):e.push(h`
            <div class="lp-empty-state">
                <div class="lp-welcome"><h2 class="lp-welcome-title">Welcome</h2></div>
                <div class="lp-empty-actions">
                    <button class="lp-empty-btn lp-empty-primary" @click=${()=>{i.generating=!0,m.postMessage({command:"showGenerateConfig"})}}>
                        <span class="codicon ${i.generating?"codicon-loading codicon-modifier-spin":"codicon-sparkle"}"></span>
                        <span class="lp-btn-label">${i.generating?"Detecting...":"Auto-detect"}</span>
                    </button>
                </div>
            </div>
          `)),ue(h`
    <div id="toast" class="lp-toast"></div>
    ${i.loading?h`<div class="lp-loading-overlay"><span class="codicon codicon-loading codicon-modifier-spin"></span></div>`:null}
    ${$n(t)}
    ${B?h`
    <div class="lp-reorder-banner">
        <span class="lp-reorder-banner-label">
            <span class="codicon codicon-grabber"></span>
            Drag rows to reorder
        </span>
        <button class="lp-reorder-banner-done" @click=${Ct}>
            <span class="codicon codicon-check"></span>
            Done
        </button>
    </div>`:null}
    <div class="lp-grid">
        ${e}
    </div>
  `,tt),i.newActionNames&&i.newActionNames.length>0){let n=[...i.newActionNames];i.newActionNames=[],requestAnimationFrame(()=>{let o=!1;for(let s of n){let r=s.replace(/"/g,'\\"'),a=document.querySelector(`[data-action-name="${r}"]`);a&&(o||(a.scrollIntoView({behavior:"smooth",block:"center"}),o=!0),a.classList.add("lp-highlight-new"),setTimeout(()=>{a.classList.remove("lp-highlight-new")},2200))}})}requestAnimationFrame(()=>{document.querySelectorAll(".lp-menu-panel--action, .lp-menu-panel--group").forEach(n=>{let o=n.getBoundingClientRect();n.classList.toggle("lp-menu-flip",o.bottom>window.innerHeight-8)})})};window.addEventListener("message",t=>{let e=t.data;switch(e.type){case"update":St(()=>{Object.assign(i,e.data),i.loading=!1,i.generating=!1});break;case"setLoading":i.loading=e.value;break;case"toggleSearch":i.showSearch=e.visible;break;case"collapseAllGroups":i.collapsedGroups=i.groups.map(n=>n.name),v();break;case"expandAllGroups":i.collapsedGroups=[],v();break;case"showToast":break}e.command==="statusUpdate"&&(i.runStatus={...i.runStatus,[e.name]:{exitCode:e.exitCode,timestamp:e.timestamp}})});P();document.addEventListener("click",t=>{let e=t.target;if(e?.closest(".lp-menu-container")||N(),!e?.closest(".lp-cp-container")){let n=!1;k!==null&&(k=null,n=!0),M!==null&&(M=null,n=!0),n&&P()}!e?.closest(".lp-search-assign-wrap")&&C&&(C=!1,P())});document.addEventListener("keydown",t=>{t.key==="Escape"&&(N(),C&&(C=!1,P()))});var U=null,me=0,He=()=>{U!==null&&(cancelAnimationFrame(U),U=null),me=0},pt=()=>{if(me===0){U=null;return}document.documentElement.scrollTop+=me,U=requestAnimationFrame(pt)};document.addEventListener("dragover",t=>{if(!b&&!w)return;let e=80,n=14,{clientY:o}=t,s=window.innerHeight,r=0;o<e?r=-Math.ceil(n*(1-o/e)):o>s-e&&(r=Math.ceil(n*(1-(s-o)/e))),me=r,r!==0&&U===null?U=requestAnimationFrame(pt):r===0&&He()});document.addEventListener("dragend",He);document.addEventListener("drop",He);
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
