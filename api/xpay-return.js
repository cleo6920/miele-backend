const xpayGateway = require('../xpay-gateway');
module.exports = async (req,res)=>xpayGateway.returnHandler(req,res);