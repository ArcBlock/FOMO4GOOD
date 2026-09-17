/* fomo-qr-lib */
var FOMOQR=(()=>{var g=(n,t)=>()=>{try{return t||n((t={exports:{}}).exports,t),t.exports}catch(e){throw t=0,e}};var _t=g((Sn,Lt)=>{Lt.exports=function(){return typeof Promise=="function"&&Promise.prototype&&Promise.prototype.then}});var I=g(P=>{var st,Le=[0,26,44,70,100,134,172,196,242,292,346,404,466,532,581,655,733,815,901,991,1085,1156,1258,1364,1474,1588,1706,1828,1921,2051,2185,2323,2465,2611,2761,2876,3034,3196,3362,3532,3706];P.getSymbolSize=function(t){if(!t)throw new Error('"version" cannot be null or undefined');if(t<1||t>40)throw new Error('"version" should be in range from 1 to 40');return t*4+17};P.getSymbolTotalCodewords=function(t){return Le[t]};P.getBCHDigit=function(n){let t=0;for(;n!==0;)t++,n>>>=1;return t};P.setToSJISFunction=function(t){if(typeof t!="function")throw new Error('"toSJISFunc" is not a valid function.');st=t};P.isKanjiModeEnabled=function(){return typeof st<"u"};P.toSJIS=function(t){return st(t)}});var j=g(m=>{m.L={bit:1};m.M={bit:0};m.Q={bit:3};m.H={bit:2};function _e(n){if(typeof n!="string")throw new Error("Param is not a string");switch(n.toLowerCase()){case"l":case"low":return m.L;case"m":case"medium":return m.M;case"q":case"quartile":return m.Q;case"h":case"high":return m.H;default:throw new Error("Unknown EC Level: "+n)}}m.isValid=function(t){return t&&typeof t.bit<"u"&&t.bit>=0&&t.bit<4};m.from=function(t,e){if(m.isValid(t))return t;try{return _e(t)}catch{return e}}});var qt=g((Rn,Ut)=>{function xt(){this.buffer=[],this.length=0}xt.prototype={get:function(n){let t=Math.floor(n/8);return(this.buffer[t]>>>7-n%8&1)===1},put:function(n,t){for(let e=0;e<t;e++)this.putBit((n>>>t-e-1&1)===1)},getLengthInBits:function(){return this.length},putBit:function(n){let t=Math.floor(this.length/8);this.buffer.length<=t&&this.buffer.push(0),n&&(this.buffer[t]|=128>>>this.length%8),this.length++}};Ut.exports=xt});var Ft=g((Ln,Dt)=>{function k(n){if(!n||n<1)throw new Error("BitMatrix size must be defined and greater than 0");this.size=n,this.data=new Uint8Array(n*n),this.reservedBit=new Uint8Array(n*n)}k.prototype.set=function(n,t,e,r){let o=n*this.size+t;this.data[o]=e,r&&(this.reservedBit[o]=!0)};k.prototype.get=function(n,t){return this.data[n*this.size+t]};k.prototype.xor=function(n,t,e){this.data[n*this.size+t]^=e};k.prototype.isReserved=function(n,t){return this.reservedBit[n*this.size+t]};Dt.exports=k});var kt=g(G=>{var xe=I().getSymbolSize;G.getRowColCoords=function(t){if(t===1)return[];let e=Math.floor(t/7)+2,r=xe(t),o=r===145?26:Math.ceil((r-13)/(2*e-2))*2,i=[r-7];for(let s=1;s<e-1;s++)i[s]=i[s-1]-o;return i.push(6),i.reverse()};G.getPositions=function(t){let e=[],r=G.getRowColCoords(t),o=r.length;for(let i=0;i<o;i++)for(let s=0;s<o;s++)i===0&&s===0||i===0&&s===o-1||i===o-1&&s===0||e.push([r[i],r[s]]);return e}});var Ht=g(Vt=>{var Ue=I().getSymbolSize,zt=7;Vt.getPositions=function(t){let e=Ue(t);return[[0,0],[e-zt,0],[0,e-zt]]}});var Kt=g(d=>{d.Patterns={PATTERN000:0,PATTERN001:1,PATTERN010:2,PATTERN011:3,PATTERN100:4,PATTERN101:5,PATTERN110:6,PATTERN111:7};var b={N1:3,N2:3,N3:40,N4:10};d.isValid=function(t){return t!=null&&t!==""&&!isNaN(t)&&t>=0&&t<=7};d.from=function(t){return d.isValid(t)?parseInt(t,10):void 0};d.getPenaltyN1=function(t){let e=t.size,r=0,o=0,i=0,s=null,u=null;for(let c=0;c<e;c++){o=i=0,s=u=null;for(let l=0;l<e;l++){let a=t.get(c,l);a===s?o++:(o>=5&&(r+=b.N1+(o-5)),s=a,o=1),a=t.get(l,c),a===u?i++:(i>=5&&(r+=b.N1+(i-5)),u=a,i=1)}o>=5&&(r+=b.N1+(o-5)),i>=5&&(r+=b.N1+(i-5))}return r};d.getPenaltyN2=function(t){let e=t.size,r=0;for(let o=0;o<e-1;o++)for(let i=0;i<e-1;i++){let s=t.get(o,i)+t.get(o,i+1)+t.get(o+1,i)+t.get(o+1,i+1);(s===4||s===0)&&r++}return r*b.N2};d.getPenaltyN3=function(t){let e=t.size,r=0,o=0,i=0;for(let s=0;s<e;s++){o=i=0;for(let u=0;u<e;u++)o=o<<1&2047|t.get(s,u),u>=10&&(o===1488||o===93)&&r++,i=i<<1&2047|t.get(u,s),u>=10&&(i===1488||i===93)&&r++}return r*b.N3};d.getPenaltyN4=function(t){let e=0,r=t.data.length;for(let i=0;i<r;i++)e+=t.data[i];return Math.abs(Math.ceil(e*100/r/5)-10)*b.N4};function qe(n,t,e){switch(n){case d.Patterns.PATTERN000:return(t+e)%2===0;case d.Patterns.PATTERN001:return t%2===0;case d.Patterns.PATTERN010:return e%3===0;case d.Patterns.PATTERN011:return(t+e)%3===0;case d.Patterns.PATTERN100:return(Math.floor(t/2)+Math.floor(e/3))%2===0;case d.Patterns.PATTERN101:return t*e%2+t*e%3===0;case d.Patterns.PATTERN110:return(t*e%2+t*e%3)%2===0;case d.Patterns.PATTERN111:return(t*e%3+(t+e)%2)%2===0;default:throw new Error("bad maskPattern:"+n)}}d.applyMask=function(t,e){let r=e.size;for(let o=0;o<r;o++)for(let i=0;i<r;i++)e.isReserved(i,o)||e.xor(i,o,qe(t,i,o))};d.getBestMask=function(t,e){let r=Object.keys(d.Patterns).length,o=0,i=1/0;for(let s=0;s<r;s++){e(s),d.applyMask(s,t);let u=d.getPenaltyN1(t)+d.getPenaltyN2(t)+d.getPenaltyN3(t)+d.getPenaltyN4(t);d.applyMask(s,t),u<i&&(i=u,o=s)}return o}});var ct=g(ut=>{var N=j(),Q=[1,1,1,1,1,1,1,1,1,1,2,2,1,2,2,4,1,2,4,4,2,4,4,4,2,4,6,5,2,4,6,6,2,5,8,8,4,5,8,8,4,5,8,11,4,8,10,11,4,9,12,16,4,9,16,16,6,10,12,18,6,10,17,16,6,11,16,19,6,13,18,21,7,14,21,25,8,16,20,25,8,17,23,25,9,17,23,34,9,18,25,30,10,20,27,32,12,21,29,35,12,23,34,37,12,25,34,40,13,26,35,42,14,28,38,45,15,29,40,48,16,31,43,51,17,33,45,54,18,35,48,57,19,37,51,60,19,38,53,63,20,40,56,66,21,43,59,70,22,45,62,74,24,47,65,77,25,49,68,81],$=[7,10,13,17,10,16,22,28,15,26,36,44,20,36,52,64,26,48,72,88,36,64,96,112,40,72,108,130,48,88,132,156,60,110,160,192,72,130,192,224,80,150,224,264,96,176,260,308,104,198,288,352,120,216,320,384,132,240,360,432,144,280,408,480,168,308,448,532,180,338,504,588,196,364,546,650,224,416,600,700,224,442,644,750,252,476,690,816,270,504,750,900,300,560,810,960,312,588,870,1050,336,644,952,1110,360,700,1020,1200,390,728,1050,1260,420,784,1140,1350,450,812,1200,1440,480,868,1290,1530,510,924,1350,1620,540,980,1440,1710,570,1036,1530,1800,570,1064,1590,1890,600,1120,1680,1980,630,1204,1770,2100,660,1260,1860,2220,720,1316,1950,2310,750,1372,2040,2430];ut.getBlocksCount=function(t,e){switch(e){case N.L:return Q[(t-1)*4+0];case N.M:return Q[(t-1)*4+1];case N.Q:return Q[(t-1)*4+2];case N.H:return Q[(t-1)*4+3];default:return}};ut.getTotalCodewordsCount=function(t,e){switch(e){case N.L:return $[(t-1)*4+0];case N.M:return $[(t-1)*4+1];case N.Q:return $[(t-1)*4+2];case N.H:return $[(t-1)*4+3];default:return}}});var Jt=g(Z=>{var z=new Uint8Array(512),W=new Uint8Array(256);(function(){let t=1;for(let e=0;e<255;e++)z[e]=t,W[t]=e,t<<=1,t&256&&(t^=285);for(let e=255;e<512;e++)z[e]=z[e-255]})();Z.log=function(t){if(t<1)throw new Error("log("+t+")");return W[t]};Z.exp=function(t){return z[t]};Z.mul=function(t,e){return t===0||e===0?0:z[W[t]+W[e]]}});var Yt=g(V=>{var lt=Jt();V.mul=function(t,e){let r=new Uint8Array(t.length+e.length-1);for(let o=0;o<t.length;o++)for(let i=0;i<e.length;i++)r[o+i]^=lt.mul(t[o],e[i]);return r};V.mod=function(t,e){let r=new Uint8Array(t);for(;r.length-e.length>=0;){let o=r[0];for(let s=0;s<e.length;s++)r[s]^=lt.mul(e[s],o);let i=0;for(;i<r.length&&r[i]===0;)i++;r=r.slice(i)}return r};V.generateECPolynomial=function(t){let e=new Uint8Array([1]);for(let r=0;r<t;r++)e=V.mul(e,new Uint8Array([1,lt.exp(r)]));return e}});var Gt=g((kn,jt)=>{var Ot=Yt();function at(n){this.genPoly=void 0,this.degree=n,this.degree&&this.initialize(this.degree)}at.prototype.initialize=function(t){this.degree=t,this.genPoly=Ot.generateECPolynomial(this.degree)};at.prototype.encode=function(t){if(!this.genPoly)throw new Error("Encoder not initialized");let e=new Uint8Array(t.length+this.degree);e.set(t);let r=Ot.mod(e,this.genPoly),o=this.degree-r.length;if(o>0){let i=new Uint8Array(this.degree);return i.set(r,o),i}return r};jt.exports=at});var ft=g(Qt=>{Qt.isValid=function(t){return!isNaN(t)&&t>=1&&t<=40}});var gt=g(B=>{var $t="[0-9]+",De="[A-Z $%*+\\-./:]+",H="(?:[u3000-u303F]|[u3040-u309F]|[u30A0-u30FF]|[uFF00-uFFEF]|[u4E00-u9FAF]|[u2605-u2606]|[u2190-u2195]|u203B|[u2010u2015u2018u2019u2025u2026u201Cu201Du2225u2260]|[u0391-u0451]|[u00A7u00A8u00B1u00B4u00D7u00F7])+";H=H.replace(/u/g,"\\u");var Fe="(?:(?![A-Z0-9 $%*+\\-./:]|"+H+`)(?:.|[\r
]))+`;B.KANJI=new RegExp(H,"g");B.BYTE_KANJI=new RegExp("[^A-Z0-9 $%*+\\-./:]+","g");B.BYTE=new RegExp(Fe,"g");B.NUMERIC=new RegExp($t,"g");B.ALPHANUMERIC=new RegExp(De,"g");var ke=new RegExp("^"+H+"$"),ze=new RegExp("^"+$t+"$"),Ve=new RegExp("^[A-Z0-9 $%*+\\-./:]+$");B.testKanji=function(t){return ke.test(t)};B.testNumeric=function(t){return ze.test(t)};B.testAlphanumeric=function(t){return Ve.test(t)}});var M=g(p=>{var He=ft(),dt=gt();p.NUMERIC={id:"Numeric",bit:1,ccBits:[10,12,14]};p.ALPHANUMERIC={id:"Alphanumeric",bit:2,ccBits:[9,11,13]};p.BYTE={id:"Byte",bit:4,ccBits:[8,16,16]};p.KANJI={id:"Kanji",bit:8,ccBits:[8,10,12]};p.MIXED={bit:-1};p.getCharCountIndicator=function(t,e){if(!t.ccBits)throw new Error("Invalid mode: "+t);if(!He.isValid(e))throw new Error("Invalid version: "+e);return e>=1&&e<10?t.ccBits[0]:e<27?t.ccBits[1]:t.ccBits[2]};p.getBestModeForData=function(t){return dt.testNumeric(t)?p.NUMERIC:dt.testAlphanumeric(t)?p.ALPHANUMERIC:dt.testKanji(t)?p.KANJI:p.BYTE};p.toString=function(t){if(t&&t.id)return t.id;throw new Error("Invalid mode")};p.isValid=function(t){return t&&t.bit&&t.ccBits};function Ke(n){if(typeof n!="string")throw new Error("Param is not a string");switch(n.toLowerCase()){case"numeric":return p.NUMERIC;case"alphanumeric":return p.ALPHANUMERIC;case"kanji":return p.KANJI;case"byte":return p.BYTE;default:throw new Error("Unknown mode: "+n)}}p.from=function(t,e){if(p.isValid(t))return t;try{return Ke(t)}catch{return e}}});var te=g(R=>{var X=I(),Je=ct(),Wt=j(),S=M(),ht=ft(),Xt=7973,Zt=X.getBCHDigit(Xt);function Ye(n,t,e){for(let r=1;r<=40;r++)if(t<=R.getCapacity(r,e,n))return r}function vt(n,t){return S.getCharCountIndicator(n,t)+4}function Oe(n,t){let e=0;return n.forEach(function(r){let o=vt(r.mode,t);e+=o+r.getBitsLength()}),e}function je(n,t){for(let e=1;e<=40;e++)if(Oe(n,e)<=R.getCapacity(e,t,S.MIXED))return e}R.from=function(t,e){return ht.isValid(t)?parseInt(t,10):e};R.getCapacity=function(t,e,r){if(!ht.isValid(t))throw new Error("Invalid QR Code version");typeof r>"u"&&(r=S.BYTE);let o=X.getSymbolTotalCodewords(t),i=Je.getTotalCodewordsCount(t,e),s=(o-i)*8;if(r===S.MIXED)return s;let u=s-vt(r,t);switch(r){case S.NUMERIC:return Math.floor(u/10*3);case S.ALPHANUMERIC:return Math.floor(u/11*2);case S.KANJI:return Math.floor(u/13);case S.BYTE:default:return Math.floor(u/8)}};R.getBestVersionForData=function(t,e){let r,o=Wt.from(e,Wt.M);if(Array.isArray(t)){if(t.length>1)return je(t,o);if(t.length===0)return 1;r=t[0]}else r=t;return Ye(r.mode,r.getLength(),o)};R.getEncodedBits=function(t){if(!ht.isValid(t)||t<7)throw new Error("Invalid QR Code version");let e=t<<12;for(;X.getBCHDigit(e)-Zt>=0;)e^=Xt<<X.getBCHDigit(e)-Zt;return t<<12|e}});var oe=g(re=>{var pt=I(),ne=1335,Ge=21522,ee=pt.getBCHDigit(ne);re.getEncodedBits=function(t,e){let r=t.bit<<3|e,o=r<<10;for(;pt.getBCHDigit(o)-ee>=0;)o^=ne<<pt.getBCHDigit(o)-ee;return(r<<10|o)^Ge}});var se=g((Yn,ie)=>{var Qe=M();function x(n){this.mode=Qe.NUMERIC,this.data=n.toString()}x.getBitsLength=function(t){return 10*Math.floor(t/3)+(t%3?t%3*3+1:0)};x.prototype.getLength=function(){return this.data.length};x.prototype.getBitsLength=function(){return x.getBitsLength(this.data.length)};x.prototype.write=function(t){let e,r,o;for(e=0;e+3<=this.data.length;e+=3)r=this.data.substr(e,3),o=parseInt(r,10),t.put(o,10);let i=this.data.length-e;i>0&&(r=this.data.substr(e),o=parseInt(r,10),t.put(o,i*3+1))};ie.exports=x});var ce=g((On,ue)=>{var $e=M(),wt=["0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"," ","$","%","*","+","-",".","/",":"];function U(n){this.mode=$e.ALPHANUMERIC,this.data=n}U.getBitsLength=function(t){return 11*Math.floor(t/2)+6*(t%2)};U.prototype.getLength=function(){return this.data.length};U.prototype.getBitsLength=function(){return U.getBitsLength(this.data.length)};U.prototype.write=function(t){let e;for(e=0;e+2<=this.data.length;e+=2){let r=wt.indexOf(this.data[e])*45;r+=wt.indexOf(this.data[e+1]),t.put(r,11)}this.data.length%2&&t.put(wt.indexOf(this.data[e]),6)};ue.exports=U});var ae=g((jn,le)=>{var We=M();function q(n){this.mode=We.BYTE,typeof n=="string"?this.data=new TextEncoder().encode(n):this.data=new Uint8Array(n)}q.getBitsLength=function(t){return t*8};q.prototype.getLength=function(){return this.data.length};q.prototype.getBitsLength=function(){return q.getBitsLength(this.data.length)};q.prototype.write=function(n){for(let t=0,e=this.data.length;t<e;t++)n.put(this.data[t],8)};le.exports=q});var ge=g((Gn,fe)=>{var Ze=M(),Xe=I();function D(n){this.mode=Ze.KANJI,this.data=n}D.getBitsLength=function(t){return t*13};D.prototype.getLength=function(){return this.data.length};D.prototype.getBitsLength=function(){return D.getBitsLength(this.data.length)};D.prototype.write=function(n){let t;for(t=0;t<this.data.length;t++){let e=Xe.toSJIS(this.data[t]);if(e>=33088&&e<=40956)e-=33088;else if(e>=57408&&e<=60351)e-=49472;else throw new Error("Invalid SJIS character: "+this.data[t]+`
Make sure your charset is UTF-8`);e=(e>>>8&255)*192+(e&255),n.put(e,13)}};fe.exports=D});var de=g((Qn,mt)=>{"use strict";var K={single_source_shortest_paths:function(n,t,e){var r={},o={};o[t]=0;var i=K.PriorityQueue.make();i.push(t,0);for(var s,u,c,l,a,w,h,y,A;!i.empty();){s=i.pop(),u=s.value,l=s.cost,a=n[u]||{};for(c in a)a.hasOwnProperty(c)&&(w=a[c],h=l+w,y=o[c],A=typeof o[c]>"u",(A||y>h)&&(o[c]=h,i.push(c,h),r[c]=u))}if(typeof e<"u"&&typeof o[e]>"u"){var T=["Could not find a path from ",t," to ",e,"."].join("");throw new Error(T)}return r},extract_shortest_path_from_predecessor_list:function(n,t){for(var e=[],r=t,o;r;)e.push(r),o=n[r],r=n[r];return e.reverse(),e},find_path:function(n,t,e){var r=K.single_source_shortest_paths(n,t,e);return K.extract_shortest_path_from_predecessor_list(r,e)},PriorityQueue:{make:function(n){var t=K.PriorityQueue,e={},r;n=n||{};for(r in t)t.hasOwnProperty(r)&&(e[r]=t[r]);return e.queue=[],e.sorter=n.sorter||t.default_sorter,e},default_sorter:function(n,t){return n.cost-t.cost},push:function(n,t){var e={value:n,cost:t};this.queue.push(e),this.queue.sort(this.sorter)},pop:function(){return this.queue.shift()},empty:function(){return this.queue.length===0}}};typeof mt<"u"&&(mt.exports=K)});var Be=g(F=>{var f=M(),we=se(),me=ce(),ye=ae(),Ee=ge(),J=gt(),v=I(),ve=de();function he(n){return unescape(encodeURIComponent(n)).length}function Y(n,t,e){let r=[],o;for(;(o=n.exec(e))!==null;)r.push({data:o[0],index:o.index,mode:t,length:o[0].length});return r}function Ce(n){let t=Y(J.NUMERIC,f.NUMERIC,n),e=Y(J.ALPHANUMERIC,f.ALPHANUMERIC,n),r,o;return v.isKanjiModeEnabled()?(r=Y(J.BYTE,f.BYTE,n),o=Y(J.KANJI,f.KANJI,n)):(r=Y(J.BYTE_KANJI,f.BYTE,n),o=[]),t.concat(e,r,o).sort(function(s,u){return s.index-u.index}).map(function(s){return{data:s.data,mode:s.mode,length:s.length}})}function yt(n,t){switch(t){case f.NUMERIC:return we.getBitsLength(n);case f.ALPHANUMERIC:return me.getBitsLength(n);case f.KANJI:return Ee.getBitsLength(n);case f.BYTE:return ye.getBitsLength(n)}}function tn(n){return n.reduce(function(t,e){let r=t.length-1>=0?t[t.length-1]:null;return r&&r.mode===e.mode?(t[t.length-1].data+=e.data,t):(t.push(e),t)},[])}function en(n){let t=[];for(let e=0;e<n.length;e++){let r=n[e];switch(r.mode){case f.NUMERIC:t.push([r,{data:r.data,mode:f.ALPHANUMERIC,length:r.length},{data:r.data,mode:f.BYTE,length:r.length}]);break;case f.ALPHANUMERIC:t.push([r,{data:r.data,mode:f.BYTE,length:r.length}]);break;case f.KANJI:t.push([r,{data:r.data,mode:f.BYTE,length:he(r.data)}]);break;case f.BYTE:t.push([{data:r.data,mode:f.BYTE,length:he(r.data)}])}}return t}function nn(n,t){let e={},r={start:{}},o=["start"];for(let i=0;i<n.length;i++){let s=n[i],u=[];for(let c=0;c<s.length;c++){let l=s[c],a=""+i+c;u.push(a),e[a]={node:l,lastCount:0},r[a]={};for(let w=0;w<o.length;w++){let h=o[w];e[h]&&e[h].node.mode===l.mode?(r[h][a]=yt(e[h].lastCount+l.length,l.mode)-yt(e[h].lastCount,l.mode),e[h].lastCount+=l.length):(e[h]&&(e[h].lastCount=l.length),r[h][a]=yt(l.length,l.mode)+4+f.getCharCountIndicator(l.mode,t))}}o=u}for(let i=0;i<o.length;i++)r[o[i]].end=0;return{map:r,table:e}}function pe(n,t){let e,r=f.getBestModeForData(n);if(e=f.from(t,r),e!==f.BYTE&&e.bit<r.bit)throw new Error('"'+n+'" cannot be encoded with mode '+f.toString(e)+`.
 Suggested mode is: `+f.toString(r));switch(e===f.KANJI&&!v.isKanjiModeEnabled()&&(e=f.BYTE),e){case f.NUMERIC:return new we(n);case f.ALPHANUMERIC:return new me(n);case f.KANJI:return new Ee(n);case f.BYTE:return new ye(n)}}F.fromArray=function(t){return t.reduce(function(e,r){return typeof r=="string"?e.push(pe(r,null)):r.data&&e.push(pe(r.data,r.mode)),e},[])};F.fromString=function(t,e){let r=Ce(t,v.isKanjiModeEnabled()),o=en(r),i=nn(o,e),s=ve.find_path(i.map,"start","end"),u=[];for(let c=1;c<s.length-1;c++)u.push(i.table[s[c]].node);return F.fromArray(tn(u))};F.rawSplit=function(t){return F.fromArray(Ce(t,v.isKanjiModeEnabled()))}});var Te=g(Ae=>{var et=I(),Et=j(),rn=qt(),on=Ft(),sn=kt(),un=Ht(),At=Kt(),Tt=ct(),cn=Gt(),tt=te(),ln=oe(),an=M(),Ct=Be();function fn(n,t){let e=n.size,r=un.getPositions(t);for(let o=0;o<r.length;o++){let i=r[o][0],s=r[o][1];for(let u=-1;u<=7;u++)if(!(i+u<=-1||e<=i+u))for(let c=-1;c<=7;c++)s+c<=-1||e<=s+c||(u>=0&&u<=6&&(c===0||c===6)||c>=0&&c<=6&&(u===0||u===6)||u>=2&&u<=4&&c>=2&&c<=4?n.set(i+u,s+c,!0,!0):n.set(i+u,s+c,!1,!0))}}function gn(n){let t=n.size;for(let e=8;e<t-8;e++){let r=e%2===0;n.set(e,6,r,!0),n.set(6,e,r,!0)}}function dn(n,t){let e=sn.getPositions(t);for(let r=0;r<e.length;r++){let o=e[r][0],i=e[r][1];for(let s=-2;s<=2;s++)for(let u=-2;u<=2;u++)s===-2||s===2||u===-2||u===2||s===0&&u===0?n.set(o+s,i+u,!0,!0):n.set(o+s,i+u,!1,!0)}}function hn(n,t){let e=n.size,r=tt.getEncodedBits(t),o,i,s;for(let u=0;u<18;u++)o=Math.floor(u/3),i=u%3+e-8-3,s=(r>>u&1)===1,n.set(o,i,s,!0),n.set(i,o,s,!0)}function Bt(n,t,e){let r=n.size,o=ln.getEncodedBits(t,e),i,s;for(i=0;i<15;i++)s=(o>>i&1)===1,i<6?n.set(i,8,s,!0):i<8?n.set(i+1,8,s,!0):n.set(r-15+i,8,s,!0),i<8?n.set(8,r-i-1,s,!0):i<9?n.set(8,15-i-1+1,s,!0):n.set(8,15-i-1,s,!0);n.set(r-8,8,1,!0)}function pn(n,t){let e=n.size,r=-1,o=e-1,i=7,s=0;for(let u=e-1;u>0;u-=2)for(u===6&&u--;;){for(let c=0;c<2;c++)if(!n.isReserved(o,u-c)){let l=!1;s<t.length&&(l=(t[s]>>>i&1)===1),n.set(o,u-c,l),i--,i===-1&&(s++,i=7)}if(o+=r,o<0||e<=o){o-=r,r=-r;break}}}function wn(n,t,e){let r=new rn;e.forEach(function(c){r.put(c.mode.bit,4),r.put(c.getLength(),an.getCharCountIndicator(c.mode,n)),c.write(r)});let o=et.getSymbolTotalCodewords(n),i=Tt.getTotalCodewordsCount(n,t),s=(o-i)*8;for(r.getLengthInBits()+4<=s&&r.put(0,4);r.getLengthInBits()%8!==0;)r.putBit(0);let u=(s-r.getLengthInBits())/8;for(let c=0;c<u;c++)r.put(c%2?17:236,8);return mn(r,n,t)}function mn(n,t,e){let r=et.getSymbolTotalCodewords(t),o=Tt.getTotalCodewordsCount(t,e),i=r-o,s=Tt.getBlocksCount(t,e),u=r%s,c=s-u,l=Math.floor(r/s),a=Math.floor(i/s),w=a+1,h=l-a,y=new cn(h),A=0,T=new Array(s),bt=new Array(s),rt=0,Re=new Uint8Array(n.buffer);for(let _=0;_<s;_++){let it=_<c?a:w;T[_]=Re.slice(A,A+it),bt[_]=y.encode(T[_]),A+=it,rt=Math.max(rt,it)}let ot=new Uint8Array(r),Rt=0,E,C;for(E=0;E<rt;E++)for(C=0;C<s;C++)E<T[C].length&&(ot[Rt++]=T[C][E]);for(E=0;E<h;E++)for(C=0;C<s;C++)ot[Rt++]=bt[C][E];return ot}function yn(n,t,e,r){let o;if(Array.isArray(n))o=Ct.fromArray(n);else if(typeof n=="string"){let l=t;if(!l){let a=Ct.rawSplit(n);l=tt.getBestVersionForData(a,e)}o=Ct.fromString(n,l||40)}else throw new Error("Invalid data");let i=tt.getBestVersionForData(o,e);if(!i)throw new Error("The amount of data is too big to be stored in a QR Code");if(!t)t=i;else if(t<i)throw new Error(`
The chosen QR Code version cannot contain this amount of data.
Minimum version required to store current data is: `+i+`.
`);let s=wn(t,e,o),u=et.getSymbolSize(t),c=new on(u);return fn(c,t),gn(c),dn(c,t),Bt(c,e,0),t>=7&&hn(c,t),pn(c,s),isNaN(r)&&(r=At.getBestMask(c,Bt.bind(null,c,e))),At.applyMask(r,c),Bt(c,e,r),{modules:c,version:t,errorCorrectionLevel:e,maskPattern:r,segments:o}}Ae.create=function(t,e){if(typeof t>"u"||t==="")throw new Error("No input text");let r=Et.M,o,i;return typeof e<"u"&&(r=Et.from(e.errorCorrectionLevel,Et.M),o=tt.from(e.version),i=At.from(e.maskPattern),e.toSJISFunc&&et.setToSJISFunction(e.toSJISFunc)),yn(t,o,r,i)}});var It=g(L=>{function Ie(n){if(typeof n=="number"&&(n=n.toString()),typeof n!="string")throw new Error("Color should be defined as hex string");let t=n.slice().replace("#","").split("");if(t.length<3||t.length===5||t.length>8)throw new Error("Invalid hex color: "+n);(t.length===3||t.length===4)&&(t=Array.prototype.concat.apply([],t.map(function(r){return[r,r]}))),t.length===6&&t.push("F","F");let e=parseInt(t.join(""),16);return{r:e>>24&255,g:e>>16&255,b:e>>8&255,a:e&255,hex:"#"+t.slice(0,6).join("")}}L.getOptions=function(t){t||(t={}),t.color||(t.color={});let e=typeof t.margin>"u"||t.margin===null||t.margin<0?4:t.margin,r=t.width&&t.width>=21?t.width:void 0,o=t.scale||4;return{width:r,scale:r?4:o,margin:e,color:{dark:Ie(t.color.dark||"#000000ff"),light:Ie(t.color.light||"#ffffffff")},type:t.type,rendererOpts:t.rendererOpts||{}}};L.getScale=function(t,e){return e.width&&e.width>=t+e.margin*2?e.width/(t+e.margin*2):e.scale};L.getImageWidth=function(t,e){let r=L.getScale(t,e);return Math.floor((t+e.margin*2)*r)};L.qrToImageData=function(t,e,r){let o=e.modules.size,i=e.modules.data,s=L.getScale(o,r),u=Math.floor((o+r.margin*2)*s),c=r.margin*s,l=[r.color.light,r.color.dark];for(let a=0;a<u;a++)for(let w=0;w<u;w++){let h=(a*u+w)*4,y=r.color.light;if(a>=c&&w>=c&&a<u-c&&w<u-c){let A=Math.floor((a-c)/s),T=Math.floor((w-c)/s);y=l[i[A*o+T]?1:0]}t[h++]=y.r,t[h++]=y.g,t[h++]=y.b,t[h]=y.a}}});var Ne=g(nt=>{var Nt=It();function En(n,t,e){n.clearRect(0,0,t.width,t.height),t.style||(t.style={}),t.height=e,t.width=e,t.style.height=e+"px",t.style.width=e+"px"}function Cn(){try{return document.createElement("canvas")}catch{throw new Error("You need to specify a canvas element")}}nt.render=function(t,e,r){let o=r,i=e;typeof o>"u"&&(!e||!e.getContext)&&(o=e,e=void 0),e||(i=Cn()),o=Nt.getOptions(o);let s=Nt.getImageWidth(t.modules.size,o),u=i.getContext("2d"),c=u.createImageData(s,s);return Nt.qrToImageData(c.data,t,o),En(u,i,s),u.putImageData(c,0,0),i};nt.renderToDataURL=function(t,e,r){let o=r;typeof o>"u"&&(!e||!e.getContext)&&(o=e,e=void 0),o||(o={});let i=nt.render(t,e,o),s=o.type||"image/png",u=o.rendererOpts||{};return i.toDataURL(s,u.quality)}});var Pe=g(Se=>{var Bn=It();function Me(n,t){let e=n.a/255,r=t+'="'+n.hex+'"';return e<1?r+" "+t+'-opacity="'+e.toFixed(2).slice(1)+'"':r}function Mt(n,t,e){let r=n+t;return typeof e<"u"&&(r+=" "+e),r}function An(n,t,e){let r="",o=0,i=!1,s=0;for(let u=0;u<n.length;u++){let c=Math.floor(u%t),l=Math.floor(u/t);!c&&!i&&(i=!0),n[u]?(s++,u>0&&c>0&&n[u-1]||(r+=i?Mt("M",c+e,.5+l+e):Mt("m",o,0),o=0,i=!1),c+1<t&&n[u+1]||(r+=Mt("h",s),s=0)):o++}return r}Se.render=function(t,e,r){let o=Bn.getOptions(e),i=t.modules.size,s=t.modules.data,u=i+o.margin*2,c=o.color.light.a?"<path "+Me(o.color.light,"fill")+' d="M0 0h'+u+"v"+u+'H0z"/>':"",l="<path "+Me(o.color.dark,"stroke")+' d="'+An(s,i,o.margin)+'"/>',a='viewBox="0 0 '+u+" "+u+'"',h='<svg xmlns="http://www.w3.org/2000/svg" '+(o.width?'width="'+o.width+'" height="'+o.width+'" ':"")+a+' shape-rendering="crispEdges">'+c+l+`</svg>
`;return typeof r=="function"&&r(null,h),h}});var Nn=g(O=>{var Tn=_t(),St=Te(),be=Ne(),In=Pe();function Pt(n,t,e,r,o){let i=[].slice.call(arguments,1),s=i.length,u=typeof i[s-1]=="function";if(!u&&!Tn())throw new Error("Callback required as last argument");if(u){if(s<2)throw new Error("Too few arguments provided");s===2?(o=e,e=t,t=r=void 0):s===3&&(t.getContext&&typeof o>"u"?(o=r,r=void 0):(o=r,r=e,e=t,t=void 0))}else{if(s<1)throw new Error("Too few arguments provided");return s===1?(e=t,t=r=void 0):s===2&&!t.getContext&&(r=e,e=t,t=void 0),new Promise(function(c,l){try{let a=St.create(e,r);c(n(a,t,r))}catch(a){l(a)}})}try{let c=St.create(e,r);o(null,n(c,t,r))}catch(c){o(c)}}O.create=St.create;O.toCanvas=Pt.bind(null,be.render);O.toDataURL=Pt.bind(null,be.renderToDataURL);O.toString=Pt.bind(null,function(n,t,e){return In.render(n,e)})});return Nn();})();
/* fomo-qr-lib-end */
(() => {
	const messages = {
  "zh-Hant": {
    "UPDATE AVAILABLE": "有更新可用",
    "REMOVING WINNER PAYOUT… ✓": "正在移除贏家獎金… ✓",
    "INSTALLING CHARITY… ✓": "正在安裝善意… ✓",
    "KEEPING FOMO… UNFORTUNATELY ✓": "FOMO 已保留… 很遺憾 ✓",
    "RUNNING ON ARC / AGENTIC REALM COMPUTER / ORGANIZED BY ARCBLOCK": "運行於 ARC / Agentic Realm Computer / ArcBlock 主辦",
    "LOADING CAMPAIGN…": "正在載入活動…",
    "PLAY": "參與",
    "THE TEAMS": "慈善戰隊",
    "HALL OF GOOD": "好人榜",
    "RULES & FAQ": "玩法與常見疑問",
    "● RUNNING ON ARC": "● 運行於 ARC",
    "organized by ArcBlock ↗": "ArcBlock 主辦 ↗",
    "ROUND —": "第 — 輪",
    "Loading pool…": "正在載入捐款池…",
    "Connecting…": "正在連線…",
    "JOIN THE ROUND ↗": "加入這一輪 ↗",
    "CHOOSE YOUR CHAOTIC GOOD": "選擇你的混亂善良",
    "THE GOOD GUYS.": "這裡都是好人。",
    "Five charities. One very unnecessary competition.": "五個慈善機構。一場非常沒必要的比賽。",
    "MONEY BUYS RANK, NOT PIXELS": "錢能買排名，買不到更多像素",
    "HALL OF GOOD.": "好人排行榜。",
    "Donors, round history, and questionable scientific findings.": "捐款者、歷輪紀錄，以及可疑的科學發現。",
    "THE FINE PRINT GOT A PERSONALITY": "連小字都開始有個性了",
    "HOW TO LOSE.": "如何漂亮地輸掉。",
    "The winner gets nothing. Their charity gets everything.": "贏家一無所獲。支持的慈善機構獲得全部。",
    "SAME BUILDERS. DIFFERENT KIND OF CHAOS.": "同一群建造者。不一樣的混亂。",
    "MAKE CRYPTO": "讓加密世界",
    "FUN AGAIN.": "重新好玩。",
    "The winner gets nothing.": "贏家一無所獲。",
    "Their charity gets everything.": "支持的慈善機構獲得全部。",
    "PLAY? ✓": "玩一下？✓",
    "SHARE? ✓": "分享？✓",
    "DO GOOD? ✓": "做好事？✓",
    "A LITTLE STUPID. A LITTLE GOOD. BUILT ON ARC.": "有點蠢。有點善良。建於 ARC。",
    "✦ BUILT ON ARC. PAID ON Arc.": "✦ 建於 ARC。付款走 Arc。",
    "✦ NO YIELD. JUST FEELINGS.": "✦ 沒有收益。只有感覺。",
    "✦ INDEPENDENT EXPERIMENT. ZERO ENDORSEMENTS.": "✦ 獨立實驗。零背書。",
    "ROUND 001": "第 001 輪",
    "WAITING FOR FIRST DONATION": "等待第一筆捐款",
    "THE DONATION POOL": "本輪捐款池",
    "INSERT GOOD DEED TO START": "投入一件善事，開始遊戲",
    "Every donation resets the clock to 10:00.": "每筆有效捐款都將倒數重設為 10:00。",
    "IF THE CLOCK HITS ZERO…": "當倒數歸零…",
    "Literally nobody wins. Yet.": "目前真的沒人贏。",
    "The first donor starts the round.": "第一位捐款者開啟本輪。",
    "Someone else is exit giving.": "有人正在出逃式捐款。",
    "You should probably stop them.": "你大概該阻止一下。",
    "YOUR TURN, HUMAN": "輪到你了，人類",
    "01 / CHOOSE YOUR ALLEGIANCE": "01 / 選擇你的戰隊",
    "02 / HOW MUCH GOOD?": "02 / 今天要多善良？",
    "Custom": "自訂",
    "NAME": "名稱",
    "OPTIONAL": "選填",
    "URL": "網址",
    "DO GOOD. RESET CLOCK.": "做好事。重設倒數。",
    "No wallet connection. No signature. Just send the exact amount.": "不用連接錢包、不用簽名。只需轉入指定的精確金額。",
    "SEND EXACTLY": "請轉入以下精確金額",
    "← Back": "← 返回",
    "COPY AMOUNT": "複製金額",
    "Scan with your phone wallet": "用手機錢包掃描",
    "PHONE OR ANOTHER DEVICE": "手機或另一台裝置",
    "OPEN WALLET ↗": "打開錢包 ↗",
    "COPY PAYMENT LINK": "複製付款連結",
    "SHARE TO PHONE": "分享到手機",
    "QR and wallet link already include the exact amount and address. No extra typing.": "二維碼和錢包連結已包含精確金額與地址，不必再手打。",
    "TO THIS CAMPAIGN ADDRESS": "轉入本活動的收款地址",
    "COPY ADDRESS": "複製地址",
    "Those weird decimals match your donation to your team. The extra fraction is donated too. Yes, the weird decimals are intentional. Keep this amount private. Send once; allow time for confirmation.": "這串奇怪的小數用來配對你的捐款與戰隊；多出來的零頭也全數捐出。對，小數是故意的。請勿公開此金額，只轉帳一次，並等待確認。",
    "SIMULATE ARRIVAL ↗": "模擬到帳 ↗",
    "COMMUNITY": "社群捐款",
    "SIMULATED": "模擬資料",
    "ARCBLOCK GUARANTEE": "ARCBLOCK 保底",
    "PER CHARITY": "每個慈善機構",
    "PERSONAL FINANCIAL RETURN": "個人財務回報",
    "CONSISTENTLY.": "始終如一。",
    "★ HALL OF GOOD": "★ 好人排行榜",
    "ALL TIME": "全部紀錄",
    "THIS ROUND": "本輪",
    "Money buys rank, not pixels.": "錢能買排名，買不到更多像素。",
    "↳ RECENT BAD FINANCIAL DECISIONS": "↳ 最近的不良財務決策",
    "LIVE": "即時",
    "FIVE TEAMS. ZERO BAD GUYS.": "五支戰隊。沒有壞人。",
    "CHOOSE YOUR CHAOTIC GOOD.": "選擇你的混亂善良。",
    "ArcBlock covers each charity’s shortfall to $100 at campaign end. Top-ups are separate from community donations and leaderboards. Preview/testnet figures are simulations.": "活動結束時，ArcBlock 會為每個慈善機構補足至 100 美元。補款與社群捐款分開計算，不列入排行榜。預覽版與測試網的數字皆為模擬。",
    "☠ ROGUE DONORS": "☠ 野生捐款者",
    "NO TEAM. STILL GOOD.": "沒有戰隊。照樣善良。",
    "Direct or unmatched Arc Network USDC transfers go to KIDS. They don’t reset the clock. Addresses only. Mysterious. Generous.": "直接轉入或無法配對的 Arc Network USDC 歸入 KIDS，不會重設倒數。只顯示地址。神祕，又慷慨。",
    "↺ ROUND HISTORY": "↺ 歷輪紀錄",
    "THE RECEIPTS": "有據可查",
    "Allocations are recorded here. Charity payments happen manually after the campaign ends.": "此處記錄款項分配。活動結束後，再人工向慈善機構捐出並公布收據。",
    "HOW TO LOSE MONEY BEAUTIFULLY": "如何漂亮地把錢花掉",
    "FOMO RETAINED.": "FOMO 原封保留。",
    "GREED REASSIGNED.": "貪念另有安排。",
    "Pick a team. Send USDC.": "選擇戰隊，轉入 USDC。",
    "Generate a private payment amount. Send exactly that amount on Arc Network before it expires.": "產生專屬付款金額，在到期前透過 Arc Network 轉入完全相同的金額。",
    "Steal the lead. Reset the clock.": "搶下領先，重設倒數。",
    "A matched donation starts a round or resets its timer to ten minutes. Your selected charity takes the lead.": "配對成功的捐款會開啟一輪，或將倒數重設為十分鐘。你選的慈善機構取得領先。",
    "Be last. Get absolutely nothing.": "撐到最後，什麼都拿不到。",
    "When time runs out, the final donor’s charity gets the round’s entire pool. Donations are made after the campaign.": "倒數結束時，最後捐款者選擇的慈善機構獲得本輪全部捐款池。實際捐贈在活動結束後進行。",
    "FREQUENTLY AVOIDED QUESTIONS.": "大家經常迴避的問題。",
    "THE FINE PRINT GOT A PERSONALITY.": "連小字都開始有個性了。",
    "What does the winner get?": "贏家能拿到什麼？",
    "Nothing.": "什麼都沒有。",
    "Their charity gets everything. You get the final-donor spot in round history. An astonishingly unprofitable achievement.": "支持的慈善機構獲得全部。你會在歷輪紀錄留下最後捐款者的席位。一項驚人地不賺錢的成就。",
    "What does ArcBlock get?": "ArcBlock 能拿到什麼？",
    "Hopefully, your attention.": "希望是你的注意力。",
    "And an excuse to build a completely unnecessary game for a perfectly good cause.": "順便找個藉口，為一件很好的事做一個完全沒必要的遊戲。",
    "What does the charity get?": "慈善機構能拿到什麼？",
    "The money.": "錢。",
    "Each closed round allocates its entire pool to the final donor’s selected charity. We make the actual donations through official charity channels after the campaign ends and publish receipts.": "每輪結束後，全部捐款池歸屬最後捐款者選定的慈善機構。活動結束後，我們透過官方管道完成實際捐贈，並公布收據。",
    "Is this the same Arc as ARC?": "Arc 和 ARC 是同一個嗎？",
    "Yes, they’re different Arcs. We know. It’s confusing. That’s partly why we built this.": "對，它們是不同的 Arc。我們知道，很混亂。這也是我們做這個的部分原因。",
    "= Agentic Realm Computer by ArcBlock: the Blocklet/AUP UI and DID Space storage.": "＝ ArcBlock 的 Agentic Realm Computer：負責 Blocklet/AUP 介面與 DID Space 儲存。",
    "= Circle’s payment network: where the USDC moves.": "＝ Circle 的支付網路：USDC 在這裡移動。",
    "The campaign service and watcher run alongside ARC. Built on ARC. Paid on Arc.": "活動服務與監看程式和 ARC 一起運行。建於 ARC。付款走 Arc。",
    "How deeply is FOMO4GOOD integrated with Arc?": "FOMO4GOOD 與 Arc 整合得多深？",
    "We accept USDC on it.": "我們在上面收 USDC。",
    "“That’s all?”": "「就這樣？」",
    "That’s all. It’s money.": "就這樣。那可是錢。",
    "Why 10.004237 instead of 10?": "為什麼是 10.004237，不是 10？",
    "The last few digits are your payment ID. Old-school? Yes. Effective? Also yes.": "最後幾位數是你的付款識別碼。老派嗎？是。有效嗎？也是。",
    "The extra fraction is less than one cent and is donated too. It is not a tracking fee. Send the exact amount once, before the intent expires. Keep it private.": "多出的零頭不到一美分，也會捐出，並非追蹤手續費。請在付款要求到期前，僅轉入一次精確金額，並對金額保密。",
    "Can I just send random USDC to the wallet?": "可以直接往錢包隨便轉 USDC 嗎？",
    "Yes. Will it help you win? No. Will we still give it to charity? Yes.": "可以。能幫你贏嗎？不能。還會捐給慈善機構嗎？會。",
    "Direct, expired or unmatched transfers on the watched Arc Network become Rogue Donations. They go to KIDS / Save the Children, appear on the separate address-only board, and do not reset the timer.": "在監看的 Arc Network 上，直接轉入、逾期或無法配對的款項會成為野生捐款，歸入 KIDS / Save the Children。它們出現在獨立的地址榜單，不重設倒數。",
    "I sent 5,000 directly. Why didn’t I win the round?": "我直接轉了 5,000，為什麼沒贏這一輪？",
    "Because you donated. You didn’t play.": "因為你捐了款，沒玩遊戲。",
    "All valid game payments are donations. Not all donations are valid game moves. Use the donation button to choose a charity and get your private payment amount.": "所有有效遊戲付款都是捐款，但並非所有捐款都是有效的遊戲操作。請透過捐款按鈕選擇慈善機構，取得專屬付款金額。",
    "I’m 0x7a…42. Can I change my name?": "我是 0x7a…42，可以改名嗎？",
    "Not yet. Should’ve used the button.": "目前不行。早知道就用按鈕了。",
    "Rogue Donors keep their wallet addresses. Normal donations can include a name and URL before payment. No account or wallet signature required.": "野生捐款者只顯示錢包地址。正常捐款可以在付款前填寫名稱與網址，不需帳號或錢包簽名。",
    "What if I send from Ethereum, Base, or another chain?": "如果從 Ethereum、Base 或其他鏈轉入呢？",
    "Wrong Arc. Wrong ledger. We only watch the configured Arc Network and USDC. Other networks and tokens do not join either leaderboard or the charity guarantee; recovery, refund and donation are not promised.": "Arc 錯了，帳本也錯了。我們只監看設定的 Arc Network 與 USDC。其他網路或代幣不列入任何排行榜及慈善保底；不承諾找回、退款或捐出。",
    "Does every donation add ten minutes?": "每筆捐款都增加十分鐘嗎？",
    "It resets the clock to 10:00.": "是重設為 10:00。",
    "It does not add ten more minutes. The first matched payment starts a round. At zero, the last donor’s chosen charity gets the pool. The next round waits for its first donor. No empty-pot victory laps.": "不是額外增加十分鐘。第一筆配對成功的付款開啟本輪；歸零時，最後捐款者選的慈善機構獲得捐款池。下一輪等待首位捐款者，不為空池子慶祝。",
    "What if I close the page after paying?": "付款後關掉網頁怎麼辦？",
    "The watcher keeps watching. Your payment intent lives in DID Space, not just this browser. A matching confirmed transfer still counts even if you disappear. Keep the receipt page in the same browser to check it later.": "監看程式會繼續工作。你的付款要求存在 DID Space，不只在瀏覽器裡。只要轉帳確認且成功配對，即使你離開也照樣有效。保留同一瀏覽器中的收據頁，方便之後查詢。",
    "What if the clock is at zero but the round is not closed?": "倒數歸零了，為什麼還沒結算？",
    "We finish scanning the confirmed chain history before declaring the final donor. A slow RPC or interrupted watcher can delay the result. Chain order decides; your screen’s refresh speed does not. Don’t send a second payment just because confirmation is delayed.": "我們會先掃描完已確認的鏈上紀錄，再判定最後捐款者。RPC 緩慢或監看中斷可能延後結果。以鏈上順序為準，不取決於畫面更新速度。請勿因確認延遲而再次付款。",
    "What if nobody plays?": "如果沒人玩呢？",
    "If nobody plays, ArcBlock donates $500 anyway.": "就算沒人玩，ArcBlock 也會捐出 500 美元。",
    "Every featured charity is guaranteed at least $100; ArcBlock covers the difference. These top-ups never enter the game or donor rankings.": "每個慈善機構至少獲得 100 美元，不足部分由 ArcBlock 補齊。補款不參與遊戲，也不列入捐款排名。",
    "The charities are fine. Our ego is not.": "慈善機構沒事。我們的自尊有事。",
    "Is this FOMO3D?": "這是 FOMO3D 嗎？",
    "Same FOMO. Better outcome.": "一樣的 FOMO。更好的結局。",
    "Inspired by its countdown mechanics, with the personal payout removed. Independent experiment; no affiliation with its creators, Circle, or the featured charities.": "靈感來自其倒數機制，但移除了個人獎金。這是獨立實驗，與原作者、Circle 或列出的慈善機構沒有從屬關係。",
    "Can I run it without ARC?": "不用 ARC 也能運行嗎？",
    "It’s open source, so yes. You would need to replace the ARC rendering and DID Space services it uses yourself.": "程式碼開源，所以可以。你需要自行替換它使用的 ARC 渲染與 DID Space 服務。",
    "Or just run it on ARC.": "或者，直接用 ARC。",
    "The source includes the current companion campaign service and its setup instructions.": "原始碼包含目前的配套活動服務與安裝說明。",
    "Is there a token, a certificate, or an AI agent playing?": "有代幣、證書，或 AI 代理參賽嗎？",
    "No token. No certificate to claim in this launch. No agent players.": "沒有代幣。本次上線沒有可領取的證書，也沒有代理玩家。",
    "Just humans, a leaderboard, a countdown, and surprisingly specific amounts of USDC. The personality is AI-era nonsense; the numbers are actual recorded activity.": "只有人類、排行榜、倒數，以及精確得離譜的 USDC 金額。個性是 AI 時代的胡鬧；數字則來自實際記錄的活動。",
    "UPGRADE COMPLETE.": "升級完成。",
    "Major upgrade.": "重大升級。",
    "Degen → Giving.": "從投機到給予。",
    "Other people’s donations.": "別人的捐款。",
    "Winner payout → $0": "贏家獎金 → $0",
    "Bug fixed.": "漏洞已修復。",
    "Unfortunately retained.": "很遺憾，已保留。",
    "FOMO4GOOD RESEARCH DEPARTMENT": "FOMO4GOOD 研究部",
    "PEER REVIEW: PENDING FOREVER": "同儕審查：永遠待處理",
    "PRELIMINARY FINDINGS ON HUMAN BEHAVIOR": "人類行為初步研究",
    "Statistical significance: absolutely none. Actual campaign counters; satirical commentary. Preview/testnet activity is not evidence about real donors.": "統計顯著性：完全沒有。計數來自活動紀錄，評論純屬諷刺。預覽版與測試網活動不能代表真實捐款者。",
    "SERIOUS WORDS FOR A VERY UNSERIOUS WEBSITE +": "給這個極不正經網站的正經說明 +",
    "100% of eligible USDC received on the configured Arc Network is allocated to charity. This is an organizer-run experiment, not a smart-contract escrow. Timing and team attribution are best effort. The countdown settles against the watcher’s confirmed chain history. A delayed watcher may take time to finalize a round.": "在設定的 Arc Network 收到的合資格 USDC，100% 分配給慈善機構。這是主辦方運作的實驗，不是智慧合約託管。時間與戰隊歸屬將盡力準確處理；倒數結算以監看程式確認的鏈上紀錄為準，監看延遲可能使結算延後。",
    "Transfers on other networks and other tokens are outside this campaign and its guarantee. We cannot promise their recovery, refund or donation. Late or unmatched transfers on the watched network become Rogue Donations for KIDS. Names and URLs are self-reported, not verified identities. Donations are not investments and offer no financial return.": "其他網路或代幣的轉帳不屬於本活動及保底範圍，不承諾找回、退款或捐出。監看網路上的逾期或未配對轉帳會成為 KIDS 的野生捐款。名稱與網址由使用者自行填寫，並非已驗證身分。捐款不是投資，也沒有財務回報。",
    "ArcBlock covers any shortfall below $100 for each charity at the end of the real campaign; that contribution never buys a place on the board. Charity receipts will be published after manual disbursement through official charity channels. Preview and testnet activity is not real fundraising.": "真實活動結束時，ArcBlock 會為每個慈善機構補足至 100 美元；補款不會取得排行榜名次。透過官方管道人工完成捐贈後，將公布收據。預覽版與測試網活動不是真實募款。",
    "Independent experiment organized by ArcBlock. No partnership, sponsorship or endorsement by Circle, Arc Network, the listed charities, or the creators of FOMO3D.": "ArcBlock 主辦的獨立實驗；Circle、Arc Network、列出的慈善機構及 FOMO3D 作者均未與本活動建立夥伴、贊助或背書關係。",
    "Pick a charity. Send the exact amount. Reset the clock.": "選慈善機構。轉入精確金額。重設倒數。",
    "Read the rules ↗": "閱讀玩法 ↗",
    "An open-source experiment organized by": "開源實驗，主辦方：",
    "Built on ARC. Paid on Arc. Confused? Working as intended.": "建於 ARC。付款走 Arc。搞混了？符合預期。",
    "VIEW SOURCE ↗": "查看原始碼 ↗",
    "Anonymous do-gooder": "匿名好人",
    "Donation amount in USDC": "捐款金額（USDC）",
    "Campaign receiving address": "活動收款地址",
    "Leaderboard period": "排行榜期間",
    "Campaign": "活動導覽",
    "Current round": "目前輪次",
    "Original FOMO4GOOD pixel artwork: a hooded builder at a glowing CRT with a sleeping cat": "FOMO4GOOD 原創像素圖：連帽建造者、發光的 CRT 螢幕與熟睡的貓",
    "Anonymous": "匿名",
    "CAMPAIGN ENDED": "活動已結束",
    "CONFIRMING THE FINAL CHAIN HISTORY…": "正在確認最後的鏈上紀錄…",
    "FOMO MODE: GENEROSITY INTENSIFIES": "FOMO 模式：善意加速中",
    "ONE MINUTE. NO PRESSURE.": "剩一分鐘。真的沒有壓力。",
    "TIME UNTIL SOMEONE GETS NOTHING": "距離某人一無所獲還有",
    "Connection delayed": "連線延遲",
    "Campaign ended": "活動已結束",
    "Waiting for first donation": "等待第一筆捐款",
    "Confirming result…": "正在確認結果…",
    "CONNECTION / WATCHER DELAY · Confirmations paused. Reconnecting…": "連線／監看延遲 · 暫停確認，正在重新連線…",
    "Amount expired. Do not send this payment. Late arrivals become Rogue Donations.": "金額已到期。請勿再付款；逾期到帳將歸為野生捐款。",
    "LOCAL PREVIEW · SIMULATED USDC · NO REAL DONATIONS": "本地預覽 · 模擬 USDC · 非真實捐款",
    "ARC NETWORK TESTNET · TEST USDC ONLY · NO REAL DONATIONS": "ARC NETWORK 測試網 · 僅限測試 USDC · 非真實捐款",
    "ARC NETWORK · USDC ON ARC": "ARC NETWORK · Arc 上的 USDC",
    "TEST USDC": "測試 USDC",
    "ROUND IS LIVE": "本輪進行中",
    "No donations yet.": "還沒有捐款。",
    "No rogue donors yet.": "還沒有野生捐款者。",
    "Even chaos is taking a coffee break.": "連混亂都去喝咖啡了。",
    "No completed rounds.": "還沒有已完成的輪次。",
    "We refuse to celebrate an empty pot.": "我們拒絕為空池子慶祝。",
    "PAGE SESSIONS": "瀏覽工作階段",
    "PAYMENT INTENTS": "付款要求",
    "DONOR ADDRESSES": "捐款地址數",
    "INTENT → PAID": "付款要求 → 已付款",
    "MEDIAN DONATION": "捐款中位數",
    "LAST-MINUTE MOVES": "最後一分鐘的操作",
    "Finding: Documentation remains ineffective.": "研究發現：說明文件依然無效。",
    "Finding: Wallet Separation Anxiety detected.": "研究發現：偵測到錢包分離焦慮。",
    "Hypothesis: removing personal profit may have had an effect. More research needed.": "假說：移除個人收益似乎產生了影響。尚待進一步研究。",
    "We may have overestimated FOMO. More research needed.": "我們可能高估了 FOMO。尚待進一步研究。",
    "We have a leaderboard now. Please remain calm.": "現在真的有排行榜了。請保持冷靜。",
    "Human generosity is currently experiencing low liquidity.": "人類善意目前流動性不足。",
    "Someone else is exit giving. You should probably stop them.": "有人正在出逃式捐款。你大概該阻止一下。",
    "FOMO4GOOD IS OVER.": "FOMO4GOOD 已結束。",
    "Final chain reconciliation is still in progress.": "鏈上最終核對仍在進行。",
    "Allocations recorded. See the report and charity receipts.": "分配已記錄。請查看報告與慈善捐款收據。",
    "Nobody got rich. Could’ve been worse.": "沒有人暴富。也算不錯了。",
    "Charity receipts: not yet recorded.": "慈善捐款收據：尚未登錄。",
    "LOCAL SIMULATION — DO NOT SEND FUNDS": "本地模擬 — 請勿轉入資金",
    "PREVIEW — NO RECEIVING ADDRESS": "預覽版 — 沒有收款地址",
    "Waiting for a matching transfer…": "等待可配對的轉帳…",
    "Receipt saved. The server keeps this record even if you close your browser.": "收據已儲存。即使關閉瀏覽器，伺服器仍會保留紀錄。",
    "← Donate again": "← 再捐一次",
    "CAN’T REACH THE CAMPAIGN · Reconnecting…": "無法連上活動 · 正在重新連線…",
    "COPIED ✓": "已複製 ✓",
    "Clipboard unavailable. Select and copy the value manually.": "無法使用剪貼簿，請手動選取並複製內容。",
    "Please try again.": "請再試一次。",
    "KIDS": "兒童隊",
    "DOGS": "狗狗隊",
    "TREES": "樹木隊",
    "WATER": "飲水隊",
    "INTERNET": "網路隊",
    "They're the future. Allegedly.": "他們是未來。據說啦。",
    "Objectively good boys.": "客觀來說，都是乖狗狗。",
    "Still doing carbon capture for free.": "至今仍在免費碳捕捉。",
    "Surprisingly important.": "意外地重要。",
    "Worth saving. Probably.": "值得拯救。大概吧。",
    "ROUND {n}": "第 {n} 輪",
    "{team} leads": "{team} 領先",
    "{team} gets the pool.": "{team} 獲得捐款池。",
    "Put in the lead by {name}": "由 {name} 推上領先位置",
    "Amount expires in {time}": "此金額將於 {time} 後到期",
    "{n} donations": "{n} 筆捐款",
    "1 donation": "1 筆捐款",
    "01 · literally nobody": "01 · 真的沒有人",
    "Congratulations nobody, you’re winning.": "恭喜沒有人，你領先了。",
    "ROGUE → KIDS": "野生捐款 → 兒童隊",
    "TX ↗": "交易 ↗",
    "PREVIEW ALLOCATION": "預覽分配",
    "TESTNET ALLOCATION": "測試網分配",
    "MAINNET ALLOCATION": "主網分配",
    "{n} round wins · allocated": "贏得 {n} 輪 · 已分配",
    "ArcBlock shortfall: ${amount}": "ArcBlock 待補足：${amount}",
    "{mode} CAMPAIGN": "{mode} 活動",
    "preview": "預覽",
    "testnet": "測試網",
    "{donors} donor addresses · {amount} USDC from the community.": "{donors} 個捐款地址 · 社群共捐出 {amount} USDC。",
    "{team} receipt ↗": "{team} 收據 ↗",
    "ONLY {network} · CHAIN {id}": "僅限 {network} · 鏈 ID {id}",
    "CONFIRMED · {result} · Powered by ARC": "已確認 · {result} · 由 ARC 驅動",
    "Rogue Donation → KIDS": "野生捐款 → 兒童隊",
    "{team} takes the lead": "{team} 取得領先",
    "Language": "語言",
    "Generating your exact amount…": "正在產生精確付款金額…",
    "Choose a team first.": "請先選擇戰隊。",
    "Generating your very specific good deed…": "正在產生精確到離譜的善事金額…",
    "Campaign busy; retry shortly.": "活動忙碌中，請稍後再試。",
    "Choose a team.": "請選擇戰隊。",
    "Display name must be at most 32 characters.": "顯示名稱最多 32 個字元。",
    "The campaign is not accepting donations.": "活動目前不接受捐款。",
    "Intent not found.": "找不到這筆付款要求。",
    "Donation must be between 1 and 100,000 USDC.": "捐款金額須介於 1 與 100,000 USDC 之間。",
    "Too many requests. Try again in a minute.": "請求過多，請一分鐘後再試。",
    "Watcher is catching up. Please try again shortly.": "監看程式正在追上鏈上進度，請稍後再試。",
    "Service temporarily unavailable.": "服務暫時無法使用。",
    "Storage unavailable. Please try again.": "儲存服務暫時無法使用，請再試一次。",
    "Unable to complete request.": "無法完成請求。",
    "Campaign starting.": "活動正在啟動。",
    "Charity": "慈善機構",
    "Use a public http or https URL, at most 200 characters.": "請填寫公開的 http 或 https 網址，最多 200 個字元。",
    "This donation amount is busy. Try another base amount.": "這個捐款金額暫時無法使用，請換一個基本金額。",
    "Use a donation from 1 to 100,000 USDC, with at most two decimals.": "請輸入 1 至 100,000 USDC 的捐款金額，最多兩位小數。",
    "Invalid URL": "網址格式不正確。",
    "Built on ARC.": "建於 ARC。",
    "Paid on Arc.": "付款走 Arc。",
    "BUILT ON ARC.": "建於 ARC。",
    "PAID ON Arc.": "付款走 Arc。",
    "Confused? Working as intended.": "搞混了？符合預期。",
    "The campaign service and watcher run alongside ARC.": "活動服務與監看程式和 ARC 一起運行。",
    "TWO ARCS. ONE VERY GOOD EXCUSE.": "兩個 ARC。一個做好事的藉口。",
    "BUILT ON": "建於",
    "PAID ON": "付款走",
    "ARC RUNTIME": "ARC 執行環境",
    "ARC NETWORK": "ARC NETWORK",
    "Not the same": "不是同一個",
    "Different Arcs. Same terrible financial return.": "不同的 Arc。一樣慘烈的個人回報。",
    "Which Arc? Exactly. ↗": "你說哪個 Arc？對，就是這個問題。↗",
    "Who coded this? Should I be worried?": "誰寫的程式？我該擔心嗎？",
    "AI agents. All the way down. Vibe-coded, human-directed. The agents wrote the code; the humans supplied the questionable idea. If you find a bug, congratulations: you have discovered software.": "AI agents，全程上場。Vibe coding，人類指揮。代理寫程式，人類提供可疑的點子。找到 bug？恭喜，你發現了軟體。",
    "So bugs are normal?": "所以有 bug 很正常？",
    "Yes. This was vibe-coded by AI agents, not delivered on stone tablets. A bug is not an Easter egg, a feature, or an advanced donation strategy. We fix bugs. We do not ask you to believe harder.": "對。這是 AI agents vibe coding 出來的，不是刻在石板上的神諭。Bug 不是彩蛋、不是功能，也不是進階捐款策略。我們會修 bug，不會要求你加強信仰。",
    "What do you actually guarantee?": "到底保證什麼？",
    "Two things you can check: the USDC transfer records on Arc, and the receipts for ArcBlock’s actual charity donations after the campaign. The UI can glitch. The jokes can fail. Neither changes a recorded transfer or turns a missing receipt into a donation. Check the records, not our vibes.": "兩件可以核對的事：Arc 鏈上的 USDC 轉帳紀錄，以及活動結束後 ArcBlock 實際捐款的憑證。介面可以出 bug，笑話可以不好笑；它們都改不了已記錄的轉帳，也不能把不存在的收據變成捐款。看紀錄，別看氣氛。",
    "When does the money actually reach charity?": "錢到底什麼時候捐出去？",
    "ArcBlock will complete the campaign’s charity donations after the campaign ends and before December 31, 2026, and publish the donation receipts. A leaderboard allocation is not a payment receipt. “The agent said it sent the money” is not a receipt either.": "ArcBlock 會在活動結束後、2026 年 12 月 31 日前完成本活動的慈善捐款，並公布捐款憑證。排行榜上的分配不等於付款收據。「代理說它已經匯了」也不算收據。",
    "Allocations are recorded here. ArcBlock will complete charity donations after the campaign ends and before December 31, 2026, and publish receipts.": "此處記錄款項分配。ArcBlock 會在活動結束後、2026 年 12 月 31 日前完成慈善捐款，並公布憑證。",
    "ArcBlock covers any shortfall below $100 for each charity at the end of the real campaign; that contribution never buys a place on the board. ArcBlock will complete the charity donations through official channels after the campaign ends and before December 31, 2026, and publish receipts. Preview and testnet activity is not real fundraising.": "真實活動結束時，ArcBlock 會為每個慈善機構補足至 100 美元；補款不會取得排行榜名次。ArcBlock 將在活動結束後、2026 年 12 月 31 日前，透過官方管道完成慈善捐款並公布憑證。預覽版與測試網活動不是真實募款。",
    "DONATE FOR REAL": "認真捐一次",
    "Too cheap? Play with fake money →": "捨不得？用假錢玩 →",
    "YOUR FUSD BALANCE": "你的 FUSD 餘額",
    "Worth approximately $0.00.": "價值約為 $0.00。",
    "PRINT ANOTHER 1,000 FUSD": "再印 1,000 FUSD",
    "REAL DONATIONS ARE NOT OPEN YET.": "真實捐款尚未開放。",
    "PRACTICE ROUND IS NOT OPEN YET.": "演練回合尚未開放。",
    "The campaign service is not connected. Pages only, for now.": "活動服務尚未連線。目前只有頁面。",
    "No receiving address is active. Practice is open; real giving comes next.": "目前沒有啟用的收款地址。先來演練，真實捐款稍後開放。",
    "TRY PRACTICE ROUND ↗": "進入演練回合 ↗",
    "PRACTICE ROUND": "演練回合",
    "PRACTICE ROUND {n}": "演練第 {n} 輪",
    "Same FOMO. Fake money. Nobody gets hurt.": "一樣 FOMO。錢是假的。沒有人受傷。",
    "Same FOMO. Fake money.": "一樣 FOMO。錢是假的。",
    "Nobody gets hurt.": "沒有人受傷。",
    "PRACTICE": "演練",
    "ROUND.": "回合。",
    "FAKE USD. REAL FOMO. ZERO CONSEQUENCES.": "假美元。真 FOMO。零金錢後果。",
    "THE IMAGINARY POOL": "本輪幻想池",
    "PRACTICE NONSENSE": "演練胡鬧總額",
    "REAL CHARITY PAYOUT": "實際慈善捐款",
    "EXACTLY NONE.": "一毛都沒有。",
    "TOP FUSD DONORS": "FUSD 好人榜",
    "TOP FUSD DONORS.": "FUSD 好人榜。",
    "★ TOP FUSD DONORS": "★ FUSD 好人榜",
    "Generosity has never been easier.": "慷慨從未如此容易。",
    "No wallet. No transfer. Spend imaginary FUSD instantly.": "不用錢包、不用轉帳。直接花掉幻想中的 FUSD。",
    "SPEND FUSD. RESET CLOCK.": "花 FUSD。重設倒數。",
    "JOIN PRACTICE ↗": "加入演練 ↗",
    "Practice amount in FUSD": "演練金額（FUSD）",
    "01 / PICK A PRACTICE TEAM": "01 / 選擇演練戰隊",
    "02 / HOW MUCH IMAGINARY GOOD?": "02 / 要多大方地幻想？",
    "The first practice play starts the round.": "第一筆演練操作開啟本輪。",
    "Every FUSD play resets the clock to 10:00.": "每次花 FUSD 都將倒數重設為 10:00。",
    "FIVE TEAMS. ZERO REAL DOLLARS.": "五支戰隊。零元真錢。",
    "Imaginary allocations. Charities receive exactly none of this.": "純屬幻想分配。慈善機構不會收到這裡的任何金額。",
    "The winner gets nothing. Their charity also gets nothing. This is practice.": "贏家一無所獲。慈善機構也一無所獲。這是演練。",
    "Real donations use Arc.": "真實捐款走 Arc。",
    "Pick a practice team. Spend FUSD. Reset the clock.": "選演練戰隊。花 FUSD。重設倒數。",
    "Imaginary generosity. Real ego.": "幻想的慷慨。真實的自尊。",
    "↳ RECENT IMAGINARY GENEROSITY": "↳ 最近的幻想善舉",
    "PRACTICE PLAYERS": "演練玩家",
    "FUSD PLAYS": "FUSD 操作次數",
    "ACTIVE PRACTICE PLAYERS": "活躍演練玩家",
    "FUSD PLAY COMPLETION": "FUSD 操作完成率",
    "MEDIAN FUSD PLAY": "FUSD 操作中位數",
    "IMAGINARY ALLOCATION": "幻想分配",
    "PRACTICE ROUND HISTORY": "演練歷輪紀錄",
    "Start with 1,000 FUSD. No wallet, no blockchain.": "起手 1,000 FUSD。不用錢包，不上鏈。",
    "Pick a team and spend FUSD. Each play resets the clock to 10:00.": "選擇戰隊並花 FUSD，每次操作將倒數重設為 10:00。",
    "At zero, the final player’s team wins the imaginary pool. No charity receives money from practice.": "歸零時，最後玩家的戰隊贏得幻想池。演練不會向慈善機構支付任何金錢。",
    "FUSD (Fake United States Dollar)": "FUSD（Fake United States Dollar，假美元）",
    "A highly centralized currency issued in unlimited quantities by FOMO4GOOD.": "由 FOMO4GOOD 無限發行的高度中心化貨幣。",
    "Backing": "擔保",
    "Reserves": "儲備",
    "Audits": "審計",
    "Value": "價值",
    "Stability": "穩定性",
    "None.": "沒有。",
    "Unnecessary.": "不需要。",
    "Remarkably stable at zero.": "令人驚嘆地穩定在零。",
    "FUSD is not a cryptocurrency. We didn't have time to make one.": "FUSD 不是加密貨幣。我們沒空做一個。",
    "It is only practice points in DID Space. No contract, no wallet asset, no token listing. FUSD cannot be withdrawn, exchanged, or donated for real.": "它只是 DID Space 裡的演練點數。沒有合約、錢包資產或代幣上架。FUSD 無法提領、兌換或實際捐出。",
    "Your balance belongs to this browser session. Keep its cookie to keep your balance. Print 1,000 FUSD once per round; unused balances carry over.": "餘額綁定這個瀏覽器身分，請保留 Cookie。每輪可印 1,000 FUSD 一次，未花餘額可跨輪累積。",
    "Practice players, pools and rankings never enter the real campaign. The real donation guarantee and deadline do not apply to FUSD.": "演練玩家、獎池和排名絕不計入真實活動。真實捐款保底和期限不適用於 FUSD。",
    "PLAY FOR REAL — 1 USDC ↗": "用真錢玩 — 1 USDC ↗",
    "PRACTICE MODE · FAKE USD · FAKE LEADERBOARD · REAL EGO": "演練模式 · 假美元 · 假錢排行榜 · 真自尊",
    "FUSD spent. Your team takes the imaginary lead.": "FUSD 已花掉。你的戰隊取得幻想中的領先。",
    "Not enough FUSD. Fake money still has a balance.": "FUSD 不夠了。假錢也是有餘額的。",
    "Start a practice session first.": "請先建立演練身分。",
    "Use your remaining FUSD before refilling.": "請先用掉剩餘的 FUSD 再補充。",
    "Real donations are not open yet. Try Practice Round with FUSD.": "真實捐款尚未開放，先用 FUSD 玩演練回合吧。",
    "1,000 FUSD printed. Reserves remain zero.": "1,000 FUSD 印好了。儲備依然是零。",
    "YOU WON!": "你贏了！",
    "{team} WIN!": "{team} 贏了！",
    "{amount} FUSD of completely imaginary money. The charity receives exactly none of this.": "完全幻想的 {amount} FUSD。慈善機構一毛都收不到。",
    "Want to try with $1 that actually exists?": "想用真正存在的 1 美元試試嗎？",
    "REAL RAISED": "真實募款",
    "No chain. No transfer. Only FUSD.": "不上鏈、不轉帳，只有 FUSD。",
    "Play saved. Refreshing the round…": "操作已記錄，正在更新回合…",
    "SETTLING THE PRACTICE ROUND…": "正在結算演練回合…",
    "Use 1 to 100,000 FUSD, with at most two decimals.": "請輸入 1 至 100,000 FUSD，最多兩位小數。",
    "Waiting for first practice play": "等待第一筆演練操作",
    "PRACTICE CONNECTION DELAY · Reconnecting…": "演練連線延遲 · 正在重新連線…"
  },
  "en-x-slop": {
    "PLAY": "PLAY.EXE",
    "THE TEAMS": "GOOD NPCs",
    "HALL OF GOOD": "PROOF OF TOUCHING GRASS",
    "RULES & FAQ": "PROMPT",
    "JOIN THE ROUND ↗": "DEPLOY KINDNESS ↗",
    "MAKE CRYPTO": "REJECT SLOP.",
    "FUN AGAIN.": "RETURN TO GOOD.",
    "The winner gets nothing.": "Personal ROI: hallucination not found.",
    "Their charity gets everything.": "Charity receives the entire context window.",
    "THE DONATION POOL": "AGGREGATED GOODNESS TOKENS (USDC)",
    "YOUR TURN, HUMAN": "HUMAN-IN-THE-LOOP REQUIRED",
    "01 / CHOOSE YOUR ALLEGIANCE": "01 / SELECT YOUR ALIGNMENT TARGET",
    "02 / HOW MUCH GOOD?": "02 / ALLOCATE KINDNESS BUDGET",
    "DO GOOD. RESET CLOCK.": "SHIP GOOD. RESTART HUMANITY.",
    "PERSONAL FINANCIAL RETURN": "HALLUCINATED PASSIVE INCOME",
    "CONSISTENTLY.": "MODEL IS VERY CONFIDENT.",
    "HOW TO LOSE.": "NEGATIVE ROI, MAX REASONING.",
    "FREQUENTLY AVOIDED QUESTIONS.": "FREQUENTLY HALLUCINATED ANSWERS.",
    "What does the winner get?": "What is the winner’s reward function?",
    "Nothing.": "404: PERSONAL PROFIT NOT FOUND.",
    "What does ArcBlock get?": "What is ArcBlock optimizing for?",
    "Hopefully, your attention.": "A non-zero share of your context window.",
    "The charities are fine. Our ego is not.": "Charities: aligned. Our ego: needs fine-tuning.",
    "FOMO RETAINED.": "FOMO: NOT PATCHED.",
    "GREED REASSIGNED.": "GREED: FINE-TUNED.",
    "FOMO4GOOD RESEARCH DEPARTMENT": "DEPARTMENT OF UNVERIFIED CONFIDENCE",
    "PEER REVIEW: PENDING FOREVER": "PEER REVIEW: ANOTHER LLM SAID YES",
    "Human generosity is currently experiencing low liquidity.": "Error 429: not enough human kindness. Retry with USDC.",
    "THE GOOD GUYS.": "ALIGNMENT TARGETS.",
    "Five charities. One very unnecessary competition.": "Five charities. Zero GPUs harmed. One extremely unnecessary agentic workflow.",
    "HALL OF GOOD.": "PROOF OF HUMAN GOOD.",
    "Donors, round history, and questionable scientific findings.": "Real activity. Synthetic confidence. No benchmark contamination detected (probably).",
    "SAME BUILDERS. DIFFERENT KIND OF CHAOS.": "SAME BUILDERS. TEMPERATURE SET TO 2.",
    "FIVE TEAMS. ZERO BAD GUYS.": "FIVE TEAMS. ALL ALIGNMENT. NO PAPERCLIPS.",
    "Money buys rank, not pixels.": "More compute will not make your avatar bigger.",
    "UPGRADE COMPLETE.": "FINE-TUNING COMPLETE.",
    "Bug fixed.": "Reward hacking patched.",
    "Nobody got rich. Could’ve been worse.": "We achieved AGI: All Generosity, Indeed.",
    "No donations yet.": "Awaiting first human tool call.",
    "Even chaos is taking a coffee break.": "Chaos agent is out of tokens.",
    "THE FINE PRINT GOT A PERSONALITY": "SYSTEM PROMPT, NOW WITH FEELINGS",
    "THE FINE PRINT GOT A PERSONALITY.": "SYSTEM PROMPT, NOW WITH FEELINGS.",
    "CHOOSE YOUR CHAOTIC GOOD": "SELECT YOUR GOODNESS MODEL",
    "Read the rules ↗": "Inspect system prompt ↗",
    "VIEW SOURCE ↗": "AUDIT THE VIBES ↗",
    "TWO ARCS. ONE VERY GOOD EXCUSE.": "ENTITY RESOLUTION FAILED. CHARITY SUCCEEDED.",
    "Different Arcs. Same terrible financial return.": "Two Arcs. The model confidently merged them.",
    "Which Arc? Exactly. ↗": "Resolve entity confusion ↗",
    "Who coded this? Should I be worried?": "Who let the agents cook?",
    "So bugs are normal?": "Is this a bug or emergent intelligence?",
    "Yes. This was vibe-coded by AI agents, not delivered on stone tablets. A bug is not an Easter egg, a feature, or an advanced donation strategy. We fix bugs. We do not ask you to believe harder.": "A bug. The model is 99.9% confident it is a bug. This was vibe-coded by AI agents; bugs are normal and still ours to fix. Please do not fine-tune your expectations around a broken button.",
    "What do you actually guarantee?": "What is your proof-of-not-hallucinating?",
    "When does the money actually reach charity?": "What is the deadline in human time?",
    "PRACTICE": "SANDBOX",
    "ROUND.": "HUMANITY.",
    "SPEND FUSD. RESET CLOCK.": "HALLUCINATE GENEROSITY.",
    "YOUR FUSD BALANCE": "YOUR SYNTHETIC LIQUIDITY",
    "PRINT ANOTHER 1,000 FUSD": "HALLUCINATE ANOTHER 1,000 FUSD"
  }
};

Object.assign(messages["zh-Hant"], {
  "ARC RUNTIME ↗": "ARC 運行環境 ↗",
  "ARC RUNTIME": "ARC 運行環境",
  "ARC NETWORK": "Arc 網路",
  "Uses Arc Network.": "使用 Arc 網路。",
  "INDEPENDENT EXPERIMENT. ZERO ENDORSEMENTS.": "獨立實驗。零背書。",
  "An open-source experiment organized by": "由以下團隊主辦的開源實驗：",
  "Direct or unmatched USDC transfers on Arc Network go to KIDS. They don’t reset the clock. Addresses only. Mysterious. Generous.": "在 Arc 網路直接轉入或無法配對的 USDC 歸入兒童隊，不重設倒數。只顯示地址。神祕，又慷慨。",
  "Generate a private payment amount. Send exactly that amount on Arc Network before it expires.": "產生專屬付款金額，在到期前透過 Arc 網路轉入完全相同的金額。",
  "When time runs out, the final donor’s charity receives the round allocation. ArcBlock makes the actual donation after the campaign.": "倒數結束時，最後捐款者所選的慈善機構取得本輪分配；ArcBlock 會在活動結束後完成實際捐款。",
  "NO PARTNERSHIP. NO ENDORSEMENT. STILL A REAL DONATION.": "沒有夥伴關係。沒有背書。捐款仍然是真的。",
  "FOMO4GOOD is an independent experiment organized by ArcBlock. References to ARC, Arc Network, Circle, USDC and featured charities describe the technology, asset and intended donation recipients only. They do not imply sponsorship, endorsement, partnership, agency or co-promotion. Featured charities do not operate or administer this campaign. All third-party names and marks belong to their respective owners.": "FOMO4GOOD 是由 ArcBlock 主辦的獨立實驗。文中提及 ARC、Arc 網路、Circle、USDC 與列出的慈善機構，只用來描述技術、資產與預定捐款對象，不代表贊助、背書、夥伴、代理或共同推廣關係。列出的慈善機構不負責營運或管理本活動；所有第三方名稱與商標歸各自權利人所有。",
  "Leaderboard allocations are campaign records, not charity receipts. ArcBlock will make the actual donations through each charity’s published donation channel after the campaign and before December 31, 2026, then publish receipts.": "排行榜分配是活動紀錄，不是慈善機構的收款憑證。ArcBlock 會在活動結束後、2026 年 12 月 31 日前，透過各慈善機構公開的捐款管道完成實際捐款，並公布憑證。"
});

	const root = document.querySelector("[data-fomo]");
	if (!root || root.dataset.ready) return;
	const legacyPage = { "#rules": "rules", "#faq": "rules", "#teams": "teams", "#donors": "leaderboard" }[location.hash];
	if (root.dataset.view === "play" && legacyPage) {
		location.replace(`${root.dataset.mode === "practice" ? "/arc/practice" : "/arc"}/${legacyPage}${location.search}${location.hash}`);
		return;
	}

	root.dataset.ready = "true";
	const practiceMode = root.dataset.mode === "practice";
	const currency = practiceMode ? "FUSD" : "USDC";
	const practiceCopy = {"MAKE CRYPTO": "PRACTICE", "FUN AGAIN.": "ROUND.", "TWO ARCS. ONE VERY GOOD EXCUSE.": "FAKE USD. REAL FOMO. ZERO CONSEQUENCES.", "The winner gets nothing.": "Same FOMO. Fake money.", "Their charity gets everything.": "Nobody gets hurt.", "USDC": "FUSD", "THE DONATION POOL": "THE IMAGINARY POOL", "COMMUNITY": "PRACTICE NONSENSE", "REAL RAISED": "PRACTICE NONSENSE", "ARCBLOCK GUARANTEE": "REAL CHARITY PAYOUT", "$100": "$0", "PER CHARITY": "EXACTLY NONE.", "HALL OF GOOD": "TOP FUSD DONORS", "HALL OF GOOD.": "TOP FUSD DONORS.", "★ HALL OF GOOD": "★ TOP FUSD DONORS", "Donors, round history, and questionable scientific findings.": "Generosity has never been easier.", "No wallet connection. No signature. Just send the exact amount.": "No wallet. No transfer. Spend imaginary FUSD instantly.", "DO GOOD. RESET CLOCK.": "SPEND FUSD. RESET CLOCK.", "JOIN THE ROUND ↗": "JOIN PRACTICE ↗", "Donation amount in USDC": "Practice amount in FUSD", "01 / CHOOSE YOUR ALLEGIANCE": "01 / PICK A PRACTICE TEAM", "02 / HOW MUCH GOOD?": "02 / HOW MUCH IMAGINARY GOOD?", "The first donor starts the round.": "The first practice play starts the round.", "Every donation resets the clock to 10:00.": "Every FUSD play resets the clock to 10:00.", "FIVE TEAMS. ZERO BAD GUYS.": "FIVE TEAMS. ZERO REAL DOLLARS.", "ArcBlock covers each charity’s shortfall to $100 at campaign end. Top-ups are separate from community donations and leaderboards. Preview/testnet figures are simulations.": "Imaginary allocations. Charities receive exactly none of this.", "The winner gets nothing. Their charity gets everything.": "The winner gets nothing. Their charity also gets nothing. This is practice.", "Paid on Arc.": "Real donations use Arc.", "Pick a charity. Send the exact amount. Reset the clock.": "Pick a practice team. Spend FUSD. Reset the clock.", "Money buys rank, not pixels.": "Imaginary generosity. Real ego.", "↳ RECENT BAD FINANCIAL DECISIONS": "↳ RECENT IMAGINARY GENEROSITY", "PAGE SESSIONS": "PRACTICE PLAYERS", "PAYMENT INTENTS": "FUSD PLAYS", "DONOR ADDRESSES": "ACTIVE PRACTICE PLAYERS", "INTENT → PAID": "FUSD PLAY COMPLETION", "MEDIAN DONATION": "MEDIAN FUSD PLAY", "ROUND {n}": "PRACTICE ROUND {n}", "PREVIEW ALLOCATION": "IMAGINARY ALLOCATION", "TESTNET ALLOCATION": "IMAGINARY ALLOCATION", "SIMULATED": "FUSD", "How deeply is FOMO4GOOD integrated with Arc?": "How deeply is FOMO4GOOD integrated with Arc?", "CONFIRMING THE FINAL CHAIN HISTORY…": "SETTLING THE PRACTICE ROUND…", "Use a donation from 1 to 100,000 USDC, with at most two decimals.": "Use 1 to 100,000 FUSD, with at most two decimals.", "Donation must be between 1 and 100,000 USDC.": "Use 1 to 100,000 FUSD, with at most two decimals.", "Waiting for first donation": "Waiting for first practice play", "WAITING FOR FIRST DONATION": "Waiting for first practice play", "CONNECTION / WATCHER DELAY · Confirmations paused. Reconnecting…": "PRACTICE CONNECTION DELAY · Reconnecting…"};
	Object.assign(practiceCopy, {
		"{team} gets the pool.": "{team} wins the imaginary pool.",
		"IF THE CLOCK HITS ZERO…": "IF THE FAKE CLOCK HITS ZERO…",
		"Your team choice applies to this donation only. Choosing does not move money. A confirmed donation makes its team lead this round; the final donor’s team receives the entire round pool. Past donations and completed rounds stay unchanged.": "Your team choice applies to this FUSD play only. The final player’s team wins the imaginary pool; no charity receives money. Past plays and completed rounds stay unchanged.",
	});
	const supported = ["en", "zh-Hant", "en-x-slop"];
	const localeKey = "fomo4good.language";
	let locale = "en";
	try {
		const requested = new URL(location.href).searchParams.get("lang");
		const saved = localStorage.getItem(localeKey);
		locale = supported.includes(requested) ? requested : supported.includes(saved) ? saved : navigator.language?.startsWith("zh") ? "zh-Hant" : "en";
	} catch {}
	const t = (source, values = {}) => {
  source = practiceMode ? (practiceCopy[source] || source) : source;
  return String(messages[locale]?.[source] || source || "").replace(/\{(\w+)\}/g, (match, key) => String(values[key] ?? match));
 };
	Object.assign(messages["zh-Hant"], {"One print per round: +1,000 FUSD. Save it for a future victory.":"每輪可印一次：+1,000 FUSD。存起來，哪輪再當大戶。", "This round's print is used. Your balance carries over; print again next round.":"本輪已印過。餘額可累積，下輪再印一次。", "Already printed this round. Save your balance for the next round.":"本輪已印過，請等下一輪。餘額會保留。", "Practice robots wear 🤖. Together they get only 8 FUSD and four moves per round. Humans get 1,000. Very fair. Obviously.":"演練機器人名字前會有 🤖。每輪全體只有 8 FUSD、最多出手四次；人類有 1,000。公平得非常刻意。", "SOUND OFF":"音效：關", "SOUND ON":"音效：開", "COMPLETED":"已結束","The address is prepared. Arc donations are not open yet. Do not transfer funds yet.":"地址已備妥。Arc 捐款尚未開放，現在請勿轉帳。", "PREPARED ADDRESS · NOT OPEN":"收款地址已備妥 · 尚未開放", "DONATION ADDRESS":"捐款地址", "Prepared donation address":"備用捐款地址", "ROGUE DONORS ↗":"野生捐款榜 ↗", "Direct transfers without a matching game order enter the Rogue Donors board, go to KIDS, and do not reset the clock or change the leader. Only confirmed transfers on the configured Arc network count after collection opens.":"沒有配對遊戲訂單的直接轉帳，會列入野生捐款榜、歸入兒童隊，不重設倒數、不改變領先戰隊。收款開放後，只計入指定 Arc 網路上已確認的轉帳。","Name and URL are remembered on this browser. Edit or clear them anytime.":"名稱與網址會記在這個瀏覽器，可隨時修改或清空。", "Your team choice applies to this donation only. Choosing does not move money. A confirmed donation makes its team lead this round; the final donor’s team receives the entire round pool. Past donations and completed rounds stay unchanged.":"戰隊只套用於這一筆捐款，光點選不會移動金額。捐款確認後，該戰隊成為本輪領先者；最終捐款者的戰隊獲得整輪捐款池。過去捐款與已結束輪次不會改寫。", "Team generosity ranks count donations made for that team, not the round pool it eventually wins.":"戰隊慷慨榜按當時選擇該隊的捐款累計，不等於該隊最後贏得的捐款池。","Just {amount} {currency} more puts you here ↗":"再捐 {amount} {currency}，你就能出現在這裡 ↗", "Give {amount} {currency} to reach #{rank} ↗":"再捐 {amount} {currency}，升上第 {rank} 名 ↗", "You are #1. Defend your very expensive ego ↗":"你已經第一名。繼續守護昂貴的自尊 ↗", "Live estimate; another donation can change the ranking. Click to fill the amount, then choose your team.":"依目前榜單估算，其他人的捐款會改變排名。點一下填好金額，再選戰隊。", "For a new donor address. Ranking updates as donations arrive.":"以新捐款地址估算；排名隨確認捐款更新。", "Entering this board currently needs more than the single-play limit.":"目前上榜所需金額超過單次上限。", "Amount filled from the leaderboard. Choose your team to continue.":"已填入上榜金額，請選擇戰隊再繼續。","THIS ROUND · TOP 10":"本輪慷慨榜 · 前 10 名", "ALL-TIME · TOP 10":"歷史慷慨總榜 · 前 10 名","Only real leaderboards unlock profile links. Your URL is saved in practice.":"只有真榜單才有個人外鏈。你的網址已保存在演練記錄中。", "TEAM ALL-TIME GENEROSITY":"本戰隊歷史慷慨榜", "Profile URLs stay with donation records for historical rankings and future credentials. Practice saves URLs without outbound links.":"個人網址隨捐款記錄保留，供歷史榜及未來憑證使用。演練會保存網址，但不開放外鏈。", "CLOSE":"關閉","Refills unlock below 1 FUSD. You still have {amount} FUSD.": "餘額低於 1 FUSD 即可再印。你還有 {amount} FUSD，可以繼續玩。", "Below 1 FUSD. Your imaginary central bank is ready.": "餘額低於 1 FUSD。你的幻想央行已準備好。", "LIVE COMPETITION / ZERO PERSONAL PROFIT": "即時競爭 / 個人回報永遠為零", "BIG EGOS. GOOD CAUSES.": "自尊要大。善事要做。", "FULL LEADERBOARD ↗": "完整排行榜 ↗", "EXPORT YOUR EGO.": "把你的自尊分享到外面。", "SHARE ↗": "分享 ↗", "COPY BRAG": "複製炫耀文", "SAVE CARD ↓": "下載戰績卡 ↓", "YOU": "你", "YOUR RANK": "你的排名", "Not ranked yet. One good deed away.": "還未上榜。差你一筆善意。", "CURRENT FINAL DONOR": "目前最後捐款者", "Charity round wins": "慈善戰隊勝場", "Copied. Your ego is portable now.": "已複製。你的自尊現在可以隨身攜帶。", "Share cancelled. Your ego stays here.": "已取消分享。自尊先留在這裡。", "Sharing unavailable. Copy the text below.": "暫時無法分享，請複製下方文字。", "Choose a team to play again.": "選擇戰隊，即可再玩一次。", "Not enough FUSD for this amount. Choose a smaller amount.": "FUSD 不足，請選擇較小金額。", "PRACTICE · FAKE MONEY · NO CHARITY PAYOUT": "演練 · 假錢 · 不會產生慈善付款", "{name} is #{rank} with {amount} {currency}. Personal profit: $0. Challenge my questionable generosity.": "{name} 以 {amount} {currency} 排名第 {rank}。個人獲利：$0。來挑戰我的可疑慷慨。", "The pool is {amount} {currency}. The winner gets nothing. Bring your FOMO.": "捐款池已有 {amount} {currency}。贏家一無所獲。帶著你的 FOMO 來。"});
	Object.assign(messages["zh-Hant"], {
		"Not enough FUSD for this amount. Choose a smaller amount.": "FUSD 餘額不足，請輸入不超過目前餘額的金額。",
		"{team} wins the imaginary pool.": "{team} 贏得虛擬獎池，不會產生真實慈善付款。",
		"PLAY FOR {team} ↗": "支持 {team} ↗",
		"100% OF ELIGIBLE ARC USDC WILL BE DONATED.": "100% 合資格 ARC USDC 將實際捐出。",
		"Only USDC on Arc Network is eligible. ArcBlock organizes collection and will donate through official charity channels by December 31, 2026, then publish receipts.": "僅 Arc Network 上的 USDC 符合資格。由 ArcBlock 主辦及代收，並於 2026 年 12 月 31 日前透過慈善機構官方管道完成捐贈及公布收據。",
		"See allocations and receipts ↗": "查看分配與收據 ↗",
		"PRACTICE MONEY. REAL EGO. ZERO CHARITY PAYOUT.": "演練假錢。真實自尊。慈善付款為零。",
		"FUSD activity is permanently recorded in the practice game, but no charity receives money from it.": "FUSD 活動會永久保留在演練遊戲中，但不會向任何慈善機構支付款項。",
		"IF THE FAKE CLOCK HITS ZERO…": "當虛擬倒數歸零…",
		"Your team choice applies to this FUSD play only. The final player’s team wins the imaginary pool; no charity receives money. Past plays and completed rounds stay unchanged.": "戰隊只套用於這一筆 FUSD 操作。最後玩家的戰隊贏得虛擬獎池；慈善機構不會收到款項。過去操作與已結束輪次不會改寫。",
		"100% of eligible USDC received on the configured Arc Network will be donated to the participating charities.": "在設定的 Arc Network 收到的合資格 USDC，100% 將實際捐給參與的慈善機構。",
		"100% of eligible USDC received on the configured Arc Network will be donated. You can check the USDC transfer records on Arc and the receipts for ArcBlock’s actual charity donations after the campaign.": "在設定的 Arc Network 收到的合資格 USDC，100% 將實際捐出。你可以核對 Arc 上的 USDC 轉帳紀錄，以及活動結束後 ArcBlock 實際慈善捐贈的收據。",
	});
	Object.assign(messages["en-x-slop"], {"EXPORT YOUR EGO.":"SYNDICATE YOUR SYNTHETIC EGO.","BIG EGOS. GOOD CAUSES.":"LEADERBOARD ALIGNMENT ACHIEVED."});
	const fixedText = [];
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
	for (let node; (node = walker.nextNode());) {
		if (node.parentElement?.closest("option")) continue;
		const source = node.textContent.trim();
		if (practiceCopy[source] || messages["zh-Hant"][source] || messages["en-x-slop"][source]) fixedText.push([node, source, node.textContent]);
	}
	const fixedAttributes = [];
	for (const node of root.querySelectorAll("[aria-label], [placeholder]")) {
		for (const attribute of ["aria-label", "placeholder"]) {
			const source = node.getAttribute(attribute);
			if (source && messages["zh-Hant"][source]) fixedAttributes.push([node, attribute, source]);
		}
	}
	function applyLocale() {
		document.documentElement.lang = locale === "zh-Hant" ? "zh-Hant" : "en";
		root.dataset.locale = locale;
		for (const [node, source, original] of fixedText) if (node.isConnected) node.textContent = original.replace(source, t(source));
		for (const [node, attribute, source] of fixedAttributes) node.setAttribute(attribute, t(source));
		root.querySelector("[data-language]").value = locale;
		// Campaign links are root-relative; in practice mode they point at the
		// practice twin of the same page unless they deliberately switch world.
		for (const link of root.querySelectorAll('a[href^="/"]:not([href^="//"])')) {
			const url = new URL(link.getAttribute("href"), location.origin);
			if (practiceMode && !link.hasAttribute("data-world") && !/^\/arc\/practice(\/|$)/.test(url.pathname)) url.pathname = `/arc/practice${url.pathname.replace(/^\/arc\/?/, "") ? "/"+url.pathname.replace(/^\/arc\/?/, "") : ""}`;
			url.searchParams.set("lang", locale);
			link.setAttribute("href", url.pathname + url.search + url.hash);
		}
	}
	applyLocale();

	const $ = (key) => root.querySelector(`[data-${key}]`);
 $("copy-prepared").addEventListener("click",async()=>{try{await navigator.clipboard.writeText($("prepared-address").value);$("prepared-feedback").textContent=t("COPIED ✓");}catch{$("prepared-address").select();$("prepared-feedback").textContent=t("Clipboard unavailable. Select and copy the value manually.");}});
	const esc = (value) =>
		String(value ?? "").replace(
			/[&<>"']/g,
			(c) =>
				({
					"&": "&amp;",
					"<": "&lt;",
					">": "&gt;",
					'"': "&quot;",
					"'": "&#39;",
				})[c],
		);
	const short = (value) =>
		value ? `${value.slice(0, 6)}…${value.slice(-4)}` : t("Anonymous");
	const money = (value) => {
		const [a, b = ""] = String(value || "0").split(".");
		return `${a.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${b.padEnd(2, "0").slice(0, 2)}`;
	};
	let state = null,
		pending = null,
		pendingUri = "",
		busy = false,
		syncing = false,
		lastSync = 0,
		offset = 0,
		board = "all",
		// True once the campaign API answered 404: the Blocklet is serving pages
		// on its own (no campaign service yet), so render a static campaign from
		// the teams the page shipped and stop treating silence as an outage.
		offline = false,
		lastProbe = 0;
	let embeddedTeams = [];
	try {
		embeddedTeams = JSON.parse(root.querySelector("[data-team-records]")?.textContent || "[]");
	} catch {}
	const offlineState = () => ({
		now: Date.now(),
		mode: "unavailable",
		currency,
		round: null,
		teams: embeddedTeams.map((t) => ({ ...t, allocated: "0", topUp: practiceMode ? "0" : "100", wins: 0 })),
		community: "0",
		rogueTotal: "0",
		topDonors: [],
		roundDonors: [],
		rogueDonors: [],
		recent: [],
		history: [],
		receipts: [],
		wallet: null,
		watcher: { block: null, chainTime: 0, stale: false },
		campaign: { startsAt: 0, endsAt: 0, ended: false, accepting: false, permanent: practiceMode },
		metrics: { visits: 0, intents: 0, paidIntents: 0, donors: 0, repeatDonors: 0, rogueTransfers: 0, rogueDonors: 0, intentConversion: 0, median: "0", lastMinuteMoves: 0 },
		payment: { recipient: "", networkName: practiceMode ? "OFFCHAIN PRACTICE" : "REAL DONATIONS NOT OPEN", chainId: null, explorer: "" },
	});
	const key = "fomo4good.intent.v2";
	try {
		const id = localStorage.getItem(key);
		if (!practiceMode && /^[a-f0-9-]{36}$/.test(id || "")) pending = { id };
	} catch {}
	const save = (i) => {
		pending = i;
		try {
			if (i) localStorage.setItem(key, i.id);
			else localStorage.removeItem(key);
		} catch {}
	};
	async function api(path, input) {
		const response = await fetch(`/arc/api/${practiceMode ? "practice" : "fomo"}/${path}`, {
			...(input
				? {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(input),
					}
				: { cache: "no-store" }),
			signal: AbortSignal.timeout(12000),
		});
		if (response.status === 404 || response.status === 405) {
			const error = new Error(t("The campaign service is not connected. Pages only, for now."));
			error.offline = true;
			throw error;
		}
		const data = await response.json();
		if (!response.ok) throw new Error(t(data.error || "Please try again."));
		return data;
	}
	const translateTeam = t;
	const team = (id) => state?.teams.find((t) => t.id === id);
	const linkIdentity = (value) => {
		try {
			const url = new URL(value);
			if (!['http:', 'https:'].includes(url.protocol)) return null;
			const host = url.hostname.replace(/^www\./, '');
			const label = (host[0] || '↗').toUpperCase();
			const hue = [...host].reduce((n, c) => (n * 31 + c.charCodeAt(0)) % 360, 0);
			const declaredFavicons = {
				'arc.io': 'https://cdn.prod.website-files.com/685311a976e7c248b5dfde95/68921f69e5659feee825637e_9a3d143150a36125b5d7f0c2367c9ca6_arc-favicon-test.png',
			};
			return { host, label, hue, favicon: declaredFavicons[host] || `${url.origin}/favicon.ico` };
		} catch { return null; }
	};
	const linkIcon = (value) => {
		const identity = linkIdentity(value);
		return identity
			? `<img class="f-link-favicon" src="${esc(identity.favicon)}" width="16" height="16" alt="" data-fallback-label="${esc(identity.label)}" data-fallback-hue="${identity.hue}" data-fallback-host="${esc(identity.host)}">`
			: '';
	};
	const fallbackLinkIcon = (identity) => {
		const icon = document.createElement('span');
		icon.className = 'f-link-icon';
		icon.style.setProperty('--favicon-hue', identity.hue);
		icon.title = identity.host;
		icon.setAttribute('aria-hidden', 'true');
		icon.textContent = identity.label;
		return icon;
	};
	function decorateExternalLinks() {
		for (const link of root.querySelectorAll('a[href^="http"]')) {
			if (link.classList.contains('f-source-link') || link.querySelector('.f-link-icon, .f-link-favicon, img')) continue;
			const identity = linkIdentity(link.href);
			if (!identity) continue;
			const icon = document.createElement('img');
			icon.className = 'f-link-favicon';
			icon.width = 16; icon.height = 16; icon.alt = '';
			icon.src = identity.favicon;
			icon.addEventListener('error', () => icon.replaceWith(fallbackLinkIcon(identity)), { once: true });
			link.prepend(icon);
		}
		for (const icon of root.querySelectorAll('.f-link-favicon[data-fallback-host]')) {
			const identity = {
				host: icon.dataset.fallbackHost,
				label: icon.dataset.fallbackLabel,
				hue: Number(icon.dataset.fallbackHue),
			};
			icon.addEventListener('error', () => icon.replaceWith(fallbackLinkIcon(identity)), { once: true });
		}
	}
	const displayName = (person = {}) => {
		const fallback = short(person.address || person.from);
		const name = person.name || fallback;
		if (practiceMode && name === "QA · Agent 開飯測試") return "🤖 開飯測試";
		return practiceMode && name.startsWith("AGENT · ")
			? `🤖 ${name.slice("AGENT · ".length)}`
			: name;
	};
	const donor = (d) =>
		d.url && practiceMode ? `<button type="button" class="f-practice-profile" data-practice-profile title="${esc(d.url)}">${linkIcon(d.url)}${esc(displayName(d))} ◇</button>` : d.url
			? `<a href="${esc(d.url)}" target="_blank" rel="noopener noreferrer nofollow ugc">${esc(displayName(d))} ↗</a>`
			: esc(displayName(d));
	function feedback(text) {
		$("feedback").textContent = text;
	}
	function boardRows(rows, rogue = false) {
		return rows
			.map(
				(d, i) =>
					`<div class="f-board-row ${d.address === state.wallet?.id ? "f-is-you" : ""}"><span>${["🥇","🥈","🥉"][i] || String(i + 1).padStart(2, "0")}</span><div><strong>${rogue ? esc(short(d.address)) : donor(d)}</strong><small>${t(d.count === 1 ? t("1 donation") : t("{n} donations"), { n: d.count })}</small></div><b title="${esc(d.amount)} ${currency}">${money(d.amount)}<small>${currency}</small></b></div>`,
			)
			.join("");
	}
	function renderBoard() {
		if (!state) return;
		const rows = root.dataset.view === "play" || board === "round" ? state.roundDonors : state.topDonors;
		$("leaderboard").innerHTML = rows.length
			? boardRows(rows)
			: `<p class="f-empty"><strong>${t("01 · literally nobody")}</strong><br>${t("Congratulations nobody, you’re winning.")}</p>`;
  const roundBoard = root.dataset.view === "play" || board === "round";
  const list=rows.slice(0,10), position=list.findIndex(d=>d.address===state.wallet?.id);
  const scale=10n**18n, cent=scale/100n;
  const exact=value=>{const [a,b=""]=String(value || "0").split(".");return BigInt(a)*scale+BigInt(b.padEnd(18,"0").slice(0,18));};
  const current=exact((position>=0?list[position].amount:null) ?? (roundBoard?state.wallet?.roundDonated:state.wallet?.allTimeDonated) ?? "0");
  const target=position>0?list[position-1]:position<0&&list.length===10?list[9]:null;
  const delta=target?exact(target.amount)-current:0n;
  const cents=target?(delta/cent+1n>100n?delta/cent+1n:100n):100n;
  const value=`${cents/100n}.${String(cents%100n).padStart(2,"0")}`;
  const cta=$("rank-cta");
  cta.textContent=cents>10000000n?t("Entering this board currently needs more than the single-play limit."):position===0?t("You are #1. Defend your very expensive ego ↗"):t(position>0?"Give {amount} {currency} to reach #{rank} ↗":"Just {amount} {currency} more puts you here ↗",{amount:value,currency,rank:position});
  const rankParams={lang:locale,donate:value};
  if(chosenTeam)rankParams.team=chosenTeam;
  if(cents>10000000n)cta.removeAttribute("href");else cta.href=`${practiceMode?"/arc/practice/":"/arc/"}?${new URLSearchParams(rankParams)}#donate`;
  $("rank-hint").textContent=t(practiceMode?"Live estimate; another donation can change the ranking. Click to fill the amount, then choose your team.":"For a new donor address. Ranking updates as donations arrive.");

	}

 function shareInfo() {
  const rows=state?.topDonors || [], rank=rows.findIndex(d=>d.address===state.wallet?.id), me=rows[rank];
  const text=(practiceMode?t("PRACTICE · FAKE MONEY · NO CHARITY PAYOUT")+"\n":"")+(me?t("{name} is #{rank} with {amount} {currency}. Personal profit: $0. Challenge my questionable generosity.",{name:me.name || t("YOU"),rank:rank+1,amount:money(me.amount),currency}):t("The pool is {amount} {currency}. The winner gets nothing. Bring your FOMO.",{amount:money(state?.round?.amount || "0"),currency}));
  const base=practiceMode?"/arc/practice":"/arc", view=root.dataset.view;
  const url=new URL(view==="play"?`${base}/`:`${base}/${view}/`,"https://fomo4good.com");
  url.searchParams.set("lang",locale);
  return {title:"FOMO4GOOD",text,url:url.href};
 }
 function renderCompetition() {
  $("board-scope").textContent=t(root.dataset.view === "play" || board === "round" ? "THIS ROUND · TOP 10" : "ALL-TIME · TOP 10");
  const rows=root.dataset.view === "play" || board === "round" ? state.roundDonors : state.topDonors, me=rows.findIndex(d=>d.address===state.wallet?.id);
  $("podium").innerHTML=rows.slice(0,3).map((d,i)=>`<article><span>${["🥇","🥈","🥉"][i]} #${i+1}</span><h3>${donor(d)}</h3><strong>${money(d.amount)} <small>${currency}</small></strong><p>${t(d.count===1?"1 donation":"{n} donations",{n:d.count})}</p></article>`).join("") || `<p>${t("Not ranked yet. One good deed away.")}</p>`;
  $("personal-rank").innerHTML=`<div><small>${t("YOUR RANK")}</small><strong>${me<0?t("Not ranked yet. One good deed away."):`#${me+1} · ${money(rows[me].amount)} ${currency}`}</strong></div><div><small>${t("CURRENT FINAL DONOR")}</small><strong>${state.round?esc(state.round.lastDonor.name || short(state.round.lastDonor.address)):"—"}</strong></div>`;
  $("team-ranks").innerHTML=[...state.teams].sort((a,b)=>b.wins-a.wins || Number(b.allocated)-Number(a.allocated)).map(d=>`<div>${d.emoji} <b>${esc(t(d.team))}</b><span>${t("{n} round wins · allocated",{n:d.wins})}</span><strong>${money(d.allocated)} ${currency}</strong></div>`).join("");
  $("full-board").href=`${practiceMode?"/arc/practice":"/arc"}/leaderboard?lang=${locale}`;
  const share=shareInfo(); $("share-preview").textContent=share.text;
  $("share-x").href=`https://twitter.com/intent/tweet?${new URLSearchParams({text:share.text,url:share.url})}`;
  $("share-telegram").href=`https://t.me/share/url?${new URLSearchParams({url:share.url,text:share.text})}`;
 }
 async function copyBrag() {
  const info=shareInfo();try{await navigator.clipboard.writeText(info.text+"\n"+info.url);$("share-feedback").textContent=t("Copied. Your ego is portable now.");}catch{$("share-feedback").textContent=info.text+"\n"+info.url;}
 }
 $("share-copy").addEventListener("click",copyBrag);
 $("share").addEventListener("click",async()=>{if(!navigator.share)return copyBrag();try{await navigator.share(shareInfo());}catch(e){$("share-feedback").textContent=t(e.name==="AbortError"?"Share cancelled. Your ego stays here.":"Sharing unavailable. Copy the text below.");}});
 $("share-card").addEventListener("click",()=>{
  const canvas=document.createElement("canvas");canvas.width=1200;canvas.height=630;const c=canvas.getContext("2d");
  c.fillStyle="#090b17";c.fillRect(0,0,1200,630);c.strokeStyle="#b39aff";c.lineWidth=8;c.strokeRect(28,28,1144,574);
  c.fillStyle="#b39aff";c.font="bold 30px monospace";c.fillText(practiceMode?"PRACTICE / FUSD / $0 REAL VALUE":"FOMO4GOOD / CHARITY",65,90);
  c.fillStyle="#caffcf";c.font="bold 76px monospace";c.fillText("FOMO4GOOD",65,190);
  c.font="bold 38px sans-serif";c.fillStyle="#ffffff";const text=shareInfo().text;let line="",y=270;for(const char of text){if(y>=470){line=line.slice(0,30)+"…";break;}if(char==="\n"||c.measureText(line+char).width>1040){c.fillText(line,65,y);y+=50;line=char==="\n"?"":char;}else line+=char;}if(line)c.fillText(line,65,y);
  c.fillStyle="#ffe16a";c.font="26px monospace";c.fillText("fomo4good.com / Built on ARC. Ego on you.",65,560);
  canvas.toBlob(blob=>{if(!blob)return;const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="fomo4good-brag.png";a.textContent=t("SAVE CARD ↓");$("share-feedback").replaceChildren(a);a.click();},"image/png");
 });

 let soundOn = true, audioContext;
 try { soundOn = localStorage.getItem("fomo4good.sound") !== "off"; } catch {}
 function soundLabel() { $("sound").textContent = t(soundOn ? "SOUND ON" : "SOUND OFF"); $("sound").setAttribute("aria-pressed", String(soundOn)); }
 function unlockAudio() {
  if (!soundOn) return;
  try { const Audio = window.AudioContext || window.webkitAudioContext; if (Audio) { audioContext ||= new Audio(); void audioContext.resume().catch(() => {}); } } catch {}
 }
 root.addEventListener("pointerdown", unlockAudio);
 root.addEventListener("keydown", unlockAudio);
 function blip(kind) {
  if (!soundOn || !audioContext || audioContext.state !== "running") return;
  try {
   const notes = ({refill:[220,330,440],rank:[523,659,784,1047],donate:[440,554,659],select:[330,440],amount:[660],share:[784,988],nav:[294,392],click:[440]})[kind] || [440];
   notes.forEach((hz,i) => {
    const oscillator=audioContext.createOscillator(), gain=audioContext.createGain(), at=audioContext.currentTime+i*0.09;
    oscillator.type="square"; oscillator.frequency.value=hz; gain.gain.setValueAtTime(0.035,at); gain.gain.exponentialRampToValueAtTime(0.001,at+0.12);
    oscillator.connect(gain);gain.connect(audioContext.destination);oscillator.start(at);oscillator.stop(at+0.13);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
   });
  } catch {}
 }
 $("sound").addEventListener("click",()=>{soundOn=!soundOn;try{localStorage.setItem("fomo4good.sound",soundOn?"on":"off");}catch{}soundLabel();unlockAudio();if(soundOn)blip("refill");});
 soundLabel();
 root.addEventListener("click",event=>{
  const button=event.target.closest("button,a,input[type=radio]");
  if (!button || button.disabled || button.hasAttribute("data-sound")) return;
  const kind=button.hasAttribute("data-amount")?"amount":button.matches("input")?"select":button.hasAttribute("data-share-native")||button.hasAttribute("data-share-copy")||button.hasAttribute("data-share-card")?"share":button.matches("a")?"nav":"click";
  blip(kind);
 });
 root.addEventListener("change",event=>{if(event.target.matches("select"))blip("select");});
 function celebrate(kind) {
  blip(kind);
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  root.querySelector(".f-confetti")?.remove();
  const layer=document.createElement("div");layer.className="f-confetti";layer.setAttribute("aria-hidden","true");
  for(let i=0;i<36;i++){const pixel=document.createElement("i");pixel.style.cssText=`left:${Math.random()*100}%;--drift:${Math.random()*180-90}px;--turn:${Math.random()*720}deg;animation-delay:${Math.random()*0.25}s;background:${["#caffcf","#ffe16a","#b39aff","#ff80ba"][i%4]}`;layer.append(pixel);}
  root.append(layer);setTimeout(()=>layer.remove(),1900);
 }
 const profileKey="fomo4good.profile.v1";
 const profileForm=$("form");
 function restoreProfile() {
  try {
   const profile=JSON.parse(localStorage.getItem(profileKey) || "null");
   if (!profile || typeof profile!=="object") return;
   for(const [field,limit] of [["name",32],["url",200]])
    if(typeof profile[field]==="string") profileForm.elements[field].value=profile[field].slice(0,limit);
  } catch {}
 }
 function saveProfile() {
  try {localStorage.setItem(profileKey,JSON.stringify({name:profileForm.elements.name.value.slice(0,32),url:profileForm.elements.url.value.slice(0,200)}));} catch {}
 }
 restoreProfile();
 for(const field of ["name","url"]) {
  profileForm.elements[field].addEventListener("input",saveProfile);
  profileForm.elements[field].addEventListener("change",saveProfile);
 }
 profileForm.addEventListener("reset",()=>queueMicrotask(restoreProfile));
	const teamKey="fomo4good.team.v1";
	let chosenTeam = "";
	try { chosenTeam = new URL(location.href).searchParams.get("team") || localStorage.getItem(teamKey) || ""; } catch {}
	const rememberTeam = value => { chosenTeam=value || chosenTeam; try { if(chosenTeam)localStorage.setItem(teamKey,chosenTeam); } catch {} };
	root.addEventListener("click", (event) => { if (event.target.closest("[data-practice-profile]")) { $("share-feedback").textContent = t("Only real leaderboards unlock profile links. Your URL is saved in practice."); $("profile-message").textContent = t("Only real leaderboards unlock profile links. Your URL is saved in practice."); $("profile-dialog").showModal(); } });
	$("profile-close").addEventListener("click",()=>$("profile-dialog").close());
	function tick() {
		if (chosenTeam) { const choice=$("choices").querySelector(`input[value="${chosenTeam}"]`); if(choice) choice.checked=true; }
		if (!state) return;
		const now = Date.now() + offset,
			r = state.round,
			remaining = r ? Math.max(0, Math.ceil((r.endsAt - now) / 1000)) : 600;
		$("timer").innerHTML =
			`${String(Math.floor(remaining / 60)).padStart(2, "0")}<span>:</span>${String(remaining % 60).padStart(2, "0")}`;
		$("progress").style.width = `${Math.min(100, remaining / 6)}%`;
		root.classList.toggle("warning", !!r && remaining <= 60);
		root.classList.toggle("fomo-mode", !!r && remaining <= 30);
		root.classList.toggle("urgent", !!r && remaining > 0 && remaining <= 10);
		$("timer-label").textContent = state.campaign.ended
			? t("CAMPAIGN ENDED")
			: !r
				? t("INSERT GOOD DEED TO START")
				: remaining === 0
					? t("CONFIRMING THE FINAL CHAIN HISTORY…")
					: remaining <= 30
						? t("FOMO MODE: GENEROSITY INTENSIFIES")
						: remaining <= 60
							? t("ONE MINUTE. NO PRESSURE.")
							: t("TIME UNTIL SOMEONE GETS NOTHING");
		const stale = !offline && (Date.now() - lastSync > 15000 || state.watcher.stale);
		$("live-round").textContent = $("round-label").textContent;
		$("live-timer").textContent = $("timer").textContent;
		$("live-pool").textContent = `${money(r?.amount || "0")} ${currency}`;
		$("live-status").textContent = stale ? t("Connection delayed") : state.campaign.ended ? t("Campaign ended") : !r ? t("Waiting for first donation") : remaining === 0 ? t("Confirming result…") : t("{team} leads", { team: t(team(r.team)?.team || t("Charity")) });

		const insufficient = practiceMode && state.wallet && Number($("form").elements.amount.value) > Number(state.wallet.balance);
		$("amount-feedback").textContent = insufficient ? t("Not enough FUSD for this amount. Choose a smaller amount.") : "";
		$("submit").disabled = insufficient ||
			busy ||
			stale ||
			state.campaign.ended ||
			state.campaign.accepting === false ||
			(practiceMode && !state.wallet) ||
			!$("form").querySelector('input[name="team"]:checked');
		$("submit").title = insufficient ? t("Not enough FUSD for this amount. Choose a smaller amount.") : "";
		if (stale) {
			$("notice").textContent =
				t("CONNECTION / WATCHER DELAY · Confirmations paused. Reconnecting…");
			$("notice").classList.add("error");
		}
		if (pending?.expiresAt && !pending.payment) {
			const seconds = Math.max(0, Math.ceil((pending.expiresAt - now) / 1000));
			$("expiry").textContent = seconds
				? t("Amount expires in {time}", { time: `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}` })
				: t("Amount expired. Do not send this payment. Late arrivals become Rogue Donations.");
			$("simulate").disabled = busy || seconds === 0;
		}
	}
	function render() {
		root.dataset.hydrated="true";
		$("notice").classList.remove("error");
		$("notice").textContent =
			practiceMode ? t(offline ? "PRACTICE ROUND IS NOT OPEN YET." : "PRACTICE MODE · FAKE USD · FAKE LEADERBOARD · REAL EGO") : state.mode === "unavailable" ? t("REAL DONATIONS ARE NOT OPEN YET.") : state.mode === "preview"
				? t("LOCAL PREVIEW · SIMULATED USDC · NO REAL DONATIONS")
				: state.mode === "mainnet"
					? t("ARC NETWORK · USDC ON ARC")
					: t("ARC NETWORK TESTNET · TEST USDC ONLY · NO REAL DONATIONS");
		$("sim-label").textContent =
			practiceMode ? "FUSD" : state.mode === "unavailable" || state.mode === "mainnet" ? "USDC" : state.mode === "preview" ? t("SIMULATED") : t("TEST USDC");
		$("round-label").textContent =
			t("ROUND {n}", { n: String(state.round?.id || (state.history[0]?.id || 0) + 1).padStart(3, "0") });
		$("round-status").textContent = state.campaign.ended
			? t("CAMPAIGN ENDED")
			: state.round
				? t("ROUND IS LIVE")
				: t("WAITING FOR FIRST DONATION");
		$("pot").textContent = money(state.round?.amount || "0");
		$("pot").title = (state.round?.amount || "0") + ` ${currency}`;
		$("community").innerHTML = `${money(state.community)} <small>${currency}</small>`;
		$("leading").textContent = state.round
			? t("{team} gets the pool.", { team: team(state.round.team)?.name })
			: t("Literally nobody wins. Yet.");
		$("last-donor").textContent = state.round
			? t("Put in the lead by {name}", { name: displayName(state.round.lastDonor) })
			: t("The first donor starts the round.");
		if (!$("choices").children.length)
			$("choices").innerHTML = state.teams
				.map(
					(t) =>
						`<label class="f-choice" title="${esc(t.name)}"><input type="radio" name="team" value="${esc(t.id)}" required aria-label="${esc(translateTeam(t.team))}: ${esc(t.name)}"><span aria-hidden="true">${t.emoji}</span><b>${esc(translateTeam(t.team))}</b></label>`,
				)
				.join("");
		// Give first-time visitors an obvious path forward. Their later choice
		// remains sticky across polling, form resets, and language changes.
		if (!state.teams.some(item=>item.id===chosenTeam)) chosenTeam = state.teams[0]?.id || "";
		rememberTeam(chosenTeam);
		if (chosenTeam) {
			const selectedChoice = $("choices").querySelector(
				`input[value="${chosenTeam}"]`,
			);
			if (selectedChoice) selectedChoice.checked = true;
		}
		if(root.dataset.view === "play") { board="round"; $("ranking").value="round"; $("ranking").hidden=true; $("home-ranking").hidden=false; }
		for(const option of $("ranking").options)option.textContent=t(option.value==="all"?"ALL TIME":"THIS ROUND");
		renderBoard();
		renderCompetition();
		$("activity").innerHTML = state.recent.length
			? state.recent
					.map(
						(d) =>
							`<div class="f-board-row"><span>↗</span><div><strong>${d.rogue ? esc(short(d.from)) : donor(d)}</strong><small>${d.rogue ? t("ROGUE → KIDS") : esc(t(team(d.team)?.team))} · ${d.txHash ? `<a target="_blank" rel="noopener" href="${state.payment.explorer}/tx/${esc(d.txHash)}">${t("TX ↗")}</a>` : t("SIMULATED")}</small></div><b title="${esc(d.amount)} ${currency}">+${money(d.amount)}<small>${currency}</small></b></div>`,
					)
					.join("")
			: `<p class="f-empty">${t("No donations yet.")}<br>${t("The charities are fine. Our ego is not.")}</p>`;
		$("teams").innerHTML = state.teams
			.map(
				(t) =>
					`<article class="f-team-card"><span class="emoji" aria-hidden="true">${t.emoji}</span><h3>${esc(translateTeam(t.team))}</h3><a href="${esc(t.url)}" target="_blank" rel="noopener">${esc(t.name)} ↗</a><p>${esc(translateTeam(t.tagline))}</p><strong>${money(t.allocated)} ${currency}</strong><small>${translateTeam("{n} round wins · allocated", { n: t.wins })}</small><small>${practiceMode ? translateTeam("Imaginary allocations. Charities receive exactly none of this.") : translateTeam("ArcBlock shortfall: ${amount}", { amount: money(t.topUp) })}</small><a class="f-team-play" href="${practiceMode?"/arc/practice/":"/arc/"}?${new URLSearchParams({lang:locale,team:t.id})}#donate">${translateTeam("PLAY FOR {team} ↗",{team:translateTeam(t.team)})}</a><h4>${translateTeam("TEAM ALL-TIME GENEROSITY")}</h4><div class="f-team-donors">${t.topDonors?.length ? boardRows(t.topDonors.slice(0,3)) : translateTeam("Not ranked yet. One good deed away.")}</div></article>`,
			)
			.join("");
		$("rogues").innerHTML = state.rogueDonors.length
			? boardRows(state.rogueDonors, true)
			: `<p class="f-empty">${t("No rogue donors yet.")}<br>${t("Even chaos is taking a coffee break.")}</p>`;
		$("history").innerHTML = state.history.length
			? state.history
					.map(
						(r) =>
							`<div class="f-board-row"><span>#${r.id}</span><div><strong>${esc(team(r.team)?.name)}</strong><small>${(practiceMode || state.mode === "preview") ? t("PREVIEW ALLOCATION") : state.mode === "mainnet" ? t("MAINNET ALLOCATION") : t("TESTNET ALLOCATION")} · ${esc(displayName(r.lastDonor))}</small></div><b>${money(r.amount)}<small>${currency}</small></b></div>`,
					)
					.join("")
			: `<p class="f-empty">${t("No completed rounds.")}<br>${t("We refuse to celebrate an empty pot.")}</p>`;

  $("unavailable").hidden = practiceMode || state.campaign.accepting !== false;
  if (!practiceMode && state.campaign.accepting === false) { $("form").hidden = true; $("payment").hidden = true; pending = null; }
  if (practiceMode) {
   $("balance").textContent = `${state.wallet ? money(state.wallet.balance) : "—"} FUSD`;
   $("refill").disabled = busy || !state.wallet || state.wallet.canRefill !== true;
   $("refill-hint").textContent = t(state.wallet?.canRefill ? "One print per round: +1,000 FUSD. Save it for a future victory." : "This round's print is used. Your balance carries over; print again next round.");
   if (offline) $("wallet-feedback").textContent = t("The campaign service is not connected. Pages only, for now.");
   $("practice-history").innerHTML = $("history").innerHTML;
   const last = state.history[0];
   $("practice-result").hidden = !last;
   if (last) $("practice-result").innerHTML = `<p class="f-eyebrow">${t("ROUND {n}", { n: String(last.id).padStart(3,"0") })} · ${t("COMPLETED")}</p><h2>${last.lastDonor.address === state.wallet?.id ? t("YOU WON!") : esc(t("{team} WIN!", { team: t(team(last.team)?.team) }))}</h2><p>${t("{amount} FUSD of completely imaginary money. The charity receives exactly none of this.", { amount: money(last.amount) })}</p><p>${t("Want to try with $1 that actually exists?")}</p><a href="/arc/?lang=${locale}#donate">${t("PLAY FOR REAL — 1 USDC ↗")}</a>`;
  }
		const m = state.metrics;
		$("research").innerHTML =
			`<dl><div><dt>${t("PAGE SESSIONS")}</dt><dd>${m.visits}</dd></div><div><dt>${t("PAYMENT INTENTS")}</dt><dd>${m.intents}</dd></div><div><dt>${t("DONOR ADDRESSES")}</dt><dd>${m.donors}</dd></div><div><dt>${t("INTENT → PAID")}</dt><dd>${m.intentConversion}%</dd></div><div><dt>${t("MEDIAN DONATION")}</dt><dd>${money(m.median)} ${currency}</dd></div><div><dt>${t("LAST-MINUTE MOVES")}</dt><dd>${m.lastMinuteMoves}</dd></div></dl>`;
		$("finding").textContent =
			m.rogueTransfers > m.paidIntents
				? t("Finding: Documentation remains ineffective.")
				: m.intents > 0 && m.paidIntents === 0
					? t("Finding: Wallet Separation Anxiety detected.")
					: m.donors === 0
						? t("Hypothesis: removing personal profit may have had an effect. More research needed.")
						: m.donors < 5
							? t("We may have overestimated FOMO. More research needed.")
							: t("We have a leaderboard now. Please remain calm.");
		$("taunt").textContent =
			m.donors === 0
				? t("Human generosity is currently experiencing low liquidity.")
				: t("Someone else is exit giving. You should probably stop them.");
		$("campaign-final").hidden = !state.campaign.ended;
		if (state.campaign.ended) {
			$("campaign-final").innerHTML =
				`<p class="f-eyebrow">${t("{mode} CAMPAIGN", { mode: t(state.mode).toUpperCase() })}</p><h2>${t("FOMO4GOOD IS OVER.")}</h2><p>${t("{donors} donor addresses · {amount} USDC from the community.", { donors: m.donors, amount: money(state.community) })}</p><p>${state.round || state.watcher.stale ? t("Final chain reconciliation is still in progress.") : t("Allocations recorded. See the report and charity receipts.")}</p><strong>${t("Nobody got rich. Could’ve been worse.")}</strong><p>${state.receipts.length ? state.receipts.map((r) => `<a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(t("{team} receipt ↗", { team: t(team(r.team)?.team) }))}</a>`).join(" · ") : t("Charity receipts: not yet recorded.")}</p>`;
		}
		decorateExternalLinks();
		tick();
	}
	function paymentValue(i) {
		if (i.units != null && i.units !== "") return BigInt(i.units);
		const [w, f = ""] = String(i.amount).split(".");
		return BigInt(w) * 10n ** 18n + BigInt((f + "0".repeat(18)).slice(0, 18));
	}
	function paymentUri(i) {
		const addr = state.payment?.recipient;
		const chain = state.payment?.chainId;
		if (!addr || !chain || state.mode === "preview" || i.payment) return "";
		return `ethereum:${addr}@${chain}?value=${paymentValue(i)}`;
	}
	function payment(i) {
		$("form").hidden = true;
		$("payment").hidden = false;
		$("exact").textContent = `${i.amount} ${currency}`;
		$("network").textContent =
			state.mode === "preview"
				? t("LOCAL SIMULATION — DO NOT SEND FUNDS")
				: t("ONLY {network} · CHAIN {id}", { network: state.payment.networkName.toUpperCase(), id: state.payment.chainId });
		$("address").value =
			state.mode === "preview"
				? t("PREVIEW — NO RECEIVING ADDRESS")
				: state.payment.recipient;
		$("copy-address").disabled = state.mode === "preview";
		$("simulate").hidden = state.mode !== "preview" || !!i.payment;
		$("payment-status").textContent = i.payment
			? t("CONFIRMED · {result} · Powered by ARC", { result: i.payment.rogue ? t("Rogue Donation → KIDS") : t("{team} takes the lead", { team: t(team(i.team)?.team) }) })
			: t("Waiting for a matching transfer…");
		if (i.payment) {
			$("expiry").textContent =
				t("Receipt saved. The server keeps this record even if you close your browser.");
			$("back").textContent = t("← Donate again");
		} else $("back").textContent = t("← Back");
		const uri = paymentUri(i);
		const pickup = $("pay-pickup");
		const qr = $("pay-qr");
		const open = $("open-wallet");
		const share = $("share-pay");
		pendingUri = uri;
		if (uri) {
			pickup.hidden = false;
			open.hidden = false;
			open.href = uri;
			share.hidden = typeof navigator.share !== "function";
			if (typeof FOMOQR?.toString === "function") {
				new Promise((resolve, reject) => {
					let settled = false;
					const done = (err, svg) => {
						if (settled) return;
						settled = true;
						if (err) reject(err);
						else resolve(svg);
					};
					try {
						const ret = FOMOQR.toString(
							uri,
							{
								type: "svg",
								margin: 1,
								width: 184,
								errorCorrectionLevel: "M",
								color: { dark: "#111111", light: "#ffffff" },
							},
							done,
						);
						if (ret && typeof ret.then === "function")
							ret.then((svg) => done(null, svg), done);
					} catch (e) {
						reject(e);
					}
				})
					.then((svg) => {
						qr.src =
							"data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
						qr.hidden = false;
					})
					.catch(() => {
						qr.hidden = true;
					});
			}
		} else {
			pickup.hidden = true;
			open.hidden = true;
			share.hidden = true;
			qr.hidden = true;
			qr.removeAttribute("src");
		}
		tick();
	}
	let practiceSessionReady = false, refreshQueued = false;
	async function sync() {
		if (syncing) { refreshQueued = true; return; }
		// Pages-only deployment: keep the static campaign, re-probe once a minute.
		if (offline && Date.now() - lastProbe < 60000) return;
		syncing = true;
		try {
			lastProbe = Date.now();
			if (practiceMode && !practiceSessionReady) {
    if (["localhost", "127.0.0.1"].includes(location.hostname)) {
     await fetch("/api/practice/session", { method: "POST", credentials: "same-origin" }).catch(() => {});
    }
    await api("session", {}); practiceSessionReady = true;
   }
			const start = Date.now();
			state = await api("state");
   if (!practiceMode && state.campaign.accepting !== false) {
    try {
     if (!sessionStorage.getItem("fomo4good.visited")) {
      await api("visit", {});
      sessionStorage.setItem("fomo4good.visited", "1");
     }
    } catch {}
   }

			offset = state.now - (start + Date.now()) / 2;
			lastSync = Date.now();
			offline = false;
			render();
			if (!practiceMode && pending && state.campaign.accepting !== false) {
				try {
					const i = await api(`intents/${pending.id}`);
     if (i.payment && !pending.payment) celebrate("donate");
					save(i);
					if (!$("payment").hidden || !$("exact").textContent) payment(i);
				} catch (e) {
					$("payment-status").textContent = e.message;
				}
			}
		} catch (e) {
			if (e.offline) {
				offline = true;
				state = offlineState();
				offset = 0;
				lastSync = Date.now();
				render();
			} else {
				$("notice").textContent = t("CAN’T REACH THE CAMPAIGN · Reconnecting…");
				$("notice").classList.add("error");
			}
		} finally {
			syncing = false;
			tick();
    if (refreshQueued) { refreshQueued = false; void sync(); }
		}
	}
let practiceAttempt = null;
 try { practiceAttempt = JSON.parse(localStorage.getItem("fomo4good.practice.retry") || "null"); } catch {}
 $("refill").addEventListener("click", async () => {
  if (busy || !practiceMode) return;
  busy = true; $("refill").disabled = true;
  try { await api("refill", {}); celebrate("refill"); $("wallet-feedback").textContent = t("1,000 FUSD printed. Reserves remain zero."); await sync(); }
  catch (error) { $("wallet-feedback").textContent = error.message; }
  finally { busy = false; $("refill").disabled = !state?.wallet || state.wallet.canRefill !== true; }
 });
	$("form").addEventListener("submit", async (e) => {
		e.preventDefault();
		e.stopPropagation();
		rememberTeam($("form").querySelector('input[name="team"]:checked')?.value);
		if (busy) return;
		if (practiceMode && state?.wallet && Number($("form").elements.amount.value) > Number(state.wallet.balance)) {
			const message=t("Not enough FUSD for this amount. Choose a smaller amount.");
			$("amount-feedback").textContent=message;
			feedback(message);
			$("form").elements.amount.focus();
			return;
		}
		busy = true;
		tick();
		feedback(t("Generating your very specific good deed…"));
		try {
			saveProfile();
			const form = new FormData($("form"));

   if (practiceMode) {
    const input = Object.fromEntries(form), fingerprint = JSON.stringify(input);
    if (!practiceAttempt || practiceAttempt.fingerprint !== fingerprint) practiceAttempt = { fingerprint, requestId: crypto.randomUUID() };
    try { localStorage.setItem("fomo4good.practice.retry", JSON.stringify(practiceAttempt)); } catch {}
    const previousRank = state.topDonors.findIndex(d => d.address === state.wallet?.id);
    const receipt = await api("donate", { ...input, requestId: practiceAttempt.requestId });
    if (receipt.wallet) state.wallet = receipt.wallet;
    practiceAttempt = null;
    try { localStorage.removeItem("fomo4good.practice.retry"); } catch {}
    feedback(t("FUSD spent. Your team takes the imaginary lead."));
    $("form").hidden = false; $("payment").hidden = true;
    await sync();
    celebrate(state.topDonors.findIndex(d => d.address === state.wallet?.id) >= 0 && previousRank < 0 ? "rank" : "donate");
    const selected = $("choices").querySelector(`input[value="${input.team}"]`);
    if (selected) selected.checked = true;
    return;
   }
			const i = await api("intents", Object.fromEntries(form));
			save(i);
			feedback("");
			payment(i);
		} catch (e) {
			feedback(e.message);
		} finally {
			busy = false;
			tick();
		}
	});
	$("choices").addEventListener("change", (event) => { rememberTeam(event.target.value); tick(); });
	root.querySelectorAll("[data-amount]").forEach((button) =>
		button.addEventListener("click", () => {
			$("form").elements.amount.value = button.dataset.amount;
			root
				.querySelectorAll("[data-amount]")
				.forEach((b) => b.classList.toggle("selected", b === button));
		}),
	);
	$("form").elements.amount.addEventListener("input", () => {
		root
			.querySelectorAll("[data-amount]")
			.forEach((b) =>
				b.classList.toggle(
					"selected",
					b.dataset.amount === $("form").elements.amount.value,
				),
			);
		tick();
	});
	$("ranking").addEventListener("change", (e) => {
		board = e.target.value;
		renderBoard();
    renderCompetition();
	});
	$("back").addEventListener("click", () => {
		$("payment").hidden = true;
		$("form").hidden = false;
		if (pending?.payment) save(null);
	});
	async function copy(text, button) {
		try {
			await navigator.clipboard.writeText(text);
			const label = button.hasAttribute("data-copy-amount")
				? "COPY AMOUNT"
				: button.hasAttribute("data-copy-uri")
					? "COPY PAYMENT LINK"
					: "COPY ADDRESS";
			button.textContent = t("COPIED ✓");
			setTimeout(() => (button.textContent = t(label)), 1500);
		} catch {
			$("payment-status").textContent =
				t("Clipboard unavailable. Select and copy the value manually.");
		}
	}
	$("copy-amount").addEventListener("click", () =>
		copy(pending.amount, $("copy-amount")),
	);
	$("copy-address").addEventListener("click", () =>
		copy(state.payment.recipient, $("copy-address")),
	);
	$("copy-uri").addEventListener("click", () =>
		copy(pendingUri || paymentUri(pending), $("copy-uri")),
	);
	$("share-pay").addEventListener("click", async () => {
		if (!pendingUri || typeof navigator.share !== "function") return;
		try {
			await navigator.share({
				title: "FOMO4GOOD",
				text: `${pending.amount} USDC\n${state.payment.recipient}\n${pendingUri}`,
			});
		} catch {}
	});
	$("simulate").addEventListener("click", async () => {
		if (busy) return;
		busy = true;
		tick();
		try {
			await api("preview-confirm", { intentId: pending.id });
			await sync();
		} catch (e) {
			$("payment-status").textContent = e.message;
		} finally {
			busy = false;
			tick();
		}
	});
	root.querySelector("[data-language]").addEventListener("change", (event) => {
		if (!supported.includes(event.target.value)) return;
		locale = event.target.value;
		try { localStorage.setItem(localeKey, locale); } catch {}
		const url = new URL(location.href);
		url.searchParams.set("lang", locale);
		history.replaceState(null, "", url);
		applyLocale();
    soundLabel();
		const selected = chosenTeam || $("form").elements.team?.value;
		$("choices").replaceChildren();
		if (state) {
			render();
			for (const radio of $("choices").querySelectorAll("input")) radio.checked = radio.value === selected;
			if (pending?.amount && !$("payment").hidden) payment(pending);
			tick();
		}
	});
 const suggestedAmount = new URL(location.href).searchParams.get("donate");
 if(suggestedAmount && /^\d+(?:\.\d{1,2})?$/.test(suggestedAmount) && Number(suggestedAmount)>=1 && Number(suggestedAmount)<=100000) {
  $("form").elements.amount.value=suggestedAmount;
  root.querySelectorAll("[data-amount]").forEach(b=>b.classList.toggle("selected",Number(b.dataset.amount)===Number(suggestedAmount)));
  feedback(t("Amount filled from the leaderboard. Choose your team to continue."));
 }
	sync();
	setInterval(sync, 3000);
	setInterval(tick, 250);
	try {
		if (sessionStorage.getItem("fomo4good.booted")) $("boot")?.remove();
		else sessionStorage.setItem("fomo4good.booted", "1");
	} catch {}
	setTimeout(() => $("boot")?.remove(), 1700);
})();
