const xpayGateway = require('../xpay-gateway');
module.exports = async (req,res)=>xpayGateway.cancelHandler(req,res);