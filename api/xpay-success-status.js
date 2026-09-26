const xpayGateway = require('../xpay-gateway');
const receiptHandler = require('../xpay-receipt-helper');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Metodo non consentito.' });
  }
  if (String(req.query && req.query.receipt || '') === '1') {
    return receiptHandler(req, res);
  }
  return xpayGateway.successStatusHandler(req, res);
};
