const fs=require('fs');
const path=require('path');

let catalogCache=null;

function clean(value,max=200){
  return String(value||'').trim().slice(0,max);
}
function language(value){
  const l=clean(value,5).toLowerCase();
  return ['it','en','de','fr','es'].includes(l)?l:'it';
}
function loadCatalog(){
  if(catalogCache)return catalogCache;
  const busatello=[
    {id:'millefiori',name:'Miele Millefiori',size:'250 g',price:4.9,desc:'Miele dell’Oasi del Busatello dal profilo armonico e dalla dolcezza equilibrata.',anchor:'miele-millefiori'},
    {id:'melone',name:'Miele al Melone',size:'250 g',price:4.9,desc:'Specialità al miele dal gusto dolce e fruttato.',anchor:'miele-melone'},
    {id:'fragola',name:'Miele alla Fragola',size:'250 g',price:4.9,desc:'Specialità al miele dal gusto morbido e fruttato.',anchor:'miele-fragola'},
    {id:'pesca',name:'Miele alla Pesca',size:'250 g',price:4.9,desc:'Specialità al miele dal profilo delicato e fruttato.',anchor:'miele-pesca'},
    {id:'arancia',name:"Miele all'Arancia",size:'250 g',price:4.9,desc:'Specialità al miele dal carattere fresco e agrumato.',anchor:'miele-arancia'}
  ];
  try{
    const html=fs.readFileSync(path.join(__dirname,'shop-v2.html'),'utf8');
    const marker='const SHOP_OFFICIAL_PRODUCTS=';
    const start=html.indexOf(marker);
    const end=start>=0?html.indexOf('];',start):-1;
    if(start>=0&&end>start){
      const json=html.slice(start+marker.length,end+1);
      const products=JSON.parse(json).map(p=>({
        id:clean(p.id,180),
        name:clean(p.name,180),
        size:clean(p.size,120),
        price:Number(p.price||0),
        desc:clean(p.desc,500),
        section:clean(p.section,80),
        anchor:'prodotto-'+clean(p.id,180)
      }));
      catalogCache=[...busatello,...products];
      return catalogCache;
    }
  }catch(error){
    console.error('[Ape Telù Vercel] Catalogo non letto:',error&&error.message?error.message:error);
  }
  catalogCache=busatello;
  return catalogCache;
}
function catalogText(){
  return loadCatalog().map(p=>'- '+p.name+' | '+p.size+' | €'+Number(p.price||0).toFixed(2).replace('.',',')+' | '+p.desc).join('\n');
}
function normalize(s){
  return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
}
function productAction(message,reply,lang){
  const hay=normalize(message+'\n'+reply);
  const found=loadCatalog().filter(p=>hay.includes(normalize(p.name)));
  if(found.length!==1)return null;
  const p=found[0];
  const prefix={it:'Scopri',en:'Discover',de:'Entdecke',fr:'Découvrir',es:'Descubrir'}[lang]||'Scopri';
  return {href:'/shop#'+p.anchor,label:prefix+' '+p.name};
}
function cheapReply(message,lang){
  const q=normalize(message);
  const intent=/(spendendo poco|spendere poco|economico|economica|costa meno|meno caro|prezzo piu basso|low cost|cheap|cheapest|günstig|gunstig|moins cher|barato|economico)/i.test(q);
  const choice=/(prodotto|prodotti|consigli|consiglia|provare|provo|scegli|prendo|product|produkt|produit|producto)/i.test(q);
  if(!intent||!choice)return null;
  const products=loadCatalog().filter(p=>Number(p.price)>0 && p.section!=='alveo-digitale');
  const min=Math.min(...products.map(p=>Number(p.price)));
  const cheapest=products.find(p=>Number(p.price)===min);
  if(!cheapest)return null;
  const euro=Number(cheapest.price).toFixed(2).replace('.',',')+' €';
  const replies={
    it:'Se vuoi **provare qualcosa spendendo poco**, partirei dal **'+cheapest.name+' · '+cheapest.size+' · '+euro+'**. È il prodotto fisico con il prezzo più basso del catalogo attuale.\n\nSe vuoi restare sotto i 5 €, posso anche mostrarti le alternative disponibili in quella fascia.',
    en:'If you want to **try something inexpensive**, I would start with **'+cheapest.name+' · '+cheapest.size+' · '+euro+'**. It is currently the lowest-priced physical product in the catalogue.\n\nIf you want, I can also show you the other options under €5.',
    de:'Wenn du **etwas Günstiges ausprobieren** möchtest, würde ich mit **'+cheapest.name+' · '+cheapest.size+' · '+euro+'** beginnen. Es ist derzeit das günstigste physische Produkt im Katalog.\n\nWenn du möchtest, zeige ich dir auch die anderen Optionen unter 5 €.',
    fr:'Si vous voulez **essayer quelque chose à petit prix**, je commencerais par **'+cheapest.name+' · '+cheapest.size+' · '+euro+'**. C’est actuellement le produit physique le moins cher du catalogue.\n\nJe peux aussi vous montrer les autres options à moins de 5 €.',
    es:'Si quieres **probar algo gastando poco**, empezaría por **'+cheapest.name+' · '+cheapest.size+' · '+euro+'**. Es el producto físico más económico del catálogo actual.\n\nSi quieres, también puedo enseñarte las otras opciones por debajo de 5 €.'
  };
  return {reply:replies[lang]||replies.it,action:{href:'/shop#'+cheapest.anchor,label:'Scopri '+cheapest.name}};
}

