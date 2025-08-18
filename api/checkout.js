// /api/checkout.js — Vercel Serverless Function
const Stripe = require('stripe');

module.exports = async (req, res) => {
  // CORS (utile anche se provi da GitHub Pages)
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST on /api/checkout' });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const body = req.body || {};
    const items = Array.isArray(body.items) ? body.items : [];

    const line_items = items.length
      ? items
      : [
          {
            price_data: {
              currency: 'eur',
              product_data: { name: 'Miele Millefiori 250g' },
              unit_amount: 500, // €5,00
            },
            quantity: 1,
          },
        ];

    const success_url = 'https://cleo6920.github.io/miele-backend/success.html';
    const cancel_url  = 'https://cleo6920.github.io/miele-backend/cancel.html';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,
      success_url,
      cancel_url,
    });

    return res.status(200).json({ id: session.id, url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    return res.status(500).json({ error: 'Stripe error', details: err.message });
  }
};
