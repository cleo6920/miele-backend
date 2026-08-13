const Stripe = require('stripe');

const SITE_URL = 'https://miele-backend-omega.vercel.app';

function cleanText(value, maxLength = 200) {
  return String(value || '').trim().slice(0, maxLength);
}

module.exports = async (req, res) => {
  res.setHeader('Allow', 'POST');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito.' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('[Stripe] Variabile STRIPE_SECRET_KEY non configurata.');
    return res.status(500).json({
      error: 'Configurazione Stripe mancante su Vercel (STRIPE_SECRET_KEY).'
    });
  }

  try {
    const body = req.body || {};
    const items = Array.isArray(body.items) ? body.items : [];

    const lineItems = items.map((item) => {
      const name = cleanText(item && item.name, 120);
      const amountEuro = Number(item && item.amount);
      const quantity = Number(item && item.quantity);
      const unitAmount = Math.round(amountEuro * 100);

      if (!name || !Number.isFinite(unitAmount) || unitAmount < 1 ||
          !Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
        throw new Error('Dati di uno o più prodotti non validi.');
      }

      return {
        price_data: {
          currency: 'eur',
          product_data: { name },
          unit_amount: unitAmount
        },
        quantity
      };
    });

    if (lineItems.length === 0) {
      return res.status(400).json({ error: 'Il carrello è vuoto.' });
    }

    const shippingEuro = Number(body.shippingCostOverride || 0);
    const shippingCents = Math.round(shippingEuro * 100);
    if (!Number.isFinite(shippingCents) || shippingCents < 0) {
      return res.status(400).json({ error: 'Costo di spedizione non valido.' });
    }

    if (shippingCents > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: { name: 'Spedizione' },
          unit_amount: shippingCents
        },
        quantity: 1
      });
    }

    const customer = body.customer || {};
    const email = cleanText(customer.email || body.email, 254);
    const orderReference = [
      cleanText(customer.name, 100),
      cleanText(customer.phone, 50),
      cleanText(customer.address, 150),
      cleanText(customer.postal_code, 20),
      cleanText(customer.city, 80),
      cleanText(customer.state, 30)
    ].filter(Boolean).join(' | ').slice(0, 500);

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      success_url: `${SITE_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/cancel.html`,
      customer_email: email || undefined,
      metadata: {
        customer: orderReference || 'Cliente sito',
        notes: cleanText(body.notes, 500)
      }
    });

    return res.status(200).json({ id: session.id, url: session.url });
  } catch (error) {
    console.error('[Stripe] Errore creazione Checkout Session:', error);
    return res.status(500).json({
      error: error && error.message
        ? error.message
        : 'Impossibile avviare il pagamento.'
    });
  }
};

