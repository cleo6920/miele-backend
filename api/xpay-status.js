const xpayGateway = require('../xpay-gateway');
const {getGiftStock}=require('../stock-store');
module.exports = async (req,res)=>{
  res.setHeader('Cache-Control','no-store');
  if(req.query && req.query.giftStock==='1'){
    if(req.method!=='GET')return res.status(405).json({error:'Metodo non consentito'});
    const id=typeof req.query.id==='string'?req.query.id.trim():'';
    if(id && !/^regalo-[a-z0-9-]{1,110}$/.test(id))return res.status(400).json({error:'Codice confezione non valido'});
    try{
      const items=await getGiftStock(id?[id]:null);
      return res.status(200).json({ok:true,items,checkedAt:new Date().toISOString()});
    }catch(error){
      console.error('[XPay] Stato disponibilità:',error&&error.message);
      return res.status(503).json({ok:false,error:'Disponibilità non verificabile ora'});
    }
  }
  return res.status(200).json({
    provider:'Nexi XPay',
    configured:xpayGateway.isConfigured(),
    liveEnabled:xpayGateway.isLiveEnabled(),
    mode:xpayGateway.isLiveEnabled()?'production':'prepared',
    beeDatabaseConfigured:Boolean(String(process.env.BEE_DATABASE_URL||process.env.DATABASE_URL||'').trim())
  });
};