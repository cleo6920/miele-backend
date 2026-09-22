(function(){
'use strict';

const KEY='fda-site-language';
const SUPPORTED=['it','en','de','fr','es'];
const NAMES={
  it:'🇮🇹 Italiano',
  en:'🇬🇧 English',
  de:'🇩🇪 Deutsch',
  fr:'🇫🇷 Français',
  es:'🇪🇸 Español'
};
let lang='it';
let translating=false;
let observer=null;
const originals=new WeakMap();
const attrOriginals=new WeakMap();
const pending=new Map();

const CORE={
  en:{
    "Home":"Home",
    "Alveoterapia":"Alveotherapy",
    "Alveoterapia Integrata":"Integrated Alveotherapy",
    "ALVEOTERAPIA INTEGRATA":"INTEGRATED ALVEOTHERAPY",
    "Chi siamo":"About us",
    "Bacheca":"News",
    "Contatti":"Contact",
    "Prodotti & Shop":"Products & Shop",
    "Parliamone":"Let's talk",
    "Linea Veleni":"Bee Venom Line",
    "LINEA VELENI":"BEE VENOM LINE",
    "Il Centro":"The Centre",
    "Galena delle Api":"Galena delle Api",
    "Oasi del Busatello":"Busatello Oasis",
    "Primavera · Estate":"Spring · Summer",
    "Autunno · Inverno":"Autumn · Winter",
    "Carrello":"Cart",
    "Il tuo carrello":"Your cart",
    "Selezione":"Selection",
    "Tutte le linee":"All collections",
    "Linea Alimenti":"Food Collection",
    "Linea Integratori":"Supplements Collection",
    "Linea Cosmesi e Tesori in Cera d’Api":"Cosmetics & Beeswax Treasures",
    "Linea Cosmetica al Veleno d’Api":"Bee Venom Cosmetic Line",
    "Pagamento":"Payment",
    "Spedizione":"Shipping",
    "Totale da pagare":"Total to pay"
  },
  de:{
    "Home":"Startseite",
    "Alveoterapia":"Alveotherapie",
    "Alveoterapia Integrata":"Integrierte Alveotherapie",
    "ALVEOTERAPIA INTEGRATA":"INTEGRIERTE ALVEOTHERAPIE",
    "Chi siamo":"Über uns",
    "Bacheca":"Aktuelles",
    "Contatti":"Kontakt",
    "Prodotti & Shop":"Produkte & Shop",
    "Parliamone":"Sprechen wir darüber",
    "Linea Veleni":"Bienengift-Linie",
    "LINEA VELENI":"BIENENGIFT-LINIE",
    "Il Centro":"Das Zentrum",
    "Galena delle Api":"Galena delle Api",
    "Oasi del Busatello":"Oase Busatello",
    "Primavera · Estate":"Frühling · Sommer",
    "Autunno · Inverno":"Herbst · Winter",
    "Carrello":"Warenkorb",
    "Il tuo carrello":"Dein Warenkorb",
    "Selezione":"Auswahl",
    "Tutte le linee":"Alle Linien",
    "Linea Alimenti":"Lebensmittel-Linie",
    "Linea Integratori":"Nahrungsergänzungsmittel",
    "Linea Cosmesi e Tesori in Cera d’Api":"Kosmetik & Schätze aus Bienenwachs",
    "Linea Cosmetica al Veleno d’Api":"Kosmetiklinie mit Bienengift",
    "Pagamento":"Zahlung",
    "Spedizione":"Versand",
    "Totale da pagare":"Gesamtbetrag"
  },
  fr:{
    "Home":"Accueil",
    "Alveoterapia":"Alvéothérapie",
    "Alveoterapia Integrata":"Alvéothérapie Intégrée",
    "ALVEOTERAPIA INTEGRATA":"ALVÉOTHÉRAPIE INTÉGRÉE",
    "Chi siamo":"Qui sommes-nous",
    "Bacheca":"Actualités",
    "Contatti":"Contact",
    "Prodotti & Shop":"Produits & Boutique",
    "Parliamone":"Parlons-en",
    "Linea Veleni":"Ligne Venin d'Abeille",
    "LINEA VELENI":"LIGNE VENIN D'ABEILLE",
    "Il Centro":"Le Centre",
    "Galena delle Api":"Galena delle Api",
    "Oasi del Busatello":"Oasis du Busatello",
    "Primavera · Estate":"Printemps · Été",
    "Autunno · Inverno":"Automne · Hiver",
    "Carrello":"Panier",
    "Il tuo carrello":"Votre panier",
    "Selezione":"Sélection",
    "Tutte le linee":"Toutes les gammes",
    "Linea Alimenti":"Gamme Alimentaire",
    "Linea Integratori":"Gamme Compléments",
    "Linea Cosmesi e Tesori in Cera d’Api":"Cosmétiques & Trésors en Cire d'Abeille",
    "Linea Cosmetica al Veleno d’Api":"Gamme Cosmétique au Venin d'Abeille",
    "Pagamento":"Paiement",
    "Spedizione":"Livraison",
    "Totale da pagare":"Total à payer"
  },
  es:{
    "Home":"Inicio",
    "Alveoterapia":"Alveoterapia",
    "Alveoterapia Integrata":"Alveoterapia Integrada",
    "ALVEOTERAPIA INTEGRATA":"ALVEOTERAPIA INTEGRADA",
    "Chi siamo":"Quiénes somos",
    "Bacheca":"Novedades",
    "Contatti":"Contacto",
    "Prodotti & Shop":"Productos & Tienda",
    "Parliamone":"Hablemos",
    "Linea Veleni":"Línea Veneno de Abeja",
    "LINEA VELENI":"LÍNEA VENENO DE ABEJA",
    "Il Centro":"El Centro",
    "Galena delle Api":"Galena delle Api",
    "Oasi del Busatello":"Oasis del Busatello",
    "Primavera · Estate":"Primavera · Verano",
    "Autunno · Inverno":"Otoño · Invierno",
    "Carrello":"Carrito",
    "Il tuo carrello":"Tu carrito",
    "Selezione":"Selección",
    "Tutte le linee":"Todas las líneas",
    "Linea Alimenti":"Línea Alimentación",
    "Linea Integratori":"Línea Complementos",
    "Linea Cosmesi e Tesori in Cera d’Api":"Cosmética & Tesoros de Cera de Abeja",
    "Linea Cosmetica al Veleno d’Api":"Línea Cosmética con Veneno de Abeja",
    "Pagamento":"Pago",
    "Spedizione":"Envío",
    "Totale da pagare":"Total a pagar"
  }
};

const ATTRS=['title','aria-label','placeholder','alt'];

function cacheKeyFor(l){return 'fda-translation-cache-v2-'+l;}
function loadCache(l){
  try{return JSON.parse(localStorage.getItem(cacheKeyFor(l))||'{}')||{};}catch(_){return {};}
}
let cache={};
function saveCache(){
  if(lang==='it')return;
  try{localStorage.setItem(cacheKeyFor(lang),JSON.stringify(cache));}catch(_){}
}

function style(){
  if(document.getElementById('fda-language-style'))return;
  const s=document.createElement('style');
  s.id='fda-language-style';
  s.textContent='#fda-language-test{display:flex;align-items:center;gap:9px;color:#fff;font:800 12px/1.1 Arial,sans-serif;border:1px solid rgba(255,255,255,.32);border-radius:999px;padding:5px 6px 5px 10px;background:rgba(0,0,0,.18);white-space:nowrap}#fda-language-test span{font-weight:800}#fda-language-select{border:0;border-radius:999px;background:#f2b83f;color:#171717;padding:8px 10px;font-weight:900;outline:none;cursor:pointer}#fda-language-test.fallback{position:fixed;right:12px;top:12px;z-index:99999;box-shadow:0 5px 20px rgba(0,0,0,.3)}@media(max-width:900px){#fda-language-test{font-size:11px;padding-left:8px}#fda-language-test span{display:none}#fda-language-select{max-width:150px}}';
  document.head.appendChild(s);
}

function selector(){
  style();
  let box=document.getElementById('fda-language-test');
  if(!box){
    box=document.createElement('div');
    box.id='fda-language-test';
    const opts=SUPPORTED.map(v=>'<option value="'+v+'">'+NAMES[v]+'</option>').join('');
    box.innerHTML='<span>🌐 Lingua / Language</span><select id="fda-language-select" aria-label="Lingua / Language">'+opts+'</select>';
    const target=document.getElementById('center-home-bar')||document.querySelector('header nav')||document.querySelector('header .nav')||document.querySelector('header');
    if(target)target.appendChild(box);else{box.classList.add('fallback');document.body.appendChild(box);}
    box.querySelector('select').addEventListener('change',e=>setLang(e.target.value));
  }
  const sel=document.getElementById('fda-language-select');
  if(sel)sel.value=lang;
}

function cleanText(v){return String(v||'').replace(/\s+/g,' ').trim();}
function shouldTranslate(x){
  if(!x||x.length<2)return false;
  if(/^[-+€$£%\d\s.,:/()]+$/.test(x))return false;
  if(/^(APIS\d+|BIO|INCI|PDF|QR|URL)$/i.test(x))return false;
  if(/^https?:\/\//i.test(x))return false;
  return /[A-Za-zÀ-ÿ]/.test(x);
}

async function remoteTranslateBatch(texts){
  if(lang==='it')return texts;
  const unique=[...new Set((texts||[]).map(cleanText).filter(shouldTranslate))];
  const unresolved=unique.filter(text=>!(CORE[lang]||{})[text]&&!cache[text]);
  if(!unresolved.length)return unique.map(text=>(CORE[lang]||{})[text]||cache[text]||text);

  for(let start=0;start<unresolved.length;start+=50){
    const chunk=unresolved.slice(start,start+50);
    try{
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),12000);
      let res;
      try{
        res=await fetch('/api/site-translate',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({target:lang,texts:chunk}),
          signal:controller.signal
        });
      }finally{clearTimeout(timer);}
      const data=await res.json().catch(()=>null);
      if(res.ok&&data?.ok&&Array.isArray(data.translations)){
        chunk.forEach((text,i)=>{
          const out=String(data.translations[i]||text);
          if(out&&out!==text)cache[text]=out;
        });
        saveCache();
      }
    }catch(_){}
  }
  return unique.map(text=>(CORE[lang]||{})[text]||cache[text]||text);
}

