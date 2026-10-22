const {getGiftStock}=require('../stock-store');

module.exports=async function giftStockHandler(req,res){
  res.setHeader('Cache-Control','no-store, max-age=0, must-revalidate');
  res.setHeader('Allow','GET');
  if(req.method!=='GET')return res.status(405).json({error:'Metodo non consentito'});
  const id=typeof req.query?.id==='string'?req.query.id.trim():'';
  if(id && (!/^regalo-[a-z0-9-]{1,110}$/.test(id)))return res.status(400).json({error:'Codice confezione non valido'});
  try{
    const items=await getGiftStock(id?[id]:null);
    return res.status(200).json({ok:true,items,checkedAt:new Date().toISOString()});
  }catch(err){
    console.error('[GiftStock] Impossibile leggere le giacenze:',err&&err.message);
    return res.status(503).json({ok:false,error:'Disponibilità non verificabile ora'});
  }
};
