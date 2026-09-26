const { Pool } = require('pg');

const DB_URL = String(process.env.BEE_DATABASE_URL || process.env.DATABASE_URL || '').trim();
let pool = null;

function db() {
  if (!DB_URL) throw new Error('Database XPay non configurato.');
  if (!pool) {
    pool = new Pool({
      connectionString: DB_URL,
      max: 2,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    });
  }
  return pool;
}

async function ensureTable() {
  await db().query(`
    create table if not exists shop_xpay_pending (
      cod_trans text primary key,
      amount_cents integer not null,
      purchase jsonb not null,
      created_at timestamptz not null default now()
    )
  `);
  await db().query("create index if not exists shop_xpay_pending_created_idx on shop_xpay_pending(created_at desc)");
}

async function savePendingPayment({ codTrans, amountCents, purchase }) {
  await ensureTable();
  const code = String(codTrans || '').trim().slice(0, 30);
  const amount = Math.round(Number(amountCents));
  if (!code || !Number.isFinite(amount) || amount < 1 || !purchase || typeof purchase !== 'object') {
    throw new Error('Dati pagamento XPay temporanei non validi.');
  }
  await db().query(
    `insert into shop_xpay_pending(cod_trans, amount_cents, purchase, created_at)
     values($1,$2,$3::jsonb,now())
     on conflict(cod_trans) do update
       set amount_cents=excluded.amount_cents, purchase=excluded.purchase, created_at=now()`,
    [code, amount, JSON.stringify(purchase)]
  );
  await db().query("delete from shop_xpay_pending where created_at < now() - interval '7 days'");
  return true;
}

async function getPendingPayment(codTrans) {
  await ensureTable();
  const code = String(codTrans || '').trim().slice(0, 30);
  if (!code) return null;
  const result = await db().query(
    "select cod_trans, amount_cents, purchase, created_at from shop_xpay_pending where cod_trans=$1 limit 1",
    [code]
  );
  return result.rows[0] || null;
}

module.exports = { savePendingPayment, getPendingPayment };