async function remoteTranslate(text){
  if(lang==='it')return text;
  const fixed=(CORE[lang]||{})[text];
  if(fixed)return fixed;
  if(cache[text])return cache[text];
  const k=lang+'\n'+text;
  if(pending.has(k))return pending.get(k);
  const job=(async()=>{
    await remoteTranslateBatch([text]);
    return cache[text]||text;
  })();
  pending.set(k,job);
  try{return await job;}finally{pending.delete(k);}
}

async function translateTextNode(node){
  if(lang==='it'||!node||node.nodeType!==3)return;
  const p=node.parentElement;
  if(!p||/^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|OPTION)$/i.test(p.tagName))return;
  if(p.closest && p.closest('#apeChatPanel,#checkoutOverlay,#cartDrawer'))return;
  const raw=node.nodeValue||'', x=cleanText(raw);
  if(!shouldTranslate(x))return;
  if(!originals.has(node))originals.set(node,raw);
  const out=await remoteTranslate(x);
  if(lang==='it'||!out||out===x)return;
  const leading=(raw.match(/^\s*/)||[''])[0];
  const trailing=(raw.match(/\s*$/)||[''])[0];
  node.nodeValue=leading+out+trailing;
}

async function translateElementAttrs(el){
  if(lang==='it'||!el||el.nodeType!==1)return;
  if(el.closest && el.closest('#apeChatPanel,#checkoutOverlay,#cartDrawer'))return;
  let map=attrOriginals.get(el);
  if(!map){map={};attrOriginals.set(el,map);}
  for(const a of ATTRS){
    if(!el.hasAttribute(a))continue;
    const raw=el.getAttribute(a)||'', x=cleanText(raw);
    if(!shouldTranslate(x))continue;
    if(!(a in map))map[a]=raw;
    const out=await remoteTranslate(x);
    if(lang!=='it'&&out&&out!==x)el.setAttribute(a,out);
  }
}

