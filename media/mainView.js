var oe=globalThis,re=oe.ShadowRoot&&(oe.ShadyCSS===void 0||oe.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,Ie=Symbol(),He=new WeakMap,se=class{constructor(e,n,o){if(this._$cssResult$=!0,o!==Ie)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=n}get styleSheet(){let e=this.o,n=this.t;if(re&&e===void 0){let o=n!==void 0&&n.length===1;o&&(e=He.get(n)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),o&&He.set(n,e))}return e}toString(){return this.cssText}},Le=t=>new se(typeof t=="string"?t:t+"",void 0,Ie);var Oe=(t,e)=>{if(re)t.adoptedStyleSheets=e.map(n=>n instanceof CSSStyleSheet?n:n.styleSheet);else for(let n of e){let o=document.createElement("style"),s=oe.litNonce;s!==void 0&&o.setAttribute("nonce",s),o.textContent=n.cssText,t.appendChild(o)}},de=re?t=>t:t=>t instanceof CSSStyleSheet?(e=>{let n="";for(let o of e.cssRules)n+=o.cssText;return Le(n)})(t):t;var{is:ct,defineProperty:pt,getOwnPropertyDescriptor:dt,getOwnPropertyNames:ut,getOwnPropertySymbols:ht,getPrototypeOf:gt}=Object,ae=globalThis,Ge=ae.trustedTypes,mt=Ge?Ge.emptyScript:"",$t=ae.reactiveElementPolyfillSupport,q=(t,e)=>t,ue={toAttribute(t,e){switch(e){case Boolean:t=t?mt:null;break;case Object:case Array:t=t==null?t:JSON.stringify(t)}return t},fromAttribute(t,e){let n=t;switch(e){case Boolean:n=t!==null;break;case Number:n=t===null?null:Number(t);break;case Object:case Array:try{n=JSON.parse(t)}catch{n=null}}return n}},Be=(t,e)=>!ct(t,e),Re={attribute:!0,type:String,converter:ue,reflect:!1,useDefault:!1,hasChanged:Be};Symbol.metadata??=Symbol("metadata"),ae.litPropertyMetadata??=new WeakMap;var T=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,n=Re){if(n.state&&(n.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((n=Object.create(n)).wrapped=!0),this.elementProperties.set(e,n),!n.noAccessor){let o=Symbol(),s=this.getPropertyDescriptor(e,o,n);s!==void 0&&pt(this.prototype,e,s)}}static getPropertyDescriptor(e,n,o){let{get:s,set:r}=dt(this.prototype,e)??{get(){return this[n]},set(a){this[n]=a}};return{get:s,set(a){let l=s?.call(this);r?.call(this,a),this.requestUpdate(e,l,o)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??Re}static _$Ei(){if(this.hasOwnProperty(q("elementProperties")))return;let e=gt(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(q("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(q("properties"))){let n=this.properties,o=[...ut(n),...ht(n)];for(let s of o)this.createProperty(s,n[s])}let e=this[Symbol.metadata];if(e!==null){let n=litPropertyMetadata.get(e);if(n!==void 0)for(let[o,s]of n)this.elementProperties.set(o,s)}this._$Eh=new Map;for(let[n,o]of this.elementProperties){let s=this._$Eu(n,o);s!==void 0&&this._$Eh.set(s,n)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let n=[];if(Array.isArray(e)){let o=new Set(e.flat(1/0).reverse());for(let s of o)n.unshift(de(s))}else e!==void 0&&n.push(de(e));return n}static _$Eu(e,n){let o=n.attribute;return o===!1?void 0:typeof o=="string"?o:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,n=this.constructor.elementProperties;for(let o of n.keys())this.hasOwnProperty(o)&&(e.set(o,this[o]),delete this[o]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return Oe(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,n,o){this._$AK(e,o)}_$ET(e,n){let o=this.constructor.elementProperties.get(e),s=this.constructor._$Eu(e,o);if(s!==void 0&&o.reflect===!0){let r=(o.converter?.toAttribute!==void 0?o.converter:ue).toAttribute(n,o.type);this._$Em=e,r==null?this.removeAttribute(s):this.setAttribute(s,r),this._$Em=null}}_$AK(e,n){let o=this.constructor,s=o._$Eh.get(e);if(s!==void 0&&this._$Em!==s){let r=o.getPropertyOptions(s),a=typeof r.converter=="function"?{fromAttribute:r.converter}:r.converter?.fromAttribute!==void 0?r.converter:ue;this._$Em=s;let l=a.fromAttribute(n,r.type);this[s]=l??this._$Ej?.get(s)??l,this._$Em=null}}requestUpdate(e,n,o,s=!1,r){if(e!==void 0){let a=this.constructor;if(s===!1&&(r=this[e]),o??=a.getPropertyOptions(e),!((o.hasChanged??Be)(r,n)||o.useDefault&&o.reflect&&r===this._$Ej?.get(e)&&!this.hasAttribute(a._$Eu(e,o))))return;this.C(e,n,o)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,n,{useDefault:o,reflect:s,wrapped:r},a){o&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,a??n??this[e]),r!==!0||a!==void 0)||(this._$AL.has(e)||(this.hasUpdated||o||(n=void 0),this._$AL.set(e,n)),s===!0&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(n){Promise.reject(n)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[s,r]of this._$Ep)this[s]=r;this._$Ep=void 0}let o=this.constructor.elementProperties;if(o.size>0)for(let[s,r]of o){let{wrapped:a}=r,l=this[s];a!==!0||this._$AL.has(s)||l===void 0||this.C(s,void 0,r,l)}}let e=!1,n=this._$AL;try{e=this.shouldUpdate(n),e?(this.willUpdate(n),this._$EO?.forEach(o=>o.hostUpdate?.()),this.update(n)):this._$EM()}catch(o){throw e=!1,this._$EM(),o}e&&this._$AE(n)}willUpdate(e){}_$AE(e){this._$EO?.forEach(n=>n.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(n=>this._$ET(n,this[n])),this._$EM()}updated(e){}firstUpdated(e){}};T.elementStyles=[],T.shadowRootOptions={mode:"open"},T[q("elementProperties")]=new Map,T[q("finalized")]=new Map,$t?.({ReactiveElement:T}),(ae.reactiveElementVersions??=[]).push("2.1.2");var ye=globalThis,Ue=t=>t,le=ye.trustedTypes,Ne=le?le.createPolicy("lit-html",{createHTML:t=>t}):void 0,Ve="$lit$",x=`lit$${Math.random().toFixed(9).slice(2)}$`,ze="?"+x,vt=`<${ze}>`,H=document,V=()=>H.createComment(""),z=t=>t===null||typeof t!="object"&&typeof t!="function",be=Array.isArray,ft=t=>be(t)||typeof t?.[Symbol.iterator]=="function",he=`[ 	
\f\r]`,W=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Fe=/-->/g,Ke=/>/g,P=RegExp(`>|${he}(?:([^\\s"'>=/]+)(${he}*=${he}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),je=/'/g,qe=/"/g,Qe=/^(?:script|style|textarea|title)$/i,Ae=t=>(e,...n)=>({_$litType$:t,strings:e,values:n}),u=Ae(1),un=Ae(2),hn=Ae(3),I=Symbol.for("lit-noChange"),$=Symbol.for("lit-nothing"),We=new WeakMap,D=H.createTreeWalker(H,129);function Ye(t,e){if(!be(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return Ne!==void 0?Ne.createHTML(e):e}var yt=(t,e)=>{let n=t.length-1,o=[],s,r=e===2?"<svg>":e===3?"<math>":"",a=W;for(let l=0;l<n;l++){let d=t[l],h,g,p=-1,v=0;for(;v<d.length&&(a.lastIndex=v,g=a.exec(d),g!==null);)v=a.lastIndex,a===W?g[1]==="!--"?a=Fe:g[1]!==void 0?a=Ke:g[2]!==void 0?(Qe.test(g[2])&&(s=RegExp("</"+g[2],"g")),a=P):g[3]!==void 0&&(a=P):a===P?g[0]===">"?(a=s??W,p=-1):g[1]===void 0?p=-2:(p=a.lastIndex-g[2].length,h=g[1],a=g[3]===void 0?P:g[3]==='"'?qe:je):a===qe||a===je?a=P:a===Fe||a===Ke?a=W:(a=P,s=void 0);let y=a===P&&t[l+1].startsWith("/>")?" ":"";r+=a===W?d+vt:p>=0?(o.push(h),d.slice(0,p)+Ve+d.slice(p)+x+y):d+x+(p===-2?l:y)}return[Ye(t,r+(t[n]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),o]},Q=class t{constructor({strings:e,_$litType$:n},o){let s;this.parts=[];let r=0,a=0,l=e.length-1,d=this.parts,[h,g]=yt(e,n);if(this.el=t.createElement(h,o),D.currentNode=this.el.content,n===2||n===3){let p=this.el.content.firstChild;p.replaceWith(...p.childNodes)}for(;(s=D.nextNode())!==null&&d.length<l;){if(s.nodeType===1){if(s.hasAttributes())for(let p of s.getAttributeNames())if(p.endsWith(Ve)){let v=g[a++],y=s.getAttribute(p).split(x),w=/([.?@])?(.*)/.exec(v);d.push({type:1,index:r,name:w[2],strings:y,ctor:w[1]==="."?me:w[1]==="?"?$e:w[1]==="@"?ve:B}),s.removeAttribute(p)}else p.startsWith(x)&&(d.push({type:6,index:r}),s.removeAttribute(p));if(Qe.test(s.tagName)){let p=s.textContent.split(x),v=p.length-1;if(v>0){s.textContent=le?le.emptyScript:"";for(let y=0;y<v;y++)s.append(p[y],V()),D.nextNode(),d.push({type:2,index:++r});s.append(p[v],V())}}}else if(s.nodeType===8)if(s.data===ze)d.push({type:2,index:r});else{let p=-1;for(;(p=s.data.indexOf(x,p+1))!==-1;)d.push({type:7,index:r}),p+=x.length-1}r++}}static createElement(e,n){let o=H.createElement("template");return o.innerHTML=e,o}};function R(t,e,n=t,o){if(e===I)return e;let s=o!==void 0?n._$Co?.[o]:n._$Cl,r=z(e)?void 0:e._$litDirective$;return s?.constructor!==r&&(s?._$AO?.(!1),r===void 0?s=void 0:(s=new r(t),s._$AT(t,n,o)),o!==void 0?(n._$Co??=[])[o]=s:n._$Cl=s),s!==void 0&&(e=R(t,s._$AS(t,e.values),s,o)),e}var ge=class{constructor(e,n){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=n}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:n},parts:o}=this._$AD,s=(e?.creationScope??H).importNode(n,!0);D.currentNode=s;let r=D.nextNode(),a=0,l=0,d=o[0];for(;d!==void 0;){if(a===d.index){let h;d.type===2?h=new Y(r,r.nextSibling,this,e):d.type===1?h=new d.ctor(r,d.name,d.strings,this,e):d.type===6&&(h=new fe(r,this,e)),this._$AV.push(h),d=o[++l]}a!==d?.index&&(r=D.nextNode(),a++)}return D.currentNode=H,s}p(e){let n=0;for(let o of this._$AV)o!==void 0&&(o.strings!==void 0?(o._$AI(e,o,n),n+=o.strings.length-2):o._$AI(e[n])),n++}},Y=class t{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,n,o,s){this.type=2,this._$AH=$,this._$AN=void 0,this._$AA=e,this._$AB=n,this._$AM=o,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,n=this._$AM;return n!==void 0&&e?.nodeType===11&&(e=n.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,n=this){e=R(this,e,n),z(e)?e===$||e==null||e===""?(this._$AH!==$&&this._$AR(),this._$AH=$):e!==this._$AH&&e!==I&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):ft(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==$&&z(this._$AH)?this._$AA.nextSibling.data=e:this.T(H.createTextNode(e)),this._$AH=e}$(e){let{values:n,_$litType$:o}=e,s=typeof o=="number"?this._$AC(e):(o.el===void 0&&(o.el=Q.createElement(Ye(o.h,o.h[0]),this.options)),o);if(this._$AH?._$AD===s)this._$AH.p(n);else{let r=new ge(s,this),a=r.u(this.options);r.p(n),this.T(a),this._$AH=r}}_$AC(e){let n=We.get(e.strings);return n===void 0&&We.set(e.strings,n=new Q(e)),n}k(e){be(this._$AH)||(this._$AH=[],this._$AR());let n=this._$AH,o,s=0;for(let r of e)s===n.length?n.push(o=new t(this.O(V()),this.O(V()),this,this.options)):o=n[s],o._$AI(r),s++;s<n.length&&(this._$AR(o&&o._$AB.nextSibling,s),n.length=s)}_$AR(e=this._$AA.nextSibling,n){for(this._$AP?.(!1,!0,n);e!==this._$AB;){let o=Ue(e).nextSibling;Ue(e).remove(),e=o}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},B=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,n,o,s,r){this.type=1,this._$AH=$,this._$AN=void 0,this.element=e,this.name=n,this._$AM=s,this.options=r,o.length>2||o[0]!==""||o[1]!==""?(this._$AH=Array(o.length-1).fill(new String),this.strings=o):this._$AH=$}_$AI(e,n=this,o,s){let r=this.strings,a=!1;if(r===void 0)e=R(this,e,n,0),a=!z(e)||e!==this._$AH&&e!==I,a&&(this._$AH=e);else{let l=e,d,h;for(e=r[0],d=0;d<r.length-1;d++)h=R(this,l[o+d],n,d),h===I&&(h=this._$AH[d]),a||=!z(h)||h!==this._$AH[d],h===$?e=$:e!==$&&(e+=(h??"")+r[d+1]),this._$AH[d]=h}a&&!s&&this.j(e)}j(e){e===$?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}},me=class extends B{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===$?void 0:e}},$e=class extends B{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==$)}},ve=class extends B{constructor(e,n,o,s,r){super(e,n,o,s,r),this.type=5}_$AI(e,n=this){if((e=R(this,e,n,0)??$)===I)return;let o=this._$AH,s=e===$&&o!==$||e.capture!==o.capture||e.once!==o.once||e.passive!==o.passive,r=e!==$&&(o===$||s);s&&this.element.removeEventListener(this.name,this,o),r&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},fe=class{constructor(e,n,o){this.element=e,this.type=6,this._$AN=void 0,this._$AM=n,this.options=o}get _$AU(){return this._$AM._$AU}_$AI(e){R(this,e)}};var bt=ye.litHtmlPolyfillSupport;bt?.(Q,Y),(ye.litHtmlVersions??=[]).push("3.3.2");var ie=(t,e,n)=>{let o=n?.renderBefore??e,s=o._$litPart$;if(s===void 0){let r=n?.renderBefore??null;o._$litPart$=s=new Y(e.insertBefore(V(),r),r,void 0,n??{})}return s._$AI(t),s};var we=globalThis,U=class extends T{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let n=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=ie(n,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return I}};U._$litElement$=!0,U.finalized=!0,we.litElementHydrateSupport?.({LitElement:U});var At=we.litElementPolyfillSupport;At?.({LitElement:U});(we.litElementVersions??=[]).push("4.2.2");var m=window.acquireVsCodeApi(),Xe=document.getElementById("root"),Ee=!1,_e=!1,b=()=>{if(Ee){_e=!0;return}j()},wt=t=>{Ee=!0;try{t()}finally{Ee=!1,_e&&(_e=!1,j())}};window.addEventListener("resize",()=>{m.postMessage({command:"webviewResized",width:window.innerWidth})});setTimeout(()=>{m.postMessage({command:"webviewResized",width:window.innerWidth})},100);var ke={actions:[],groups:[],searchQuery:"",loading:!1,generating:!1,display:{showCommand:!0,showGroup:!0,hideIcon:"eye-closed",playButtonBg:"transparent",actionToolbar:["hide","setColor","edit","delete"]},iconMap:{},collapsedGroups:[],showSearch:!1,showHidden:!1,selectionMode:!1,selectedItems:[],openActionMenuFor:null,runStatus:{}};window.__INITIAL_DATA__&&Object.assign(ke,window.__INITIAL_DATA__);var Me=m.getState()||{};Me.collapsedGroups&&(ke.collapsedGroups=Me.collapsedGroups);var i=new Proxy(ke,{set(t,e,n){return Reflect.set(t,e,n),b(),e==="collapsedGroups"&&m.setState({...Me,collapsedGroups:n}),!0}}),f=null,M=null,ee=!0,k=null,A=null,S=null,te=!0,E=null,F=!1,K=!0,Je=!1,_=null,X=!0,J=!1,Z=!1,L=!1,Et=()=>{G(),E=null,_=null,L=!0,b()},_t=()=>{f=null,M=null,k=null,L=!1,b()},Mt=(t,e)=>{f=e,t.dataTransfer.effectAllowed="move";let n=t.currentTarget.closest(".lp-btn-wrapper");if(n){let o=n.getBoundingClientRect(),s=t.clientX-o.left,r=t.clientY-o.top;t.dataTransfer.setDragImage(n,s,r)}setTimeout(()=>b(),0)},Ct=(t,e)=>{if(!f||f===e)return;t.preventDefault(),t.dataTransfer.dropEffect="move";let o=t.currentTarget.getBoundingClientRect(),s=t.clientY<o.top+o.height/2;(M!==e||ee!==s)&&(M=e,ee=s,b())},kt=(t,e)=>{let n=t.relatedTarget;!t.currentTarget.contains(n)&&M===e&&(M=null,b())},St=(t,e)=>{if(t.preventDefault(),!f||f===e)return;let n={...f};e.group!==void 0?n.group=e.group:delete n.group;let o=i.actions.map(d=>d===f?n:d),s=o.indexOf(n),r=o.indexOf(e);if(s===-1||r===-1){f=null,M=null,k=null;return}o.splice(s,1);let a=o.indexOf(e),l=ee?a:a+1;o.splice(l,0,n),f=null,M=null,k=null,i.actions=o,m.postMessage({command:"reorderActions",actions:o})},Ze=(t,e)=>{let n=[...i.actions],o=n.indexOf(t);if(e==="up"&&o<=0||e==="down"&&o>=n.length-1)return;let s=e==="up"?o-1:o+1;[n[o],n[s]]=[n[s],n[o]],i.actions=n,m.postMessage({command:"reorderActions",actions:n})},Tt=()=>{f=null,M=null,k=null,A=null,S=null,b()},xt=(t,e)=>{A=e,t.dataTransfer.effectAllowed="move";let n=t.currentTarget.closest(".lp-group-header");if(n){let o=n.getBoundingClientRect();t.dataTransfer.setDragImage(n,t.clientX-o.left,t.clientY-o.top)}setTimeout(()=>b(),0)},Pt=()=>{A=null,S=null,b()},Dt=(t,e)=>{if(A){if(A===e)return;t.preventDefault(),t.stopPropagation(),t.dataTransfer.dropEffect="move";let o=t.currentTarget.getBoundingClientRect(),s=t.clientY<o.top+o.height/2;(S!==e||te!==s)&&(S=e,te=s,b());return}f&&(t.preventDefault(),t.stopPropagation(),t.dataTransfer.dropEffect="move",k!==e.name&&(M=null,k=e.name,b()))},Ht=(t,e)=>{if(A){let n=t.relatedTarget;!t.currentTarget.contains(n)&&S===e&&(S=null,b());return}k===e.name&&(k=null,b())},It=(t,e)=>{if(t.preventDefault(),t.stopPropagation(),A){if(A===e)return;let l=[...i.groups],d=A,h=l.findIndex(w=>w===d),g=l.findIndex(w=>w===e);if(h===-1||g===-1){A=null,S=null;return}let[p]=l.splice(h,1),v=l.findIndex(w=>w===e),y=te?v:v+1;l.splice(y,0,p),A=null,S=null,i.groups=l,m.postMessage({command:"reorderGroups",groups:l});return}let n=f;if(!n)return;let o={...n,group:e.name},s=i.actions.filter(l=>l!==n),r=s.length;for(let l=s.length-1;l>=0;l--)if(s[l].group===e.name){r=l+1;break}let a=[...s.slice(0,r),o,...s.slice(r)];f=null,M=null,k=null,i.actions=a,m.postMessage({command:"reorderActions",actions:a})},et=t=>{let e=new Set(i.collapsedGroups);e.has(t)?e.delete(t):e.add(t),i.collapsedGroups=Array.from(e)},Lt=t=>{m.postMessage({command:"executeCommand",item:t})},Ot=t=>{m.postMessage({command:"editAction",item:t})},Gt=(t,e)=>{G(),_=null,E===e?E=null:(E=e,K=!0,F=!!t.backgroundColor),j()},Rt=t=>{m.postMessage({command:"deleteAction",item:t})},tt=(t,e)=>{m.postMessage({command:"assignGroup",item:t,groupName:e})},Se=t=>encodeURIComponent(`${t.name}|${t.command}|${t.type}|${t.workspace??""}`),nt=(t,e)=>{t.isOpen()||t.open(),e==="last"?t.focusLast():t.focusFirst()},Bt=(t,e)=>{if(t.key==="Escape"&&e.isOpen()){t.preventDefault(),e.close(!0);return}if(t.key==="Enter"||t.key===" "||t.key==="ArrowDown"){t.preventDefault(),nt(e,"first");return}t.key==="ArrowUp"&&(t.preventDefault(),nt(e,"last"))},Ut=(t,e)=>{let n=t.currentTarget,o=e.getMenuItems(n);if(!o.length)return;let s=o.indexOf(document.activeElement);if(t.key==="Escape"){t.preventDefault(),e.close(!0);return}if(t.key==="Tab"){e.close();return}if(t.key==="Home"){t.preventDefault(),o[0].focus();return}if(t.key==="End"){t.preventDefault(),o[o.length-1].focus();return}if(t.key==="ArrowDown"){t.preventDefault();let r=s>=0?(s+1)%o.length:0;o[r].focus();return}if(t.key==="ArrowUp"){t.preventDefault();let r=s>=0?(s-1+o.length)%o.length:o.length-1;o[r].focus()}},Nt=t=>{let e=Se(t);requestAnimationFrame(()=>{document.querySelector(`.lp-menu-trigger[data-action-menu-id="${e}"]`)?.focus()})},ot=(t,e="first")=>{let n=Se(t);requestAnimationFrame(()=>{let o=document.querySelector(`.lp-menu-panel[data-action-menu-id="${n}"]`);if(!o)return;let s=Array.from(o.querySelectorAll(".lp-menu-item"));if(!s.length)return;(e==="last"?s[s.length-1]:s[0]).focus()})},st=t=>({isOpen:()=>i.openActionMenuFor===t,open:()=>{i.openActionMenuFor=t},close:(e=!1)=>G(e?t:void 0),focusFirst:()=>ot(t,"first"),focusLast:()=>ot(t,"last"),getMenuItems:e=>Array.from(e.querySelectorAll(".lp-menu-item"))}),Ft=(t,e)=>{t.stopPropagation(),E=null,_=null,i.openActionMenuFor=i.openActionMenuFor===e?null:e},G=t=>{i.openActionMenuFor&&(i.openActionMenuFor=null),t&&Nt(t)},N=t=>{t(),G()},Kt=(t,e)=>{Bt(t,st(e))},jt=(t,e)=>{Ut(t,st(e))},qt=t=>{m.postMessage({command:"hideAction",item:t})},Wt=t=>{m.postMessage({command:"editGroup",group:t})},Vt=t=>{m.postMessage({command:"hideGroup",group:t})},zt=t=>`grp-${encodeURIComponent(t.name)}`,Qt=(t,e)=>{G(),E=null,_===e?_=null:(_=e,X=!0,J=!!t.backgroundColor,Z=!!t.borderColor),j()},Yt=t=>{let e=t.color||t.backgroundColor||t.borderColor||"",n=r=>{m.postMessage({command:"setGroupColor",group:t,color:r,applyToAccent:X,applyToBg:J,applyToBorder:Z})},o=r=>n(r.target.value),s=r=>{let a=r.target.value.trim();a&&n(a)};return u`
        <div class="lp-cp-popout" @click=${r=>r.stopPropagation()}>
            <div class="lp-cp-swatches">
                ${rt.map(r=>u`
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
                        <input type="checkbox" .checked=${X}
                            @change=${r=>{X=r.target.checked,X?e&&n(e):m.postMessage({command:"setGroupColor",group:t,color:"",applyToAccent:!0,applyToBg:!1,applyToBorder:!1})}}>
                        Accent
                    </label>
                    <label class="lp-cp-target-label">
                        <input type="checkbox" .checked=${J}
                            @change=${r=>{J=r.target.checked,J?e&&n(e):m.postMessage({command:"setGroupColor",group:t,color:"",applyToAccent:!1,applyToBg:!0,applyToBorder:!1})}}>
                        BG
                    </label>
                    <label class="lp-cp-target-label">
                        <input type="checkbox" .checked=${Z}
                            @change=${r=>{Z=r.target.checked,Z?e&&n(e):m.postMessage({command:"setGroupColor",group:t,color:"",applyToAccent:!1,applyToBg:!1,applyToBorder:!0})}}>
                        Border
                    </label>
                </div>
            </div>
        </div>
    `},Xt=t=>{let e=Math.floor((Date.now()-t)/1e3);if(e<60)return`${e}s ago`;let n=Math.floor(e/60);return n<60?`${n}m ago`:`${Math.floor(n/60)}h ago`},Jt=t=>{if(t.type==="npm"&&t.command.startsWith("npm run "))return t.command.replace("npm run ","");if(t.type==="task"){let e=t.command.split("|")[1];return e||"task"}if(t.type==="launch"){let e=t.command.split("|")[1];return e||"launch"}if(t.type==="vscode"){let[e,n]=t.command.split("|");return e==="workbench.action.tasks.runTask"?n||"task":e==="workbench.action.debug.start"?n||"launch":n?`${e} ${n}`:e}return t.command},Zt=t=>{let e=`lp-menu-container lp-menu-container--${t.kind}`,n=`lp-menu-trigger lp-menu-trigger--${t.kind}`,o=`lp-menu-panel lp-menu-panel--${t.kind}`;return u`
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
    `},en=[{name:"Forest",value:"#162d1e"},{name:"Ocean",value:"#0e1e30"},{name:"Dusk",value:"#1e1030"},{name:"Ember",value:"#2e160a"},{name:"Slate",value:"#141e28"},{name:"Olive",value:"#1e2210"},{name:"Teal",value:"#0e2828"},{name:"Crimson",value:"#2e0e0e"}],rt=[{name:"Red",value:"var(--vscode-charts-red)"},{name:"Orange",value:"var(--vscode-charts-orange)"},{name:"Yellow",value:"var(--vscode-charts-yellow)"},{name:"Green",value:"var(--vscode-charts-green)"},{name:"Blue",value:"var(--vscode-charts-blue)"},{name:"Purple",value:"var(--vscode-charts-purple)"},{name:"Pink",value:"var(--vscode-charts-pink)"},{name:"Error",value:"var(--vscode-errorForeground)"},{name:"Warning",value:"var(--vscode-editorWarning-foreground)"},{name:"Info",value:"var(--vscode-editorInfo-foreground)"},{name:"Success",value:"var(--vscode-testing-iconPassed)"}],tn=t=>{let e=t.match(/^#([0-9a-f]{6})$/i);if(!e)return null;let n=parseInt(e[1].slice(0,2),16)/255,o=parseInt(e[1].slice(2,4),16)/255,s=parseInt(e[1].slice(4,6),16)/255,r=Math.max(n,o,s),a=Math.min(n,o,s),l=r-a,d=0,h=0,g=(r+a)/2;return l>0&&(h=l/(g>.5?2-r-a:r+a),d=r===n?(o-s)/l+(o<s?6:0):r===o?(s-n)/l+2:(n-o)/l+4,d/=6),[d*360,h*100,g*100]},ce=(t,e,n)=>{t/=360,e/=100,n/=100;let o=s=>{let r=(s+t*12)%12,a=e*Math.min(n,1-n);return n-a*Math.max(-1,Math.min(r-3,9-r,1))};return"#"+[o(0),o(8),o(4)].map(s=>Math.round(s*255).toString(16).padStart(2,"0")).join("")},nn=t=>{let e=tn(t);if(!e)return[];let[n,o,s]=e,r=Math.max(Math.min(o,65),25),a=Math.max(Math.min(s,32),8);return[ce((n+30)%360,r,a),ce((n-30+360)%360,r,a),ce((n+150)%360,r,a),ce((n+180)%360,r,a)]},on=t=>{let e=t.rowBackgroundColor||t.backgroundColor||"",n=e.startsWith("#")?nn(e):[],o=l=>{m.postMessage({command:"setActionColor",item:t,color:l,applyToPlay:F,applyToRow:K})},s=()=>{m.postMessage({command:"setActionColor",item:t,color:"",applyToPlay:F,applyToRow:K})},r=l=>o(l.target.value),a=l=>{let d=l.target.value.trim();d&&o(d)};return u`
        <div class="lp-cp-popout" @click=${l=>l.stopPropagation()}>
            <div class="lp-cp-swatches">
                ${en.map(l=>u`
                    <button class="lp-cp-swatch ${e===l.value?"lp-cp-swatch--active":""}"
                        style="background:${l.value}" title=${l.name}
                        @click=${()=>o(l.value)}></button>
                `)}
                <button class="lp-cp-swatch lp-cp-swatch--clear" title="Clear color"
                    @click=${s}>
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
            <details class="lp-cp-theme-section" .open=${Je}
                @toggle=${l=>{Je=l.target.open}}>
                <summary class="lp-cp-theme-toggle">
                    <span class="codicon codicon-chevron-right lp-cp-theme-chevron"></span>
                    VSCode theme colors
                </summary>
                <div class="lp-cp-swatches lp-cp-theme-swatches">
                    ${rt.map(l=>u`
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
                        <input type="checkbox" .checked=${F}
                            @change=${l=>{F=l.target.checked,F?e&&o(e):m.postMessage({command:"setActionColor",item:t,color:"",applyToPlay:!0,applyToRow:!1})}}>
                        <span class="codicon codicon-play"></span>Play
                    </label>
                    <label class="lp-cp-target-label">
                        <input type="checkbox" .checked=${K}
                            @change=${l=>{K=l.target.checked,K?e&&o(e):m.postMessage({command:"setActionColor",item:t,color:"",applyToPlay:!1,applyToRow:!0})}}>
                        Row bg
                    </label>
                </div>
            </div>
        </div>
    `},Ce=t=>{let e=t.hidden,{display:n}=i,o=[],s=null;if(t.workspace){let c="";t.workspaceColor&&(c=`background-color: ${t.workspaceColor}; color: var(--vscode-editor-background); border: 1px solid color-mix(in srgb, var(--vscode-foreground) 20%, transparent); opacity: 0.9;`),s=u`<span class="lp-workspace-label" style="${c}">${t.workspace}</span>`}if(n.showCommand){let c=Jt(t),C=t.name.trim().toLowerCase();c.trim().toLowerCase()!==C&&t.command.trim().toLowerCase()!==C&&o.push(c)}let r=!!t.group,l=i.groups.length>0||r,d=i.openActionMenuFor===t,h=Se(t),g=f===t,p=M===t,v=["lp-btn-wrapper",e?"lp-hidden-item":"",g?"lp-dragging":"",p&&ee?"lp-drag-over-top":"",p&&!ee?"lp-drag-over-bottom":"",E===h?"lp-cp-open":"",d?"lp-menu-open":"",L?"lp-reorder-mode-row":""].filter(Boolean).join(" "),y=i.runStatus[t.name],w=y?u`<span
            class="lp-status-dot ${y.exitCode===0?"lp-status-ok":"lp-status-fail"}"
            title="Last run: ${Xt(y.timestamp)} — Exit ${y.exitCode}">
          </span>`:null,ne={edit:{icon:"edit",label:"Edit",action:()=>Ot(t)},setColor:{icon:"symbol-color",label:"Set color",action:()=>Gt(t,h)},hide:{icon:e?"eye":n.hideIcon,label:e?"Show":"Hide",action:()=>qt(t)},delete:{icon:"trash",label:"Delete",action:()=>Rt(t),dangerous:!0}},xe=n.actionToolbar??["hide","setColor","edit","delete"],lt=xe.filter(c=>ne[c]).map(c=>({id:c,...ne[c]})),Pe=Object.keys(ne).filter(c=>!xe.includes(c)).map(c=>({id:c,...ne[c]})),De=!i.searchQuery,it=!L&&(Pe.length>0||l||De);return u`
    <div class=${v}
        data-action-name=${t.name}
        style=${t.rowBackgroundColor?`--lp-row-bg:${t.rowBackgroundColor}`:""}
        @dragover=${c=>Ct(c,t)}
        @dragleave=${c=>kt(c,t)}
        @drop=${c=>St(c,t)}>
        ${i.selectionMode?u`<input type="checkbox" class="lp-btn-checkbox" .checked=${i.selectedItems.includes(t)} @change=${c=>{c.target.checked?i.selectedItems=[...i.selectedItems,t]:i.selectedItems=i.selectedItems.filter(C=>C!==t)}}>`:null}

        ${L?u`
        <button class="lp-reorder-handle" draggable="true"
            title="Drag to reorder"
            aria-label=${`Drag ${t.name} to reorder`}
            @dragstart=${c=>Mt(c,t)}
            @dragend=${Tt}>
            <span class="codicon codicon-gripper"></span>
        </button>`:u`
        <button
            class="lp-play-btn"
            style=${t.backgroundColor?`--lp-play-btn-bg: ${t.backgroundColor}`:n.playButtonBg&&n.playButtonBg!=="transparent"?`--lp-play-btn-bg: ${n.playButtonBg}`:""}
            title="Run"
            aria-label=${`Run ${t.name}`}
            @click=${()=>Lt(t)}>
            <span class="codicon codicon-play"></span>
        </button>`}

        <div class="lp-btn ${i.selectionMode?"has-checkbox":""}">
             ${s}
             <span class="lp-btn-name">
                ${t.name}
                ${e?u`<span class="lp-hidden-badge">(hidden)</span>`:null}
                ${w}
                <span class="lp-action-toolbar" style=${L?"display:none":""}>
                    ${lt.map(c=>c.id==="setColor"?u`
                        <div class="lp-cp-container">
                            <button class="lp-inline-action-btn ${E===h?"lp-cp-active":""}"
                                title=${c.label} aria-label="${c.label} ${t.name}"
                                @click=${C=>{C.stopPropagation(),c.action()}}>
                                <span class="codicon codicon-${c.icon}"></span>
                            </button>
                        </div>
                    `:u`
                        <button class="lp-inline-action-btn ${c.dangerous?"lp-btn-dangerous":""}"
                            title=${c.label} aria-label="${c.label} ${t.name}"
                            @click=${C=>{C.stopPropagation(),c.action()}}>
                            <span class="codicon codicon-${c.icon}"></span>
                        </button>
                    `)}
                    ${it?Zt({kind:"action",menuId:h,isOpen:d,triggerTitle:"More actions",triggerAriaLabel:`More actions for ${t.name}`,onTriggerClick:c=>Ft(c,t),onTriggerKeydown:c=>Kt(c,t),onMenuClick:c=>c.stopPropagation(),onMenuKeydown:c=>jt(c,t),menuContent:u`
                            ${Pe.map(c=>u`
                                <button class="lp-menu-item lp-menu-item--action" role="menuitem"
                                    @click=${()=>N(()=>c.action())}>
                                    <span class="codicon codicon-${c.icon}"></span>
                                    ${c.label}
                                </button>
                            `)}
                            ${l?u`
                                <div class="lp-menu-divider"></div>
                                <button class="lp-menu-item lp-menu-item--action" role="menuitem" @click=${()=>N(()=>tt(t,"__none__"))}>
                                    <span class="codicon codicon-clear-all"></span>
                                    Remove from group
                                </button>
                                ${i.groups.map(c=>u`
                                    <button class="lp-menu-item lp-menu-item--action" role="menuitem" @click=${()=>N(()=>tt(t,c.name))}>
                                        ${c.icon?u`<span class="codicon codicon-${c.icon}"></span>`:u`<span class="codicon codicon-folder"></span>`}
                                        Assign to ${c.name}
                                    </button>
                                `)}
                            `:null}
                            ${De?u`
                                <div class="lp-menu-divider"></div>
                                <button class="lp-menu-item lp-menu-item--action" role="menuitem"
                                    @click=${()=>N(()=>Et())}>
                                    <span class="codicon codicon-grabber"></span>
                                    Reorder actions
                                </button>
                                <button class="lp-menu-item lp-menu-item--action" role="menuitem"
                                    ?disabled=${i.actions.indexOf(t)===0}
                                    @click=${()=>N(()=>Ze(t,"up"))}>
                                    <span class="codicon codicon-arrow-up"></span>
                                    Move up
                                </button>
                                <button class="lp-menu-item lp-menu-item--action" role="menuitem"
                                    ?disabled=${i.actions.indexOf(t)===i.actions.length-1}
                                    @click=${()=>N(()=>Ze(t,"down"))}>
                                    <span class="codicon codicon-arrow-down"></span>
                                    Move down
                                </button>
                            `:null}
                        `}):null}
                </span>
             </span>
             ${o.length?u`<span class="lp-btn-meta">${o.map((c,C)=>u`${C>0?" \xB7 ":""}${c}`)}</span>`:null}
        </div>
        ${E===h?on(t):null}
    </div>
    `},sn=(t,e)=>{let n=!!i.searchQuery||!i.collapsedGroups.includes(t.name),o=!!t.hidden,s=[],r=t.borderColor||t.color;r&&(r.includes("--vscode-charts-")?s.push(`--lp-group-accent: ${r}`):s.push(`--lp-group-accent: ${r}`)),t.color&&(t.color.includes("--vscode-charts-")||s.push(`color: ${t.color}`)),t.backgroundColor&&s.push(`background-color: ${t.backgroundColor}`);let a=[];t.backgroundColor&&a.push(`background-color: ${t.backgroundColor}`);let l=zt(t);return u`
    <details class="lp-group ${A===t?"lp-dragging-group":""} ${S===t&&te?"lp-drag-over-top-group":""} ${S===t&&!te?"lp-drag-over-bottom-group":""}" ?open=${n} @toggle=${p=>{if(i.searchQuery)return;let v=p.target;(v.open&&i.collapsedGroups.includes(t.name)||!v.open&&!i.collapsedGroups.includes(t.name))&&et(t.name)}}>
        <summary class="lp-group-header ${o?"lp-hidden-group":""} ${k===t.name?"lp-drag-over-group":""} ${_===l?"lp-group-header--picker-open":""}"
            style="${s.join(";")}"
            @dragover=${p=>Dt(p,t)}
            @dragleave=${p=>Ht(p,t)}
            @drop=${p=>It(p,t)}>
            <span class="codicon codicon-chevron-down lp-group-chevron"></span>
            <button class="lp-group-drag-handle" draggable="true"
                title="Drag to reorder group" aria-label=${`Drag ${t.name} to reorder`}
                @click=${p=>{p.preventDefault(),p.stopPropagation()}}
                @dragstart=${p=>xt(p,t)}
                @dragend=${Pt}>
                <span class="codicon codicon-gripper"></span>
            </button>
            <div class="lp-group-header-content">
                ${t.icon?u`<span class="codicon codicon-${t.icon} lp-group-icon"></span>`:null}
                <span class="lp-group-name">${t.name}</span>
                ${o?u`<span class="lp-hidden-badge"><span class="codicon codicon-eye-closed"></span>hidden</span>`:null}
            </div>
            <span class="lp-group-action-toolbar">
                <button class="lp-inline-action-btn"
                    title=${o?"Show group":"Hide group"}
                    aria-label=${o?`Show group ${t.name}`:`Hide group ${t.name}`}
                    @click=${p=>{p.preventDefault(),p.stopPropagation(),Vt(t)}}>
                    <span class="codicon codicon-${o?"eye":i.display.hideIcon}"></span>
                </button>
                <div class="lp-cp-container">
                    <button class="lp-inline-action-btn ${_===l?"lp-cp-active":""}"
                        title="Set color"
                        aria-label="Set color for group ${t.name}"
                        @click=${p=>{p.preventDefault(),p.stopPropagation(),Qt(t,l)}}>
                        <span class="codicon codicon-symbol-color"></span>
                    </button>
                </div>
                <button class="lp-inline-action-btn"
                    title="Edit group"
                    aria-label="Edit group ${t.name}"
                    @click=${p=>{p.preventDefault(),p.stopPropagation(),Wt(t)}}>
                    <span class="codicon codicon-edit"></span>
                </button>
            </span>
            ${_===l?Yt(t):null}
        </summary>
        <div class="lp-group-items" style="${a.join(";")}">
            ${e.map(p=>Ce(p))}
        </div>
    </details>
    `},rn=()=>!i.showSearch&&!i.searchQuery?null:u`
    <div id="searchContainer" class="lp-search-container">
        <input type="text" class="lp-search-box" 
            placeholder="🔍 Search actions..." 
            .value=${i.searchQuery}
            @input=${t=>{i.searchQuery=t.target.value}}
        >
        <!-- Additional search buttons (Select Multiple, etc) could go here -->
    </div>
    `,j=()=>{if(!Xe)return;let t=i.actions;if(i.showHidden||(t=t.filter(n=>!n.hidden)),i.searchQuery){let n=i.searchQuery.toLowerCase();t=t.filter(o=>o.name.toLowerCase().includes(n)||o.command.toLowerCase().includes(n)||o.group&&o.group.toLowerCase().includes(n))}let e=[];if(i.display.showGroup&&i.groups.length>0){let n=new Map,o=[];t.forEach(s=>{s.group?(n.has(s.group)||n.set(s.group,[]),n.get(s.group).push(s)):o.push(s)}),i.groups.forEach(s=>{if(s.hidden&&!i.showHidden)return;let r=n.get(s.name);r&&r.length&&e.push(sn(s,r))}),o.length&&e.push(u`
            <details class="lp-group" open>
                <summary class="lp-group-header"><span class="codicon codicon-chevron-down lp-group-chevron"></span> Ungrouped</summary>
                                <div class="lp-group-items">${o.map(s=>Ce(s))}</div>
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
                    <button class="lp-empty-btn lp-empty-primary" @click=${()=>{i.generating=!0,m.postMessage({command:"showGenerateConfig"})}}>
                        <span class="codicon ${i.generating?"codicon-loading codicon-modifier-spin":"codicon-sparkle"}"></span>
                        <span class="lp-btn-label">${i.generating?"Detecting...":"Auto-detect"}</span>
                    </button>
                </div>
            </div>
          `)),ie(u`
    <div id="toast" class="lp-toast"></div>
    ${i.loading?u`<div class="lp-loading-overlay"><span class="codicon codicon-loading codicon-modifier-spin"></span></div>`:null}
    ${rn()}
    ${L?u`
    <div class="lp-reorder-banner">
        <span class="lp-reorder-banner-label">
            <span class="codicon codicon-grabber"></span>
            Drag rows to reorder
        </span>
        <button class="lp-reorder-banner-done" @click=${_t}>
            <span class="codicon codicon-check"></span>
            Done
        </button>
    </div>`:null}
    <div class="lp-grid">
        ${e}
    </div>
  `,Xe),i.newActionNames&&i.newActionNames.length>0){let n=[...i.newActionNames];i.newActionNames=[],requestAnimationFrame(()=>{let o=!1;for(let s of n){let r=s.replace(/"/g,'\\"'),a=document.querySelector(`[data-action-name="${r}"]`);a&&(o||(a.scrollIntoView({behavior:"smooth",block:"center"}),o=!0),a.classList.add("lp-highlight-new"),setTimeout(()=>{a.classList.remove("lp-highlight-new")},2200))}})}requestAnimationFrame(()=>{document.querySelectorAll(".lp-menu-panel--action, .lp-menu-panel--group").forEach(n=>{let o=n.getBoundingClientRect();n.classList.toggle("lp-menu-flip",o.bottom>window.innerHeight-8)})})};window.addEventListener("message",t=>{let e=t.data;switch(e.type){case"update":wt(()=>{Object.assign(i,e.data),i.loading=!1,i.generating=!1});break;case"setLoading":i.loading=e.value;break;case"toggleSearch":i.showSearch=e.visible;break;case"collapseAllGroups":i.collapsedGroups=i.groups.map(n=>n.name),b();break;case"expandAllGroups":i.collapsedGroups=[],b();break;case"showToast":break}e.command==="statusUpdate"&&(i.runStatus={...i.runStatus,[e.name]:{exitCode:e.exitCode,timestamp:e.timestamp}})});j();document.addEventListener("click",t=>{let e=t.target;if(e?.closest(".lp-menu-container")||G(),!e?.closest(".lp-cp-container")){let n=!1;E!==null&&(E=null,n=!0),_!==null&&(_=null,n=!0),n&&j()}});document.addEventListener("keydown",t=>{t.key==="Escape"&&G()});var O=null,pe=0,Te=()=>{O!==null&&(cancelAnimationFrame(O),O=null),pe=0},at=()=>{if(pe===0){O=null;return}document.documentElement.scrollTop+=pe,O=requestAnimationFrame(at)};document.addEventListener("dragover",t=>{if(!f&&!A)return;let e=80,n=14,{clientY:o}=t,s=window.innerHeight,r=0;o<e?r=-Math.ceil(n*(1-o/e)):o>s-e&&(r=Math.ceil(n*(1-(s-o)/e))),pe=r,r!==0&&O===null?O=requestAnimationFrame(at):r===0&&Te()});document.addEventListener("dragend",Te);document.addEventListener("drop",Te);
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
