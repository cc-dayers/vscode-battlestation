var N=globalThis,K=N.ShadowRoot&&(N.ShadyCSS===void 0||N.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,me=Symbol(),ge=new WeakMap,B=class{constructor(e,n,s){if(this._$cssResult$=!0,s!==me)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=n}get styleSheet(){let e=this.o,n=this.t;if(K&&e===void 0){let s=n!==void 0&&n.length===1;s&&(e=ge.get(n)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),s&&ge.set(n,e))}return e}toString(){return this.cssText}},$e=t=>new B(typeof t=="string"?t:t+"",void 0,me);var fe=(t,e)=>{if(K)t.adoptedStyleSheets=e.map(n=>n instanceof CSSStyleSheet?n:n.styleSheet);else for(let n of e){let s=document.createElement("style"),o=N.litNonce;o!==void 0&&s.setAttribute("nonce",o),s.textContent=n.cssText,t.appendChild(s)}},W=K?t=>t:t=>t instanceof CSSStyleSheet?(e=>{let n="";for(let s of e.cssRules)n+=s.cssText;return $e(n)})(t):t;var{is:Ge,defineProperty:Ne,getOwnPropertyDescriptor:Be,getOwnPropertyNames:Ke,getOwnPropertySymbols:Fe,getPrototypeOf:je}=Object,F=globalThis,ye=F.trustedTypes,qe=ye?ye.emptyScript:"",Ve=F.reactiveElementPolyfillSupport,H=(t,e)=>t,Q={toAttribute(t,e){switch(e){case Boolean:t=t?qe:null;break;case Object:case Array:t=t==null?t:JSON.stringify(t)}return t},fromAttribute(t,e){let n=t;switch(e){case Boolean:n=t!==null;break;case Number:n=t===null?null:Number(t);break;case Object:case Array:try{n=JSON.parse(t)}catch{n=null}}return n}},ve=(t,e)=>!Ge(t,e),Ae={attribute:!0,type:String,converter:Q,reflect:!1,useDefault:!1,hasChanged:ve};Symbol.metadata??=Symbol("metadata"),F.litPropertyMetadata??=new WeakMap;var v=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,n=Ae){if(n.state&&(n.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((n=Object.create(n)).wrapped=!0),this.elementProperties.set(e,n),!n.noAccessor){let s=Symbol(),o=this.getPropertyDescriptor(e,s,n);o!==void 0&&Ne(this.prototype,e,o)}}static getPropertyDescriptor(e,n,s){let{get:o,set:i}=Be(this.prototype,e)??{get(){return this[n]},set(r){this[n]=r}};return{get:o,set(r){let c=o?.call(this);i?.call(this,r),this.requestUpdate(e,c,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??Ae}static _$Ei(){if(this.hasOwnProperty(H("elementProperties")))return;let e=je(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(H("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(H("properties"))){let n=this.properties,s=[...Ke(n),...Fe(n)];for(let o of s)this.createProperty(o,n[o])}let e=this[Symbol.metadata];if(e!==null){let n=litPropertyMetadata.get(e);if(n!==void 0)for(let[s,o]of n)this.elementProperties.set(s,o)}this._$Eh=new Map;for(let[n,s]of this.elementProperties){let o=this._$Eu(n,s);o!==void 0&&this._$Eh.set(o,n)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let n=[];if(Array.isArray(e)){let s=new Set(e.flat(1/0).reverse());for(let o of s)n.unshift(W(o))}else e!==void 0&&n.push(W(e));return n}static _$Eu(e,n){let s=n.attribute;return s===!1?void 0:typeof s=="string"?s:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,n=this.constructor.elementProperties;for(let s of n.keys())this.hasOwnProperty(s)&&(e.set(s,this[s]),delete this[s]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return fe(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,n,s){this._$AK(e,s)}_$ET(e,n){let s=this.constructor.elementProperties.get(e),o=this.constructor._$Eu(e,s);if(o!==void 0&&s.reflect===!0){let i=(s.converter?.toAttribute!==void 0?s.converter:Q).toAttribute(n,s.type);this._$Em=e,i==null?this.removeAttribute(o):this.setAttribute(o,i),this._$Em=null}}_$AK(e,n){let s=this.constructor,o=s._$Eh.get(e);if(o!==void 0&&this._$Em!==o){let i=s.getPropertyOptions(o),r=typeof i.converter=="function"?{fromAttribute:i.converter}:i.converter?.fromAttribute!==void 0?i.converter:Q;this._$Em=o;let c=r.fromAttribute(n,i.type);this[o]=c??this._$Ej?.get(o)??c,this._$Em=null}}requestUpdate(e,n,s,o=!1,i){if(e!==void 0){let r=this.constructor;if(o===!1&&(i=this[e]),s??=r.getPropertyOptions(e),!((s.hasChanged??ve)(i,n)||s.useDefault&&s.reflect&&i===this._$Ej?.get(e)&&!this.hasAttribute(r._$Eu(e,s))))return;this.C(e,n,s)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,n,{useDefault:s,reflect:o,wrapped:i},r){s&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,r??n??this[e]),i!==!0||r!==void 0)||(this._$AL.has(e)||(this.hasUpdated||s||(n=void 0),this._$AL.set(e,n)),o===!0&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(n){Promise.reject(n)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[o,i]of this._$Ep)this[o]=i;this._$Ep=void 0}let s=this.constructor.elementProperties;if(s.size>0)for(let[o,i]of s){let{wrapped:r}=i,c=this[o];r!==!0||this._$AL.has(o)||c===void 0||this.C(o,void 0,i,c)}}let e=!1,n=this._$AL;try{e=this.shouldUpdate(n),e?(this.willUpdate(n),this._$EO?.forEach(s=>s.hostUpdate?.()),this.update(n)):this._$EM()}catch(s){throw e=!1,this._$EM(),s}e&&this._$AE(n)}willUpdate(e){}_$AE(e){this._$EO?.forEach(n=>n.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(n=>this._$ET(n,this[n])),this._$EM()}updated(e){}firstUpdated(e){}};v.elementStyles=[],v.shadowRootOptions={mode:"open"},v[H("elementProperties")]=new Map,v[H("finalized")]=new Map,Ve?.({ReactiveElement:v}),(F.reactiveElementVersions??=[]).push("2.1.2");var ne=globalThis,_e=t=>t,j=ne.trustedTypes,be=j?j.createPolicy("lit-html",{createHTML:t=>t}):void 0,ke="$lit$",_=`lit$${Math.random().toFixed(9).slice(2)}$`,Te="?"+_,ze=`<${Te}>`,S=document,L=()=>S.createComment(""),O=t=>t===null||typeof t!="object"&&typeof t!="function",se=Array.isArray,We=t=>se(t)||typeof t?.[Symbol.iterator]=="function",Y=`[ 	
\f\r]`,P=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Ee=/-->/g,we=/>/g,E=RegExp(`>|${Y}(?:([^\\s"'>=/]+)(${Y}*=${Y}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),Se=/'/g,Ce=/"/g,xe=/^(?:script|style|textarea|title)$/i,oe=t=>(e,...n)=>({_$litType$:t,strings:e,values:n}),u=oe(1),St=oe(2),Ct=oe(3),C=Symbol.for("lit-noChange"),m=Symbol.for("lit-nothing"),Me=new WeakMap,w=S.createTreeWalker(S,129);function Ie(t,e){if(!se(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return be!==void 0?be.createHTML(e):e}var Qe=(t,e)=>{let n=t.length-1,s=[],o,i=e===2?"<svg>":e===3?"<math>":"",r=P;for(let c=0;c<n;c++){let l=t[c],h,g,d=-1,$=0;for(;$<l.length&&(r.lastIndex=$,g=r.exec(l),g!==null);)$=r.lastIndex,r===P?g[1]==="!--"?r=Ee:g[1]!==void 0?r=we:g[2]!==void 0?(xe.test(g[2])&&(o=RegExp("</"+g[2],"g")),r=E):g[3]!==void 0&&(r=E):r===E?g[0]===">"?(r=o??P,d=-1):g[1]===void 0?d=-2:(d=r.lastIndex-g[2].length,h=g[1],r=g[3]===void 0?E:g[3]==='"'?Ce:Se):r===Ce||r===Se?r=E:r===Ee||r===we?r=P:(r=E,o=void 0);let A=r===E&&t[c+1].startsWith("/>")?" ":"";i+=r===P?l+ze:d>=0?(s.push(h),l.slice(0,d)+ke+l.slice(d)+_+A):l+_+(d===-2?c:A)}return[Ie(t,i+(t[n]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),s]},D=class t{constructor({strings:e,_$litType$:n},s){let o;this.parts=[];let i=0,r=0,c=e.length-1,l=this.parts,[h,g]=Qe(e,n);if(this.el=t.createElement(h,s),w.currentNode=this.el.content,n===2||n===3){let d=this.el.content.firstChild;d.replaceWith(...d.childNodes)}for(;(o=w.nextNode())!==null&&l.length<c;){if(o.nodeType===1){if(o.hasAttributes())for(let d of o.getAttributeNames())if(d.endsWith(ke)){let $=g[r++],A=o.getAttribute(d).split(_),k=/([.?@])?(.*)/.exec($);l.push({type:1,index:i,name:k[2],strings:A,ctor:k[1]==="."?X:k[1]==="?"?Z:k[1]==="@"?ee:x}),o.removeAttribute(d)}else d.startsWith(_)&&(l.push({type:6,index:i}),o.removeAttribute(d));if(xe.test(o.tagName)){let d=o.textContent.split(_),$=d.length-1;if($>0){o.textContent=j?j.emptyScript:"";for(let A=0;A<$;A++)o.append(d[A],L()),w.nextNode(),l.push({type:2,index:++i});o.append(d[$],L())}}}else if(o.nodeType===8)if(o.data===Te)l.push({type:2,index:i});else{let d=-1;for(;(d=o.data.indexOf(_,d+1))!==-1;)l.push({type:7,index:i}),d+=_.length-1}i++}}static createElement(e,n){let s=S.createElement("template");return s.innerHTML=e,s}};function T(t,e,n=t,s){if(e===C)return e;let o=s!==void 0?n._$Co?.[s]:n._$Cl,i=O(e)?void 0:e._$litDirective$;return o?.constructor!==i&&(o?._$AO?.(!1),i===void 0?o=void 0:(o=new i(t),o._$AT(t,n,s)),s!==void 0?(n._$Co??=[])[s]=o:n._$Cl=o),o!==void 0&&(e=T(t,o._$AS(t,e.values),o,s)),e}var J=class{constructor(e,n){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=n}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:n},parts:s}=this._$AD,o=(e?.creationScope??S).importNode(n,!0);w.currentNode=o;let i=w.nextNode(),r=0,c=0,l=s[0];for(;l!==void 0;){if(r===l.index){let h;l.type===2?h=new U(i,i.nextSibling,this,e):l.type===1?h=new l.ctor(i,l.name,l.strings,this,e):l.type===6&&(h=new te(i,this,e)),this._$AV.push(h),l=s[++c]}r!==l?.index&&(i=w.nextNode(),r++)}return w.currentNode=S,o}p(e){let n=0;for(let s of this._$AV)s!==void 0&&(s.strings!==void 0?(s._$AI(e,s,n),n+=s.strings.length-2):s._$AI(e[n])),n++}},U=class t{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,n,s,o){this.type=2,this._$AH=m,this._$AN=void 0,this._$AA=e,this._$AB=n,this._$AM=s,this.options=o,this._$Cv=o?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,n=this._$AM;return n!==void 0&&e?.nodeType===11&&(e=n.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,n=this){e=T(this,e,n),O(e)?e===m||e==null||e===""?(this._$AH!==m&&this._$AR(),this._$AH=m):e!==this._$AH&&e!==C&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):We(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==m&&O(this._$AH)?this._$AA.nextSibling.data=e:this.T(S.createTextNode(e)),this._$AH=e}$(e){let{values:n,_$litType$:s}=e,o=typeof s=="number"?this._$AC(e):(s.el===void 0&&(s.el=D.createElement(Ie(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===o)this._$AH.p(n);else{let i=new J(o,this),r=i.u(this.options);i.p(n),this.T(r),this._$AH=i}}_$AC(e){let n=Me.get(e.strings);return n===void 0&&Me.set(e.strings,n=new D(e)),n}k(e){se(this._$AH)||(this._$AH=[],this._$AR());let n=this._$AH,s,o=0;for(let i of e)o===n.length?n.push(s=new t(this.O(L()),this.O(L()),this,this.options)):s=n[o],s._$AI(i),o++;o<n.length&&(this._$AR(s&&s._$AB.nextSibling,o),n.length=o)}_$AR(e=this._$AA.nextSibling,n){for(this._$AP?.(!1,!0,n);e!==this._$AB;){let s=_e(e).nextSibling;_e(e).remove(),e=s}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},x=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,n,s,o,i){this.type=1,this._$AH=m,this._$AN=void 0,this.element=e,this.name=n,this._$AM=o,this.options=i,s.length>2||s[0]!==""||s[1]!==""?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=m}_$AI(e,n=this,s,o){let i=this.strings,r=!1;if(i===void 0)e=T(this,e,n,0),r=!O(e)||e!==this._$AH&&e!==C,r&&(this._$AH=e);else{let c=e,l,h;for(e=i[0],l=0;l<i.length-1;l++)h=T(this,c[s+l],n,l),h===C&&(h=this._$AH[l]),r||=!O(h)||h!==this._$AH[l],h===m?e=m:e!==m&&(e+=(h??"")+i[l+1]),this._$AH[l]=h}r&&!o&&this.j(e)}j(e){e===m?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}},X=class extends x{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===m?void 0:e}},Z=class extends x{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==m)}},ee=class extends x{constructor(e,n,s,o,i){super(e,n,s,o,i),this.type=5}_$AI(e,n=this){if((e=T(this,e,n,0)??m)===C)return;let s=this._$AH,o=e===m&&s!==m||e.capture!==s.capture||e.once!==s.once||e.passive!==s.passive,i=e!==m&&(s===m||o);o&&this.element.removeEventListener(this.name,this,s),i&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},te=class{constructor(e,n,s){this.element=e,this.type=6,this._$AN=void 0,this._$AM=n,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(e){T(this,e)}};var Ye=ne.litHtmlPolyfillSupport;Ye?.(D,U),(ne.litHtmlVersions??=[]).push("3.3.2");var q=(t,e,n)=>{let s=n?.renderBefore??e,o=s._$litPart$;if(o===void 0){let i=n?.renderBefore??null;s._$litPart$=o=new U(e.insertBefore(L(),i),i,void 0,n??{})}return o._$AI(t),o};var ie=globalThis,I=class extends v{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let n=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=q(n,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return C}};I._$litElement$=!0,I.finalized=!0,ie.litElementHydrateSupport?.({LitElement:I});var Je=ie.litElementPolyfillSupport;Je?.({LitElement:I});(ie.litElementVersions??=[]).push("4.2.2");var y=window.acquireVsCodeApi(),He=document.getElementById("root"),re=!1,ae=!1,M=()=>{if(re){ae=!0;return}ue()},Xe=t=>{re=!0;try{t()}finally{re=!1,ae&&(ae=!1,ue())}},de={actions:[],groups:[],searchQuery:"",loading:!1,generating:!1,display:{showIcon:!0,showType:!0,showCommand:!0,showGroup:!0,hideIcon:"eye-closed",playButtonBg:"transparent",density:"comfortable",useEmojiLoader:!1,loaderEmoji:"\u{1F32F}"},secondaryGroups:{},iconMap:{},collapsedGroups:[],showSearch:!1,showHidden:!1,selectionMode:!1,selectedItems:[],openActionMenuFor:null};window.__INITIAL_DATA__&&Object.assign(de,window.__INITIAL_DATA__);var le=y.getState()||{};le.collapsedGroups&&(de.collapsedGroups=le.collapsedGroups);var a=new Proxy(de,{set(t,e,n){return t[e]=n,M(),e==="collapsedGroups"&&y.setState({...le,collapsedGroups:n}),!0}}),f=null,b=null,G=!0,Ze=(t,e)=>{f=e,t.dataTransfer.effectAllowed="move";let n=t.currentTarget.closest(".lp-btn-wrapper");if(n){let s=n.getBoundingClientRect(),o=t.clientX-s.left,i=t.clientY-s.top;t.dataTransfer.setDragImage(n,o,i)}setTimeout(()=>M(),0)},et=(t,e)=>{if(!f||f===e)return;t.preventDefault(),t.dataTransfer.dropEffect="move";let s=t.currentTarget.getBoundingClientRect(),o=t.clientY<s.top+s.height/2;(b!==e||G!==o)&&(b=e,G=o,M())},tt=(t,e)=>{let n=t.relatedTarget;!t.currentTarget.contains(n)&&b===e&&(b=null,M())},nt=(t,e)=>{if(t.preventDefault(),!f||f===e)return;let n=[...a.actions],s=n.indexOf(f),o=n.indexOf(e);if(s===-1||o===-1){f=null,b=null;return}n.splice(s,1);let i=n.indexOf(e),r=G?i:i+1;n.splice(r,0,f),f=null,b=null,a.actions=n,y.postMessage({command:"reorderActions",actions:n})},st=()=>{f=null,b=null,M()},Pe=t=>{let e=new Set(a.collapsedGroups);e.has(t)?e.delete(t):e.add(t),a.collapsedGroups=Array.from(e)},ot=t=>{y.postMessage({command:"executeCommand",item:t})},it=t=>{y.postMessage({command:"editAction",item:t})},rt=t=>{y.postMessage({command:"setActionColor",item:t})},Le=(t,e)=>{y.postMessage({command:"assignGroup",item:t,groupName:e})},pe=t=>encodeURIComponent(`${t.name}|${t.command}|${t.type}|${t.workspace??""}`),Oe=(t,e)=>{t.isOpen()||t.open(),e==="last"?t.focusLast():t.focusFirst()},at=(t,e)=>{if(t.key==="Escape"&&e.isOpen()){t.preventDefault(),e.close(!0);return}if(t.key==="Enter"||t.key===" "||t.key==="ArrowDown"){t.preventDefault(),Oe(e,"first");return}t.key==="ArrowUp"&&(t.preventDefault(),Oe(e,"last"))},lt=(t,e)=>{let n=t.currentTarget,s=e.getMenuItems(n);if(!s.length)return;let o=s.indexOf(document.activeElement);if(t.key==="Escape"){t.preventDefault(),e.close(!0);return}if(t.key==="Tab"){e.close();return}if(t.key==="Home"){t.preventDefault(),s[0].focus();return}if(t.key==="End"){t.preventDefault(),s[s.length-1].focus();return}if(t.key==="ArrowDown"){t.preventDefault();let i=o>=0?(o+1)%s.length:0;s[i].focus();return}if(t.key==="ArrowUp"){t.preventDefault();let i=o>=0?(o-1+s.length)%s.length:s.length-1;s[i].focus()}},ct=t=>{let e=pe(t);requestAnimationFrame(()=>{document.querySelector(`.lp-menu-trigger[data-action-menu-id="${e}"]`)?.focus()})},De=(t,e="first")=>{let n=pe(t);requestAnimationFrame(()=>{let s=document.querySelector(`.lp-menu-panel[data-action-menu-id="${n}"]`);if(!s)return;let o=Array.from(s.querySelectorAll(".lp-menu-item"));if(!o.length)return;(e==="last"?o[o.length-1]:o[0]).focus()})},Ue=t=>({isOpen:()=>a.openActionMenuFor===t,open:()=>{a.openActionMenuFor=t},close:(e=!1)=>V(e?t:void 0),focusFirst:()=>De(t,"first"),focusLast:()=>De(t,"last"),getMenuItems:e=>Array.from(e.querySelectorAll(".lp-menu-item"))}),dt=(t,e)=>{t.stopPropagation(),a.openActionMenuFor=a.openActionMenuFor===e?null:e},V=t=>{a.openActionMenuFor&&(a.openActionMenuFor=null),t&&ct(t)},R=t=>{t(),V()},pt=(t,e)=>{at(t,Ue(e))},ut=(t,e)=>{lt(t,Ue(e))},ht=t=>{y.postMessage({command:"hideAction",item:t})},gt=t=>{y.postMessage({command:"editGroup",group:t})},mt=t=>{y.postMessage({command:"hideGroup",group:t})},$t=t=>{if(t.type==="npm"&&t.command.startsWith("npm run "))return`npm: ${t.command.replace("npm run ","")}`;if(t.type==="task"){let e=t.command.split("|")[1];return e?`task: ${e}`:"task"}if(t.type==="launch"){let e=t.command.split("|")[1];return e?`launch: ${e}`:"launch"}if(t.type==="vscode"){let[e,n]=t.command.split("|");return e==="workbench.action.tasks.runTask"?n?`task: ${n}`:"task":e==="workbench.action.debug.start"?n?`launch: ${n}`:"launch":n?`${e} ${n}`:e}return t.command},ft=t=>{let e=`lp-menu-container lp-menu-container--${t.kind}`,n=`lp-menu-trigger lp-menu-trigger--${t.kind}`,s=`lp-menu-panel lp-menu-panel--${t.kind}`;return u`
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
    `},ce=t=>{let e=t.hidden,{display:n,iconMap:s,secondaryGroups:o}=a,i=n.showIcon&&s[t.type]||"",r=[];if(t.workspace){let p=t.workspaceColor?`background-color: ${t.workspaceColor};`:"";r.push(u`<span class="lp-workspace-label" style="${p}">${t.workspace}</span>`)}let c=$t(t);n.showType&&n.showCommand?(r.push(t.type),r.push(c)):n.showType?r.push(t.type):n.showCommand&&r.push(c);let l=!!t.group,g=a.groups.length>0||l,d=a.openActionMenuFor===t,$=pe(t),A=t.backgroundColor?`background-color: ${t.backgroundColor} !important;`:"",k=f===t,he=b===t,Re=["lp-btn-wrapper",e?"lp-hidden-item":"",k?"lp-dragging":"",he&&G?"lp-drag-over-top":"",he&&!G?"lp-drag-over-bottom":""].filter(Boolean).join(" ");return u`
    <div class=${Re}
        @dragover=${p=>et(p,t)}
        @dragleave=${p=>tt(p,t)}
        @drop=${p=>nt(p,t)}>
        ${a.selectionMode?u`<input type="checkbox" class="lp-btn-checkbox" .checked=${a.selectedItems.includes(t)} @change=${p=>{p.target.checked?a.selectedItems=[...a.selectedItems,t]:a.selectedItems=a.selectedItems.filter(z=>z!==t)}}>`:null}
        
        <button
            class="lp-play-btn"
            style="--lp-play-btn-bg: ${n.playButtonBg}"
            title="Run"
            aria-label=${`Run ${t.name}`}
            @click=${()=>ot(t)}>
            <span class="codicon codicon-play"></span>
        </button>
        ${a.searchQuery?null:u`
        <button class="lp-drag-handle" draggable="true" title="Drag to reorder" aria-label=${`Drag ${t.name} to reorder`}
            @dragstart=${p=>Ze(p,t)}
            @dragend=${st}>
            <span class="codicon codicon-gripper"></span>
        </button>`}
        
        <div class="lp-btn ${a.selectionMode?"has-checkbox":""}" style="${A}">
             <span class="lp-btn-name">
                ${i?u`<span class="codicon codicon-${i} lp-icon"></span>`:null}
                ${t.name}
                ${e?u`<span class="lp-hidden-badge">(hidden)</span>`:null}
             </span>
             ${r.length?u`<span class="lp-btn-meta">${r.map((p,z)=>u`${z>0?" \xB7 ":""}${p}`)}</span>`:null}
        </div>

        ${ft({kind:"action",menuId:$,isOpen:d,triggerTitle:"More actions",triggerAriaLabel:`More actions for ${t.name}`,onTriggerClick:p=>dt(p,t),onTriggerKeydown:p=>pt(p,t),onMenuClick:p=>p.stopPropagation(),onMenuKeydown:p=>ut(p,t),menuContent:u`
                <button class="lp-menu-item lp-menu-item--action" role="menuitem" @click=${()=>R(()=>it(t))}>
                    <span class="codicon codicon-edit"></span>
                    Edit
                </button>
                <button class="lp-menu-item lp-menu-item--action" role="menuitem" @click=${()=>R(()=>rt(t))}>
                    <span class="codicon codicon-symbol-color"></span>
                    Set color
                </button>
                <button class="lp-menu-item lp-menu-item--action" role="menuitem" @click=${()=>R(()=>ht(t))}>
                    <span class="codicon codicon-${e?"eye":n.hideIcon}"></span>
                    ${e?"Show":"Hide"}
                </button>

                ${g?u`
                    <div class="lp-menu-divider"></div>
                    <button class="lp-menu-item lp-menu-item--action" role="menuitem" @click=${()=>R(()=>Le(t,"__none__"))}>
                        <span class="codicon codicon-clear-all"></span>
                        Remove from group
                    </button>
                    ${a.groups.map(p=>u`
                        <button class="lp-menu-item lp-menu-item--action" role="menuitem" @click=${()=>R(()=>Le(t,p.name))}>
                            ${p.icon?u`<span class="codicon codicon-${p.icon}"></span>`:u`<span class="codicon codicon-folder"></span>`}
                            Assign to ${p.name}
                        </button>
                    `)}
                `:null}
            `})}
    </div>
    `},yt=(t,e)=>{let n=!a.collapsedGroups.includes(t.name),s=!!t.hidden,o=[],i=t.borderColor||t.color;i&&(i.includes("--vscode-charts-")?o.push(`--lp-group-accent: ${i}`):o.push(`--lp-group-accent: ${i}`)),t.color&&(t.color.includes("--vscode-charts-")||o.push(`color: ${t.color}`)),t.backgroundColor&&o.push(`background-color: ${t.backgroundColor}`);let r=[];return t.backgroundColor&&r.push(`background-color: ${t.backgroundColor}`),u`
    <details class="lp-group" ?open=${n} @toggle=${c=>{let l=c.target;(l.open&&a.collapsedGroups.includes(t.name)||!l.open&&!a.collapsedGroups.includes(t.name))&&Pe(t.name)}}>
        <summary class="lp-group-header ${s?"lp-hidden-group":""}" style="${o.join(";")}">
            <span class="codicon codicon-chevron-down lp-group-chevron"></span>
            <div class="lp-group-header-content">
                ${t.icon?u`<span class="codicon codicon-${t.icon} lp-group-icon"></span>`:null}
                <span class="lp-group-name">${t.name}</span>
                ${s?u`<span class="lp-hidden-badge">(hidden)</span>`:null}
            </div>
            <div class="lp-menu-container lp-menu-container--group">
                <button
                    class="lp-menu-trigger lp-menu-trigger--group"
                    title=${s?"Show group":"Hide group"}
                    aria-label=${s?`Show group ${t.name}`:`Hide group ${t.name}`}
                    @click=${c=>{c.preventDefault(),c.stopPropagation(),mt(t)}}>
                    <span class="codicon codicon-${s?"eye":a.display.hideIcon}"></span>
                </button>
                <button
                    class="lp-menu-trigger lp-menu-trigger--group"
                    title="Edit group"
                    aria-label="Edit group ${t.name}"
                    @click=${c=>{c.preventDefault(),c.stopPropagation(),gt(t)}}>
                    <span class="codicon codicon-settings-gear"></span>
                </button>
            </div>
        </summary>
        <div class="lp-group-items" style="${r.join(";")}">
            ${e.map(c=>ce(c))}
        </div>
    </details>
    `},At=()=>!a.showSearch&&!a.searchQuery?null:u`
    <div id="searchContainer" class="lp-search-container">
        <input type="text" class="lp-search-box" 
            placeholder="🔍 Search actions..." 
            .value=${a.searchQuery}
            @input=${t=>{a.searchQuery=t.target.value}}
        >
        <!-- Additional search buttons (Select Multiple, etc) could go here -->
    </div>
    `,ue=()=>{if(!He)return;let t=a.actions;if(a.showHidden||(t=t.filter(n=>!n.hidden)),a.searchQuery){let n=a.searchQuery.toLowerCase();t=t.filter(s=>s.name.toLowerCase().includes(n)||s.command.toLowerCase().includes(n)||s.group&&s.group.toLowerCase().includes(n))}let e=[];if(a.display.showGroup&&a.groups.length>0){let n=new Map,s=[];t.forEach(o=>{o.group?(n.has(o.group)||n.set(o.group,[]),n.get(o.group).push(o)):s.push(o)}),a.groups.forEach(o=>{if(o.hidden&&!a.showHidden)return;let i=n.get(o.name);i&&i.length&&e.push(yt(o,i))}),s.length&&e.push(u`
            <details class="lp-group" open>
                <summary class="lp-group-header"><span class="codicon codicon-chevron-down lp-group-chevron"></span> Ungrouped</summary>
                                <div class="lp-group-items">${s.map(o=>ce(o))}</div>
            </details>
          `)}else e.push(t.map(n=>ce(n)));t.length===0&&e.push(u`
        <div class="lp-empty-state">
            <div class="lp-welcome"><h2 class="lp-welcome-title">Welcome</h2></div>
            <div class="lp-empty-actions">
                <button class="lp-empty-btn lp-empty-primary" @click=${()=>{a.generating=!0,y.postMessage({command:"showGenerateConfig"})}}>
                    <span class="codicon ${a.generating?"codicon-loading codicon-modifier-spin":"codicon-sparkle"}"></span>
                    <span class="lp-btn-label">${a.generating?"Detecting...":"Auto-detect"}</span>
                </button>
            </div>
        </div>
      `),q(u`
    <div id="toast" class="lp-toast"></div>
    ${a.loading?u`<div class="lp-loading-overlay"><span class="codicon codicon-loading codicon-modifier-spin"></span></div>`:null}
    ${At()}
    <div class="lp-grid ${a.display.density}">
        ${e}
    </div>
  `,He)};window.addEventListener("message",t=>{let e=t.data;switch(e.type){case"update":Xe(()=>{Object.assign(a,e.data),a.loading=!1,a.generating=!1});break;case"setLoading":a.loading=e.value;break;case"toggleSearch":a.showSearch=e.visible;break;case"collapseAllGroups":a.collapsedGroups=a.groups.map(n=>n.name),M();break;case"expandAllGroups":a.collapsedGroups=[],M();break;case"showToast":break}});ue();document.addEventListener("click",t=>{t.target?.closest(".lp-menu-container")||V()});document.addEventListener("keydown",t=>{t.key==="Escape"&&V()});
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
