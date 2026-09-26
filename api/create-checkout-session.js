const xpayGateway = require('../xpay-gateway');
const {applyPromo,normalizeCode}=require('../promo-store');

function cleanText(value, maxLength = 200) {
  return String(value || '').trim().slice(0, maxLength);
}

module.exports = async (req, res) => {
  res.setHeader('Allow', 'POST');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito.' });
  }

  try {
    if (!xpayGateway.isConfigured()) {
      console.error('[XPay] Configurazione Nexi incompleta.');
      return res.status(503).json({ error: 'Pagamento Nexi non ancora configurato.' });
    }
    if (!xpayGateway.isLiveEnabled()) {
      console.error('[XPay] XPAY_LIVE_ENABLED non attivo.');
      return res.status(503).json({ error: 'Pagamento Nexi non ancora abilitato.' });
    }

    const body = req.body || {};
    const requestedLanguage = cleanText(body.language, 5).toLowerCase();
    const orderLanguage = ['it','en','de','fr','es'].includes(requestedLanguage) ? requestedLanguage : 'it';
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

      return { name, amount: unitAmount / 100, quantity };
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

    const goodsCents = sanitizedItems.reduce(
      (sum, item) => sum + (Math.round(item.amount * 100) * item.quantity),
      0
    );
    const rawTotalCents = goodsCents + shippingCents;
    const promoCode=normalizeCode(body.promoCode||'');
    let promo=null;
    let totalCents=rawTotalCents;
    if(promoCode){
      promo=await applyPromo(promoCode,goodsCents,shippingCents);
      totalCents=promo.totalCents;
    }
    if(body.validatePromo===true){
      return res.status(200).json({
        ok:true,
        promo:promo?{
          code:promo.code,
          testMode:promo.testMode,
          originalTotal:Number((promo.originalTotalCents/100).toFixed(2)),
          discount:Number((promo.discountCents/100).toFixed(2)),
          total:Number((promo.totalCents/100).toFixed(2))
        }:null
      });
    }
    const itemSummary = sanitizedItems
      .map((item) => item.quantity + 'x ' + item.name)
      .join(' | ')
      .slice(0, 200);

    const purchaseItems = sanitizedItems.map((item, index) => ({
      productId: cleanText(cartMeta[index] && cartMeta[index].productId, 180),
      productName: cleanText(
        (cartMeta[index] && (cartMeta[index].productName || cartMeta[index].name)) || item.name,
        180
      ),
      name: item.name,
      amount: item.amount,
      quantity: item.quantity
    }));

    const payment = xpayGateway.createPaymentRedirectUrl({
      amountCents: totalCents,
      email,
      description: 'Ordine La Fabbrica delle Api',
      note1: orderReference,
      note2: itemSummary,
      note3: cleanText(body.notes, 200),
      purchase: {
        items: purchaseItems,
        goodsTotal: goodsCents / 100,
        shipping: shippingCents / 100,
        discount: promo ? promo.discountCents / 100 : 0,
        total: totalCents / 100,
        promoCode: promo ? promo.code : '',
        promoTestMode: Boolean(promo&&promo.testMode),
        customer: safeCustomer,
        language: orderLanguage,
        notes: cleanText(body.notes, 500)
      }
    });

    console.log('[XPay] Avvio pagamento ' + payment.id + ' per ' + (totalCents / 100).toFixed(2) + ' EUR.');
    return res.status(200).json(payment);
  } catch (error) {
    console.error('[XPay] Errore avvio pagamento:', error);
    return res.status(error && error.status ? error.status : 500).json({
      error: error && error.message ? error.message : 'Impossibile avviare il pagamento Nexi.'
    });
  }
};
