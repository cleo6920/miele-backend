const { callBeeDataApi } = require('../bee-wallet-client');

module.exports = async function(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET') return res.status(405).json({ok:false});
  if(String(req.query?.probe||'')!=='saldo-api-20260923') return res.status(404).json({ok:false});
  const candidates=[
    ['get_balance',{email:'probe-does-not-exist@example.invalid'}],
    ['balance',{email:'probe-does-not-exist@example.invalid'}],
    ['get_customer_balance',{email:'probe-does-not-exist@example.invalid'}],
    ['find_balance',{email:'probe-does-not-exist@example.invalid'}]
  ];
  const results=[];
  for(const [action,payload] of candidates){
    try{
      const data=await callBeeDataApi(action,payload);
      results.push({action,ok:true,data});
    }catch(error){
      results.push({action,ok:false,error:String(error?.message||error).slice(0,300)});
    }
  }
  return res.json({ok:true,results});
};