const { callBeeDataApi } = require('../bee-wallet-client');

function clean(value, max = 254) {
  return String(value || '').trim().slice(0, max);
}

function cleanShipping(raw) {
  const s = raw || {};
  return {
    name: clean(s.name, 120),
    email: clean(s.email, 254).toLowerCase(),
    phone: clean(s.phone, 50),
    address: clean(s.address, 180),
    postalCode: clean(s.postalCode || s.postal_code, 20),
    city: clean(s.city, 100),
    state: clean(s.state, 50).toUpperCase(),
    country: clean(s.country || 'Italia', 80),
    notes: clean(s.notes, 500)
  };
}

module.exports = async (req, res) => {
  res.setHeader('Allow', 'POST');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo non consentito.' });

  try {
    const body = req.body || {};
    const action = clean(body.action, 40).toLowerCase();
    const customer = body.customer || {};
    const email = clean(customer.email || body.email, 254).toLowerCase();
    const phone = clean(customer.phone || body.phone, 50);

    let data;
    if (action === 'lookup') {
      if (!email && !phone) return res.status(400).json({ error: 'Inserisci email oppure telefono.' });
      data = await callBeeDataApi('lookup', { email, phone });
    } else if (action === 'add_coupon') {
      if (!email && !phone) return res.status(400).json({ error: 'Inserisci email oppure telefono.' });
      data = await callBeeDataApi('add_coupon', {
        email,
        phone,
        couponCode: clean(body.couponCode, 120).toUpperCase()
      });
    } else if (action === 'check_coupon') {
      data = await callBeeDataApi('check_coupon', {
        couponCode: clean(body.couponCode, 120).toUpperCase()
      });
    } else if (action === 'claim') {
      if (!email && !phone) return res.status(400).json({ error: 'Inserisci email oppure telefono.' });
      data = await callBeeDataApi('claim', {
        email,
        phone,
        giftProducts: Array.isArray(body.giftProducts) ? body.giftProducts : [],
        shipping: cleanShipping(body.shipping)
      });
    } else {
      return res.status(400).json({ error: 'Azione Saldo Api non valida.' });
    }

    const status = Number(data && data.status) || (data && data.ok === false ? 400 : 200);
    return res.status(status).json(data);
  } catch (error) {
    console.error('[Saldo Api] Errore:', error);
    return res.status(error.status || 500).json({
      error: error && error.message ? error.message : 'Impossibile accedere al Saldo Api.'
    });
  }
};
