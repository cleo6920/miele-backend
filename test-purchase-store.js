const crypto = require('crypto');
const { callBeeDataApi } = require('./bee-wallet-client');

const VENOM_IDS = new Set([
  'unguento-apis',
  'apis1-crema-viso-veleno-api',
  'apis2-siero-viso-veleno-api',
  'apis4-crema-corpo-veleno-api-manuka',
  'apis5-gommage-veleno-api-manuka',
  'bagnodoccia-veleno-oro'
]);

const CUSTOM_TRIS_POINTS = {
  'favo-integrale': 4,
  'polline': 4,
  'orsetti': 1,
  'pappa-reale': 2,
  'bee-energy': 4,
  'propol-active': 4,
  'propoli-spray': 3,
  'propoli-alcolica': 2,
  'propoli-analcolica': 2,
  'crema-mani': 3,
  'burrocacao-propoli-aloe': 2,
  'burrocacao-miele-pappa': 2,
  'shampoo': 3,
  'saponetta-frutti-bosco': 1,
  'saponetta-lavanda': 1,
  'saponetta-aloe': 1,
  'candela-alveare': 2,
  'limoncello': 2,
  'liquore-caffe': 2,
  'castagne-rum': 2
};

const PREDEFINED_TRIS_POINTS = {
  'tris-alveare-millefiori': 11,
  'tris-alveare-melone': 12,
  'tris-alveare-fragola': 12,
  'tris-alveare-pesca': 11,
  'tris-alveare-arancia': 12,
  'tris-alveare-castagno': 12,
  'tris-alveare-acacia-zenzero': 12,
  'tris-alveare-eucalipto': 10,
  'tris-alveare-balsammiel': 12,
  'tris-alveare-acacia-40g': 11,
  'tris-alveare-favo-integrale': 12,
  'tris-alveare-polline': 12,
  'tris-alveare-orsetti': 11,
  'tris-alveare-pappa-reale': 11,
  'tris-alveare-bee-energy': 11,
  'tris-alveare-propol-active': 13,
  'tris-alveare-propoli-spray': 13,
  'tris-alveare-propoli-alcolica': 12,
  'tris-alveare-propoli-analcolica': 12,
  'tris-alveare-crema-mani': 12,
  'tris-alveare-burrocacao-propoli-aloe': 13,
  'tris-alveare-burrocacao-miele-pappa': 13,
  'tris-alveare-shampoo': 12,
  'tris-alveare-saponetta-frutti-bosco': 12,
  'tris-alveare-saponetta-lavanda': 10,
  'tris-alveare-saponetta-aloe': 12,
  'tris-alveare-candela-alveare': 12,
  'tris-alveare-limoncello': 12,
  'tris-alveare-liquore-caffe': 12,
  'tris-alveare-castagne-rum': 12
};

const PREDEFINED_TRIS_NAME_POINTS = {
  'millefiori': 11,
  'melone': 12,
  'fragola': 12,
  'pesca': 11,
  'arancia': 12,
  'castagno': 12,
  'acacia e zenzero': 12,
  'eucalipto': 10,
  'balsamico italiano': 12,
  'acacia 40 g': 11,
  'acacia in favo': 12,
  'polline': 12,
  'orsetti': 11,
  'pappa reale': 11,
  'bee energy': 11,
  'propol active': 13,
  'propoli spray': 13,
  'propoli alcolica contagocce': 12,
  'propoli analcolica': 12,
  'crema mani': 12,
  'burrocacao propoli + aloe': 13,
  'burrocacao miele + pappa reale': 13,
  'shampoo': 12,
  'saponetta frutti di bosco': 12,
  'saponetta lavanda': 10,
  'saponetta aloe': 12,
  'candela alveare': 12,
  'limoncello': 12,
  'liquore al caffe': 12,
  'castagne al rum': 12
};

function isTestPurchaseMode() {
  return String(process.env.TEST_PURCHASE_MODE || '').trim().toLowerCase() === 'true';
}

function clean(value, max = 200) {
  return String(value || '').trim().slice(0, max);
}

function baseBeePoints(rawPrice) {
  const price = Number(rawPrice || 0);
  if (!Number.isFinite(price) || price <= 0) return 0;
  if (price <= 3.90) return 1;
  if (price <= 6.90) return 2;
  if (price <= 9.90) return 3;
  if (price <= 14.90) return 4;
  if (price <= 20.00) return 5;
  if (price <= 29.90) return 6;
  if (price <= 39.90) return 7;
  if (price <= 59.90) return 8;
  if (price <= 99.90) return 10;
  return 15;
}

function makeId(prefix) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

function makeCoupon() {
  const raw = crypto.randomBytes(5).toString('hex').toUpperCase();
  return `TEST-${raw.slice(0, 5)}-${raw.slice(5)}`;
}