function collect(root){
  const texts=[],els=[];
  if(!root)return {texts,els};
  if(root.nodeType===3)texts.push(root);
  if(root.nodeType===1)els.push(root);
  const w=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);
  let n;
  while((n=w.nextNode())){if(n.nodeType===3)texts.push(n);else els.push(n);}
  return {texts,els};
}

function applyCoreImmediately(root){
  if(lang==='it')return;
  const dict=CORE[lang]||{};
  const {texts,els}=collect(root||document.body);
  for(const node of texts){
    const p=node.parentElement;
    if(!p||/^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|OPTION)$/i.test(p.tagName))continue;
    if(p.closest && p.closest('#apeChatPanel,#checkoutOverlay,#cartDrawer'))continue;
    const raw=node.nodeValue||'', x=cleanText(raw);
    if(!x||!dict[x])continue;
    if(!originals.has(node))originals.set(node,raw);
    const leading=(raw.match(/^\s*/)||[''])[0];
    const trailing=(raw.match(/\s*$/)||[''])[0];
    node.nodeValue=leading+dict[x]+trailing;
  }
  for(const el of els){
    if(el.closest && el.closest('#apeChatPanel,#checkoutOverlay,#cartDrawer'))continue;
    let map=attrOriginals.get(el);
    if(!map){map={};attrOriginals.set(el,map);}
    for(const a of ATTRS){
      if(!el.hasAttribute(a))continue;
      const raw=el.getAttribute(a)||'', x=cleanText(raw);
      if(!x||!dict[x])continue;
      if(!(a in map))map[a]=raw;
      el.setAttribute(a,dict[x]);
    }
  }
}

