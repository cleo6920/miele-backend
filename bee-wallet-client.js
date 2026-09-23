const { Pool } = require('pg');

const BEE_DATABASE_URL = String(process.env.BEE_DATABASE_URL || '').trim();
let pool = null;

function getPool() {
  if (!BEE_DATABASE_URL) {
    const error = new Error('Archivio permanente Saldo Api non configurato.');
    error.status = 503;
    throw error;
  }

  if (!pool) {
    pool = new Pool({
      connectionString: BEE_DATABASE_URL,
      max: 3,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    });
  }
  return pool;
}

async function callBeeDataApi(action, payload = {}) {
  try {
    const result = await getPool().query(
      'select public.bee_wallet_api($1::text, $2::jsonb) as bee_wallet_api',
      [String(action || ''), JSON.stringify(payload || {})]
    );

    const data = result && result.rows && result.rows[0]
      ? result.rows[0].bee_wallet_api
      : null;

    return data || {
      ok: false,
      status: 502,
      error: 'Risposta vuota dall’archivio Saldo Api.'
    };
  } catch (error) {
    if (!error.status) error.status = 503;
    throw error;
  }
}

module.exports = { callBeeDataApi };
