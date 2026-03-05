var X=globalThis,ee=X.ShadowRoot&&(X.ShadyCSS===void 0||X.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,ke=Symbol(),Ce=new WeakMap,Z=class{constructor(e,n,o){if(this._$cssResult$=!0,o!==ke)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=n}get styleSheet(){let e=this.o,n=this.t;if(ee&&e===void 0){let o=n!==void 0&&n.length===1;o&&(e=Ce.get(n)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),o&&Ce.set(n,e))}return e}toString(){return this.cssText}},Se=t=>new Z(typeof t=="string"?t:t+"",void 0,ke);var Me=(t,e)=>{if(ee)t.adoptedStyleSheets=e.map(n=>n instanceof CSSStyleSheet?n:n.styleSheet);else for(let n of e){let o=document.createElement("style"),s=X.litNonce;s!==void 0&&o.setAttribute("nonce",s),o.textContent=n.cssText,t.appendChild(o)}},se=ee?t=>t:t=>t instanceof CSSStyleSheet?(e=>{let n="";for(let o of e.cssRules)n+=o.cssText;return Se(n)})(t):t;var{is:Ze,defineProperty:et,getOwnPropertyDescriptor:tt,getOwnPropertyNames:nt,getOwnPropertySymbols:ot,getPrototypeOf:st}=Object,te=globalThis,Te=te.trustedTypes,rt=Te?Te.emptyScript:"",at=te.reactiveElementPolyfillSupport,U=(t,e)=>t,re={toAttribute(t,e){switch(e){case Boolean:t=t?rt:null;break;case Object:case Array:t=t==null?t:JSON.stringify(t)}return t},fromAttribute(t,e){let n=t;switch(e){case Boolean:n=t!==null;break;case Number:n=t===null?null:Number(t);break;case Object:case Array:try{n=JSON.parse(t)}catch{n=null}}return n}},Pe=(t,e)=>!Ze(t,e),xe={attribute:!0,type:String,converter:re,reflect:!1,useDefault:!1,hasChanged:Pe};Symbol.metadata??=Symbol("metadata"),te.litPropertyMetadata??=new WeakMap;var _=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,n=xe){if(n.state&&(n.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((n=Object.create(n)).wrapped=!0),this.elementProperties.set(e,n),!n.noAccessor){let o=Symbol(),s=this.getPropertyDescriptor(e,o,n);s!==void 0&&et(this.prototype,e,s)}}static getPropertyDescriptor(e,n,o){let{get:s,set:r}=tt(this.prototype,e)??{get(){return this[n]},set(a){this[n]=a}};return{get:s,set(a){let c=s?.call(this);r?.call(this,a),this.requestUpdate(e,c,o)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??xe}static _$Ei(){if(this.hasOwnProperty(U("elementProperties")))return;let e=st(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(U("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(U("properties"))){let n=this.properties,o=[...nt(n),...ot(n)];for(let s of o)this.createProperty(s,n[s])}let e=this[Symbol.metadata];if(e!==null){let n=litPropertyMetadata.get(e);if(n!==void 0)for(let[o,s]of n)this.elementProperties.set(o,s)}this._$Eh=new Map;for(let[n,o]of this.elementProperties){let s=this._$Eu(n,o);s!==void 0&&this._$Eh.set(s,n)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let n=[];if(Array.isArray(e)){let o=new Set(e.flat(1/0).reverse());for(let s of o)n.unshift(se(s))}else e!==void 0&&n.push(se(e));return n}static _$Eu(e,n){let o=n.attribute;return o===!1?void 0:typeof o=="string"?o:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,n=this.constructor.elementProperties;for(let o of n.keys())this.hasOwnProperty(o)&&(e.set(o,this[o]),delete this[o]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return Me(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,n,o){this._$AK(e,o)}_$ET(e,n){let o=this.constructor.elementProperties.get(e),s=this.constructor._$Eu(e,o);if(s!==void 0&&o.reflect===!0){let r=(o.converter?.toAttribute!==void 0?o.converter:re).toAttribute(n,o.type);this._$Em=e,r==null?this.removeAttribute(s):this.setAttribute(s,r),this._$Em=null}}_$AK(e,n){let o=this.constructor,s=o._$Eh.get(e);if(s!==void 0&&this._$Em!==s){let r=o.getPropertyOptions(s),a=typeof r.converter=="function"?{fromAttribute:r.converter}:r.converter?.fromAttribute!==void 0?r.converter:re;this._$Em=s;let c=a.fromAttribute(n,r.type);this[s]=c??this._$Ej?.get(s)??c,this._$Em=null}}requestUpdate(e,n,o,s=!1,r){if(e!==void 0){let a=this.constructor;if(s===!1&&(r=this[e]),o??=a.getPropertyOptions(e),!((o.hasChanged??Pe)(r,n)||o.useDefault&&o.reflect&&r===this._$Ej?.get(e)&&!this.hasAttribute(a._$Eu(e,o))))return;this.C(e,n,o)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,n,{useDefault:o,reflect:s,wrapped:r},a){o&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,a??n??this[e]),r!==!0||a!==void 0)||(this._$AL.has(e)||(this.hasUpdated||o||(n=void 0),this._$AL.set(e,n)),s===!0&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(n){Promise.reject(n)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[s,r]of this._$Ep)this[s]=r;this._$Ep=void 0}let o=this.constructor.elementProperties;if(o.size>0)for(let[s,r]of o){let{wrapped:a}=r,c=this[s];a!==!0||this._$AL.has(s)||c===void 0||this.C(s,void 0,r,c)}}let e=!1,n=this._$AL;try{e=this.shouldUpdate(n),e?(this.willUpdate(n),this._$EO?.forEach(o=>o.hostUpdate?.()),this.update(n)):this._$EM()}catch(o){throw e=!1,this._$EM(),o}e&&this._$AE(n)}willUpdate(e){}_$AE(e){this._$EO?.forEach(n=>n.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(n=>this._$ET(n,this[n])),this._$EM()}updated(e){}firstUpdated(e){}};_.elementStyles=[],_.shadowRootOptions={mode:"open"},_[U("elementProperties")]=new Map,_[U("finalized")]=new Map,at?.({ReactiveElement:_}),(te.reactiveElementVersions??=[]).push("2.1.2");var ue=globalThis,Ie=t=>t,ne=ue.trustedTypes,He=ne?ne.createPolicy("lit-html",{createHTML:t=>t}):void 0,Be="$lit$",k=`lit$${Math.random().toFixed(9).slice(2)}$`,Ue="?"+k,it=`<${Ue}>`,x=document,F=()=>x.createComment(""),K=t=>t===null||typeof t!="object"&&typeof t!="function",he=Array.isArray,lt=t=>he(t)||typeof t?.[Symbol.iterator]=="function",ae=`[ 	
\f\r]`,N=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,De=/-->/g,Le=/>/g,M=RegExp(`>|${ae}(?:([^\\s"'>=/]+)(${ae}*=${ae}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),Oe=/'/g,Ge=/"/g,Ne=/^(?:script|style|textarea|title)$/i,ge=t=>(e,...n)=>({_$litType$:t,strings:e,values:n}),d=ge(1),zt=ge(2),Qt=ge(3),P=Symbol.for("lit-noChange"),$=Symbol.for("lit-nothing"),Re=new WeakMap,T=x.createTreeWalker(x,129);function Fe(t,e){if(!he(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return He!==void 0?He.createHTML(e):e}var ct=(t,e)=>{let n=t.length-1,o=[],s,r=e===2?"<svg>":e===3?"<math>":"",a=N;for(let c=0;c<n;c++){let i=t[c],h,m,u=-1,v=0;for(;v<i.length&&(a.lastIndex=v,m=a.exec(i),m!==null);)v=a.lastIndex,a===N?m[1]==="!--"?a=De:m[1]!==void 0?a=Le:m[2]!==void 0?(Ne.test(m[2])&&(s=RegExp("</"+m[2],"g")),a=M):m[3]!==void 0&&(a=M):a===M?m[0]===">"?(a=s??N,u=-1):m[1]===void 0?u=-2:(u=a.lastIndex-m[2].length,h=m[1],a=m[3]===void 0?M:m[3]==='"'?Ge:Oe):a===Ge||a===Oe?a=M:a===De||a===Le?a=N:(a=M,s=void 0);let y=a===M&&t[c+1].startsWith("/>")?" ":"";r+=a===N?i+it:u>=0?(o.push(h),i.slice(0,u)+Be+i.slice(u)+k+y):i+k+(u===-2?c:y)}return[Fe(t,r+(t[n]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),o]},j=class t{constructor({strings:e,_$litType$:n},o){let s;this.parts=[];let r=0,a=0,c=e.length-1,i=this.parts,[h,m]=ct(e,n);if(this.el=t.createElement(h,o),T.currentNode=this.el.content,n===2||n===3){let u=this.el.content.firstChild;u.replaceWith(...u.childNodes)}for(;(s=T.nextNode())!==null&&i.length<c;){if(s.nodeType===1){if(s.hasAttributes())for(let u of s.getAttributeNames())if(u.endsWith(Be)){let v=m[a++],y=s.getAttribute(u).split(k),I=/([.?@])?(.*)/.exec(v);i.push({type:1,index:r,name:I[2],strings:y,ctor:I[1]==="."?le:I[1]==="?"?ce:I[1]==="@"?pe:D}),s.removeAttribute(u)}else u.startsWith(k)&&(i.push({type:6,index:r}),s.removeAttribute(u));if(Ne.test(s.tagName)){let u=s.textContent.split(k),v=u.length-1;if(v>0){s.textContent=ne?ne.emptyScript:"";for(let y=0;y<v;y++)s.append(u[y],F()),T.nextNode(),i.push({type:2,index:++r});s.append(u[v],F())}}}else if(s.nodeType===8)if(s.data===Ue)i.push({type:2,index:r});else{let u=-1;for(;(u=s.data.indexOf(k,u+1))!==-1;)i.push({type:7,index:r}),u+=k.length-1}r++}}static createElement(e,n){let o=x.createElement("template");return o.innerHTML=e,o}};function H(t,e,n=t,o){if(e===P)return e;let s=o!==void 0?n._$Co?.[o]:n._$Cl,r=K(e)?void 0:e._$litDirective$;return s?.constructor!==r&&(s?._$AO?.(!1),r===void 0?s=void 0:(s=new r(t),s._$AT(t,n,o)),o!==void 0?(n._$Co??=[])[o]=s:n._$Cl=s),s!==void 0&&(e=H(t,s._$AS(t,e.values),s,o)),e}var ie=class{constructor(e,n){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=n}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:n},parts:o}=this._$AD,s=(e?.creationScope??x).importNode(n,!0);T.currentNode=s;let r=T.nextNode(),a=0,c=0,i=o[0];for(;i!==void 0;){if(a===i.index){let h;i.type===2?h=new q(r,r.nextSibling,this,e):i.type===1?h=new i.ctor(r,i.name,i.strings,this,e):i.type===6&&(h=new de(r,this,e)),this._$AV.push(h),i=o[++c]}a!==i?.index&&(r=T.nextNode(),a++)}return T.currentNode=x,s}p(e){let n=0;for(let o of this._$AV)o!==void 0&&(o.strings!==void 0?(o._$AI(e,o,n),n+=o.strings.length-2):o._$AI(e[n])),n++}},q=class t{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,n,o,s){this.type=2,this._$AH=$,this._$AN=void 0,this._$AA=e,this._$AB=n,this._$AM=o,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,n=this._$AM;return n!==void 0&&e?.nodeType===11&&(e=n.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,n=this){e=H(this,e,n),K(e)?e===$||e==null||e===""?(this._$AH!==$&&this._$AR(),this._$AH=$):e!==this._$AH&&e!==P&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):lt(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==$&&K(this._$AH)?this._$AA.nextSibling.data=e:this.T(x.createTextNode(e)),this._$AH=e}$(e){let{values:n,_$litType$:o}=e,s=typeof o=="number"?this._$AC(e):(o.el===void 0&&(o.el=j.createElement(Fe(o.h,o.h[0]),this.options)),o);if(this._$AH?._$AD===s)this._$AH.p(n);else{let r=new ie(s,this),a=r.u(this.options);r.p(n),this.T(a),this._$AH=r}}_$AC(e){let n=Re.get(e.strings);return n===void 0&&Re.set(e.strings,n=new j(e)),n}k(e){he(this._$AH)||(this._$AH=[],this._$AR());let n=this._$AH,o,s=0;for(let r of e)s===n.length?n.push(o=new t(this.O(F()),this.O(F()),this,this.options)):o=n[s],o._$AI(r),s++;s<n.length&&(this._$AR(o&&o._$AB.nextSibling,s),n.length=s)}_$AR(e=this._$AA.nextSibling,n){for(this._$AP?.(!1,!0,n);e!==this._$AB;){let o=Ie(e).nextSibling;Ie(e).remove(),e=o}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},D=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,n,o,s,r){this.type=1,this._$AH=$,this._$AN=void 0,this.element=e,this.name=n,this._$AM=s,this.options=r,o.length>2||o[0]!==""||o[1]!==""?(this._$AH=Array(o.length-1).fill(new String),this.strings=o):this._$AH=$}_$AI(e,n=this,o,s){let r=this.strings,a=!1;if(r===void 0)e=H(this,e,n,0),a=!K(e)||e!==this._$AH&&e!==P,a&&(this._$AH=e);else{let c=e,i,h;for(e=r[0],i=0;i<r.length-1;i++)h=H(this,c[o+i],n,i),h===P&&(h=this._$AH[i]),a||=!K(h)||h!==this._$AH[i],h===$?e=$:e!==$&&(e+=(h??"")+r[i+1]),this._$AH[i]=h}a&&!s&&this.j(e)}j(e){e===$?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}},le=class extends D{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===$?void 0:e}},ce=class extends D{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==$)}},pe=class extends D{constructor(e,n,o,s,r){super(e,n,o,s,r),this.type=5}_$AI(e,n=this){if((e=H(this,e,n,0)??$)===P)return;let o=this._$AH,s=e===$&&o!==$||e.capture!==o.capture||e.once!==o.once||e.passive!==o.passive,r=e!==$&&(o===$||s);s&&this.element.removeEventListener(this.name,this,o),r&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},de=class{constructor(e,n,o){this.element=e,this.type=6,this._$AN=void 0,this._$AM=n,this.options=o}get _$AU(){return this._$AM._$AU}_$AI(e){H(this,e)}};var pt=ue.litHtmlPolyfillSupport;pt?.(j,q),(ue.litHtmlVersions??=[]).push("3.3.2");var oe=(t,e,n)=>{let o=n?.renderBefore??e,s=o._$litPart$;if(s===void 0){let r=n?.renderBefore??null;o._$litPart$=s=new q(e.insertBefore(F(),r),r,void 0,n??{})}return s._$AI(t),s};var me=globalThis,L=class extends _{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let n=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=oe(n,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return P}};L._$litElement$=!0,L.finalized=!0,me.litElementHydrateSupport?.({LitElement:L});var dt=me.litElementPolyfillSupport;dt?.({LitElement:L});(me.litElementVersions??=[]).push("4.2.2");var g=window.acquireVsCodeApi(),Ke=document.getElementById("root"),fe=!1,ve=!1,w=()=>{if(fe){ve=!0;return}B()},ut=t=>{fe=!0;try{t()}finally{fe=!1,ve&&(ve=!1,B())}},be={actions:[],groups:[],searchQuery:"",loading:!1,generating:!1,display:{showIcon:!0,showType:!0,showCommand:!0,showGroup:!0,hideIcon:"eye-closed",playButtonBg:"transparent",actionToolbar:["hide","setColor","edit","delete"]},iconMap:{},collapsedGroups:[],showSearch:!1,showHidden:!1,selectionMode:!1,selectedItems:[],openActionMenuFor:null,runStatus:{}};window.__INITIAL_DATA__&&Object.assign(be,window.__INITIAL_DATA__);var ye=g.getState()||{};ye.collapsedGroups&&(be.collapsedGroups=ye.collapsedGroups);var l=new Proxy(be,{set(t,e,n){return t[e]=n,w(),e==="collapsedGroups"&&g.setState({...ye,collapsedGroups:n}),!0}}),f=null,b=null,Q=!0,C=null,E=null;var O=!0,G=!1,A=null,V=!0,W=!1,z=!1,ht=(t,e)=>{f=e,t.dataTransfer.effectAllowed="move";let n=t.currentTarget.closest(".lp-btn-wrapper");if(n){let o=n.getBoundingClientRect(),s=t.clientX-o.left,r=t.clientY-o.top;t.dataTransfer.setDragImage(n,s,r)}setTimeout(()=>w(),0)},gt=(t,e)=>{if(!f||f===e)return;t.preventDefault(),t.dataTransfer.dropEffect="move";let o=t.currentTarget.getBoundingClientRect(),s=t.clientY<o.top+o.height/2;(b!==e||Q!==s)&&(b=e,Q=s,w())},mt=(t,e)=>{let n=t.relatedTarget;!t.currentTarget.contains(n)&&b===e&&(b=null,w())},$t=(t,e)=>{if(t.preventDefault(),!f||f===e)return;let n={...f};e.group!==void 0?n.group=e.group:delete n.group;let o=l.actions.map(i=>i===f?n:i),s=o.indexOf(n),r=o.indexOf(e);if(s===-1||r===-1){f=null,b=null,C=null;return}o.splice(s,1);let a=o.indexOf(e),c=Q?a:a+1;o.splice(c,0,n),f=null,b=null,C=null,l.actions=o,g.postMessage({command:"reorderActions",actions:o})},ft=()=>{f=null,b=null,C=null,w()},vt=(t,e)=>{f&&(t.preventDefault(),t.stopPropagation(),t.dataTransfer.dropEffect="move",C!==e.name&&(b=null,C=e.name,w()))},yt=(t,e)=>{C===e.name&&(C=null,w())},At=(t,e)=>{t.preventDefault(),t.stopPropagation();let n=f;if(!n)return;let o={...n,group:e.name},s=l.actions.filter(c=>c!==n),r=s.length;for(let c=s.length-1;c>=0;c--)if(s[c].group===e.name){r=c+1;break}let a=[...s.slice(0,r),o,...s.slice(r)];f=null,b=null,C=null,l.actions=a,g.postMessage({command:"reorderActions",actions:a})},je=t=>{let e=new Set(l.collapsedGroups);e.has(t)?e.delete(t):e.add(t),l.collapsedGroups=Array.from(e)},bt=t=>{g.postMessage({command:"executeCommand",item:t})},_t=t=>{g.postMessage({command:"editAction",item:t})},Et=(t,e)=>{R(),A=null,E===e?E=null:(E=e,O=!0,G=!!t.rowBackgroundColor),B()},wt=t=>{g.postMessage({command:"deleteAction",item:t})},qe=(t,e)=>{g.postMessage({command:"assignGroup",item:t,groupName:e})},_e=t=>encodeURIComponent(`${t.name}|${t.command}|${t.type}|${t.workspace??""}`),Ve=(t,e)=>{t.isOpen()||t.open(),e==="last"?t.focusLast():t.focusFirst()},Ct=(t,e)=>{if(t.key==="Escape"&&e.isOpen()){t.preventDefault(),e.close(!0);return}if(t.key==="Enter"||t.key===" "||t.key==="ArrowDown"){t.preventDefault(),Ve(e,"first");return}t.key==="ArrowUp"&&(t.preventDefault(),Ve(e,"last"))},kt=(t,e)=>{let n=t.currentTarget,o=e.getMenuItems(n);if(!o.length)return;let s=o.indexOf(document.activeElement);if(t.key==="Escape"){t.preventDefault(),e.close(!0);return}if(t.key==="Tab"){e.close();return}if(t.key==="Home"){t.preventDefault(),o[0].focus();return}if(t.key==="End"){t.preventDefault(),o[o.length-1].focus();return}if(t.key==="ArrowDown"){t.preventDefault();let r=s>=0?(s+1)%o.length:0;o[r].focus();return}if(t.key==="ArrowUp"){t.preventDefault();let r=s>=0?(s-1+o.length)%o.length:o.length-1;o[r].focus()}},St=t=>{let e=_e(t);requestAnimationFrame(()=>{document.querySelector(`.lp-menu-trigger[data-action-menu-id="${e}"]`)?.focus()})},We=(t,e="first")=>{let n=_e(t);requestAnimationFrame(()=>{let o=document.querySelector(`.lp-menu-panel[data-action-menu-id="${n}"]`);if(!o)return;let s=Array.from(o.querySelectorAll(".lp-menu-item"));if(!s.length)return;(e==="last"?s[s.length-1]:s[0]).focus()})},ze=t=>({isOpen:()=>l.openActionMenuFor===t,open:()=>{l.openActionMenuFor=t},close:(e=!1)=>R(e?t:void 0),focusFirst:()=>We(t,"first"),focusLast:()=>We(t,"last"),getMenuItems:e=>Array.from(e.querySelectorAll(".lp-menu-item"))}),Mt=(t,e)=>{t.stopPropagation(),E=null,A=null,l.openActionMenuFor=l.openActionMenuFor===e?null:e},R=t=>{l.openActionMenuFor&&(l.openActionMenuFor=null),t&&St(t)},$e=t=>{t(),R()},Tt=(t,e)=>{Ct(t,ze(e))},xt=(t,e)=>{kt(t,ze(e))},Pt=t=>{g.postMessage({command:"hideAction",item:t})},It=t=>{g.postMessage({command:"editGroup",group:t})},Ht=t=>{g.postMessage({command:"hideGroup",group:t})},Dt=t=>`grp-${encodeURIComponent(t.name)}`,Lt=(t,e)=>{R(),E=null,A===e?A=null:(A=e,V=!0,W=!!t.backgroundColor,z=!!t.borderColor),B()},Ot=t=>{let e=t.color||t.backgroundColor||t.borderColor||"",n=r=>{g.postMessage({command:"setGroupColor",group:t,color:r,applyToAccent:V,applyToBg:W,applyToBorder:z})},o=r=>n(r.target.value),s=r=>{let a=r.target.value.trim();a&&n(a)};return d`
        <div class="lp-cp-popout" @click=${r=>r.stopPropagation()}>
            <div class="lp-cp-swatches">
                ${Qe.map(r=>d`
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
                        @input=${o}>
                    <span class="codicon codicon-color-mode"></span>
                </label>
            </div>
            <div class="lp-cp-targets">
                <label class="lp-cp-target-label">
                    <input type="checkbox" .checked=${V}
                        @change=${r=>{V=r.target.checked,V?e&&n(e):g.postMessage({command:"setGroupColor",group:t,color:"",applyToAccent:!0,applyToBg:!1,applyToBorder:!1})}}>
                    Header accent
                </label>
                <label class="lp-cp-target-label">
                    <input type="checkbox" .checked=${W}
                        @change=${r=>{W=r.target.checked,W?e&&n(e):g.postMessage({command:"setGroupColor",group:t,color:"",applyToAccent:!1,applyToBg:!0,applyToBorder:!1})}}>
                    Items background
                </label>
                <label class="lp-cp-target-label">
                    <input type="checkbox" .checked=${z}
                        @change=${r=>{z=r.target.checked,z?e&&n(e):g.postMessage({command:"setGroupColor",group:t,color:"",applyToAccent:!1,applyToBg:!1,applyToBorder:!0})}}>
                    Border accent
                </label>
            </div>
        </div>
    `},Gt=t=>{let e=Math.floor((Date.now()-t)/1e3);if(e<60)return`${e}s ago`;let n=Math.floor(e/60);return n<60?`${n}m ago`:`${Math.floor(n/60)}h ago`},Rt=t=>{if(t.type==="npm"&&t.command.startsWith("npm run "))return`npm: ${t.command.replace("npm run ","")}`;if(t.type==="task"){let e=t.command.split("|")[1];return e?`task: ${e}`:"task"}if(t.type==="launch"){let e=t.command.split("|")[1];return e?`launch: ${e}`:"launch"}if(t.type==="vscode"){let[e,n]=t.command.split("|");return e==="workbench.action.tasks.runTask"?n?`task: ${n}`:"task":e==="workbench.action.debug.start"?n?`launch: ${n}`:"launch":n?`${e} ${n}`:e}return t.command},Bt=t=>{let e=`lp-menu-container lp-menu-container--${t.kind}`,n=`lp-menu-trigger lp-menu-trigger--${t.kind}`,o=`lp-menu-panel lp-menu-panel--${t.kind}`;return d`
        <div
            class=${e}
            data-action-menu-id=${t.kind==="action"?t.menuId:""}
            data-group-menu-id=${t.kind==="group"?t.menuId:""}>
            <button
                class=${n}
                title=${t.triggerTitle}
                aria-label=${t.triggerAriaLabel}
                aria-haspopup="menu"
                aria-expanded=${t.isOpen?"true":"false"}
                data-action-menu-id=${t.kind==="action"?t.menuId:""}
                data-group-menu-id=${t.kind==="group"?t.menuId:""}
                @click=${t.onTriggerClick}
                @keydown=${t.onTriggerKeydown}>
                <span class="codicon codicon-ellipsis"></span>
            </button>

            ${t.isOpen?d`
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
    `},Qe=[{name:"Red",value:"var(--vscode-charts-red)"},{name:"Orange",value:"var(--vscode-charts-orange)"},{name:"Yellow",value:"var(--vscode-charts-yellow)"},{name:"Green",value:"var(--vscode-charts-green)"},{name:"Blue",value:"var(--vscode-charts-blue)"},{name:"Purple",value:"var(--vscode-charts-purple)"},{name:"Pink",value:"var(--vscode-charts-pink)"},{name:"Error",value:"var(--vscode-errorForeground)"},{name:"Warning",value:"var(--vscode-editorWarning-foreground)"},{name:"Info",value:"var(--vscode-editorInfo-foreground)"},{name:"Success",value:"var(--vscode-testing-iconPassed)"}],Ut=(t,e)=>{let n=t.backgroundColor||"",o=c=>{g.postMessage({command:"setActionColor",item:t,color:c,applyToPlay:O,applyToRow:G})},s=()=>{g.postMessage({command:"setActionColor",item:t,color:"",applyToPlay:O,applyToRow:G})},r=c=>o(c.target.value),a=c=>{let i=c.target.value.trim();i&&o(i)};return d`
        <div class="lp-cp-popout" @click=${c=>c.stopPropagation()}>
            <div class="lp-cp-swatches">
                ${Qe.map(c=>d`
                    <button class="lp-cp-swatch ${n===c.value?"lp-cp-swatch--active":""}"
                        style="background:${c.value}" title=${c.name}
                        @click=${()=>o(c.value)}></button>
                `)}
                <button class="lp-cp-swatch lp-cp-swatch--clear" title="Clear color"
                    @click=${s}>
                    <span class="codicon codicon-circle-slash"></span>
                </button>
            </div>
            <div class="lp-cp-custom-row">
                <div class="lp-cp-preview" style="background:${n||"transparent"}"></div>
                <input class="lp-cp-text" type="text" placeholder="#hex or var(--color)"
                    value=${n}
                    @change=${a}>
                <label class="lp-cp-native-wrap" title="Open color wheel">
                    <input type="color" value=${n.startsWith("#")?n:"#000000"}
                        @input=${r}>
                    <span class="codicon codicon-color-mode"></span>
                </label>
            </div>
            <div class="lp-cp-targets">
                <label class="lp-cp-target-label">
                    <input type="checkbox" .checked=${O}
                        @change=${c=>{O=c.target.checked,O?n&&o(n):g.postMessage({command:"setActionColor",item:t,color:"",applyToPlay:!0,applyToRow:!1})}}>
                    Play button
                </label>
                <label class="lp-cp-target-label">
                    <input type="checkbox" .checked=${G}
                        @change=${c=>{G=c.target.checked,G?n&&o(n):g.postMessage({command:"setActionColor",item:t,color:"",applyToPlay:!1,applyToRow:!0})}}>
                    Row background
                </label>
            </div>
        </div>
    `},Ae=t=>{let e=t.hidden,{display:n,iconMap:o}=l,s=n.showIcon&&o[t.type]||"",r=[];t.workspace&&r.push(d`<span class="lp-workspace-label">${t.workspace}</span>`);let a=Rt(t);n.showType&&n.showCommand?(r.push(t.type),r.push(a)):n.showType?r.push(t.type):n.showCommand&&r.push(a);let c=!!t.group,h=l.groups.length>0||c,m=l.openActionMenuFor===t,u=_e(t),v=f===t,y=b===t,I=["lp-btn-wrapper",e?"lp-hidden-item":"",v?"lp-dragging":"",y&&Q?"lp-drag-over-top":"",y&&!Q?"lp-drag-over-bottom":""].filter(Boolean).join(" "),Y=l.runStatus[t.name],Ye=Y?d`<span
            class="lp-status-dot ${Y.exitCode===0?"lp-status-ok":"lp-status-fail"}"
            title="Last run: ${Gt(Y.timestamp)} — Exit ${Y.exitCode}">
          </span>`:null,J={edit:{icon:"edit",label:"Edit",action:()=>_t(t)},setColor:{icon:"symbol-color",label:"Set color",action:()=>Et(t,u)},hide:{icon:e?"eye":n.hideIcon,label:e?"Show":"Hide",action:()=>Pt(t)},delete:{icon:"trash",label:"Delete",action:()=>wt(t),dangerous:!0}},Ee=n.actionToolbar??["hide","setColor","edit","delete"],Je=Ee.filter(p=>J[p]).map(p=>({id:p,...J[p]})),we=Object.keys(J).filter(p=>!Ee.includes(p)).map(p=>({id:p,...J[p]})),Xe=we.length>0||h;return d`
    <div class=${I}
        style=${t.rowBackgroundColor?`--lp-row-bg:${t.rowBackgroundColor}`:""}
        @dragover=${p=>gt(p,t)}
        @dragleave=${p=>mt(p,t)}
        @drop=${p=>$t(p,t)}>
        ${l.selectionMode?d`<input type="checkbox" class="lp-btn-checkbox" .checked=${l.selectedItems.includes(t)} @change=${p=>{p.target.checked?l.selectedItems=[...l.selectedItems,t]:l.selectedItems=l.selectedItems.filter(S=>S!==t)}}>`:null}

        <button
            class="lp-play-btn"
            style="--lp-play-btn-bg: ${t.backgroundColor||n.playButtonBg}"
            title="Run"
            aria-label=${`Run ${t.name}`}
            @click=${()=>bt(t)}>
            <span class="codicon codicon-play"></span>
        </button>
        ${l.searchQuery?null:d`
        <button class="lp-drag-handle" draggable="true" title="Drag to reorder" aria-label=${`Drag ${t.name} to reorder`}
            @dragstart=${p=>ht(p,t)}
            @dragend=${ft}>
            <span class="codicon codicon-gripper"></span>
        </button>`}

        <div class="lp-btn ${l.selectionMode?"has-checkbox":""}">
             <span class="lp-btn-name">
                ${s?d`<span class="codicon codicon-${s} lp-icon"></span>`:null}
                ${t.name}
                ${e?d`<span class="lp-hidden-badge">(hidden)</span>`:null}
                ${Ye}
                <span class="lp-action-toolbar">
                    ${Je.map(p=>p.id==="setColor"?d`
                        <div class="lp-cp-container">
                            <button class="lp-inline-action-btn ${E===u?"lp-cp-active":""}"
                                title=${p.label} aria-label="${p.label} ${t.name}"
                                @click=${S=>{S.stopPropagation(),p.action()}}>
                                <span class="codicon codicon-${p.icon}"></span>
                            </button>
                            ${E===u?Ut(t,u):null}
                        </div>
                    `:d`
                        <button class="lp-inline-action-btn ${p.dangerous?"lp-btn-dangerous":""}"
                            title=${p.label} aria-label="${p.label} ${t.name}"
                            @click=${S=>{S.stopPropagation(),p.action()}}>
                            <span class="codicon codicon-${p.icon}"></span>
                        </button>
                    `)}
                    ${Xe?Bt({kind:"action",menuId:u,isOpen:m,triggerTitle:"More actions",triggerAriaLabel:`More actions for ${t.name}`,onTriggerClick:p=>Mt(p,t),onTriggerKeydown:p=>Tt(p,t),onMenuClick:p=>p.stopPropagation(),onMenuKeydown:p=>xt(p,t),menuContent:d`
                            ${we.map(p=>d`
                                <button class="lp-menu-item lp-menu-item--action" role="menuitem"
                                    @click=${()=>$e(()=>p.action())}>
                                    <span class="codicon codicon-${p.icon}"></span>
                                    ${p.label}
                                </button>
                            `)}
                            ${h?d`
                                <div class="lp-menu-divider"></div>
                                <button class="lp-menu-item lp-menu-item--action" role="menuitem" @click=${()=>$e(()=>qe(t,"__none__"))}>
                                    <span class="codicon codicon-clear-all"></span>
                                    Remove from group
                                </button>
                                ${l.groups.map(p=>d`
                                    <button class="lp-menu-item lp-menu-item--action" role="menuitem" @click=${()=>$e(()=>qe(t,p.name))}>
                                        ${p.icon?d`<span class="codicon codicon-${p.icon}"></span>`:d`<span class="codicon codicon-folder"></span>`}
                                        Assign to ${p.name}
                                    </button>
                                `)}
                            `:null}
                        `}):null}
                </span>
             </span>
             ${r.length?d`<span class="lp-btn-meta">${r.map((p,S)=>d`${S>0?" \xB7 ":""}${p}`)}</span>`:null}
        </div>
    </div>
    `},Nt=(t,e)=>{let n=!l.collapsedGroups.includes(t.name),o=!!t.hidden,s=[],r=t.borderColor||t.color;r&&(r.includes("--vscode-charts-")?s.push(`--lp-group-accent: ${r}`):s.push(`--lp-group-accent: ${r}`)),t.color&&(t.color.includes("--vscode-charts-")||s.push(`color: ${t.color}`)),t.backgroundColor&&s.push(`background-color: ${t.backgroundColor}`);let a=[];t.backgroundColor&&a.push(`background-color: ${t.backgroundColor}`);let c=Dt(t);return d`
    <details class="lp-group" ?open=${n} @toggle=${i=>{let h=i.target;(h.open&&l.collapsedGroups.includes(t.name)||!h.open&&!l.collapsedGroups.includes(t.name))&&je(t.name)}}>
        <summary class="lp-group-header ${o?"lp-hidden-group":""} ${C===t.name?"lp-drag-over-group":""} ${A===c?"lp-group-header--picker-open":""}"
            style="${s.join(";")}"
            @dragover=${i=>vt(i,t)}
            @dragleave=${i=>yt(i,t)}
            @drop=${i=>At(i,t)}>
            <span class="codicon codicon-chevron-down lp-group-chevron"></span>
            <div class="lp-group-header-content">
                ${t.icon?d`<span class="codicon codicon-${t.icon} lp-group-icon"></span>`:null}
                <span class="lp-group-name">${t.name}</span>
                ${o?d`<span class="lp-hidden-badge">(hidden)</span>`:null}
            </div>
            <span class="lp-group-action-toolbar">
                <button class="lp-inline-action-btn"
                    title=${o?"Show group":"Hide group"}
                    aria-label=${o?`Show group ${t.name}`:`Hide group ${t.name}`}
                    @click=${i=>{i.preventDefault(),i.stopPropagation(),Ht(t)}}>
                    <span class="codicon codicon-${o?"eye":l.display.hideIcon}"></span>
                </button>
                <div class="lp-cp-container">
                    <button class="lp-inline-action-btn ${A===c?"lp-cp-active":""}"
                        title="Set color"
                        aria-label="Set color for group ${t.name}"
                        @click=${i=>{i.preventDefault(),i.stopPropagation(),Lt(t,c)}}>
                        <span class="codicon codicon-symbol-color"></span>
                    </button>
                    ${A===c?Ot(t):null}
                </div>
                <button class="lp-inline-action-btn"
                    title="Edit group"
                    aria-label="Edit group ${t.name}"
                    @click=${i=>{i.preventDefault(),i.stopPropagation(),It(t)}}>
                    <span class="codicon codicon-edit"></span>
                </button>
            </span>
        </summary>
        <div class="lp-group-items" style="${a.join(";")}">
            ${e.map(i=>Ae(i))}
        </div>
    </details>
    `},Ft=()=>!l.showSearch&&!l.searchQuery?null:d`
    <div id="searchContainer" class="lp-search-container">
        <input type="text" class="lp-search-box" 
            placeholder="🔍 Search actions..." 
            .value=${l.searchQuery}
            @input=${t=>{l.searchQuery=t.target.value}}
        >
        <!-- Additional search buttons (Select Multiple, etc) could go here -->
    </div>
    `,B=()=>{if(!Ke)return;let t=l.actions;if(l.showHidden||(t=t.filter(n=>!n.hidden)),l.searchQuery){let n=l.searchQuery.toLowerCase();t=t.filter(o=>o.name.toLowerCase().includes(n)||o.command.toLowerCase().includes(n)||o.group&&o.group.toLowerCase().includes(n))}let e=[];if(l.display.showGroup&&l.groups.length>0){let n=new Map,o=[];t.forEach(s=>{s.group?(n.has(s.group)||n.set(s.group,[]),n.get(s.group).push(s)):o.push(s)}),l.groups.forEach(s=>{if(s.hidden&&!l.showHidden)return;let r=n.get(s.name);r&&r.length&&e.push(Nt(s,r))}),o.length&&e.push(d`
            <details class="lp-group" open>
                <summary class="lp-group-header"><span class="codicon codicon-chevron-down lp-group-chevron"></span> Ungrouped</summary>
                                <div class="lp-group-items">${o.map(s=>Ae(s))}</div>
            </details>
          `)}else e.push(t.map(n=>Ae(n)));t.length===0&&(l.searchQuery?e.push(d`
            <div class="lp-empty-state lp-no-results">
                <span class="codicon codicon-search"></span>
                <span>No results for "<strong>${l.searchQuery}</strong>"</span>
            </div>
          `):e.push(d`
            <div class="lp-empty-state">
                <div class="lp-welcome"><h2 class="lp-welcome-title">Welcome</h2></div>
                <div class="lp-empty-actions">
                    <button class="lp-empty-btn lp-empty-primary" @click=${()=>{l.generating=!0,g.postMessage({command:"showGenerateConfig"})}}>
                        <span class="codicon ${l.generating?"codicon-loading codicon-modifier-spin":"codicon-sparkle"}"></span>
                        <span class="lp-btn-label">${l.generating?"Detecting...":"Auto-detect"}</span>
                    </button>
                </div>
            </div>
          `)),oe(d`
    <div id="toast" class="lp-toast"></div>
    ${l.loading?d`<div class="lp-loading-overlay"><span class="codicon codicon-loading codicon-modifier-spin"></span></div>`:null}
    ${Ft()}
    <div class="lp-grid">
        ${e}
    </div>
  `,Ke),requestAnimationFrame(()=>{document.querySelectorAll(".lp-menu-panel--action, .lp-menu-panel--group").forEach(n=>{let o=n.getBoundingClientRect();n.classList.toggle("lp-menu-flip",o.bottom>window.innerHeight-8)})})};window.addEventListener("message",t=>{let e=t.data;switch(e.type){case"update":ut(()=>{Object.assign(l,e.data),l.loading=!1,l.generating=!1});break;case"setLoading":l.loading=e.value;break;case"toggleSearch":l.showSearch=e.visible;break;case"collapseAllGroups":l.collapsedGroups=l.groups.map(n=>n.name),w();break;case"expandAllGroups":l.collapsedGroups=[],w();break;case"showToast":break}e.command==="statusUpdate"&&(l.runStatus={...l.runStatus,[e.name]:{exitCode:e.exitCode,timestamp:e.timestamp}})});B();document.addEventListener("click",t=>{let e=t.target;if(e?.closest(".lp-menu-container")||R(),!e?.closest(".lp-cp-container")){let n=!1;E!==null&&(E=null,n=!0),A!==null&&(A=null,n=!0),n&&B()}});document.addEventListener("keydown",t=>{t.key==="Escape"&&R()});
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