async function translateRoot(root){
  if(lang==='it'||translating)return;
  translating=true;
  try{
    const target=root||document.body;
    applyCoreImmediately(target);
    document.documentElement.dataset.siteLanguage=lang;

    const {texts,els}=collect(target);
    const textQueue=texts.filter(n=>{
      const p=n.parentElement;
      if(!p||/^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|OPTION)$/i.test(p.tagName))return false;
      if(p.closest && p.closest('#apeChatPanel,#checkoutOverlay,#cartDrawer'))return false;
      return shouldTranslate(cleanText(n.nodeValue||''));
    });

    // Give visible text priority so the page changes language immediately.
    textQueue.sort((a,b)=>{
      const ar=a.parentElement?.getBoundingClientRect?.();
      const br=b.parentElement?.getBoundingClientRect?.();
      const av=ar && ar.bottom>=0 && ar.top<=innerHeight*1.5 ? 0 : 1;
      const bv=br && br.bottom>=0 && br.top<=innerHeight*1.5 ? 0 : 1;
      return av-bv;
    });

    const attrQueue=els.filter(el=>{
      if(el.closest && el.closest('#apeChatPanel,#checkoutOverlay,#cartDrawer'))return false;
      return ATTRS.some(a=>el.hasAttribute(a)&&shouldTranslate(cleanText(el.getAttribute(a)||'')));
    });

    const batchTexts=[];
    for(const n of textQueue)batchTexts.push(cleanText(n.nodeValue||''));
    for(const el of attrQueue){
      for(const a of ATTRS){
        if(el.hasAttribute(a)){
          const x=cleanText(el.getAttribute(a)||'');
          if(shouldTranslate(x))batchTexts.push(x);
        }
      }
    }
    if(document.title)batchTexts.push(cleanText(document.title));
    await remoteTranslateBatch(batchTexts);

    const textWorkers=Array.from({length:10},async()=>{
      while(textQueue.length&&lang!=='it'){
        const n=textQueue.shift();
        await translateTextNode(n);
      }
    });
    const attrWorkers=Array.from({length:4},async()=>{
      while(attrQueue.length&&lang!=='it'){
        const el=attrQueue.shift();
        await translateElementAttrs(el);
      }
    });

    await Promise.all([...textWorkers,...attrWorkers]);

    if(document.title){
      const title=cleanText(document.title);
      const out=await remoteTranslate(title);
      if(lang!=='it'&&out)document.title=out;
    }
  }finally{
    translating=false;
  }
}

