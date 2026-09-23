const { Pool } = require('pg');

module.exports = async function(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET') return res.status(405).json({ok:false});
  if(String(req.query?.probe||'')!=='schema-20260923') return res.status(404).json({ok:false});
  const url=String(process.env.BEE_DATABASE_URL||process.env.DATABASE_URL||'').trim();
  if(!url) return res.status(503).json({ok:false,error:'database-not-configured'});
  const pool=new Pool({connectionString:url,max:1,connectionTimeoutMillis:8000});
  try{
    const funcs=await pool.query(`
      select p.proname, pg_get_function_identity_arguments(p.oid) as args,
             pg_get_functiondef(p.oid) as definition
      from pg_proc p
      join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public'
        and p.proname in ('bee_wallet_api','bee_lookup_wallet','bee_create_purchase','bee_claim_by_identity','bee_claim_by_coupon')
      order by p.proname
    `);
    return res.json({ok:true,functions:funcs.rows});
  }catch(e){
    return res.status(500).json({ok:false,error:String(e?.message||e).slice(0,500)});
  }finally{
    try{await pool.end();}catch(_){}
  }
};