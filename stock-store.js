const {Pool}=require('pg');
const DB_URL=String(process.env.BEE_DATABASE_URL||process.env.DATABASE_URL||'').trim();
let pool;
function db(){if(!DB_URL)throw new Error('Database stock non configurato.');if(!pool)pool=new Pool({connectionString:DB_URL,max:1,idleTimeoutMillis:30000,connectionTimeoutMillis:10000});return pool;}
const CATALOG=[{"id":"propolterapy-professional","name":"PropolTerapy Professional"},{"id":"capsule-pb","name":"Capsule Propoli P+B (5 pz)"},{"id":"capsule-propolit","name":"Capsule PROPOLIT (5 pz)"},{"id":"castagno","name":"Miele di Castagno"},{"id":"acacia-zenzero-apinfiore","name":"Miele di Acacia e Zenzero"},{"id":"miele-eucalipto-apinfiore","name":"Miele Eucalipto"},{"id":"balsammiel","name":"Balsamico Italiano"},{"id":"acacia","name":"Miele Italiano di Acacia"},{"id":"favo-integrale-bio","name":"Miele Italiano di Acacia in Favo"},{"id":"polline-italiano","name":"Polline Italiano"},{"id":"pappa-reale-italiana-bio","name":"Pappa Reale Fresca"},{"id":"orsetti-gommosi","name":"Orsetti Gommosi BIO con Propoli e Miele"},{"id":"bee-energy-bio","name":"Bee Energy BIO"},{"id":"propol-active-bio","name":"Propol Active BIO"},{"id":"propoli-30-spray-integratore","name":"Soluzione Propoli 30% Spray"},{"id":"propoli-30-alcolica-integratore","name":"Soluzione Propoli 30% con Contagocce - Alcolica"},{"id":"propoli-analcolica-integratore","name":"Soluzione Propoli con Contagocce Analcolica"},{"id":"cosmesi-crema-mani","name":"Crema Mani"},{"id":"cosmesi-burrocacao-propoli-aloe","name":"Burrocacao Propoli e Aloe Vera"},{"id":"cosmesi-burrocacao-miele-pappa-reale","name":"Burrocacao Miele e Pappa Reale"},{"id":"cosmesi-shampoo-multivitaminico","name":"Shampoo Multivitaminico"},{"id":"cosmesi-saponetta-frutti-bosco","name":"Saponetta Miele e Frutti di Bosco"},{"id":"cosmesi-saponetta-lavanda","name":"Saponetta Miele e Lavanda"},{"id":"cosmesi-saponetta-aloe-vera","name":"Saponetta Miele e Aloe Vera"},{"id":"cosmesi-candela-alveare-cera-api","name":"Candela Alveare Grande in Cera d’Api"},{"id":"cosmesi-travel-kit-benessere","name":"Kit da Viaggio Benessere dell’Alveare"},{"id":"unguento-apis","name":"SOS DOL – Unguento al Veleno d’Api"},{"id":"sos-dol-50ml","name":"SOS DOL – Unguento al Veleno d’Api"},{"id":"apis1-crema-viso-veleno-api","name":"Crema Viso al Veleno d’Api – APIS1"},{"id":"apis2-siero-viso-veleno-api","name":"Siero Viso al Veleno d’Api – APIS2"},{"id":"apis4-crema-corpo-veleno-api-manuka","name":"Crema Corpo Veleno d’Api e Miele di Manuka – APIS4"},{"id":"apis5-gommage-veleno-api-manuka","name":"Gommage Viso e Corpo Veleno d’Api e Miele di Manuka – APIS5"},{"id":"bagnodoccia-veleno-oro","name":"Bagnodoccia Veleno d’Oro – APIS7"},{"id":"tesori-limoncello","name":"Limoncello “I Tesori di Francesco”"},{"id":"tesori-liquore-caffe","name":"Liquore di Caffè “I Tesori di Francesco”"},{"id":"tesori-castagne-rum","name":"Castagne al Rum “I Tesori di Francesco”"},{"id":"alveo-digitale-10-colazioni","name":"10 Colazioni dell’Alveare – Edizione Premium"}];
async function ensureTable(){
  const p=db();
  await p.query(`create table if not exists shop_stock(
    product_id text primary key,
    product_name text not null,
    stock_qty integer,
    enabled boolean not null default true,
    updated_at timestamptz not null default now()
  )`);
  for(const item of CATALOG){
    await p.query("insert into shop_stock(product_id,product_name) values($1,$2) on conflict(product_id) do update set product_name=excluded.product_name",[item.id,item.name]);
  }
}
async function listStock(){
  await ensureTable();
  const r=await db().query("select product_id,product_name,stock_qty,enabled,updated_at from shop_stock order by product_name asc");
  return r.rows||[];
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
module.exports={listStock,updateStock,checkStock,decrementStock};
