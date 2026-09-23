const xpayGateway = require('../xpay-gateway');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Metodo non consentito.' });
  }
  return xpayGateway.successStatusHandler(req, res);
};
