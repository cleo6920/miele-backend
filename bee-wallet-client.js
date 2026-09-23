const { Pool } = require('pg');

const BEE_DATABASE_URL = String(process.env.BEE_DATABASE_URL || process.env.DATABASE_URL || '').trim();
const BEE_DATA_API_URL = String(
  process.env.BEE_DATA_API_URL ||
  'https://ep-quiet-night-b241wmyg.apirest.c-6.eu-central-1.aws.neon.tech/neondb/rest/v1'
).replace(/\/+$/, '');
let pool = null;

function getPool() {
  if (!BEE_DATABASE_URL) return null;
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

function unwrapPayload(data) {
  if (Array.isArray(data) && data.length === 1) {
    if (data[0] && data[0].bee_wallet_api) return data[0].bee_wallet_api;
    return data[0];
  }
  if (data && data.bee_wallet_api) return data.bee_wallet_api;
  return data;
}

async function callViaDataApi(action, payload) {
  const response = await fetch(BEE_DATA_API_URL + '/rpc/bee_wallet_api', {
    method: 'POST',
    headers: {'Content-Type':'application/json','Accept':'application/json'},
    body: JSON.stringify({ p_action: String(action || ''), p_payload: payload || {} })
  });
  let data = null;
  try { data = unwrapPayload(await response.json()); } catch (_) {}
  if (!response.ok) {
    const error = new Error(data && (data.message || data.error)
      ? (data.message || data.error)
      : 'Errore archivio Saldo Api (' + response.status + ').');
    error.status = response.status;
    throw error;
  }
  return data || {ok:false,status:502,error:'Risposta vuota dall’archivio Saldo Api.'};
}

async function callBeeDataApi(action, payload = {}) {
  const directPool=getPool();
  if (directPool) {
    try {
      const result = await directPool.query(
        'select public.bee_wallet_api($1::text, $2::jsonb) as bee_wallet_api',
        [String(action || ''), JSON.stringify(payload || {})]
      );
      const data = result && result.rows && result.rows[0] ? result.rows[0].bee_wallet_api : null;
      return data || {ok:false,status:502,error:'Risposta vuota dall’archivio Saldo Api.'};
    } catch (error) {
      console.warn('[Saldo Api] Connessione Postgres diretta non disponibile, provo Data API:', error?.message||error);
    }
  }
  return callViaDataApi(action,payload);
}

module.exports = { callBeeDataApi };
