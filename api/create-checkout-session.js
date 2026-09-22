const Stripe = require('stripe');
const {
  isTestPurchaseMode,
  createTestPurchase,
  getTestPurchase,
  redeemTestCoupon
} = require('../test-purchase-store');

const DEFAULT_SITE_URL = 'https://lafabbricadelleapi.it';

function cleanText(value, maxLength = 200) {
  return String(value || '').trim().slice(0, maxLength);
}

function getSiteUrl() {
  return String(process.env.APP_URL || DEFAULT_SITE_URL)
    .trim()
    .replace(/\/+$/, '');
}

module.exports = async (req, res) => {
  res.setHeader('Allow', 'POST');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito.' });
  }

  try {
    const body = req.body || {};

    if (body.testAction) {
      if (!isTestPurchaseMode()) {
        return res.status(404).json({ error: 'Modalità acquisto simulato non attiva.' });
      }

      if (body.testAction === 'status') {
        const order = await getTestPurchase(body.orderId);
        if (!order) return res.status(404).json({ error: 'Ordine TEST non trovato.' });
        return res.status(200).json(order);
      }

      if (body.testAction === 'redeem') {
        const result = await redeemTestCoupon(body.couponCode, body.giftProducts);
        return res.status(result.status || (result.ok === false ? 400 : 200)).json(result);
      }

      return res.status(400).json({ error: 'Azione TEST non valida.' });
    }

    const items = Array.isArray(body.items) ? body.items : [];
    const sanitizedItems = items.map((item) => {
      const name = cleanText(item && item.name, 120);
      const amountEuro = Number(item && item.amount);
      const quantity = Number(item && item.quantity);
      const unitAmount = Math.round(amountEuro * 100);

      if (!name || !Number.isFinite(unitAmount) || unitAmount < 1 ||
          !Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
        throw new Error('Dati di uno o più prodotti non validi.');
      }

      return {
        name,
        amount: unitAmount / 100,
        quantity
      };
    });

    if (sanitizedItems.length === 0) {
      return res.status(400).json({ error: 'Il carrello è vuoto.' });
    }

    const cartMeta = Array.isArray(body.xpayCart) ? body.xpayCart : [];
    const orderNote = cleanText(body.notes, 120);
    const isAlveoDigitalOrder =
      sanitizedItems.length === 1 &&
      (
        cleanText(cartMeta[0] && cartMeta[0].productId, 180) === 'alveo-digitale-10-colazioni' ||
        orderNote === 'ALVEO_DIGITALE:10_COLAZIONI' ||
        /10 Colazioni dell[’']Alveare\s*-\s*PDF digitale/i.test(sanitizedItems[0].name)
      );

    // I contenuti digitali non hanno costi di spedizione, indipendentemente
    // da eventuali override/intercettori del carrello fisico.
    const shippingEuro = isAlveoDigitalOrder ? 0 : Number(body.shippingCostOverride || 0);
    const shippingCents = Math.round(shippingEuro * 100);
    if (!Number.isFinite(shippingCents) || shippingCents < 0) {
      return res.status(400).json({ error: 'Costo di spedizione non valido.' });
    }

    const customer = body.customer || {};
    const email = cleanText(customer.email || body.email, 254);
    const safeCustomer = {
      name: cleanText(customer.name, 100),
      email,
      phone: cleanText(customer.phone, 50),
      address: cleanText(customer.address, 150),
      postal_code: cleanText(customer.postal_code, 20),
      city: cleanText(customer.city, 80),
      state: cleanText(customer.state, 30)
    };

    const orderReference = [
      safeCustomer.name,
      safeCustomer.phone,
      safeCustomer.address,
      safeCustomer.postal_code,
      safeCustomer.city,
      safeCustomer.state
    ].filter(Boolean).join(' | ').slice(0, 500);

    if (isTestPurchaseMode()) {
      const testPurchase = await createTestPurchase({
        items: sanitizedItems,
        testCart: Array.isArray(body.testCart) ? body.testCart : [],
        shippingEuro,
        customer: safeCustomer,
        notes: cleanText(body.notes, 500)
      });

      console.log(`[TEST PURCHASE] Ordine ${testPurchase.orderId} salvato permanentemente: €${Number(testPurchase.total).toFixed(2)}, ${testPurchase.beePoints} Api, coupon ${testPurchase.coupon && testPurchase.coupon.code}.`);
      return res.status(200).json({
        id: testPurchase.orderId,
        url: `/test-purchase-success.html?order_id=${encodeURIComponent(testPurchase.orderId)}`,
        testMode: true
      });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('[Stripe] Variabile STRIPE_SECRET_KEY non configurata.');
      return res.status(500).json({
        error: 'Configurazione Stripe mancante (STRIPE_SECRET_KEY).'
      });
    }

    const lineItems = sanitizedItems.map((item) => ({
      price_data: {
        currency: 'eur',
        product_data: { name: item.name },
        unit_amount: Math.round(item.amount * 100)
      },
      quantity: item.quantity
    }));

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

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const siteUrl = getSiteUrl();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      success_url: `${siteUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/cancel.html`,
      customer_email: email || undefined,
      metadata: {
        customer: orderReference || 'Cliente sito',
        notes: cleanText(body.notes, 500)
      }
    });

    return res.status(200).json({ id: session.id, url: session.url });
  } catch (error) {
    const prefix = isTestPurchaseMode() ? '[TEST PURCHASE]' : '[Stripe]';
    console.error(`${prefix} Errore creazione Checkout Session:`, error);
    return res.status(error && error.status ? error.status : 500).json({
      error: error && error.message
        ? error.message
        : 'Impossibile avviare il pagamento.'
    });
  }
};
