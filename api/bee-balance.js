const crypto=require('crypto');
const {lookupWallet,normalizeEmail,normalizePhone,normalizeCode}=require('../bee-wallet-public');
const {callBeeDataApi}=require('../bee-wallet-client');
const {Pool}=require('pg');
const TEST_DB_URL=String(process.env.BEE_DATABASE_URL||process.env.DATABASE_URL||'').trim();
let testPool;
function getTestPool(){if(!TEST_DB_URL)throw new Error('Database Saldo Api non configurato.');if(!testPool)testPool=new Pool({connectionString:TEST_DB_URL,max:1,idleTimeoutMillis:30000,connectionTimeoutMillis:10000});return testPool;}
const ADMIN_COOKIE='fda_admin_session';
function adminSecret(){return String(process.env.ADMIN_ACCESS_KEY||'').trim();}
function safeEqual(a,b){
  const aa=Buffer.from(String(a||'')),bb=Buffer.from(String(b||''));
  return aa.length===bb.length&&crypto.timingSafeEqual(aa,bb);
}
function parseCookies(req){
  const out={};
  String(req.headers?.cookie||'').split(';').forEach(part=>{const i=part.indexOf('=');if(i>0)out[part.slice(0,i).trim()]=decodeURIComponent(part.slice(i+1).trim());});
  return out;
}
function adminToken(secret,ts){
  return ts+'.'+crypto.createHmac('sha256',secret).update('admin:'+ts).digest('hex');
}
function isAdmin(req){
  const secret=adminSecret(); if(!secret)return false;
  const token=parseCookies(req)[ADMIN_COOKIE]||'';
  const [ts,sig]=String(token).split('.');
  if(!/^\d+$/.test(ts)||!sig)return false;
  const age=Date.now()-Number(ts);
  if(age<0||age>12*60*60*1000)return false;
  const expected=adminToken(secret,ts).split('.')[1];
  return safeEqual(sig,expected);
}
function setAdminCookie(res,secret){
  const ts=String(Date.now());
  const token=adminToken(secret,ts);
  res.setHeader('Set-Cookie',ADMIN_COOKIE+'='+encodeURIComponent(token)+'; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=43200');
}
function clearAdminCookie(res){
  res.setHeader('Set-Cookie',ADMIN_COOKIE+'=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0');
}
async function handleAdminAction(req,res,action){
  const secret=adminSecret();
  if(action==='status') return res.json({ok:true,configured:Boolean(secret),authenticated:Boolean(secret&&isAdmin(req))});
  if(action==='login'){
    if(!secret)return res.status(503).json({ok:false,error:'Area riservata non ancora configurata.'});
    const supplied=String(req.body?.password||'');
    if(!safeEqual(supplied,secret))return res.status(401).json({ok:false,error:'Credenziali non valide.'});
    setAdminCookie(res,secret);
    return res.json({ok:true,authenticated:true});
  }
  if(action==='logout'){
    clearAdminCookie(res);
    return res.json({ok:true});
  }
  if(!isAdmin(req))return res.status(401).json({ok:false,error:'Accesso riservato.'});
  return res.status(400).json({ok:false,error:'Operazione amministrativa non riconosciuta.'});
}
const TEST_ONCE='TESTAPI-ONCE-12830';
const TEST_ALWAYS='TESTAPI-ALWAYS-12830';
const TEST_GIFTS=new Map([
  ['favo-integrale-bio','Favo Integrale Bio'],
  ['polline-italiano','Polline Italiano'],
  ['orsetti-gommosi','Orsetti Gommosi BIO'],
  ['pappa-reale-italiana-bio','Pappa Reale Italiana fresca Bio'],
  ['bee-energy-bio','Bee Energy – Tonico BIO'],
  ['propol-active-bio','Propol Active – Compresse BIO'],
  ['propoli-30-spray-integratore','Propoli 30% Spray'],
  ['propoli-30-alcolica-integratore','Propoli 30% alcolica contagocce'],
  ['propoli-analcolica-integratore','Propoli analcolica'],
  ['cosmesi-crema-mani','Crema Mani Aloe, Cera d’Api e Propoli'],
  ['cosmesi-burrocacao-propoli-aloe','Burro Cacao Propoli + Aloe'],
  ['cosmesi-burrocacao-miele-pappa-reale','Burro Cacao Miele + Pappa Reale'],
  ['cosmesi-shampoo-multivitaminico','Shampoo Propoli e Aloe'],
  ['cosmesi-saponetta-frutti-bosco','Saponetta Frutti di Bosco'],
  ['cosmesi-saponetta-lavanda','Saponetta Lavanda'],
  ['cosmesi-saponetta-aloe-vera','Saponetta Aloe Vera'],
  ['cosmesi-candela-alveare-cera-api','Candela Alveare in cera d’api'],
  ['tesori-limoncello','Limoncello'],
  ['tesori-liquore-caffe','Liquore al Caffè'],
  ['tesori-castagne-rum','Castagne al Rum']
]);
const CESTO_LANGS=new Set(['it','en','de','fr','es']);
const CESTO_GIFT_NAMES={
  en:{
    'favo-integrale-bio':'Organic Whole Honeycomb','polline-italiano':'Italian Bee Pollen','orsetti-gommosi':'Organic Gummy Bears',
    'pappa-reale-italiana-bio':'Fresh Organic Italian Royal Jelly','bee-energy-bio':'Bee Energy – Organic Tonic',
    'propol-active-bio':'Propol Active – Organic Tablets','propoli-30-spray-integratore':'Propolis 30% Spray',
    'propoli-30-alcolica-integratore':'Propolis 30% Alcohol Drops','propoli-analcolica-integratore':'Alcohol-Free Propolis',
    'cosmesi-crema-mani':'Hand Cream with Aloe, Beeswax and Propolis','cosmesi-burrocacao-propoli-aloe':'Lip Balm with Propolis + Aloe',
    'cosmesi-burrocacao-miele-pappa-reale':'Lip Balm with Honey + Royal Jelly','cosmesi-shampoo-multivitaminico':'Propolis and Aloe Shampoo',
    'cosmesi-saponetta-frutti-bosco':'Wild Berries Soap','cosmesi-saponetta-lavanda':'Lavender Soap','cosmesi-saponetta-aloe-vera':'Aloe Vera Soap',
    'cosmesi-candela-alveare-cera-api':'Beehive Candle in Beeswax','tesori-limoncello':'Limoncello','tesori-liquore-caffe':'Coffee Liqueur','tesori-castagne-rum':'Chestnuts in Rum'
  },
  de:{
    'favo-integrale-bio':'Bio-Honigwabe','polline-italiano':'Italienischer Blütenpollen','orsetti-gommosi':'Bio-Gummibärchen',
    'pappa-reale-italiana-bio':'Frisches italienisches Bio-Gelée Royale','bee-energy-bio':'Bee Energy – Bio-Tonikum',
    'propol-active-bio':'Propol Active – Bio-Tabletten','propoli-30-spray-integratore':'Propolis 30% Spray',
    'propoli-30-alcolica-integratore':'Propolis 30% alkoholische Tropfen','propoli-analcolica-integratore':'Alkoholfreie Propolis',
    'cosmesi-crema-mani':'Handcreme mit Aloe, Bienenwachs und Propolis','cosmesi-burrocacao-propoli-aloe':'Lippenbalsam Propolis + Aloe',
    'cosmesi-burrocacao-miele-pappa-reale':'Lippenbalsam Honig + Gelée Royale','cosmesi-shampoo-multivitaminico':'Shampoo mit Propolis und Aloe',
    'cosmesi-saponetta-frutti-bosco':'Waldbeeren-Seife','cosmesi-saponetta-lavanda':'Lavendelseife','cosmesi-saponetta-aloe-vera':'Aloe-Vera-Seife',
    'cosmesi-candela-alveare-cera-api':'Bienenstockkerze aus Bienenwachs','tesori-limoncello':'Limoncello','tesori-liquore-caffe':'Kaffeelikör','tesori-castagne-rum':'Kastanien in Rum'
  },
  fr:{
    'favo-integrale-bio':'Rayon de miel entier BIO','polline-italiano':'Pollen italien','orsetti-gommosi':'Oursons gélifiés BIO',
    'pappa-reale-italiana-bio':'Gelée royale italienne fraîche BIO','bee-energy-bio':'Bee Energy – Tonique BIO',
    'propol-active-bio':'Propol Active – Comprimés BIO','propoli-30-spray-integratore':'Propolis 30% Spray',
    'propoli-30-alcolica-integratore':'Propolis 30% alcoolique en gouttes','propoli-analcolica-integratore':'Propolis sans alcool',
    'cosmesi-crema-mani':'Crème mains Aloe, Cire d’abeille et Propolis','cosmesi-burrocacao-propoli-aloe':'Baume à lèvres Propolis + Aloe',
    'cosmesi-burrocacao-miele-pappa-reale':'Baume à lèvres Miel + Gelée royale','cosmesi-shampoo-multivitaminico':'Shampooing Propolis et Aloe',
    'cosmesi-saponetta-frutti-bosco':'Savon Fruits des bois','cosmesi-saponetta-lavanda':'Savon Lavande','cosmesi-saponetta-aloe-vera':'Savon Aloe Vera',
    'cosmesi-candela-alveare-cera-api':'Bougie ruche en cire d’abeille','tesori-limoncello':'Limoncello','tesori-liquore-caffe':'Liqueur au café','tesori-castagne-rum':'Châtaignes au rhum'
  },
  es:{
    'favo-integrale-bio':'Panal integral BIO','polline-italiano':'Polen italiano','orsetti-gommosi':'Ositos de goma BIO',
    'pappa-reale-italiana-bio':'Jalea real italiana fresca BIO','bee-energy-bio':'Bee Energy – Tónico BIO',
    'propol-active-bio':'Propol Active – Comprimidos BIO','propoli-30-spray-integratore':'Própolis 30% Spray',
    'propoli-30-alcolica-integratore':'Própolis 30% alcohólico en gotas','propoli-analcolica-integratore':'Própolis sin alcohol',
    'cosmesi-crema-mani':'Crema de manos con Aloe, Cera de abeja y Própolis','cosmesi-burrocacao-propoli-aloe':'Bálsamo labial Própolis + Aloe',
    'cosmesi-burrocacao-miele-pappa-reale':'Bálsamo labial Miel + Jalea real','cosmesi-shampoo-multivitaminico':'Champú Própolis y Aloe',
    'cosmesi-saponetta-frutti-bosco':'Jabón Frutos del bosque','cosmesi-saponetta-lavanda':'Jabón Lavanda','cosmesi-saponetta-aloe-vera':'Jabón Aloe Vera',
    'cosmesi-candela-alveare-cera-api':'Vela colmena de cera de abeja','tesori-limoncello':'Limoncello','tesori-liquore-caffe':'Licor de café','tesori-castagne-rum':'Castañas al ron'
  }
};
const CESTO_TEXT={
  it:{receiptTitle:"RICEVUTA ORDINE CESTO DELL'ALVEARE",status:'Stato: DA PREPARARE',payment:'Pagamento: 100 Punti Ape',shipping:'Spedizione: GRATUITA',total:'Totale da pagare: EUR 0,00',customer:'Cliente: ',email:'Email: ',phone:'Telefono: ',address:'Indirizzo: ',products:'Prodotti:',eta:'Il Cesto verrà preparato e spedito gratuitamente entro 5-7 giorni lavorativi.'},
  en:{receiptTitle:'HIVE GIFT BASKET ORDER RECEIPT',status:'Status: TO BE PREPARED',payment:'Payment: 100 Bee Points',shipping:'Shipping: FREE',total:'Amount due: EUR 0.00',customer:'Customer: ',email:'Email: ',phone:'Phone: ',address:'Address: ',products:'Products:',eta:'The basket will be prepared and shipped free of charge within 5-7 business days.'},
  de:{receiptTitle:'BESTELLBELEG BIENENSTOCK-GESCHENKKORB',status:'Status: VORBEREITUNG AUSSTEHEND',payment:'Zahlung: 100 Bienenpunkte',shipping:'Versand: KOSTENLOS',total:'Zu zahlen: EUR 0,00',customer:'Kunde: ',email:'E-Mail: ',phone:'Telefon: ',address:'Adresse: ',products:'Produkte:',eta:'Der Korb wird vorbereitet und innerhalb von 5-7 Werktagen kostenlos versendet.'},
  fr:{receiptTitle:'REÇU DE COMMANDE PANIER DE LA RUCHE',status:'Statut : À PRÉPARER',payment:'Paiement : 100 Points Abeille',shipping:'Livraison : GRATUITE',total:'Total à payer : EUR 0,00',customer:'Client : ',email:'E-mail : ',phone:'Téléphone : ',address:'Adresse : ',products:'Produits :',eta:'Le panier sera préparé et expédié gratuitement sous 5 à 7 jours ouvrables.'},
  es:{receiptTitle:'RECIBO DE PEDIDO CESTA DE LA COLMENA',status:'Estado: POR PREPARAR',payment:'Pago: 100 Puntos Abeja',shipping:'Envío: GRATUITO',total:'Total a pagar: EUR 0,00',customer:'Cliente: ',email:'Email: ',phone:'Teléfono: ',address:'Dirección: ',products:'Productos:',eta:'La cesta se preparará y se enviará gratuitamente en un plazo de 5 a 7 días laborables.'}
};
function cestoLang(v){const x=String(v||'it').toLowerCase();return CESTO_LANGS.has(x)?x:'it';}
function cestoGiftName(id,lang){return lang==='it'?(TEST_GIFTS.get(id)||id):(CESTO_GIFT_NAMES[lang]?.[id]||TEST_GIFTS.get(id)||id);}