function isVenomItem(productId, productName) {
  if (VENOM_IDS.has(productId)) return true;
  const name = clean(productName, 180).toLowerCase();
  return /veleno d['’]api|sos dol|apis1|apis2|apis4|apis5|bagnodoccia.*oro/.test(name);
}

function isSosDolItem(productId, productName) {
  if (productId === 'unguento-apis') return true;
  return /\bsos\s*dol\b/i.test(clean(productName, 180));
}

function customTrisPoints(productId) {
  if (!String(productId || '').startsWith('tris-alveare-personalizzato-')) return null;
  let sum = 0;
  let count = 0;
  for (const [optionId, points] of Object.entries(CUSTOM_TRIS_POINTS)) {
    if (String(productId).includes(optionId)) {
      sum += points;
      count += 1;
    }
  }
  return count === 3 ? sum + 3 : null;
}

function normalizeTrisLabel(value) {
  return clean(value, 220)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’‘`´]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function predefinedTrisPoints(productId, productName) {
  const exact = PREDEFINED_TRIS_POINTS[String(productId || '')];
  if (exact) return exact;
  const normalizedName = normalizeTrisLabel(productName);
  const match = normalizedName.match(/tris dell'alveare\s*[–—-]\s*(.*?)(?:\s*\(|$)/i);
  if (!match) return null;
  return PREDEFINED_TRIS_NAME_POINTS[match[1].trim()] || null;
}

function pointsForItem(item) {
  const productId = clean(item.productId, 220);
  const productName = clean(item.productName || item.name, 220);
  const price = Number(item.pricePerPack ?? item.amount ?? 0);
  const quantity = Math.max(1, Number(item.quantity || 1));
  let perUnit = baseBeePoints(price);
  let bonusPerUnit = 0;
  let calculation = 'fascia-prezzo';

  if (productId === 'alveo-digitale-10-colazioni' || /10 Colazioni dell[’']Alveare/i.test(productName)) {
    perUnit = 2;
    bonusPerUnit = 0;
    calculation = 'Alveo Digitale = 2 Api';
  } else if (isSosDolItem(productId, productName)) {
    perUnit = 10;
    bonusPerUnit = 2;
    calculation = 'SOS DOL = 8 Api + 2 bonus = 10 Api';
  } else if (isVenomItem(productId, productName)) {
    const base = perUnit;
    perUnit += 2;
    bonusPerUnit = 2;
    calculation = `${base} Api + 2 bonus = ${perUnit} Api`;
  } else if (String(productId).startsWith('tris-alveare-personalizzato-')) {
    const exact = customTrisPoints(productId);
    if (exact) {
      perUnit = exact;
      bonusPerUnit = 3;
      calculation = `somma prodotti + 3 bonus = ${perUnit} Api`;
    } else {
      perUnit += 3;
      bonusPerUnit = 3;
      calculation = 'fallback tris test';
    }
  } else {
    const predefined = predefinedTrisPoints(productId, productName);
    if (predefined) {
      perUnit = predefined;
      bonusPerUnit = 3;
      calculation = `somma prodotti + 3 bonus = ${perUnit} Api`;
    } else if (String(productId).startsWith('tris-alveare-') || /\btris\b/i.test(productName)) {
      perUnit += 3;
      bonusPerUnit = 3;
      calculation = 'fallback tris test';
    }
  }

  return {
    productId,
    productName,
    price,
    quantity,
    pointsPerUnit: perUnit,
    bonusPerUnit,
    totalPoints: perUnit * quantity,
    calculation
  };
}

async function createTestPurchase({ items, testCart, shippingEuro, customer, notes }) {
  if (!isTestPurchaseMode()) throw new Error('Modalità acquisto simulato non attiva.');
  const safeItems = Array.isArray(items) ? items : [];
  const cartMeta = Array.isArray(testCart) ? testCart : [];
  const mergedItems = safeItems.map((item, index) => ({
    ...item,
    ...(cartMeta[index] || {}),
    name: item.name,
    amount: item.amount,
    quantity: item.quantity
  }));
  const pointLines = mergedItems.map(pointsForItem);
  const beePoints = pointLines.reduce((sum, line) => sum + line.totalPoints, 0);
  const goodsTotal = safeItems.reduce((sum, item) => sum + (Number(item.amount) * Number(item.quantity)), 0);
  const shipping = Math.max(0, Number(shippingEuro || 0));
  const total = Number((goodsTotal + shipping).toFixed(2));
  const orderId = makeId('TESTORD');
  const couponCode = makeCoupon();

  const result = await callBeeDataApi('create_purchase', {
    orderId,
    couponCode,
    mode: 'TEST',
    customer: customer || {},
    items: pointLines,
    goodsTotal: Number(goodsTotal.toFixed(2)),
    shipping,
    total,
    beePoints,
    notes: clean(notes, 500)
  });

  if (!result || result.ok === false) {
    throw new Error(result && result.error ? result.error : 'Impossibile salvare l’ordine TEST nel Saldo Api permanente.');
  }
  return result;
}

async function getTestPurchase(orderId) {
  if (!isTestPurchaseMode()) return null;
  const result = await callBeeDataApi('get_purchase', { orderId: clean(orderId, 220) });
  if (!result || result.ok === false) return null;
  return result;
}

async function redeemTestCoupon(couponCode, giftProducts) {
  if (!isTestPurchaseMode()) return { ok: false, status: 404, error: 'Modalità acquisto simulato non attiva.' };
  const raw = clean(couponCode, 220);
  if (raw.startsWith('CLAIM:')) {
    const code = raw.slice('CLAIM:'.length);
    return callBeeDataApi('claim_coupon', {
      couponCode: code,
      giftProducts: Array.isArray(giftProducts) ? giftProducts : []
    });
  }
  return callBeeDataApi('check_coupon', { couponCode: raw });
}

module.exports = {
  isTestPurchaseMode,
  createTestPurchase,
  getTestPurchase,
  redeemTestCoupon,
  pointsForItem,
  baseBeePoints
};
