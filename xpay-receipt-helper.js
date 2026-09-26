const crypto = require('crypto');
const { getPendingPayment } = require('./xpay-pending-store');

function clean(value, max = 200) {
  return String(value || '').trim().slice(0, max);
}
function safeEqual(a, b) {
  const aa = Buffer.from(String(a || ''), 'utf8');
  const bb = Buffer.from(String(b || ''), 'utf8');
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}
function readToken(token, secret) {
  const parts = String(token || '').split('.');
  if (parts.length !== 2) throw new Error('Token non valido.');
  const body = parts[0], signature = parts[1];
  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  if (!safeEqual(signature, expected)) throw new Error('Firma non valida.');
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  if (!payload || Number(payload.exp || 0) < Date.now()) throw new Error('Token scaduto.');
  return payload;
}
function orderIdFromNotes(notes, fallback) {
  const m = String(notes || '').match(/(?:^|\s)ORDER:([A-Z0-9-]+)/i);
  return clean(m && m[1], 120) || clean(fallback, 120);
}
const TX = {
  it:{title:'RICEVUTA ORDINE / PAGAMENTO',nf:'Documento non fiscale - riepilogo ordine e pagamento.',order:'Codice ordine',trans:'Transazione Nexi',status:'Stato: PAGAMENTO CONFERMATO',customer:'Cliente',email:'Email',phone:'Telefono',address:'Indirizzo',products:'PRODOTTI',goods:'Prodotti',shipping:'Spedizione',discount:'Sconto',promo:'Codice promozionale',total:'Totale pagato',points:'Punti Ape',thanks:'Grazie per il tuo acquisto.'},
  en:{title:'ORDER / PAYMENT RECEIPT',nf:'Non-fiscal document - order and payment summary.',order:'Order code',trans:'Nexi transaction',status:'Status: PAYMENT CONFIRMED',customer:'Customer',email:'Email',phone:'Phone',address:'Address',products:'PRODUCTS',goods:'Products',shipping:'Shipping',discount:'Discount',promo:'Promo code',total:'Total paid',points:'Bee Points',thanks:'Thank you for your purchase.'},
  de:{title:'BESTELL- / ZAHLUNGSBELEG',nf:'Kein Steuerbeleg - Zusammenfassung von Bestellung und Zahlung.',order:'Bestellcode',trans:'Nexi-Transaktion',status:'Status: ZAHLUNG BESTAETIGT',customer:'Kunde',email:'E-Mail',phone:'Telefon',address:'Adresse',products:'PRODUKTE',goods:'Produkte',shipping:'Versand',discount:'Rabatt',promo:'Aktionscode',total:'Gesamt bezahlt',points:'Bienenpunkte',thanks:'Vielen Dank fuer Ihren Einkauf.'},
  fr:{title:'RECU DE COMMANDE / PAIEMENT',nf:'Document non fiscal - resume de la commande et du paiement.',order:'Code commande',trans:'Transaction Nexi',status:'Statut : PAIEMENT CONFIRME',customer:'Client',email:'E-mail',phone:'Telephone',address:'Adresse',products:'PRODUITS',goods:'Produits',shipping:'Livraison',discount:'Remise',promo:'Code promotionnel',total:'Total paye',points:'Points Abeille',thanks:'Merci pour votre achat.'},
  es:{title:'RECIBO DE PEDIDO / PAGO',nf:'Documento no fiscal - resumen del pedido y del pago.',order:'Codigo de pedido',trans:'Transaccion Nexi',status:'Estado: PAGO CONFIRMADO',customer:'Cliente',email:'Email',phone:'Telefono',address:'Direccion',products:'PRODUCTOS',goods:'Productos',shipping:'Envio',discount:'Descuento',promo:'Codigo promocional',total:'Total pagado',points:'Puntos Abeja',thanks:'Gracias por tu compra.'}
};
function pdfSafe(value) {
  return String(value == null ? '' : value)
    .replace(/[’‘\u0060´]/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/€/g, 'EUR')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '?')
    .replace(/[()\\]/g, function(m){ return '\\' + m; });
}
function wrap(value, max) {
  const text = String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  if (!text) return [''];
  const words = text.split(' '), out = [];
  let line = '';
  for (const word of words) {
    const next = line ? line + ' ' + word : word;
    if (line && next.length > max) { out.push(line); line = word; }
    else line = next;
  }
  if (line) out.push(line);
  return out;
}
function makePdf(rows) {
  const lines = [];
  rows.forEach(function(row){
    const r = typeof row === 'string' ? {text:row} : row;
    wrap(r.text, r.max || 82).forEach(function(line){
      lines.push({text:line,size:r.size || 10,gap:r.gap || 18});
    });
  });
  const content = ['BT','/F1 10 Tf','54 795 Td'];
  let size = 10;
  lines.slice(0, 42).forEach(function(line){
    if (line.size !== size) { size = line.size; content.push('/F1 ' + size + ' Tf'); }
    content.push('(' + pdfSafe(line.text) + ') Tj');
    content.push('0 -' + line.gap + ' Td');
  });
  content.push('ET');
  const stream = content.join('\n');
  const objs = [];
  objs[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objs[2] = '<< /Type /Pages /Kids [3 0 R] /Count 1 >>';
  objs[3] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>';
  objs[4] = '<< /Length ' + Buffer.byteLength(stream, 'latin1') + ' >>\nstream\n' + stream + '\nendstream';
  objs[5] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
  let out = '%PDF-1.4\n', offsets = [0];
  for (let i=1;i<=5;i++) { offsets[i]=Buffer.byteLength(out,'latin1'); out += i + ' 0 obj\n' + objs[i] + '\nendobj\n'; }
  const xref=Buffer.byteLength(out,'latin1');
  out += 'xref\n0 6\n0000000000 65535 f \n';
  for (let i=1;i<=5;i++) out += String(offsets[i]).padStart(10,'0') + ' 00000 n \n';
  out += 'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF';
  return Buffer.from(out,'latin1');
}
module.exports = async function(req,res){
  res.setHeader('Cache-Control','private, no-store');
  if(req.method !== 'GET') return res.status(405).send('Metodo non consentito.');
  try{
    const secret=String(process.env.XPAY_MAC_KEY||'').trim();
    if(!secret) return res.status(503).send('Configurazione non disponibile.');
    const token=readToken(req.query && req.query.t,secret);
    if(!token || token.type !== 'xpay-success') return res.status(400).send('Ricevuta non valida.');
    const codTrans=clean(token.c,30);
    const pending=await getPendingPayment(codTrans);
    if(!pending || !pending.purchase) return res.status(404).send('Dati ordine non disponibili.');
    const p=pending.purchase;
    if(Math.abs(Number(token.total||0)-Number(p.total||0))>0.001) return res.status(400).send('Dati ricevuta non corrispondenti.');
    const lang=['it','en','de','fr','es'].includes(clean(token.lang,5).toLowerCase())?clean(token.lang,5).toLowerCase():'it';
    const tx=TX[lang]||TX.it, u=p.customer||{}, items=Array.isArray(p.items)?p.items:[];
    const orderId=orderIdFromNotes(p.notes,codTrans);
    const money=function(v){return Number(v||0).toFixed(2).replace('.',',')+' EUR';};
    const address=[clean(u.address,150),clean(u.postal_code||u.postalCode,20),clean(u.city,80),clean(u.state,30)].filter(Boolean).join(', ');
    const rows=[
      {text:'LA FABBRICA DELLE API',size:18,gap:24},
      {text:tx.title,size:14,gap:22},
      {text:tx.nf,size:9,gap:22},
      tx.order+': '+orderId,
      tx.trans+': '+codTrans,
      {text:tx.status,gap:24},
      tx.customer+': '+(clean(u.name,100)||'-'),
      tx.email+': '+(clean(u.email,254)||'-'),
      tx.phone+': '+(clean(u.phone,50)||'-'),
      {text:tx.address+': '+(address||'-'),gap:24},
      {text:tx.products,size:11,gap:20}
    ];
    items.slice(0,15).forEach(function(item,index){
      const qty=Math.max(1,Number(item.quantity)||1);
      rows.push({text:(index+1)+'. '+clean(item.productName||item.name,180)+' x'+qty+' - '+money((Number(item.amount)||0)*qty),size:9,gap:17,max:88});
    });
    if(items.length>15) rows.push({text:'... +'+(items.length-15)+' prodotti',size:9,gap:20});
    rows.push(tx.goods+': '+money(p.goodsTotal));
    rows.push(tx.shipping+': '+money(p.shipping));
    if(Number(p.discount||0)>0) rows.push(tx.discount+': -'+money(p.discount));
    if(p.promoCode) rows.push(tx.promo+': '+clean(p.promoCode,80));
    rows.push({text:tx.total+': '+money(p.total),size:12,gap:20});
    rows.push({text:tx.points+': '+Number(token.points||0),gap:24});
    rows.push(tx.thanks);
    const pdf=makePdf(rows);
    res.setHeader('Content-Type','application/pdf');
    res.setHeader('Content-Disposition','attachment; filename="Ricevuta_'+orderId.replace(/[^A-Z0-9-]/gi,'_')+'.pdf"');
    return res.status(200).send(pdf);
  }catch(error){
    console.error('[XPay] Ricevuta PDF:',error&&error.message?error.message:error);
    return res.status(400).send('Ricevuta non disponibile.');
  }
};