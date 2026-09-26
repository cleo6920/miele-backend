const crypto=require('crypto');
const {Pool}=require('pg');

const DB_URL=String(process.env.BEE_DATABASE_URL||process.env.DATABASE_URL||'').trim();
let pool;
function db(){
  if(!DB_URL) throw new Error('Database promozioni non configurato.');
  if(!pool) pool=new Pool({connectionString:DB_URL,max:1,idleTimeoutMillis:30000,connectionTimeoutMillis:10000});
  return pool;
}
function clean(v,max=80){return String(v||'').trim().slice(0,max);}
function normalizeCode(v){return clean(v,80).toUpperCase().replace(/\s+/g,'');}

async function ensureTable(){
  const p=db();
  await p.query(`
    create table if not exists shop_promo_codes(
      code text primary key,
      kind text not null,
      value_cents integer not null default 0,
      target_total_cents integer,
      max_uses integer,
      uses integer not null default 0,
      active boolean not null default true,
      note text,
      created_at timestamptz not null default now(),
      used_at timestamptz
    )
  `);
  await p.query("create index if not exists shop_promo_codes_created_idx on shop_promo_codes(created_at desc)");
}
async function createTestCode(targetTotalCents=10){
  await ensureTable();
  const target=Math.max(1,Math.min(500,Math.round(Number(targetTotalCents)||10)));
  const p=db();
  for(let i=0;i<8;i++){
    const raw=crypto.randomBytes(5).toString('hex').toUpperCase();
    const code='TEST-'+raw.slice(0,5)+'-'+raw.slice(5);
    try{
      const r=await p.query(
        "insert into shop_promo_codes(code,kind,target_total_cents,max_uses,note) values($1,'test_total',$2,1,$3) returning *",
        [code,target,'Test acquisto reale Nexi']
      );
      return r.rows[0];
    }catch(e){if(e&&e.code==='23505')continue;throw e;}
  }
  throw new Error('Impossibile generare il codice test.');
}
async function listTestCodes(limit=20){
  await ensureTable();
  const r=await db().query(
    "select code,kind,target_total_cents,max_uses,uses,active,note,created_at,used_at from shop_promo_codes where kind='test_total' order by created_at desc limit $1",
    [Math.max(1,Math.min(100,Number(limit)||20))]
  );
  return r.rows;
}
async function getPromo(code){
  await ensureTable();
  const c=normalizeCode(code);
  if(!c)return null;
  const r=await db().query("select * from shop_promo_codes where code=$1 limit 1",[c]);
  return r.rows[0]||null;
}
async function applyPromo(code,subtotalCents,shippingCents){
  const promo=await getPromo(code);
  if(!promo) throw new Error('Codice promozionale non valido.');
  if(!promo.active) throw new Error('Codice promozionale non attivo.');
  if(promo.max_uses!==null && Number(promo.uses||0)>=Number(promo.max_uses)) throw new Error('Codice promozionale già utilizzato.');
  const goods=Math.max(0,Math.round(Number(subtotalCents)||0));
  const shipping=Math.max(0,Math.round(Number(shippingCents)||0));
  const original=goods+shipping;
  if(original<1) throw new Error('Totale ordine non valido.');
  let final=original,discount=0;
  if(promo.kind==='test_total'){
    const target=Math.max(1,Math.round(Number(promo.target_total_cents)||10));
    final=Math.min(original,target);
    discount=Math.max(0,original-final);
  }else{
    throw new Error('Tipo di codice promozionale non supportato.');
  }
  return {
    code:promo.code,kind:promo.kind,testMode:promo.kind==='test_total',
    originalTotalCents:original,discountCents:discount,totalCents:final,
    targetTotalCents:promo.target_total_cents
  };
}
async function consumePromo(code){
  const c=normalizeCode(code); if(!c)return false;
  await ensureTable();
  const r=await db().query(
    `update shop_promo_codes
       set uses=uses+1, used_at=now(),
           active=case when max_uses is not null and uses+1>=max_uses then false else active end
     where code=$1 and active=true and (max_uses is null or uses<max_uses)
     returning code`,[c]
  );
  return Boolean(r.rows[0]);
}
module.exports={createTestCode,listTestCodes,applyPromo,consumePromo,normalizeCode};
