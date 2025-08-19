// api/create-checkout-session.js
import Stripe from 'stripe';

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: 'Stripe secret key mancante sul server' });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

    const { items, customer, success_url, cancel_url, shipping_amount } = req.body || {};
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: 'Nessun articolo nel carrello' });
    }

    const line_items = items.map(it => ({
      quantity: it.quantity,
      price_data: {
        currency: 'eur',
        unit_amount: it.unit_amount, // in centesimi
        product_data: { name: it.name },
      },
    }));

    if (shipping_amount && shipping_amount > 0) {
      line_items.push({
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: shipping_amount,
          product_data: { name: 'Spedizione' },
        },
      });
    }

    const origin = process.env.ALLOWED_ORIGIN || 'https://althea-l-italiano.surge.sh';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      success_url: success_url || `${origin}/success.html`,
      cancel_url: cancel_url || origin,
      customer_email: customer?.email || undefined,
      billing_address_collection: 'required',
      shipping_address_collection: { allowed_countries: ['IT'] },
      metadata: {
        name: customer?.name || '',
        phone: customer?.phone || '',
      },
    });

    return res.status(200).json({ sessionId: session.id });
  } catch (err) {
    console.error('ERR create-checkout-session:', err);
    return res.status(500).json({ error: 'Errore creazione sessione' });
  }
}
