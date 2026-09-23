const { Pool } = require('pg');
const { callBeeDataApi } = require('../bee-wallet-client');

module.exports = async function(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET') return res.status(405).json({ok:false});
  if(String(req.query?.probe||'')!=='saldo-api-20260923') return res.status(404).json({ok:false});

  const dbUrl=String(process.env.BEE_DATABASE_URL||'').trim();
  const out={directConfigured:Boolean(dbUrl),directOk:false,directError:'',functions:[]};

  if(dbUrl){
    const pool=new Pool({connectionString:dbUrl,max:1,connectionTimeoutMillis:8000});
    try{
      const q=await pool.query("select current_database() as db, current_schema() as schema");
      out.directOk=true;
      out.direct=q.rows?.[0]||null;
      const fns=await pool.query("select p.proname, pg_get_function_identity_arguments(p.oid) as args from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='bee_wallet_api'");
      out.functions=fns.rows||[];
    }catch(e){out.directError=String(e?.message||e).slice(0,300);}
    try{await pool.end();}catch(_){}
  }

  try{
    const data=await callBeeDataApi('get_balance',{email:'probe-does-not-exist@example.invalid'});
    out.getBalance={ok:true,data};
  }catch(error){
    out.getBalance={ok:false,error:String(error?.message||error).slice(0,300)};
  }
  return res.json({ok:true,...out});
};