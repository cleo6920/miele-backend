const xpayGateway = require('../xpay-gateway');
function normalizeBody(req){
  if(req.body && typeof req.body==='object' && !Buffer.isBuffer(req.body)) return req.body;
  const raw=Buffer.isBuffer(req.body)?req.body.toString('utf8'):String(req.body||'');
  return Object.fromEntries(new URLSearchParams(raw));
}
module.exports = async (req,res)=>{
  req.body=normalizeBody(req);
  return xpayGateway.notifyHandler(req,res);
};