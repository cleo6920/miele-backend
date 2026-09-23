const crypto = require('crypto');
const zlib = require('zlib');
const { callBeeDataApi } = require('./bee-wallet-client');
const { pointsForItem } = require('./test-purchase-store');

const PROD_ENDPOINT = 'https://ecommerce.nexi.it/ecomm/ecomm/DispatcherServlet';
const PURCHASE_PARAM = 'fdap';

function clean(value, max = 200) {
  return String(value || '').trim().slice(0, max);
}

function siteUrl() {
  return String(process.env.APP_URL || 'https://lafabbricadelleapi.it')
    .trim()
    .replace(/\/+$/, '');
}

function config() {
  const alias = clean(process.env.XPAY_ALIAS, 30);
  const secret = String(process.env.XPAY_MAC_KEY || '').trim();
  const endpoint = String(process.env.XPAY_ENDPOINT || PROD_ENDPOINT).trim();
  return { alias, secret, endpoint };
}

function isLiveEnabled() {
  return String(process.env.XPAY_LIVE_ENABLED || '').trim().toLowerCase() === 'true';
}

function isConfigured() {
  const { alias, secret, endpoint } = config();
  return Boolean(alias && secret && /^https:\/\//i.test(endpoint));
}

function sha1(value) {
  return crypto.createHash('sha1').update(value, 'utf8').digest('hex');
}

function startMac(codTrans, divisa, importo, secret) {
  return sha1(`codTrans=${codTrans}divisa=${divisa}importo=${importo}${secret}`);
}

function resultMac(fields, secret) {
  const codTrans = clean(fields.codTrans, 30);
  const esito = clean(fields.esito, 20);
  const importo = clean(fields.importo, 20);
  const divisa = clean(fields.divisa, 3);
  const data = clean(fields.data, 20);
  const orario = clean(fields.orario, 20);
  const codAut = clean(fields.codAut, 20);
  return sha1(`codTrans=${codTrans}esito=${esito}importo=${importo}divisa=${divisa}data=${data}orario=${orario}codAut=${codAut}${secret}`);
}

function timingSafeEqualText(a, b) {
  const left = Buffer.from(String(a || '').toLowerCase(), 'utf8');
  const right = Buffer.from(String(b || '').toLowerCase(), 'utf8');
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function signToken(payload, secret) {
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${signature}`;
}

function readToken(token, secret) {
  const [body, signature] = String(token || '').split('.');
  if (!body || !signature) throw new Error('Token XPay non valido.');
  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  if (!timingSafeEqualText(signature, expected)) throw new Error('Firma token XPay non valida.');
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  if (!payload || Number(payload.exp || 0) < Date.now()) throw new Error('Sessione XPay scaduta.');
  return payload;
}

function purchaseKey(secret) {
  return crypto.createHash('sha256').update(`la-fabbrica-delle-api:xpay:${secret}`, 'utf8').digest();
}

function compactPurchase(purchase, codTrans, importo) {
  const rawItems = Array.isArray(purchase && purchase.items) ? purchase.items : [];
  if (!rawItems.length || rawItems.length > 100) throw new Error('Dettaglio ordine XPay non valido.');
  const items = rawItems.map((item) => ({
    i: clean(item && item.productId, 180),
    n: clean((item && (item.productName || item.name)), 180),
    a: Number(item && item.amount),
    q: Number(item && item.quantity)
  }));
  const customer = (purchase && purchase.customer) || {};
  return {
    v: 1,
    exp: Date.now() + (48 * 60 * 60 * 1000),
    c: codTrans,
    a: String(importo),
    i: items,
    g: Number(purchase && purchase.goodsTotal),
    s: Number(purchase && purchase.shipping),
    t: Number(purchase && purchase.total),
    u: {
      n: clean(customer.name, 100),
      e: clean(customer.email, 254).toLowerCase(),
      p: clean(customer.phone, 50),
      a: clean(customer.address, 150),
      z: clean(customer.postal_code || customer.postalCode, 20),
      c: clean(customer.city, 80),
      s: clean(customer.state, 30).toUpperCase()
    },
    o: clean(purchase && purchase.notes, 400)
  };
}

function encodePurchase(purchase, codTrans, importo, secret) {
  const payload = compactPurchase(purchase, codTrans, importo);
  const plain = Buffer.from(JSON.stringify(payload), 'utf8');
  const zipped = zlib.deflateRawSync(plain, { level: 9 });
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', purchaseKey(secret), iv);
  const encrypted = Buffer.concat([cipher.update(zipped), cipher.final()]);
  const tag = cipher.getAuthTag();
  const token = Buffer.concat([iv, tag, encrypted]).toString('base64url');
  if (token.length > 3500) throw new Error('Ordine troppo grande per il passaggio sicuro a XPay.');
  return token;
}

function decodePurchase(token, secret) {
  const raw = Buffer.from(String(token || ''), 'base64url');
  if (raw.length < 29) throw new Error('Dati ordine XPay mancanti o non validi.');
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const encrypted = raw.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', purchaseKey(secret), iv);
  decipher.setAuthTag(tag);
  const zipped = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  const payload = JSON.parse(zlib.inflateRawSync(zipped).toString('utf8'));
  if (!payload || payload.v !== 1 || Number(payload.exp || 0) < Date.now()) {
    throw new Error('Dati ordine XPay scaduti o non validi.');
  }
  return payload;
}

function makeTransactionId() {
  const time = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(5).toString('hex').toUpperCase();
  return `FDA${time}${random}`.slice(0, 30);
}

function realCouponCode(codTrans, secret) {
  const raw = crypto.createHmac('sha256', secret).update(`coupon:${codTrans}`).digest('hex').toUpperCase().slice(0, 10);
  return `API-${raw.slice(0, 5)}-${raw.slice(5)}`;
}

function createPaymentRedirectUrl({ amountCents, email, description, note1, note2, note3, purchase }) {
  const { alias, secret } = config();
  if (!alias || !secret) throw new Error('Configurazione XPay incompleta.');

  const importo = String(Math.round(Number(amountCents)));
  if (!/^\d+$/.test(importo) || Number(importo) < 1 || Number(importo) > 99999999) {
    throw new Error('Importo XPay non valido.');
  }

  const codTrans = makeTransactionId();
  const divisa = 'EUR';
  const base = siteUrl();
  const payload = {
    exp: Date.now() + (15 * 60 * 1000),
    alias,
    importo,
    divisa,
    codTrans,
    mac: startMac(codTrans, divisa, importo, secret),
    url: `${base}/api/xpay/return`,
    url_back: `${base}/api/xpay/cancel`,
    urlpost: `${base}/api/xpay/notify`,
    mail: clean(email, 150),
    languageId: 'ITA',
    descrizione: clean(description || 'Ordine La Fabbrica delle Api', 500),
    Note1: clean(note1, 200),
    Note2: clean(note2, 200),
    Note3: clean(note3, 200),
    [PURCHASE_PARAM]: encodePurchase(purchase, codTrans, importo, secret)
  };
  const token = signToken(payload, secret);
  return {
    id: codTrans,
    url: `${base}/api/xpay/redirect?t=${encodeURIComponent(token)}`,
    xpay: true
  };
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function redirectHandler(req, res) {
  try {
    const { secret, endpoint } = config();
    if (!isLiveEnabled()) return res.status(503).send('XPay non è ancora abilitato per i pagamenti reali.');
    if (!secret || !endpoint) return res.status(503).send('Configurazione XPay incompleta.');
    const payload = readToken(req.query && req.query.t, secret);
    const fields = [
      'alias', 'importo', 'divisa', 'codTrans', 'url', 'url_back', 'mac', 'urlpost',
      'mail', 'languageId', 'descrizione', 'Note1', 'Note2', 'Note3', PURCHASE_PARAM
    ];
    const inputs = fields
      .filter((key) => payload[key] !== undefined && payload[key] !== '')
      .map((key) => `<input type="hidden" name="${escapeHtml(key)}" value="${escapeHtml(payload[key])}">`)
      .join('\n');

    res.setHeader('Cache-Control', 'no-store');
    return res.type('html').send(`<!doctype html>
<html lang="it"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Pagamento Nexi XPay</title></head>
<body><p>Reindirizzamento al pagamento sicuro Nexi…</p>
<form id="xpay-form" method="post" action="${escapeHtml(endpoint)}" accept-charset="ISO-8859-1">
${inputs}
<noscript><button type="submit">Continua al pagamento Nexi</button></noscript>
</form><script>document.getElementById('xpay-form').submit();</script></body></html>`);
  } catch (error) {
    console.error('[XPay] Errore redirect:', error && error.message ? error.message : error);
    return res.status(400).send('Impossibile avviare il pagamento Nexi.');
  }
}

function verifyResult(fields) {
  const { alias, secret } = config();
  if (!alias || !secret) return false;
  if (clean(fields.alias, 30) !== alias) return false;
  const expected = resultMac(fields, secret);
  return timingSafeEqualText(fields.mac, expected);
}

async function persistPaidPurchase(fields) {
  const { secret } = config();
  const codTrans = clean(fields.codTrans, 30);
  const esito = clean(fields.esito, 20).toUpperCase();
  if (esito !== 'OK') return null;
  if (!codTrans || !secret) throw new Error('Dati XPay incompleti per il Saldo Api.');

  const existing = await callBeeDataApi('get_purchase', { orderId: codTrans });
  if (existing && existing.ok !== false) return existing;

  const payload = decodePurchase(fields[PURCHASE_PARAM], secret);
  if (payload.c !== codTrans || String(payload.a) !== clean(fields.importo, 20)) {
    throw new Error('Dati ordine XPay non corrispondenti alla transazione.');
  }

  const paidTotal = Number(clean(fields.importo, 20)) / 100;
  if (!Number.isFinite(paidTotal) || Math.abs(paidTotal - Number(payload.t)) > 0.001) {
    throw new Error('Importo XPay non corrispondente all’ordine.');
  }

  const items = (Array.isArray(payload.i) ? payload.i : []).map((item) => ({
    productId: clean(item && item.i, 180),
    productName: clean(item && item.n, 180),
    name: clean(item && item.n, 180),
    amount: Number(item && item.a),
    quantity: Number(item && item.q)
  }));
  if (!items.length) throw new Error('Ordine XPay senza prodotti.');
  const pointLines = items.map(pointsForItem);
  const beePoints = pointLines.reduce((sum, line) => sum + Number(line.totalPoints || 0), 0);
  const u = payload.u || {};
  const customer = {
    name: clean(u.n, 100),
    email: clean(u.e, 254).toLowerCase(),
    phone: clean(u.p, 50),
    address: clean(u.a, 150),
    postal_code: clean(u.z, 20),
    city: clean(u.c, 80),
    state: clean(u.s, 30).toUpperCase()
  };
  const purchase = {
    orderId: codTrans,
    couponCode: realCouponCode(codTrans, secret),
    mode: 'XPAY',
    customer,
    items: pointLines,
    goodsTotal: Number(Number(payload.g || 0).toFixed(2)),
    shipping: Number(Number(payload.s || 0).toFixed(2)),
    total: Number(Number(payload.t || 0).toFixed(2)),
    beePoints,
    notes: clean(payload.o, 400)
  };

  const result = await callBeeDataApi('create_purchase', purchase);
  if (result && result.ok !== false) {
    console.log(`[XPay] Saldo Api accreditato per ${codTrans}: ${beePoints} Api.`);
    return result;
  }

  const after = await callBeeDataApi('get_purchase', { orderId: codTrans });
  if (after && after.ok !== false) return after;
  throw new Error(result && result.error ? result.error : 'Impossibile registrare il pagamento nel Saldo Api.');
}

async function returnHandler(req, res) {
  const fields = req.query || {};
  const base = siteUrl();
  const valid = verifyResult(fields);
  const codTrans = clean(fields.codTrans, 30);
  const esito = clean(fields.esito, 20).toUpperCase();

  if (!valid) {
    console.error(`[XPay] MAC di ritorno non valido per ${codTrans || 'transazione sconosciuta'}.`);
    return res.redirect(302, `${base}/cancel.html?xpay=mac_invalid`);
  }

  if (esito === 'OK') {
    try {
      await persistPaidPurchase(fields);
      console.log(`[XPay] Pagamento confermato e Saldo Api registrato: ${codTrans}.`);
      return res.redirect(302, `${base}/success.html?xpay=ok&codTrans=${encodeURIComponent(codTrans)}`);
    } catch (error) {
      console.error(`[XPay] Pagamento ${codTrans} riuscito ma Saldo Api non registrato al ritorno:`, error && error.message ? error.message : error);
      return res.redirect(302, `${base}/success.html?xpay=ok&wallet=pending&codTrans=${encodeURIComponent(codTrans)}`);
    }
  }

  console.log(`[XPay] Pagamento non completato: ${codTrans}, esito ${esito || 'KO'}.`);
  return res.redirect(302, `${base}/cancel.html?xpay=${encodeURIComponent(esito || 'ko')}`);
}

async function notifyHandler(req, res) {
  const fields = req.body || {};
  const codTrans = clean(fields.codTrans, 30);
  if (!verifyResult(fields)) {
    console.error(`[XPay] Notifica con MAC non valido per ${codTrans || 'transazione sconosciuta'}.`);
    return res.status(400).send('MAC non valido');
  }

  const esito = clean(fields.esito, 20).toUpperCase();
  if (esito === 'OK') {
    try {
      await persistPaidPurchase(fields);
    } catch (error) {
      console.error(`[XPay] Notifica valida ma registrazione Saldo Api fallita per ${codTrans}:`, error && error.message ? error.message : error);
      return res.status(500).send('Registrazione ordine non completata');
    }
  }

  console.log(`[XPay] Notifica valida: ${codTrans}, esito ${esito || 'KO'}, importo ${clean(fields.importo, 20)} ${clean(fields.divisa, 3)}.`);
  return res.status(200).send('OK');
}

function cancelHandler(req, res) {
  const base = siteUrl();
  const esito = clean(req.query && req.query.esito, 20) || 'annullo';
  return res.redirect(302, `${base}/cancel.html?xpay=${encodeURIComponent(esito)}`);
}

function statusHandler(_req, res) {
  return res.status(200).json({
    provider: 'Nexi XPay',
    configured: isConfigured(),
    liveEnabled: isLiveEnabled(),
    mode: isLiveEnabled() ? 'production' : 'prepared'
  });
}

module.exports = {
  isLiveEnabled,
  isConfigured,
  createPaymentRedirectUrl,
  redirectHandler,
  returnHandler,
  notifyHandler,
  cancelHandler,
  statusHandler
};
