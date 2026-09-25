const crypto=require('crypto');
const {Pool}=require('pg');

const DB_URL=String(process.env.BEE_DATABASE_URL||process.env.DATABASE_URL||'').trim();
let pool;
function getPool(){
  if(!DB_URL) throw new Error('Database Saldo Api non configurato.');
  if(!pool) pool=new Pool({connectionString:DB_URL,max:3,idleTimeoutMillis:30000,connectionTimeoutMillis:10000});
  return pool;
}
function clean(v,max=220){return String(v||'').trim().slice(0,max);}
function normalizeEmail(v){return clean(v,180).toLowerCase();}
function normalizePhone(v){return clean(v,80).replace(/\D+/g,'');}
function normalizeCode(v){return clean(v,40).toUpperCase().replace(/\s+/g,'');}
function makeWalletCode(){const x=crypto.randomBytes(5).toString('hex').toUpperCase();return 'APE-'+x.slice(0,4)+'-'+x.slice(4,8)+'-'+x.slice(8,10);}
async function accountIdsFor({email='',phone='',code=''}) {
  const p=getPool();
  const ids=new Set();
  const e=normalizeEmail(email), ph=normalizePhone(phone), c=normalizeCode(code);

  if(c){
    const r=await p.query(
      "select account_id from bee_identities where lower(identifier)=lower($1) or lower(identifier)=lower($2)",
      ['code:'+c,c]
    );
    r.rows.forEach(x=>ids.add(x.account_id));
  }

  if(e){
    const r1=await p.query(
      "select account_id from bee_identities where lower(identifier)=lower($1) or lower(identifier)=lower($2)",
      ['email:'+e,e]
    );
    r1.rows.forEach(x=>ids.add(x.account_id));
    const r2=await p.query(
      "select distinct account_id from bee_orders where lower(coalesce(customer->>'email',''))=$1",
      [e]
    );
    r2.rows.forEach(x=>ids.add(x.account_id));
  }

  if(ph){
    const r1=await p.query(
      "select account_id from bee_identities where regexp_replace(identifier,'[^0-9]','','g')=$1",
      [ph]
    );
    r1.rows.forEach(x=>ids.add(x.account_id));
    const r2=await p.query(
      "select distinct account_id from bee_orders where regexp_replace(coalesce(customer->>'phone',''),'[^0-9]','','g')=$1",
      [ph]
    );
    r2.rows.forEach(x=>ids.add(x.account_id));
  }
  return [...ids].filter(Boolean);
}
async function balanceForAccounts(accountIds){
  if(!accountIds.length) return {balance:0,earned:0,spent:0};
  const p=getPool();
  const earnedQ=await p.query(
    "select coalesce(sum(bee_points),0)::int as earned from bee_orders where account_id=any($1::text[])",
    [accountIds]
  );
  const spentQ=await p.query(
    "select coalesce(sum(points_spent),0)::int as spent from bee_reward_claims where account_id=any($1::text[])",
    [accountIds]
  );
  const couponQ=await p.query(
    "select count(*)::int as n, coalesce(sum(greatest(points_remaining,0)),0)::int as remaining from bee_coupons where assigned_account_id=any($1::text[])",
    [accountIds]
  );
  const earned=Number(earnedQ.rows[0]?.earned||0);
  const spent=Number(spentQ.rows[0]?.spent||0);
  const couponCount=Number(couponQ.rows[0]?.n||0);
  const remaining=Number(couponQ.rows[0]?.remaining||0);
  const balance=couponCount>0?remaining:Math.max(0,earned-spent);
  return {balance,earned,spent};
}
async function lookupWallet(identity){
  const accountIds=await accountIdsFor(identity||{});
  if(!accountIds.length) return {found:false,balance:0,earned:0,spent:0};
  const b=await balanceForAccounts(accountIds);
  return {found:true,...b};
}
async function hasFreeEditionAward(identity,editionId){
  const accountIds=await accountIdsFor(identity||{});
  if(!accountIds.length)return false;
  const p=getPool();
  const r=await p.query(
    "select 1 from bee_orders where account_id=any($1::text[]) and bee_points>0 and lower(coalesce(notes,'')) like lower($2) limit 1",
    [accountIds,'%'+clean(editionId,80)+'%']
  );
  return Boolean(r.rows[0]);
}
async function attachContactToOrder(orderId,{email='',phone=''}={}){
  const p=getPool();
  const r=await p.query("select account_id from bee_orders where order_id=$1 limit 1",[clean(orderId,220)]);
  const accountId=r.rows[0]?.account_id;
  if(!accountId) return false;
  const e=normalizeEmail(email), ph=normalizePhone(phone);
  const identifiers=[];
  if(e) identifiers.push('email:'+e);
  if(ph) identifiers.push('phone:'+ph);
  for(const identifier of identifiers){
    await p.query(
      "insert into bee_identities(identifier,account_id,created_at) values($1,$2,now()) on conflict(identifier) do nothing",
      [identifier,accountId]
    );
  }
  return true;
}
async function ensureWalletCodeForOrder(orderId){
  const p=getPool();
  const r=await p.query("select account_id from bee_orders where order_id=$1 limit 1",[clean(orderId,220)]);
  const accountId=r.rows[0]?.account_id;
  if(!accountId) return '';
  const existing=await p.query(
    "select identifier from bee_identities where account_id=$1 and lower(identifier) like 'code:ape-%' order by created_at asc limit 1",
    [accountId]
  );
  if(existing.rows[0]?.identifier) return String(existing.rows[0].identifier).replace(/^code:/i,'').toUpperCase();
  for(let i=0;i<8;i++){
    const code=makeWalletCode();
    try{
      await p.query(
        "insert into bee_identities(identifier,account_id,created_at) values($1,$2,now()) on conflict(identifier) do nothing",
        ['code:'+code,accountId]
      );
      const check=await p.query("select account_id from bee_identities where identifier=$1",['code:'+code]);
      if(check.rows[0]?.account_id===accountId) return code;
    }catch(_){}
  }
  throw new Error('Impossibile creare il Codice Punti Ape.');
}
module.exports={lookupWallet,ensureWalletCodeForOrder,attachContactToOrder,hasFreeEditionAward,normalizeEmail,normalizePhone,normalizeCode};