function setLang(v){
  const next=SUPPORTED.includes(v)?v:'it';
  try{localStorage.setItem(KEY,next);}catch(_){}
  const sel=document.getElementById('fda-language-select');
  if(sel)sel.value=next;
  document.documentElement.dataset.siteLanguage=next;
  if(next===lang){
    if(next!=='it')translateRoot(document.body);
    return;
  }
  lang=next;
  location.reload();
}

async function translateNow(root){
  if(lang==='it'||!root)return;
  applyCoreImmediately(root);
  const {texts,els}=collect(root);
  const textNodes=texts.filter(n=>{
    const p=n.parentElement;
    if(!p||/^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|OPTION)$/i.test(p.tagName))return false;
    return shouldTranslate(cleanText(n.nodeValue||''));
  });
  const attrEls=els.filter(el=>ATTRS.some(a=>el.hasAttribute(a)&&shouldTranslate(cleanText(el.getAttribute(a)||''))));
  const batch=[];
  textNodes.forEach(n=>batch.push(cleanText(n.nodeValue||'')));
  attrEls.forEach(el=>ATTRS.forEach(a=>{
    if(el.hasAttribute(a)){
      const x=cleanText(el.getAttribute(a)||'');
      if(shouldTranslate(x))batch.push(x);
    }
  }));
  await remoteTranslateBatch(batch);

  for(const node of textNodes){
    const raw=node.nodeValue||'', x=cleanText(raw);
    const out=(CORE[lang]||{})[x]||cache[x]||x;
    if(out&&out!==x){
      const leading=(raw.match(/^\s*/)||[''])[0];
      const trailing=(raw.match(/\s*$/)||[''])[0];
      node.nodeValue=leading+out+trailing;
    }
  }
  for(const el of attrEls){
    for(const a of ATTRS){
      if(!el.hasAttribute(a))continue;
      const raw=el.getAttribute(a)||'', x=cleanText(raw);
      const out=(CORE[lang]||{})[x]||cache[x]||x;
      if(out&&out!==x)el.setAttribute(a,out);
    }
  }
}
window.fdaTranslateNow=translateNow;
window.fdaCurrentSiteLanguage=()=>lang;

function startObserver(){
  if(observer)observer.disconnect();
  observer=new MutationObserver(ms=>{
    if(lang==='it'||translating)return;
    const roots=[];
    ms.forEach(m=>m.addedNodes&&m.addedNodes.forEach(n=>{
      if(n.nodeType===1||n.nodeType===3)roots.push(n.nodeType===3?n.parentNode:n);
    }));
    roots.forEach(r=>translateRoot(r));
  });
  observer.observe(document.body,{childList:true,subtree:true});
}

async function start(){
  if(!document.querySelector('meta[name="google"][content="notranslate"]')){
    const meta=document.createElement('meta');meta.name='google';meta.content='notranslate';document.head.appendChild(meta);
  }
  document.documentElement.setAttribute('translate','no');
  document.documentElement.classList.add('notranslate');
  if(document.body){document.body.setAttribute('translate','no');document.body.classList.add('notranslate');}
  document.documentElement.classList.remove('translated-ltr','translated-rtl');
  if(document.body)document.body.classList.remove('translated-ltr','translated-rtl');
  let saved='';
  try{saved=localStorage.getItem(KEY)||'';}catch(_){}
  lang=SUPPORTED.includes(saved)?saved:'it';
  cache=loadCache(lang);
  selector();
  const sel=document.getElementById('fda-language-select');
  if(sel)sel.value=lang;
  if(lang!=='it'){
    applyCoreImmediately(document.body);
    document.documentElement.dataset.siteLanguage=lang;
    await translateRoot(document.body);
  }else document.documentElement.dataset.siteLanguage='it';
  startObserver();
}

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();