function cleanField(v,max=180){return String(v||'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);}
function euroMail(v){return Number(v||0).toFixed(2).replace('.',',')+' €';}
async function sendAdminResend({subject,text,replyTo,idempotency}){
  const key=String(process.env.RESEND_API_KEY||'').trim();
  const to=String(process.env.ORDER_EMAIL_TO||'').trim();
  if(!key||!to)throw new Error('Servizio email non configurato.');
  const r=await fetch('https://api.resend.com/emails',{
    method:'POST',
    headers:{'Authorization':'Bearer '+key,'Content-Type':'application/json','Idempotency-Key':idempotency},
    body:JSON.stringify({from:'La Fabbrica delle Api <onboarding@resend.dev>',to:[to],reply_to:replyTo,subject,text})
  });
  const data=await r.json().catch(()=>null);
  if(!r.ok){console.error('[Email Ordini] Resend',r.status,data?.message||data?.error||'unknown');throw new Error('Email non inviata.');}
}
function normalOrderFromBody(body){
  const b=body||{}, u=b.customer||{};
  const id=cleanField(b.id,80);
  if(!/^API-\d{8}-\d{5,8}$/.test(id))throw new Error('Codice ordine non valido.');
  const email=cleanField(u.email,180).toLowerCase();
  if(!cleanField(u.name,120)||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Dati cliente non validi.');
  const items=Array.isArray(b.items)?b.items.slice(0,40):[];
  if(!items.length)throw new Error('Prodotti ordine non validi.');
  return {
    id,
    customer:{
      name:cleanField(u.name,120),email,phone:cleanField(u.phone,80),
      address:cleanField(u.address,180),cap:cleanField(u.cap,20),city:cleanField(u.city,120),
      province:cleanField(u.province,40),country:cleanField(u.country,8)
    },
    items:items.map(x=>({name:cleanField(x?.name,180),size:cleanField(x?.size,120),qty:Math.max(1,Math.floor(Number(x?.qty||1))),price:Number(x?.price||0)})),
    notes:cleanField(b.notes,1000),delivery:cleanField(b.delivery,30),shippingReason:cleanField(b.shippingReason,300),
    goodsTotal:Number(b.goodsTotal||0),shipping:Number(b.shipping||0),total:Number(b.total||0),points:Number(b.points||0),
    paymentProvider:cleanField(b.paymentProvider,80),paymentId:cleanField(b.paymentId,100)
  };
}
async function handleOrderEmailAction(req,res,action){
  const o=normalOrderFromBody(req.body);
  if(action==='cancel'){
    const reason=cleanField(req.body?.cancelReason||req.body?.reason||'Pagamento annullato o non completato',160);
    const text=[
      'LA FABBRICA DELLE API','ACQUISTO ANNULLATO / NON COMPLETATO','',
      'Codice ordine: '+o.id,'Cliente: '+o.customer.name,'Email: '+o.customer.email,'Telefono: '+o.customer.phone,
      'Totale previsto: '+euroMail(o.total),'Motivo: '+reason,'','Prodotti:',
      ...o.items.map(x=>'- '+x.name+(x.size?' · '+x.size:'')+' · q.tà '+x.qty),
      '','Nessun pagamento completato da questa notifica.'
    ].join('\n');
    await sendAdminResend({subject:'ACQUISTO ANNULLATO · '+o.id+' · '+o.customer.name,text,replyTo:o.customer.email,idempotency:'cancel-'+o.id});
    return res.json({ok:true,orderId:o.id,emailSent:true,cancelled:true});
  }
  const text=[
    'LA FABBRICA DELLE API','NUOVO ORDINE RICEVUTO','',
    'Codice: '+o.id,'','DATI ACQUIRENTE',o.customer.name,o.customer.email,o.customer.phone,
    'Indirizzo: '+o.customer.address+', '+o.customer.cap+' '+o.customer.city+(o.customer.province?' ('+o.customer.province+')':''),
    'Paese: '+o.customer.country,'','PRODOTTI',
    ...o.items.map(x=>'- '+x.name+(x.size?' · '+x.size:'')+' | q.tà '+x.qty+' | '+euroMail(x.price*x.qty)),
    '','Consegna: '+(o.delivery||'—'),'Dettaglio spedizione: '+(o.shippingReason||'—'),'Note: '+(o.notes||'—'),
    'Prodotti: '+euroMail(o.goodsTotal),'Spedizione: '+euroMail(o.shipping),'Totale: '+euroMail(o.total),'Punti Ape: '+o.points,
    ...(o.paymentProvider?['Pagamento: '+o.paymentProvider+(o.paymentId?' · '+o.paymentId:'')]:[])
  ].join('\n');
  await sendAdminResend({subject:'Nuovo ordine '+o.id+' · '+o.customer.name+' · '+euroMail(o.total),text,replyTo:o.customer.email,idempotency:'order-'+o.id});
  return res.json({ok:true,orderId:o.id,emailSent:true});
}
function normalizePlace(v){
  return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
}
let comuniCache=null,comuniCacheAt=0;
async function getComuniItaliaDataset(){
  if(comuniCache&&Date.now()-comuniCacheAt<86400000)return comuniCache;
  const r=await fetch('https://cdn.jsdelivr.net/gh/RP92/comuni-italiani@main/data/comuni.json',{headers:{'Accept':'application/json','User-Agent':'LaFabbricaDelleApi/1.0 address-validator'}});
  if(!r.ok)throw new Error('Servizio di verifica indirizzo temporaneamente non disponibile.');
  const data=await r.json();
  if(!Array.isArray(data))throw new Error('Servizio di verifica indirizzo temporaneamente non disponibile.');
  comuniCache=data;comuniCacheAt=Date.now();return data;
}
async function validateItalianShippingAddress(shipping){
  const city=cleanField(shipping.city,100);
  const cap=cleanField(shipping.postalCode,20);
  const province=cleanField(shipping.state,10).toUpperCase();
  const address=cleanField(shipping.address,180);
  if(!/[A-Za-zÀ-ÿ]/.test(address)||!/\d/.test(address))throw new Error('Inserisci sia il nome della via sia il numero civico.');
  const dataset=await getComuniItaliaDataset();
  const cityNorm=normalizePlace(city);
  const matches=dataset.filter(item=>[item.nome,item.nomeAltraLingua].filter(Boolean).some(n=>normalizePlace(n)===cityNorm));
  if(!matches.length)throw new Error('Il Comune “'+city+'” non risulta nell’elenco dei comuni italiani.');
  const municipality=matches.find(item=>{
    const caps=Array.isArray(item.cap)?item.cap.map(String):[];
    const sigla=String(item.sigla||item.provincia?.sigla||'').toUpperCase();
    return caps.includes(cap)&&sigla===province;
  });
  if(!municipality){
    const caps=[...new Set(matches.flatMap(item=>Array.isArray(item.cap)?item.cap:[]))];
    const sigle=[...new Set(matches.map(item=>item.sigla||item.provincia?.sigla).filter(Boolean))];
    let msg='CAP, Comune e Provincia non corrispondono.';
    if(caps.length)msg+=' Per '+city+' risultano: CAP '+caps.join(', ')+'.';
    if(sigle.length)msg+=' Provincia '+sigle.join(', ')+'.';
    throw new Error(msg);
  }
  return shipping;
}
function validateTestCesto(body){
  const gifts=Array.isArray(body.giftProducts)?body.giftProducts.map(x=>cleanField(x,100)):[];
  const unique=[...new Set(gifts)];
  if(unique.length!==5) throw new Error('Scegli esattamente 5 prodotti diversi.');
  for(const id of unique) if(!TEST_GIFTS.has(id)) throw new Error('Prodotto cesto non valido.');
  const s=body.shipping||{};
  const shipping={
    name:cleanField(s.name,120),
    email:cleanField(s.email,180).toLowerCase(),
    phone:cleanField(s.phone,60),
    address:cleanField(s.address,180),
    postalCode:cleanField(s.postalCode,20),
    city:cleanField(s.city,100),
    state:cleanField(s.state,50).toUpperCase(),
    country:cleanField(s.country||'Italia',80),
    notes:cleanField(s.notes,500)
  };
  if(!shipping.name||!shipping.email||!shipping.phone||!shipping.address||!shipping.postalCode||!shipping.city||!shipping.state) throw new Error('Completa tutti i dati obbligatori per la spedizione.');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shipping.email)) throw new Error('Email non valida.');
  return {gifts:unique,shipping};
}
async function validateShippingRemotely(shipping){
  const email=cleanField(shipping.email,180).toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Email non valida.');
  if(!/^\d{5}$/.test(cleanField(shipping.postalCode,20))) throw new Error('Il CAP deve essere composto da 5 cifre.');
  if(!/^[A-Za-z]{2}$/.test(cleanField(shipping.state,10))) throw new Error('La Provincia deve essere indicata con la sigla di 2 lettere, ad esempio MN.');
  let phoneRaw=cleanField(shipping.phone,60).replace(/[\s().-]/g,'');
  let national=phoneRaw;
  if(phoneRaw.startsWith('0039')) national=phoneRaw.slice(4);
  else if(phoneRaw.startsWith('+39')) national=phoneRaw.slice(3);
  else if(phoneRaw.startsWith('+')) throw new Error('Per il test usa un numero italiano oppure il prefisso +39.');
  national=national.replace(/\D/g,'');
  if(!/^3\d{8,9}$/.test(national)) throw new Error('Numero di telefono non valido.');
  shipping.phone='+39'+national;

  await validateItalianShippingAddress(shipping);
  return shipping;
}

function receiptPdf(order,lang='it'){
  lang=cestoLang(lang);
  const tx=CESTO_TEXT[lang]||CESTO_TEXT.it;
  const lines=[
    'LA FABBRICA DELLE API',
    tx.receiptTitle,
    '',
    'Order / Ordine: '+order.orderNumber,
    tx.status,
    tx.payment,
    tx.shipping,
    tx.total,
    '',
    tx.customer+order.shipping.name,
    tx.email+order.shipping.email,
    tx.phone+order.shipping.phone,
    tx.address+order.shipping.address,
    order.shipping.postalCode+' '+order.shipping.city+' ('+order.shipping.state+')',
    '',
    tx.products,
    ...order.giftObjects.map((g,i)=>(i+1)+'. '+cestoGiftName(g.id,lang)),
    '',
    tx.eta
  ];
  const content=['BT','/F1 16 Tf','54 785 Td'];
  lines.forEach((line,i)=>{
    if(i===0)content.push('/F1 18 Tf');
    else if(i===1)content.push('/F1 14 Tf');
    else content.push('/F1 10 Tf');
    content.push('('+escPdf(line)+') Tj');
    content.push('0 -22 Td');
  });
  content.push('ET');
  const stream=content.join('\n');
  const objs=[];
  objs[1]='<< /Type /Catalog /Pages 2 0 R >>';
  objs[2]='<< /Type /Pages /Kids [3 0 R] /Count 1 >>';
  objs[3]='<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>';
  objs[4]='<< /Length '+Buffer.byteLength(stream,'latin1')+' >>\nstream\n'+stream+'\nendstream';
  objs[5]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  let out='%PDF-1.4\n', offsets=[0];
  for(let i=1;i<=5;i++){offsets[i]=Buffer.byteLength(out,'latin1');out+=i+' 0 obj\n'+objs[i]+'\nendobj\n';}
  const xref=Buffer.byteLength(out,'latin1');
  out+='xref\n0 6\n0000000000 65535 f \n';
  for(let i=1;i<=5;i++)out+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';
  out+='trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF';
  return Buffer.from(out,'latin1');
}

async function createTestCestoOrder(code,permanent,body){
  const lang=cestoLang(body.language);
  const {gifts,shipping}=validateTestCesto(body);
  await validateShippingRemotely(shipping);
  const p=getTestPool();
  const stamp=Date.now().toString().slice(-8);
  const orderNumber='CESTO-TEST-'+(permanent?'ALWAYS':'ONCE')+'-'+stamp;
  const accountId='TEST-'+(permanent?'ALWAYS':'ONCE')+'-12830';
  const giftObjects=gifts.map(id=>({id,name:TEST_GIFTS.get(id)}));
  await p.query(
    "insert into bee_test_state(id,payload,updated_at) values($1,$2::jsonb,now()) on conflict(id) do update set payload=excluded.payload,updated_at=excluded.updated_at",
    [
      'cesto-test:'+orderNumber,
      JSON.stringify({
        orderNumber,
        code,
        language:lang,
        accountId,
        customer:shipping,
        giftProducts:giftObjects,
        pointsSpent:100,
        shippingTotal:0,
        amountDue:0,
        paymentMethod:'100 PUNTI APE - TEST',
        status:'DA PREPARARE',
        createdAt:new Date().toISOString()
      })
    ]
  );
  const resendKey=String(process.env.RESEND_API_KEY||'').trim();
  const notifyTo=String(process.env.ORDER_EMAIL_TO||'').trim();
  if(!resendKey||!notifyTo) throw new Error('Ordine creato ma email di notifica non configurata.');
  const notifyFrom='La Fabbrica delle Api <onboarding@resend.dev>';
  const subject='TEST · Cesto Punti Ape '+orderNumber+' · '+shipping.name;
  const text=[
    'LA FABBRICA DELLE API',
    'ORDINE CESTO PUNTI APE - MODALITA TEST',
    '',
    'Ordine: '+orderNumber,
    'Codice: '+code,
    'Punti utilizzati: 100',
    'Stato: DA PREPARARE',
    '',
    'CLIENTE E SPEDIZIONE',
    'Nome: '+shipping.name,
    'Email: '+shipping.email,
    'Telefono: '+shipping.phone,
    'Indirizzo: '+shipping.address,
    'CAP: '+shipping.postalCode,
    'Comune: '+shipping.city,
    'Provincia: '+shipping.state,
    'Paese: '+shipping.country,
    'Note: '+(shipping.notes||'—'),
    '',
    '5 PRODOTTI SCELTI',
    ...giftObjects.map((g,i)=>(i+1)+'. '+g.name),
    '',
    'Pagamento: 100 Punti Ape',
    'Spedizione: GRATUITA',
    'Totale da pagare: €0,00'
  ].join('\n');
  const notify=await fetch('https://api.resend.com/emails',{
    method:'POST',
    headers:{
      'Authorization':'Bearer '+resendKey,
      'Content-Type':'application/json',
      'Idempotency-Key':'cesto-'+orderNumber
    },
    body:JSON.stringify({from:notifyFrom,to:[notifyTo],reply_to:shipping.email,subject,text})
  });
  const notifyData=await notify.json().catch(()=>null);
  if(!notify.ok){
    console.error('[Cesto Punti Ape] Resend error',notify.status,notifyData?.message||notifyData?.error||'unknown');
    throw new Error('Ordine creato ma email di notifica non inviata.');
  }
  if(!permanent) await useOnce();
  return {orderNumber,giftObjects:giftObjects.map(g=>({id:g.id,name:cestoGiftName(g.id,lang)})),shipping,emailSent:true,balance:permanent?100:0,language:lang};
}

async function getOnceUsed(){const p=getTestPool();const r=await p.query("select payload from bee_test_state where id='wallet-test-once-v3-12830' limit 1");return Boolean(r.rows[0]?.payload?.used);}
async function useOnce(){const p=getTestPool();await p.query("insert into bee_test_state(id,payload,updated_at) values('wallet-test-once-v3-12830',$1::jsonb,now()) on conflict(id) do update set payload=excluded.payload,updated_at=excluded.updated_at",[JSON.stringify({used:true,usedAt:new Date().toISOString()})]);}

function escPdf(s){return String(s||'').replace(/[()\\]/g,m=>'\\'+m);}
function walletCardPdf(code){
  const lines=[
    'LA FABBRICA DELLE API',
    'PROMEMORIA PUNTI APE',
    '',
    'Conserva questo codice personale:',
    code,
    '',
    'Usalo su lafabbricadelleapi.it per controllare il tuo saldo.',
    'Il codice non contiene dati personali.'
  ];
  const content=['BT','/F1 18 Tf','72 750 Td'];
  lines.forEach((line,i)=>{
    if(i===0)content.push('/F1 20 Tf');
    else if(i===1)content.push('/F1 15 Tf');
    else if(i===4)content.push('/F1 22 Tf');
    else content.push('/F1 12 Tf');
    content.push('('+escPdf(line)+') Tj');
    content.push('0 -30 Td');
  });
  content.push('ET');
  const stream=content.join('\n');
  const objs=[];
  objs[1]='<< /Type /Catalog /Pages 2 0 R >>';
  objs[2]='<< /Type /Pages /Kids [3 0 R] /Count 1 >>';
  objs[3]='<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>';
  objs[4]='<< /Length '+Buffer.byteLength(stream,'latin1')+' >>\nstream\n'+stream+'\nendstream';
  objs[5]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  let out='%PDF-1.4\n', offsets=[0];
  for(let i=1;i<=5;i++){offsets[i]=Buffer.byteLength(out,'latin1');out+=i+' 0 obj\n'+objs[i]+'\nendobj\n';}
  const xref=Buffer.byteLength(out,'latin1');
  out+='xref\n0 6\n0000000000 65535 f \n';
  for(let i=1;i<=5;i++)out+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';
  out+='trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF';
  return Buffer.from(out,'latin1');
}

module.exports=async(req,res)=>{
  res.setHeader('Cache-Control','no-store');
  if(req.method==='GET' && String(req.query?.card||'')==='1'){
    const code=normalizeCode(req.query?.code);
    if(!/^APE-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{2}$/.test(code)) return res.status(400).send('Codice non valido.');
    res.setHeader('Content-Type','application/pdf');
    res.setHeader('Content-Disposition','attachment; filename="Promemoria_Punti_Ape_'+code+'.pdf"');
    res.setHeader('Cache-Control','private, no-store');
    return res.status(200).send(walletCardPdf(code));
  }
  if(req.method==='GET' && String(req.query?.receipt||'')==='1'){
    const orderNumber=cleanField(req.query?.order,120);
    const code=normalizeCode(req.query?.code);
    if(!orderNumber||!(code===TEST_ONCE||code===TEST_ALWAYS)) return res.status(400).send('Ricevuta non valida.');
    try{
      const p=getTestPool();
      const r=await p.query("select payload from bee_test_state where id=$1 limit 1",['cesto-test:'+orderNumber]);
      const payload=r.rows[0]?.payload;
      if(!payload||payload.code!==code) return res.status(404).send('Ricevuta non trovata.');
      const lang=cestoLang(req.query?.lang||payload.language||'it');
      const order={
        orderNumber:payload.orderNumber,
        shipping:payload.customer||{},
        giftObjects:Array.isArray(payload.giftProducts)?payload.giftProducts:[]
      };
      res.setHeader('Content-Type','application/pdf');
      res.setHeader('Content-Disposition','attachment; filename="Ricevuta_'+orderNumber.replace(/[^A-Z0-9-]/gi,'_')+'.pdf"');
      res.setHeader('Cache-Control','private, no-store');
      return res.status(200).send(receiptPdf(order,lang));
    }catch(e){
      return res.status(500).send('Impossibile generare la ricevuta.');
    }
  }
  if(req.method!=='POST') return res.status(405).json({ok:false,error:'Metodo non consentito.'});
  try{
    const adminAction=cleanField(req.query?.adminAction,30).toLowerCase();
    if(adminAction) return await handleAdminAction(req,res,adminAction);
    const emailAction=cleanField(req.query?.emailAction,30).toLowerCase();
    if(emailAction==='order'||emailAction==='cancel') return await handleOrderEmailAction(req,res,emailAction);
    const body=req.body||{};
    const email=normalizeEmail(body.email);
    const phone=normalizePhone(body.phone);
    const code=normalizeCode(body.code);
    if(code===TEST_ONCE||code===TEST_ALWAYS){
      const permanent=code===TEST_ALWAYS;
      if(String(body.action||'')==='claim_test_reward'){
        const order=await createTestCestoOrder(code,permanent,body);
        const balance=order.balance;
        return res.json({
          ok:true,found:true,testMode:true,testKind:permanent?'always':'once',balance,earned:100,spent:permanent?0:100,
          goal:100,remainingToReward:Math.max(0,100-balance),
          testClaimed:true,cestoOrder:order,emailSent:true,
          receiptUrl:'/api/bee-balance?receipt=1&order='+encodeURIComponent(order.orderNumber)+'&code='+encodeURIComponent(code)+'&lang='+encodeURIComponent(order.language||'it'),
          message:permanent
            ? 'Ordine Cesto TEST creato e email inviata. Il codice permanente resta a 100 Punti Ape.'
            : 'Ordine Cesto TEST creato e email inviata. Il saldo TEST è tornato a 0.'
        });
      }
      const used=permanent?false:await getOnceUsed();
      const balance=permanent?100:(used?0:100);
      return res.json({
        ok:true,found:true,testMode:true,testKind:permanent?'always':'once',balance,earned:100,spent:used?100:0,
        goal:100,remainingToReward:Math.max(0,100-balance),
        canTestClaim:balance>=100,
        message:permanent
          ? 'Modalità TEST permanente: questo saldo resterà sempre a 100 Punti Ape.'
          : (used?'Modalità TEST una tantum già utilizzata: saldo TEST = 0.':'Modalità TEST una tantum: puoi simulare il riscatto del cesto.')
      });
    }
    if(!email&&!phone&&!code) return res.status(422).json({ok:false,error:'Inserisci email, telefono oppure Codice Punti Ape.'});
    if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(422).json({ok:false,error:'Email non valida.'});
    if(phone&&phone.length<6) return res.status(422).json({ok:false,error:'Numero di telefono non valido.'});
    if(code&&!/^APE-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{2}$/.test(code)) return res.status(422).json({ok:false,error:'Codice Punti Ape non valido.'});
    let result;
    if(email||phone){
      const data=await callBeeDataApi('lookup',{email,phone});
      if(data&&data.ok===false){
        const status=Number(data.status)||400;
        return res.status(status).json(data);
      }
      result={
        found:!!(data&&data.found),
        balance:Number(data&&data.balance||0),
        earned:Number(data&&data.earned||0),
        spent:Number(data&&data.spent||0)
      };
    }else{
      result=await lookupWallet({email,phone,code});
    }
    if(!result.found) return res.status(404).json({ok:false,found:false,error:'Nessun Saldo Punti Ape trovato con questi dati.'});
    return res.json({
      ok:true,found:true,balance:result.balance,earned:result.earned,spent:result.spent,
      goal:100,remainingToReward:Math.max(0,100-result.balance)
    });
  }catch(error){
    console.error('[Saldo Api] lookup error',error);
    const message=String(error&&error.message||'');
    const validationPatterns=[
      /telefono/i,/CAP/i,/Provincia/i,/Comune/i,/Indirizzo/i,/Email non valida/i,
      /Completa tutti i dati obbligatori/i,/Scegli esattamente 5 prodotti/i,/Prodotto cesto non valido/i
    ];
    if(validationPatterns.some(rx=>rx.test(message))){
      return res.status(422).json({ok:false,error:message});
    }
    return res.status(500).json({ok:false,error:'Non è stato possibile controllare il saldo. Riprova tra poco.'});
  }
};