// api/create-checkout-session.js
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  // ... tuo codice Stripe ...
  res.status(200).json({ ok: true });
};
