const {Pool}=require('pg');
const DB_URL=String(process.env.BEE_DATABASE_URL||process.env.DATABASE_URL||'').trim();
let pool;
function db(){if(!DB_URL)throw new Error('Database stock non configurato.');if(!pool)pool=new Pool({connectionString:DB_URL,max:1,idleTimeoutMillis:30000,connectionTimeoutMillis:10000});return pool;}
const CATALOG=[{"id":"propolterapy-professional","name":"PropolTerapy Professional"},{"id":"capsule-pb","name":"Capsule Propoli P+B (5 pz)"},{"id":"capsule-propolit","name":"Capsule PROPOLIT (5 pz)"},{"id":"castagno","name":"Miele di Castagno"},{"id":"acacia-zenzero-apinfiore","name":"Miele di Acacia e Zenzero"},{"id":"miele-eucalipto-apinfiore","name":"Miele Eucalipto"},{"id":"balsammiel","name":"Balsamico Italiano"},{"id":"acacia","name":"Miele Italiano di Acacia"},{"id":"favo-integrale-bio","name":"Miele Italiano di Acacia in Favo"},{"id":"polline-italiano","name":"Polline Italiano"},{"id":"pappa-reale-italiana-bio","name":"Pappa Reale Fresca"},{"id":"orsetti-gommosi","name":"Orsetti Gommosi BIO con Propoli e Miele"},{"id":"bee-energy-bio","name":"Bee Energy BIO"},{"id":"propol-active-bio","name":"Propol Active BIO"},{"id":"propoli-30-spray-integratore","name":"Soluzione Propoli 30% Spray"},{"id":"propoli-30-alcolica-integratore","name":"Soluzione Propoli 30% con Contagocce - Alcolica"},{"id":"propoli-analcolica-integratore","name":"Soluzione Propoli con Contagocce Analcolica"},{"id":"cosmesi-crema-mani","name":"Crema Mani"},{"id":"cosmesi-burrocacao-propoli-aloe","name":"Burrocacao Propoli e Aloe Vera"},{"id":"cosmesi-burrocacao-miele-pappa-reale","name":"Burrocacao Miele e Pappa Reale"},{"id":"cosmesi-shampoo-multivitaminico","name":"Shampoo Multivitaminico"},{"id":"cosmesi-saponetta-frutti-bosco","name":"Saponetta Miele e Frutti di Bosco"},{"id":"cosmesi-saponetta-lavanda","name":"Saponetta Miele e Lavanda"},{"id":"cosmesi-saponetta-aloe-vera","name":"Saponetta Miele e Aloe Vera"},{"id":"cosmesi-candela-alveare-cera-api","name":"Candela Alveare Grande in Cera d’Api"},{"id":"cosmesi-travel-kit-benessere","name":"Kit da Viaggio Benessere dell’Alveare"},{"id":"unguento-apis","name":"SOS DOL – Unguento al Veleno d’Api"},{"id":"sos-dol-50ml","name":"SOS DOL – Unguento al Veleno d’Api"},{"id":"apis1-crema-viso-veleno-api","name":"Crema Viso al Veleno d’Api – APIS1"},{"id":"apis2-siero-viso-veleno-api","name":"Siero Viso al Veleno d’Api – APIS2"},{"id":"apis4-crema-corpo-veleno-api-manuka","name":"Crema Corpo Veleno d’Api e Miele di Manuka – APIS4"},{"id":"apis5-gommage-veleno-api-manuka","name":"Gommage Viso e Corpo Veleno d’Api e Miele di Manuka – APIS5"},{"id":"bagnodoccia-veleno-oro","name":"Bagnodoccia Veleno d’Oro – APIS7"},{"id":"tesori-limoncello","name":"Limoncello “I Tesori di Francesco”"},{"id":"tesori-liquore-caffe","name":"Liquore di Caffè “I Tesori di Francesco”"},{"id":"tesori-castagne-rum","name":"Castagne al Rum “I Tesori di Francesco”"},{"id":"regalo-sapori-del-bosco","name":"Sapori del Bosco – Confezione Tris"},{"id":"regalo-b01-dolce-incontro","name":"Dolce Incontro – Confezione Bis"},{"id":"regalo-b02-pausa-doro","name":"Pausa d’Oro – Confezione Bis"},{"id":"regalo-b03-abbraccio-dautunno","name":"Abbraccio d’Autunno – Confezione Bis"},{"id":"regalo-b04-agrumi-in-fiore","name":"Agrumi in Fiore – Confezione Bis"},{"id":"regalo-b05-due-terre-un-miele","name":"Due Terre, Un Miele – Confezione Bis"},{"id":"regalo-b06-essenza-di-natura","name":"Essenza di Natura – Confezione Bis"},{"id":"regalo-t01-tre-sapori-una-storia","name":"Tre Sapori, Una Storia – Confezione Tris"},{"id":"regalo-t02-arcobaleno-di-dolcezza","name":"Arcobaleno di Dolcezza – Confezione Tris"},{"id":"regalo-t03-la-dolce-meraviglia","name":"La Dolce Meraviglia – Confezione Tris"},{"id":"regalo-t04-tesori-dell-alveare","name":"Tesori dell’Alveare – Confezione Tris"},{"id":"regalo-t05-radici-di-miele","name":"Radici di Miele – Confezione Tris"},{"id":"regalo-t06-risveglio-dorato","name":"Risveglio Dorato – Confezione Tris"},{"id":"regalo-t07-soffio-di-natura","name":"Soffio di Natura – Confezione Tris"},{"id":"regalo-t08-carezza-balsamica","name":"Carezza Balsamica – Confezione Tris"},{"id":"regalo-t09-intenso-incanto","name":"Intenso Incanto – Confezione Tris"},{"id":"regalo-i01-energia-dell-alveare","name":"Energia dell’Alveare – Confezione Bis"},{"id":"regalo-i02-vitalita-dell-alveare","name":"Vitalità dell’Alveare – Confezione Tris"},{"id":"regalo-i03-il-polline-e-la-propoli","name":"Il Polline e la Propoli – Confezione Bis"},{"id":"regalo-i04-vitalita-naturale","name":"Vitalità Naturale – Confezione Bis"},{"id":"regalo-i05-energia-dell-alveare-plus","name":"Energia dell’Alveare Plus – Confezione Tris (da completare)"},{"id":"regalo-i06-benessere-delle-api","name":"Benessere delle Api – Confezione Tris"},{"id":"regalo-i07-le-risorse-dell-alveare","name":"Le Risorse dell’Alveare – Confezione Tris"},{"id":"alveo-digitale-10-colazioni","name":"10 Colazioni dell’Alveare – Edizione Premium"}];
async function ensureTable(){
  const p=db();
  await p.query(`create table if not exists shop_stock(
    product_id text primary key,
    product_name text not null,
    stock_qty integer,
    enabled boolean not null default true,
    updated_at timestamptz not null default now()
  )`);
  const initial=CATALOG.map(item=>({
    id:item.id,name:item.name,
    qty:item.id.startsWith('regalo-i0')?0:['regalo-sapori-del-bosco','regalo-b01-dolce-incontro','regalo-b02-pausa-doro',
      'regalo-b03-abbraccio-dautunno','regalo-b04-agrumi-in-fiore','regalo-b05-due-terre-un-miele',
      'regalo-b06-essenza-di-natura','regalo-t01-tre-sapori-una-storia','regalo-t02-arcobaleno-di-dolcezza',
      'regalo-t03-la-dolce-meraviglia','regalo-t04-tesori-dell-alveare','regalo-t05-radici-di-miele',
      'regalo-t06-risveglio-dorato','regalo-t07-soffio-di-natura','regalo-t08-carezza-balsamica',
      'regalo-t09-intenso-incanto'].includes(item.id)?1:null
  }));
  // One query instead of a round trip for every catalog item; never reset recorded quantities.
  await p.query(
    `insert into shop_stock(product_id,product_name,stock_qty)
     select x.id,x.name,x.qty from jsonb_to_recordset($1::jsonb) as x(id text,name text,qty integer)
     on conflict(product_id) do update set product_name=excluded.product_name`,
    [JSON.stringify(initial)]
  );
  // Una sola riconciliazione dei valori provvisori "1": per le confezioni
  // realizzabili con prodotti inventariati usiamo le quantità pianificate.
  // Le tre confezioni BIO Vaccaro attenderanno l'arrivo dei mieli da 500 g.
  // Le quantità eventualmente già modificate/vendute (diverse da 1) restano intatte.
  const planned={
    'regalo-sapori-del-bosco':1,'regalo-b01-dolce-incontro':12,
    'regalo-b02-pausa-doro':4,'regalo-b03-abbraccio-dautunno':2,
    'regalo-b04-agrumi-in-fiore':0,'regalo-b05-due-terre-un-miele':0,
    'regalo-b06-essenza-di-natura':0,'regalo-t01-tre-sapori-una-storia':9,
    'regalo-t02-arcobaleno-di-dolcezza':5,'regalo-t03-la-dolce-meraviglia':1,
    'regalo-t04-tesori-dell-alveare':1,'regalo-t05-radici-di-miele':2,
    'regalo-t06-risveglio-dorato':3,'regalo-t07-soffio-di-natura':2,
    'regalo-t08-carezza-balsamica':1,'regalo-t09-intenso-incanto':1
  };
  const client=await p.connect();
  try{
    await client.query('BEGIN');
    await client.query("create table if not exists shop_stock_migrations(marker text primary key, applied_at timestamptz not null default now())");
    const marker=await client.query("insert into shop_stock_migrations(marker) values($1) on conflict do nothing returning marker",['gift-plan-20261022-verified-first-seed']);
    if(marker.rowCount){
      await client.query(
        `update shop_stock s
         set stock_qty=p.qty,updated_at=now()
         from jsonb_to_recordset($1::jsonb) as p(id text,qty integer)
         where s.product_id=p.id and s.stock_qty=1`,
        [JSON.stringify(Object.entries(planned).map(([id,qty])=>({id,qty})))]
      );
    }

    // One-off, non-recurring stock allocation from approved Integratori inventory.
    // User authorised treating Pronto Natura/KONTAK orders as ordered goods.
    // Never refill a sold-out SKU in subsequent requests or deployments.
    // I05 remains disabled: photograph/composition still includes Sinugem.
    const integratoriSeed=await client.query(
      "insert into shop_stock_migrations(marker) values($1) on conflict do nothing returning marker",
      ['gift-integratori-ordered-allocation-20261023-v1']
    );
    if(integratoriSeed.rowCount){
      const allocation=[{"id":"regalo-i01-energia-dell-alveare","qty":1,"enabled":true},{"id":"regalo-i02-vitalita-dell-alveare","qty":1,"enabled":true},{"id":"regalo-i03-il-polline-e-la-propoli","qty":1,"enabled":true},{"id":"regalo-i04-vitalita-naturale","qty":1,"enabled":true},{"id":"regalo-i05-energia-dell-alveare-plus","qty":0,"enabled":false},{"id":"regalo-i06-benessere-delle-api","qty":1,"enabled":true},{"id":"regalo-i07-le-risorse-dell-alveare","qty":1,"enabled":true}];
      await client.query(
        `update shop_stock s
         set stock_qty=a.qty, enabled=a.enabled, updated_at=now()
         from jsonb_to_recordset($1::jsonb) as a(id text,qty integer,enabled boolean)
         where s.product_id=a.id and s.stock_qty=0`,
        [JSON.stringify(allocation)]
      );
    }

    await client.query('COMMIT');
  }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
}
async function listStock(){
  await ensureTable();
  const r=await db().query("select product_id,product_name,stock_qty,enabled,updated_at from shop_stock order by product_name asc");
  return r.rows||[];
}
const GIFT_IDS = new Set(CATALOG.map(x=>x.id).filter(x=>x.startsWith('regalo-')));
async function getGiftStock(ids){
  await ensureTable();
  const requested = Array.isArray(ids) && ids.length ? [...new Set(ids.map(String))].filter(id=>GIFT_IDS.has(id)).slice(0,50) : [...GIFT_IDS];
  if(!requested.length)return [];
  const result = await db().query("select product_id,stock_qty,enabled,updated_at from shop_stock where product_id=any($1::text[])",[requested]);
  return result.rows.map(row=>({id:row.product_id,available:row.stock_qty===null?null:Math.max(0,Number(row.stock_qty)),enabled:row.enabled===true,updatedAt:row.updated_at}));
}
async function updateStock(productId,qty,enabled){
  await ensureTable();
  const id=String(productId||'').trim();
  if(!CATALOG.some(x=>x.id===id))throw new Error('Prodotto non riconosciuto.');
  const q=qty===null||qty===''?null:Math.max(0,Math.min(100000,Math.round(Number(qty)||0)));
  const r=await db().query("update shop_stock set stock_qty=$2,enabled=$3,updated_at=now() where product_id=$1 returning *",[id,q,enabled!==false]);
  return r.rows[0];
}
async function checkStock(items){
  await ensureTable();
  const ids=[...new Set((items||[]).map(x=>String(x.productId||'').trim()).filter(Boolean))];
  if(!ids.length)return true;
  const r=await db().query("select product_id,product_name,stock_qty,enabled from shop_stock where product_id=any($1::text[])",[ids]);
  const map=new Map(r.rows.map(x=>[x.product_id,x]));
  for(const item of items||[]){
    const id=String(item.productId||'').trim(),qty=Math.max(1,Math.round(Number(item.quantity)||1));
    const row=map.get(id); if(!row)continue;
    if(!row.enabled)throw new Error(row.product_name+' non è al momento disponibile.');
    if(row.stock_qty!==null && Number(row.stock_qty)<qty)throw new Error('Disponibilità insufficiente per '+row.product_name+'.');
  }
  return true;
}
async function decrementStock(items){
  await ensureTable();
  const p=db();
  const client=await p.connect();
  try{
    await client.query('begin');
    for(const item of items||[]){
      const id=String(item.productId||'').trim(),qty=Math.max(1,Math.round(Number(item.quantity)||1));
      if(!id)continue;
      const r=await client.query("select product_name,stock_qty,enabled from shop_stock where product_id=$1 for update",[id]);
      const row=r.rows[0]; if(!row)continue;
      if(!row.enabled)throw new Error(row.product_name+' non disponibile.');
      if(row.stock_qty!==null){
        if(Number(row.stock_qty)<qty)throw new Error('Stock insufficiente per '+row.product_name+'.');
        await client.query("update shop_stock set stock_qty=stock_qty-$2,updated_at=now() where product_id=$1",[id,qty]);
      }
    }
    await client.query('commit');
  }catch(e){await client.query('rollback');throw e;}finally{client.release();}
}
module.exports={listStock,getGiftStock,updateStock,checkStock,decrementStock};