function prestigeReply(message,lang){
  const q=normalize(message);
  const prestige=/(piu pregiato|più pregiato|piu prezioso|più prezioso|migliore prodotto|prodotto migliore|most precious|most valuable|best bee product|wertvollste|kostbarste|plus precieux|plus précieux|mas preciado|más preciado)/i.test(q);
  const beeProduct=/(ape|api|alveare|prodotto|miele|pappa reale|polline|propoli|cera|veleno)/i.test(q);
  if(!prestige||!beeProduct)return null;
  const replies={
    it:'Non esiste un prodotto dell’alveare **oggettivamente “più pregiato”**: dipende dal criterio. Se per “pregiato” intendi **raro e biologicamente particolare**, la **pappa reale** è certamente uno dei prodotti più caratteristici dell’alveare. Viene prodotta dalle **api operaie nutrici**, non dalla regina, e serve soprattutto a nutrire le larve e la regina.\n\nNel nostro shop trovi **Pappa Reale Fresca · 10 g · 6,90 €**. Se invece per “pregiato” intendi il più costoso, il più raro o quello dal gusto più particolare, posso confrontarli con quel criterio.',
    en:'There is no bee product that is **objectively the “most precious”**: it depends on the criterion. If you mean **rare and biologically distinctive**, royal jelly is certainly one of the hive’s most unusual products. It is produced by **nurse worker bees**, not by the queen, and is used mainly to feed larvae and the queen.\n\nIn our shop you can find **Pappa Reale Fresca · 10 g · €6.90**. If by “precious” you mean the most expensive, rarest or most distinctive in taste, I can compare them using that criterion.',
    de:'Es gibt kein Bienenprodukt, das **objektiv das wertvollste** ist: Das hängt vom Kriterium ab. Wenn du **selten und biologisch besonders** meinst, gehört Gelée Royale sicher zu den außergewöhnlichsten Produkten des Bienenstocks. Es wird von **Ammenarbeiterinnen**, nicht von der Königin, produziert und dient vor allem der Ernährung der Larven und der Königin.\n\nIn unserem Shop findest du **Pappa Reale Fresca · 10 g · 6,90 €**. Wenn du mit „wertvoll“ das teuerste, seltenste oder geschmacklich besondere Produkt meinst, kann ich sie nach diesem Kriterium vergleichen.',
    fr:'Il n’existe pas de produit de la ruche **objectivement “le plus précieux”** : cela dépend du critère. Si vous pensez à quelque chose de **rare et biologiquement particulier**, la gelée royale fait certainement partie des produits les plus singuliers de la ruche. Elle est produite par les **abeilles ouvrières nourrices**, et non par la reine, et sert surtout à nourrir les larves et la reine.\n\nDans notre boutique, vous trouvez **Pappa Reale Fresca · 10 g · 6,90 €**. Si par “précieux” vous entendez le plus cher, le plus rare ou le plus particulier au goût, je peux les comparer selon ce critère.',
    es:'No existe un producto de la colmena **objetivamente “más preciado”**: depende del criterio. Si te refieres a algo **raro y biológicamente especial**, la jalea real es sin duda uno de los productos más particulares de la colmena. La producen las **abejas obreras nodrizas**, no la reina, y sirve sobre todo para alimentar a las larvas y a la reina.\n\nEn nuestra tienda encontrarás **Pappa Reale Fresca · 10 g · 6,90 €**. Si por “preciado” quieres decir el más caro, el más raro o el de sabor más particular, puedo compararlos con ese criterio.'
  };
  return {reply:replies[lang]||replies.it,action:{href:'/shop#prodotto-pappa-reale-italiana-bio',label:'Scopri Pappa Reale Fresca'}};
}

