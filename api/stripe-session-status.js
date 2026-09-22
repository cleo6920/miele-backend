const Stripe = require('stripe');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok:false, error:'Metodo non consentito.' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ ok:false, error:'Configurazione Stripe mancante.' });
  }

  const sessionId = String(req.query && req.query.session_id || '').trim();
  if (!sessionId) {
    return res.status(400).json({ ok:false, error:'Sessione di pagamento mancante.' });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return res.status(200).json({
      ok:true,
      id:session.id,
      paymentStatus:session.payment_status,
      status:session.status,
      customerEmail:session.customer_details?.email || session.customer_email || '',
      amountTotal:Number(session.amount_total || 0) / 100,
      currency:session.currency || 'eur'
    });
  } catch (error) {
    console.error('[Stripe status]', error);
    return res.status(500).json({ ok:false, error:'Impossibile verificare il pagamento.' });
  }
};
