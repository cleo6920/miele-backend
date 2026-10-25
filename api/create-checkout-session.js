const xpayGateway = require('../xpay-gateway');
const {applyPromo,normalizeCode}=require('../promo-store');
const {checkStock}=require('../stock-store');
const {savePendingPayment}=require('../xpay-pending-store');

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

    // Prezzi autorevoli server-side per le confezioni; quantità acquistabili
    // determinate dalla giacenza reale, non più limitate artificialmente a uno.
    const GIFT_UNIT_CENTS={
      'regalo-sapori-del-bosco':2100,
      'regalo-b01-dolce-incontro':1400,'regalo-b02-pausa-doro':1400,'regalo-b03-abbraccio-dautunno':1400,
      'regalo-b04-agrumi-in-fiore':2380,'regalo-b05-due-terre-un-miele':2380,'regalo-b06-essenza-di-natura':2380,
      'regalo-t01-tre-sapori-una-storia':2100,'regalo-t02-arcobaleno-di-dolcezza':2100,
      'regalo-t03-la-dolce-meraviglia':2690,'regalo-t04-tesori-dell-alveare':2380,
      'regalo-t05-radici-di-miele':1880,'regalo-t06-risveglio-dorato':1980,
      'regalo-t07-soffio-di-natura':1880,'regalo-t08-carezza-balsamica':2380,
      'regalo-t09-intenso-incanto':2780,
      'regalo-c01-mani-e-labbra':1680,
      'regalo-c02-dolcezza-quotidiana':1080,
      'regalo-c03-carezza-dell-alveare':2170,
      'regalo-c04-rituale-corpo-e-capelli':2170,
      'regalo-c05-viso-e-dolcezza':1980,
      'regalo-c06-propoli-quotidiana':1080,
      'regalo-c07-rituale-delicato':2070,
      'regalo-be01-magia-tre-luci':1770,
      'regalo-be02-calore-alveare':1570,
      'regalo-be03-respiro-dambra':3270,
      'regalo-be04-oro-da-accarezzare':4270,
      // Dolci su ordinazione, prezzi server autorevoli.
      'regalo-d01-dolci-sorrisi':850,
      'regalo-d02-agrumi-e-sorrisi':850,
      'regalo-d03-tre-tentazioni-alla-propoli':1200,
      'regalo-d04-tre-gusti-dell-alveare':1250,
      // Integratori: six complete combinations; I05 deliberately withheld.
      'regalo-i01-energia-dell-alveare':2790,
      'regalo-i02-vitalita-dell-alveare':3590,
      'regalo-i03-il-polline-e-la-propoli':2090,
      'regalo-i04-vitalita-naturale':2490,
      'regalo-i05-energia-dell-alveare-plus':3970,
      'regalo-i06-benessere-delle-api':3490,
      'regalo-i07-le-risorse-dell-alveare':4390
    };
    for(let i=0;i<sanitizedItems.length;i++){
      const id=cleanText(cartMeta[i]&&cartMeta[i].productId,180);
      if(Object.prototype.hasOwnProperty.call(GIFT_UNIT_CENTS,id)){
        if(Math.round(sanitizedItems[i].amount*100)!==GIFT_UNIT_CENTS[id]){
          return res.status(400).json({error:'Prezzo della confezione non valido.'});
        }
      }
    }

    // I05 completa: validazione prezzi autorevole + controllo disponibilità nel magazzino.
    // Fresh royal jelly must be handed over cold. No ordinary courier shipping.
    const chilledIds=new Set(['regalo-i02-vitalita-dell-alveare','regalo-i06-benessere-delle-api']);
    const hasChilled=cartMeta.some(item=>chilledIds.has(cleanText(item&&item.productId,180)));
    const deliveryMethod=cleanText(body.deliveryMethod,20);
    if(hasChilled && deliveryMethod!=='pickup'){
      return res.status(409).json({error:'Le confezioni con pappa reale fresca sono disponibili solo per ritiro concordato, con trasporto refrigerato.'});
    }
    if(hasChilled && Number(body.shippingCostOverride||0)!==0){
      return res.status(400).json({error:'Per il ritiro delle confezioni refrigerate non deve essere applicata la spedizione.'});
    }
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

    await checkStock(purchaseItems);

    const pendingPurchase = {
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
    };

    const payment = xpayGateway.createPaymentRedirectUrl({
      amountCents: totalCents,
      email,
      description: 'Ordine La Fabbrica delle Api',
      note1: orderReference,
      note2: itemSummary,
      note3: cleanText(body.notes, 200),
      purchase: pendingPurchase
    });

    await savePendingPayment({
      codTrans: payment.id,
      amountCents: totalCents,
      purchase: pendingPurchase
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