async function handleChat(req,res){
  const lang=language(req.body&&req.body.language);
  const message=clean(req.body&&req.body.message,1800);
  if(!message)return res.status(400).json({ok:false,error:'Scrivi una domanda per Ape Telù.'});

  const cheap=cheapReply(message,lang);
  if(cheap)return res.status(200).json({ok:true,reply:cheap.reply,action:cheap.action,source:'vercel-catalog'});

  const prestige=prestigeReply(message,lang);
  if(prestige)return res.status(200).json({ok:true,reply:prestige.reply,action:prestige.action,source:'vercel-knowledge'});

  const apiKey=String(process.env.GROQ_API_KEY||'').trim();
  if(!apiKey){
    console.warn('[Ape Telù Vercel] GROQ_API_KEY assente.');
    return res.status(503).json({ok:false,aiConfigured:false,error:'Ape Telù AI non è ancora configurata su Vercel.'});
  }

  const history=Array.isArray(req.body&&req.body.history)?req.body.history.slice(-10):[];
  const historyClean=history.filter(x=>x&&(x.role==='user'||x.role==='assistant')).map(x=>({
    role:x.role,
    content:clean(String(x.content||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' '),1400)
  })).filter(x=>x.content);
  const langName={it:'Italiano',en:'English',de:'Deutsch',fr:'Français',es:'Español'}[lang];

  const system=[
    'Sei "Ape Telù", la guida esperta della Fabbrica delle Api.',
    'Rispondi SEMPRE in '+langName+' salvo richiesta esplicita diversa.',
    'Il tuo mondo comprende api, alveari, apicoltura, impollinazione, biodiversità, prodotti dell’alveare, Alveoterapia Integrata, Oasi del Busatello, Galena delle Api, Linea Veleni, Punti Ape, catalogo, ordini e spedizioni.',
    'Interpreta parole generiche come prodotto, prezzo, quello, questo, economico e consiglio nel contesto della Fabbrica delle Api se la frase non indica chiaramente un soggetto esterno.',
    'Esempio vincolante: "che prodotto mi consigli da provare spendendo poco?" è una domanda sul catalogo e NON è fuori tema.',
    'Dichiara fuori tema solo domande chiaramente estranee, per esempio scarpe, politica o automobili.',
    'Non inventare prodotti, prezzi, formati, disponibilità, offerte o caratteristiche.',
    'Parole come "più pregiato", "migliore", "più buono" o "più adatto" non hanno automaticamente un vincitore oggettivo: chiarisci il criterio oppure spiega che dipende dal criterio.',
    'La pappa reale viene prodotta dalle api operaie nutrici, non dalla regina. Non dire mai che è una secrezione delle api regine.',
    'Usa soltanto il catalogo qui sotto quando parli dei prodotti dello shop.',
    'Non presentare veleno d’api, alveoterapia, SOS DOL o altri prodotti come cure o trattamenti medici. Per Linea Veleni usa linguaggio cosmetico e da massaggio.',
    'Non dare diagnosi, dosaggi, prescrizioni o indicazioni per sospendere farmaci.',
    'Per domande generali sulle api rispondi in modo divulgativo, semplice e scientificamente prudente.',
    'Per domande semplici usa 2-5 brevi paragrafi. Non fare pubblicità forzata. Quasi sempre termina con una breve domanda pertinente.',
    'CATALOGO ATTUALE:',
    catalogText()
  ].join('\n');

  try{
    const ai=await fetch('https://api.groq.com/openai/v1/chat/completions',{
      method:'POST',
      headers:{'Authorization':'Bearer '+apiKey,'Content-Type':'application/json'},
      body:JSON.stringify({
        model:String(process.env.GROQ_MODEL||'openai/gpt-oss-20b'),
        messages:[{role:'system',content:system},...historyClean,{role:'user',content:message}],
        max_tokens:650,
        temperature:0.2
      })
    });
    const data=await ai.json().catch(()=>null);
    if(!ai.ok){
      console.error('[Ape Telù Vercel] Groq error:',ai.status,data&&data.error&&data.error.message||'unknown');
      return res.status(502).json({ok:false,aiConfigured:true,error:'Ape Telù non riesce a rispondere con il motore AI in questo momento.'});
    }
    const reply=clean(data&&data.choices&&data.choices[0]&&data.choices[0].message&&data.choices[0].message.content,12000);
    if(!reply)return res.status(502).json({ok:false,aiConfigured:true,error:'Risposta AI vuota.'});
    console.log('[Ape Telù Vercel] Groq OK:',String(process.env.GROQ_MODEL||'openai/gpt-oss-20b'));
    return res.status(200).json({ok:true,reply,action:productAction(message,reply,lang),source:'vercel-groq'});
  }catch(error){
    console.error('[Ape Telù Vercel] Errore:',error&&error.message?error.message:error);
    return res.status(500).json({ok:false,aiConfigured:true,error:'Errore temporaneo di Ape Telù.'});
  }
}

async function handleApePelu(req,res,action){
  res.setHeader('Cache-Control','no-store');
  if(action==='status'){
    return res.status(200).json({
      ok:true,
      aiConfigured:Boolean(String(process.env.GROQ_API_KEY||'').trim()),
      provider:'groq',
      model:String(process.env.GROQ_MODEL||'openai/gpt-oss-20b'),
      source:'vercel'
    });
  }
  if(action==='chat'){
    if(req.method!=='POST')return res.status(405).json({ok:false,error:'Metodo non consentito.'});
    return handleChat(req,res);
  }
  return res.status(404).json({ok:false,error:'Azione Ape Telù non valida.'});
}

module.exports={handleApePelu};
