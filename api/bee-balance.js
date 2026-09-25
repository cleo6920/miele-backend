const {lookupWallet,normalizeEmail,normalizePhone,normalizeCode}=require('../bee-wallet-public');
const {callBeeDataApi}=require('../bee-wallet-client');
const {Pool}=require('pg');
const TEST_DB_URL=String(process.env.BEE_DATABASE_URL||process.env.DATABASE_URL||'').trim();
let testPool;
function getTestPool(){if(!TEST_DB_URL)throw new Error('Database Saldo Api non configurato.');if(!testPool)testPool=new Pool({connectionString:TEST_DB_URL,max:1,idleTimeoutMillis:30000,connectionTimeoutMillis:10000});return testPool;}
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
  let prefix='+39', national=phoneRaw;
  if(phoneRaw.startsWith('0039')) national=phoneRaw.slice(4);
  else if(phoneRaw.startsWith('+39')) national=phoneRaw.slice(3);
  else if(phoneRaw.startsWith('+')) throw new Error('Per il test usa un numero italiano oppure il prefisso +39.');
  const phoneRes=await fetch('https://miele-shop-experience-v2.onrender.com/api/phone-normalize?'+new URLSearchParams({prefix,phone:national}).toString(),{cache:'no-store'});
  const phoneData=await phoneRes.json().catch(()=>null);
  if(!phoneRes.ok||!phoneData?.ok||!phoneData?.e164) throw new Error(phoneData?.error||'Numero di telefono non valido.');
  shipping.phone=phoneData.e164;

  const addressRes=await fetch('https://miele-shop-experience-v2.onrender.com/api/local-delivery-check?'+new URLSearchParams({
    address:shipping.address,
    city:shipping.city,
    cap:shipping.postalCode,
    province:shipping.state,
    country:'IT'
  }).toString(),{cache:'no-store'});
  const addressData=await addressRes.json().catch(()=>null);
  if(!addressRes.ok||!addressData?.ok||addressData?.validFullAddress!==true){
    throw new Error(addressData?.error||'Indirizzo non verificato. Controlla via, numero civico, Comune, CAP e Provincia.');
  }
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
  const notify=await fetch('https://miele-shop-experience-v2.onrender.com/api/cesto-notification',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      testMode:true,
      orderNumber,
      code,
      pointsSpent:100,
      giftProducts:giftObjects,
      shipping
    })
  });
  const notifyData=await notify.json().catch(()=>null);
  if(!notify.ok) throw new Error((notifyData&&notifyData.error)||'Ordine creato ma email di notifica non inviata.');
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
    return res.status(500).json({ok:false,error:'Non è stato possibile controllare il saldo. Riprova tra poco.'});
  }
};