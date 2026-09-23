const xpayGateway = require('../xpay-gateway');
module.exports = async (_req,res)=>{
  res.setHeader('Cache-Control','no-store');
  return res.status(200).json({
    provider:'Nexi XPay',
    configured:xpayGateway.isConfigured(),
    liveEnabled:xpayGateway.isLiveEnabled(),
    mode:xpayGateway.isLiveEnabled()?'production':'prepared',
    beeDatabaseConfigured:Boolean(String(process.env.BEE_DATABASE_URL||'').trim())
  });
};